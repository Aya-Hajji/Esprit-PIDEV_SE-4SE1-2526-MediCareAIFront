import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AllergyDTO, MedicalRiskAssessment, MedicalRecordDTO, PrescriptionDTO, LabResultDTO } from '../../../../shared/models/medical.model';
import { MedicalRiskAssessmentService } from '../../../../shared/services/medical-risk-assessment.service';
import { MedicalService } from '../../../../shared/services/medical.service';

@Component({
  selector: 'app-medical-risk-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-risk-assessment.component.html',
  styleUrls: ['./medical-risk-assessment.component.css']
})
export class MedicalRiskAssessmentComponent implements OnChanges {
  @Input() patientId!: number;
  /** Shown in the header instead of any internal identifier. */
  @Input() patientDisplayName = '';
  @Input() medicalRecord?: MedicalRecordDTO;

  assessment: MedicalRiskAssessment | null = null;
  recommendations: string[] = [];
  laboratoryScanResults: any[] = [];
  medicationInteractions: any[] = [];
  riskTrend: MedicalRiskAssessment[] = [];
  isLoading = true;
  error: string | null = null;
  selectedTab: 'summary' | 'details' | 'trend' = 'summary';

  /** Labels for riskCategories — single source for summary + details list. */
  readonly riskCategoryLabels: Record<string, string> = {
    cardiacRisk: 'Cardiac',
    diabetesRisk: 'Diabetes',
    strokeRisk: 'Stroke',
    cancerRisk: 'Cancer',
    renalRisk: 'Renal',
    respiratoryRisk: 'Respiratory',
    mentalHealthRisk: 'Mental health',
    infectionRisk: 'Infection'
  };

