import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HealthTrackerService } from './health-tracker.service';
import { HealthAlert, PregnancyCheckup } from '../models/health-tracking.model';

export interface PregnancyAnomalyAlert {
  checkupId: number;
  type: 'ABNORMAL_WEIGHT_GAIN' | 'REDUCED_FETAL_MOVEMENT' | 'MISSING_DATA' | 'OTHER_CRITICAL';
  severity: 'WARNING' | 'URGENT';
  message: string;
  recommendation: string;
  previousValue?: number;
  currentValue?: number;
}

/**
 * PregnancyAlertService
 * Analyzes pregnancy checkups for anomalies (abnormal weight gain, reduced fetal movements, etc.)
 * and generates health alerts for escalation
 */
@Injectable({
  providedIn: 'root'
})
export class PregnancyAlertService {
  private readonly healthTrackerService = inject(HealthTrackerService);

  // Thresholds for anomaly detection
  private readonly WEIGHT_GAIN_THRESHOLD = 1.0; // kg per week acceptable range
  private readonly MIN_FETAL_MOVEMENTS = 3; // minimum fetal movements expected per session
  private readonly MIN_CHECKUP_INTERVAL = 1; // days between checkups (for comparison)

  /**
   * Analyze a new checkup against previous ones to detect anomalies
   */
  analyzeCheckupAnomalies(
    currentCheckup: Partial<PregnancyCheckup>,
    previousCheckups: PregnancyCheckup[]
  ): PregnancyAnomalyAlert[] {
    const alerts: PregnancyAnomalyAlert[] = [];

    // Alert 1: Abnormal Weight Gain
    if (currentCheckup.weightKg && previousCheckups.length > 0) {
      const weightAlert = this.detectAbnormalWeightGain(currentCheckup, previousCheckups);
      if (weightAlert) {
        alerts.push(weightAlert);
      }
    }

    // Alert 2: Reduced Fetal Movements
    if (currentCheckup.fetalMovements !== null && currentCheckup.fetalMovements !== undefined) {
      const fetalAlert = this.detectReducedFetalMovements(currentCheckup, previousCheckups);
      if (fetalAlert) {
        alerts.push(fetalAlert);
      }
    }

    // Alert 3: Missing Critical Data
    const missingDataAlert = this.detectMissingCriticalData(currentCheckup);
    if (missingDataAlert) {
      alerts.push(missingDataAlert);
    }

    return alerts;
  }

  /**
   * Convert PregnancyAnomalyAlert to HealthAlert for backend submission
   */
  convertToHealthAlert(anomalyAlert: PregnancyAnomalyAlert, userId: number): HealthAlert {
    const levelMap: Record<string, 'WARNING' | 'URGENT'> = {
      'WARNING': 'WARNING',
      'URGENT': 'URGENT'
    };

    return {
      id: 0, // Will be assigned by backend
      message: anomalyAlert.message,
      level: levelMap[anomalyAlert.severity] || 'WARNING',
      ignored: false,
      recommendation: anomalyAlert.recommendation,
      activity: 'escalate'
    };
  }

