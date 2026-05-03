import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { HealthAlert } from '../../models/health-tracking.model';
import { PregnancyAnomalyAlert, PregnancyAlertService } from '../../services/pregnancy-alert.service';
import { HealthTrackerService } from '../../services/health-tracker.service';

@Component({
  selector: 'app-pregnancy-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pregnancy-alerts.component.html',
  styleUrl: './pregnancy-alerts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PregnancyAlertsComponent {
  private readonly pregnancyAlertService = inject(PregnancyAlertService);
  private readonly healthTrackerService = inject(HealthTrackerService);

  @Input() pregnancyTrackingId!: number;
  @Input() userId!: number;
  @Output() alertsLoaded = new EventEmitter<HealthAlert[]>();
  @Output() alertEscalated = new EventEmitter<HealthAlert>();

  readonly alerts = signal<PregnancyAnomalyAlert[]>([]);
  readonly loading = signal(false);
  readonly escalating = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly visibleAlerts = computed(() => this.alerts().filter((a) => a.severity === 'URGENT'));
  readonly hasAnomalies = computed(() => this.alerts().length > 0);
  readonly hasUrgentAnomalies = computed(() => this.visibleAlerts().length > 0);

  constructor() {
    // Auto-load alerts when pregnancyTrackingId changes
    effect(() => {
      if (this.pregnancyTrackingId && this.pregnancyTrackingId > 0) {
        this.loadAnomalies();
      }
    });
  }

  /**
   * Load anomalies for the current pregnancy tracking
   */
  loadAnomalies(): void {
    if (!this.pregnancyTrackingId) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.pregnancyAlertService
      .getCheckupAnomalies(this.pregnancyTrackingId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (anomalies) => {
          this.alerts.set(anomalies);
          if (anomalies.length === 0) {
            this.successMessage.set('✓ No anomalies detected. All checkups are within normal ranges.');
          }
        },
        error: () => {
          this.errorMessage.set('Unable to analyze checkups. Please refresh and try again.');
        }
      });
  }

  /**
   * Escalate an urgent alert to the backend
   */
  escalateAlert(anomalyAlert: PregnancyAnomalyAlert): void {
    if (this.escalating() || !this.userId) {
      return;
    }

    this.escalating.set(true);
    this.errorMessage.set('');

    // Convert to HealthAlert format
    const healthAlert = this.pregnancyAlertService.convertToHealthAlert(anomalyAlert, this.userId);

    // Call escalate endpoint
    this.healthTrackerService
      .escalateIgnoredAlerts(this.userId)
      .pipe(finalize(() => this.escalating.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Alert escalated successfully. Your healthcare provider has been notified.');
          this.alertEscalated.emit(healthAlert);
          // Reload after 2 seconds
          setTimeout(() => this.loadAnomalies(), 2000);
        },
        error: () => {
          this.errorMessage.set('Failed to escalate alert. Please try again or contact your healthcare provider directly.');
        }
      });
  }

  /**
   * Get alert icon based on severity
   */
  getAlertIcon(severity: string): string {
    switch (severity) {
      case 'URGENT':
        return '🚨';
      case 'WARNING':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Format alert type for display (convert ABNORMAL_WEIGHT_GAIN to "Abnormal Weight Gain")
   */
  formatAlertType(type: string): string {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get alert class based on severity
   */
  getAlertClass(severity: string): string {
    return `alert--${severity.toLowerCase()}`;
  }

  /**
   * Dismiss an alert from view (cosmetic only)
   */
  dismissAlert(index: number): void {
    this.alerts.update((current) => current.filter((_, i) => i !== index));
  }
}