  constructor(
    private riskService: MedicalRiskAssessmentService,
    private medicalService: MedicalService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.patientId) {
      this.isLoading = false;
      return;
    }
    if (changes['patientId'] || changes['medicalRecord']) {
      this.assessment = null;
      this.recommendations = [];
      this.laboratoryScanResults = [];
      this.medicationInteractions = [];
      this.riskTrend = [];
      this.error = null;
      this.isLoading = true;
      this.loadRiskAssessment();
    }
  }

  /**
   * 📊 Charger l'évaluation de risque du patient
   */
  private loadRiskAssessment(): void {
    this.isLoading = true;
    this.error = null;

    this.riskService.getPatientRiskAssessment(this.patientId).subscribe({
      next: (assessment: MedicalRiskAssessment | null) => {
        if (assessment) {
          this.assessment = assessment;
          this.loadRecommendations();
          this.loadMedicationInteractions();
          this.loadLaboratoryAnomalies();
          this.loadRiskTrend();
        } else {
          this.calculateNewAssessment();
        }
      },
      error: (err: any) => {
        console.error('Erreur chargement assessment:', err);
        this.calculateNewAssessment();
      }
    });
  }

  /**
   * 🧮 Calculer une nouvelle évaluation
   */
  private calculateNewAssessment(): void {
    if (!this.medicalRecord) {
      this.medicalService.getMedicalRecordByPatientId(this.patientId).subscribe({
        next: (record: MedicalRecordDTO) => {
          this.medicalRecord = record;
          this.performCalculation();
        },
        error: (err: any) => {
          this.isLoading = false;
          this.error = 'Unable to load the medical record';
        }
      });
    } else {
      this.performCalculation();
    }
  }

  /**
   * 🧮 Effectuer le calcul d'évaluation
   */
  private performCalculation(): void {
    const base = this.medicalRecord;
    if (!base) {
      return;
    }

    const recordId = base.id;
    if (!recordId) {
      this.runRiskPipeline(base, [], []);
      return;
    }

    forkJoin({
      prescriptions: this.medicalService.getPrescriptionsByMedicalRecord(recordId).pipe(catchError(() => of([] as PrescriptionDTO[]))),
      labResults: this.medicalService.getLabResultsByMedicalRecord(recordId).pipe(catchError(() => of([] as LabResultDTO[]))),
      allergies: this.medicalService.getAllergiesByMedicalRecord(recordId).pipe(catchError(() => of([] as AllergyDTO[])))
    }).subscribe({
      next: ({ prescriptions, labResults, allergies }) => {
        const mergedRecord: MedicalRecordDTO = {
          ...base,
          allergies: allergies.length > 0 ? allergies : base.allergies
        };
        this.runRiskPipeline(mergedRecord, prescriptions, labResults);
      },
      error: (err: unknown) => {
        console.error('Erreur chargement données pour évaluation:', err);
        this.runRiskPipeline(base, [], []);
      }
    });
  }

  private runRiskPipeline(
    record: MedicalRecordDTO,
    prescriptions: PrescriptionDTO[],
    labResults: LabResultDTO[]
  ): void {
    this.riskService.calculateRiskAssessment(record, prescriptions, labResults).subscribe({
      next: (assessment: MedicalRiskAssessment) => {
        this.assessment = assessment;
        this.loadRecommendations();
        this.loadMedicationInteractions();
        this.loadLaboratoryAnomalies();
        this.loadRiskTrend();
      },
      error: (err: unknown) => {
        console.error('Erreur calcul assessment:', err);
        this.isLoading = false;
        this.error = 'Error while calculating the assessment';
      }
    });
  }

  /**
   * 🎯 Charger les recommandations
   */
  private loadRecommendations(): void {
    if (!this.assessment) return;

    this.riskService.generateRecommendations(this.assessment).subscribe({
      next: (recommendations: string[]) => {
        this.recommendations = recommendations;
      },
      error: (err: any) => console.error('Erreur chargement recommandations:', err)
    });
  }

  /**
   * 💊 Charger les interactions médicamenteuses
   */
  private loadMedicationInteractions(): void {
    if (!this.assessment?.medicationInteractionRisks) return;
    this.medicationInteractions = this.assessment.medicationInteractionRisks;
  }

  /**
   * 🧪 Charger les anomalies de laboratoire
   */
  private loadLaboratoryAnomalies(): void {
    if (!this.assessment?.laboratoryAnomalies) return;
    this.laboratoryScanResults = this.assessment.laboratoryAnomalies;
  }

  /**
   * 📈 Charger la tendance de risque
   */
  private loadRiskTrend(): void {
    this.riskService.getRiskTrend(this.patientId, 30).subscribe({
      next: (trend: MedicalRiskAssessment[]) => {
        this.riskTrend = trend;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement tendance:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * 🔄 Rafraîchir l'évaluation
   */
  refreshAssessment(): void {
    this.calculateNewAssessment();
  }

  /**
   * 💾 Sauvegarder l'évaluation
   */
  saveAssessment(): void {
    if (!this.assessment) return;

    this.riskService.saveRiskAssessment(this.assessment).subscribe({
      next: () => {
        // Succès - notification ou message
      },
      error: (err: any) => console.error('Erreur sauvegarde:', err)
    });
  }

  /**
   * 🎨 Obtenir la couleur du risque
   */
  getRiskColor(level: string | undefined): string {
    switch (level) {
      case 'CRITICAL':
        return '#dc3545'; // Rouge
      case 'HIGH':
        return '#fd7e14'; // Orange
      case 'MODERATE':
        return '#ffc107'; // Jaune
      case 'LOW':
        return '#28a745'; // Vert
      default:
        return '#6c757d'; // Gris
    }
  }

  /**
   * 📊 Obtenir l'icône du risque
   */
  getRiskIcon(level: string | undefined): string {
    switch (level) {
      case 'CRITICAL':
        return '🔴';
      case 'HIGH':
        return '🟠';
      case 'MODERATE':
        return '🟡';
      case 'LOW':
        return '🟢';
      default:
        return '⚪';
    }
  }

  /**
   * 📝 Obtenir la description du risque
   */
  getRiskDescription(level: string | undefined): string {
    switch (level) {
      case 'CRITICAL':
        return 'Critical risk — immediate clinical attention recommended';
      case 'HIGH':
        return 'High risk — close follow-up needed';
      case 'MODERATE':
        return 'Moderate risk — regular monitoring';
      case 'LOW':
        return 'Low risk — routine follow-up is sufficient';
      default:
        return 'Assessment in progress…';
    }
  }

  /**
   * 🎯 Obtenir la couleur de la catégorie de risque
   */
  getCategoryColor(score: number | undefined): string {
    if (!score) return '#e9ecef';
    if (score >= 70) return '#dc3545';
    if (score >= 50) return '#fd7e14';
    if (score >= 30) return '#ffc107';
    return '#28a745';
  }

  /**
   * 📊 Obtenir la largeur de la barre de progress
   */
  getProgressWidth(score: number | undefined): string {
    return `${Math.min(score || 0, 100)}%`;
  }

  /**
   * 🔴 Obtenir le nombre d'interactions élevées
   */
  getHighSeverityInteractions(): any[] {
    return this.medicationInteractions.filter((i) => i.severity === 'HIGH' || i.severity === 'CRITICAL');
  }

  /**
   * 🟠 Obtenir le nombre d'anomalies critiques
   */
  getCriticalAnomalies(): any[] {
    return this.laboratoryScanResults.filter((a) => a.abnormalityType === 'CRITICAL' || a.abnormalityType === 'HIGH');
  }

  /**
   * 📅 Formater la date
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US');
  }

  /**
   * ✅ Obtenir le statut IA
   */
  getAIStatus(): string {
    if (!this.assessment) return 'N/A';
    return this.assessment.assessedByAI ? 'Assessed by AI' : 'Pending AI assessment';
  }

  /**
   * ✅ Obtenir le statut médecin
   */
  getDoctorStatus(): string {
    if (!this.assessment) return 'N/A';
    return this.assessment.assessedByDoctor ? 'Validated by clinician' : 'Clinician validation required';
  }

  /** Sorted risk dimensions (highest first) for full list / charts. */
  get riskCategoryRows(): { key: string; label: string; score: number }[] {
    const rc = this.assessment?.riskCategories;
    if (!rc) {
      return [];
    }
    return Object.keys(this.riskCategoryLabels)
      .map((key) => ({
        key,
        label: this.riskCategoryLabels[key] ?? key,
        score: Number((rc as Record<string, number | undefined>)[key] ?? 0)
      }))
      .sort((a, b) => b.score - a.score);
  }

  /** Highlight only the most relevant dimensions on the summary tab. */
  get topRiskCategoryRows(): { key: string; label: string; score: number }[] {
    return this.riskCategoryRows.filter((r) => r.score > 20).slice(0, 4);
  }
}