  /**
   * Detect abnormal weight gain between checkups
   * Thresholds: gain > 1kg per week = WARNING; > 2kg per week = URGENT
   */
  private detectAbnormalWeightGain(
    currentCheckup: Partial<PregnancyCheckup>,
    previousCheckups: PregnancyCheckup[]
  ): PregnancyAnomalyAlert | null {
    if (!currentCheckup.weightKg || previousCheckups.length === 0) {
      return null;
    }

    // Get most recent previous checkup with weight data
    const previousCheckupWithWeight = previousCheckups
      .filter((c) => c.weightKg !== null && c.weightKg !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (!previousCheckupWithWeight) {
      return null;
    }

    const currentDate = new Date(currentCheckup.date || new Date()).getTime();
    const previousDate = new Date(previousCheckupWithWeight.date).getTime();
    const daysDifference = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
    const weeksDifference = daysDifference / 7;

    if (weeksDifference <= 0) {
      return null;
    }

    const previousWeight = previousCheckupWithWeight.weightKg ?? 0;
    const weightGain = (currentCheckup.weightKg || 0) - previousWeight;
    const weeklyGain = weightGain / weeksDifference;

    const URGENT_THRESHOLD = 2.0; // kg per week
    const WARNING_THRESHOLD = 1.0; // kg per week

    if (weeklyGain > URGENT_THRESHOLD) {
      return {
        checkupId: 0,
        type: 'ABNORMAL_WEIGHT_GAIN',
        severity: 'URGENT',
        message: `Rapid weight gain detected: ${weeklyGain.toFixed(2)}kg/week. Previous: ${previousWeight}kg, Current: ${currentCheckup.weightKg}kg.`,
        recommendation: 'Contact your healthcare provider immediately for evaluation. Excessive weight gain can indicate gestational diabetes or preeclampsia.',
        previousValue: previousWeight,
        currentValue: currentCheckup.weightKg
      };
    } else if (weeklyGain > WARNING_THRESHOLD) {
      return {
        checkupId: 0,
        type: 'ABNORMAL_WEIGHT_GAIN',
        severity: 'WARNING',
        message: `Significant weight gain detected: ${weeklyGain.toFixed(2)}kg/week. Previous: ${previousWeight}kg, Current: ${currentCheckup.weightKg}kg.`,
        recommendation: 'Review your diet and hydration. Schedule a consultation with your healthcare provider to discuss nutrition during pregnancy.',
        previousValue: previousWeight,
        currentValue: currentCheckup.weightKg
      };
    }

    return null;
  }

  /**
   * Detect reduced fetal movements
   * Normal: 3+ movements per session
   */
  private detectReducedFetalMovements(
    currentCheckup: Partial<PregnancyCheckup>,
    previousCheckups: PregnancyCheckup[]
  ): PregnancyAnomalyAlert | null {
    const fetalMovements = currentCheckup.fetalMovements ?? 0;

    if (fetalMovements < this.MIN_FETAL_MOVEMENTS) {
      // Check trend: if consistently low, escalate to URGENT
      const recentLowMovements = previousCheckups
        .slice(-3)
        .filter((c) => (c.fetalMovements ?? 10) < this.MIN_FETAL_MOVEMENTS).length;

      const severity = recentLowMovements >= 2 ? 'URGENT' : 'WARNING';

      return {
        checkupId: 0,
        type: 'REDUCED_FETAL_MOVEMENT',
        severity,
        message:
          severity === 'URGENT'
            ? `Consistently reduced fetal movements detected: ${fetalMovements} movements (normal: 3+). This pattern over multiple checkups requires urgent attention.`
            : `Reduced fetal movements detected: ${fetalMovements} movements (normal: 3+). Monitor closely for changes.`,
        recommendation:
          severity === 'URGENT'
            ? 'Contact your healthcare provider or go to the emergency room immediately. Reduced fetal movements can indicate fetal distress.'
            : 'Perform fetal kick counts and contact your provider if movements do not return to normal within 24 hours.',
        currentValue: fetalMovements
      };
    }

    return null;
  }

  /**
   * Detect missing critical data during pregnancy checkup
   */
  private detectMissingCriticalData(currentCheckup: Partial<PregnancyCheckup>): PregnancyAnomalyAlert | null {
    const missingFields: string[] = [];

    if (!currentCheckup.date) {
      missingFields.push('checkup date');
    }
    if (!currentCheckup.observation) {
      missingFields.push('observation');
    }
    if (currentCheckup.weightKg === null || currentCheckup.weightKg === undefined) {
      missingFields.push('weight');
    }
    if (currentCheckup.fetalMovements === null || currentCheckup.fetalMovements === undefined) {
      missingFields.push('fetal movements');
    }

    if (missingFields.length > 2) {
      return {
        checkupId: 0,
        type: 'MISSING_DATA',
        severity: 'WARNING',
        message: `Incomplete pregnancy checkup: missing ${missingFields.join(', ')}.`,
        recommendation: 'Complete all required fields in the pregnancy checkup to ensure comprehensive health monitoring.'
      };
    }

    return null;
  }

  /**
   * Fetch all checkups for a pregnancy tracking ID and analyze for anomalies
   */
  getCheckupAnomalies(pregnancyTrackingId: number): Observable<PregnancyAnomalyAlert[]> {
    return this.healthTrackerService.getPregnancyCheckups().pipe(
      map((checkups) => {
        const trackingCheckups = (checkups || []).filter((c) => c.pregnancyTrackingId === pregnancyTrackingId);
        if (trackingCheckups.length < 2) {
          return [];
        }

        // Sort by date
        const sorted = trackingCheckups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const latestCheckup = sorted[sorted.length - 1];
        const previousCheckups = sorted.slice(0, -1);

        return this.analyzeCheckupAnomalies(latestCheckup, previousCheckups);
      }),
      catchError(() => of([]))
    );
  }
}
