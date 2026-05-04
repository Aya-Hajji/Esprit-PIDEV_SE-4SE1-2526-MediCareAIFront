import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  MedicalRiskAssessment,
  MedicalRecordDTO,
  PrescriptionDTO,
  LabResultDTO,
  AllergyDTO
} from '../models/medical.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicalRiskAssessmentService {
  private readonly localRiskKey = 'localRiskAssessmentsFallback';
  private baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  private riskAssessmentUrl = `${this.baseUrl}/medical-risk-assessments`;

  constructor(private http: HttpClient) {}

  /**
   * 📊 Obtenir tous les assessments de risque
   */
  getAllRiskAssessments(): Observable<MedicalRiskAssessment[]> {
    return this.http.get<MedicalRiskAssessment[]>(this.riskAssessmentUrl).pipe(
      tap((assessments) => this.setLocalRiskAssessments(assessments)),
      catchError(() => of(this.getLocalRiskAssessments()))
    );
  }

  /**
   * 🔍 Obtenir l'assessment de risque d'un patient
   */
  getPatientRiskAssessment(patientId: number): Observable<MedicalRiskAssessment | null> {
    return this.http
      .get<MedicalRiskAssessment>(`${this.riskAssessmentUrl}/patient/${patientId}`)
      .pipe(
        catchError(() => {
          const local = this.getLocalRiskAssessments().find((r) => r.patientId === patientId);
          return of(local || null);
        })
      );
  }

  /**
   * ⚠️ Calculer l'assessment de risque (IA + logique métier)
   */
  calculateRiskAssessment(
    medicalRecord: MedicalRecordDTO,
    prescriptions: PrescriptionDTO[],
    labResults: LabResultDTO[]
  ): Observable<MedicalRiskAssessment> {
    const payload = {
      patientId: medicalRecord.patientId,
      medicalRecordId: medicalRecord.id,
      prescriptions,
      labResults,
      chronicDiseases: medicalRecord.chronicDiseases,
      allergies: medicalRecord.allergies,
      medicalHistories: medicalRecord.medicalHistories
    };

    return this.http.post<MedicalRiskAssessment>(`${this.riskAssessmentUrl}/calculate`, payload).pipe(
      map((assessment) => this.enrichRiskAssessment(assessment)),
      tap((assessment) => this.saveRiskAssessmentLocally(assessment)),
      catchError(() => {
        // Calcul local du score si API indisponible
        return of(this.calculateRiskLocally(medicalRecord, prescriptions, labResults));
      })
    );
  }

  /**
   * 💊 Détecter les interactions entre médicaments
   */
  checkMedicationInteractions(prescriptions: PrescriptionDTO[]): Observable<MedicalRiskAssessment['medicationInteractionRisks']> {
    const params = new HttpParams().set('prescriptionIds', prescriptions.map((p) => p.id).join(','));
    return this.http
      .get<MedicalRiskAssessment['medicationInteractionRisks']>(`${this.riskAssessmentUrl}/medication-interactions`, { params })
      .pipe(
        catchError(() => of(this.calculateMedicationInteractionsLocally(prescriptions)))
      );
  }

  /**
   * 🧪 Analyser les anomalies de laboratoire
   */
  analyzeLaboratoryAnomalies(labResults: LabResultDTO[]): Observable<NonNullable<MedicalRiskAssessment['laboratoryAnomalies']>> {
    return this.http
      .post<NonNullable<MedicalRiskAssessment['laboratoryAnomalies']>>(`${this.riskAssessmentUrl}/lab-anomalies`, { labResults })
      .pipe(catchError(() => of(this.analyzeLaboratoryAnomaliesLocally(labResults))));
  }

  /**
   * 🎯 Générer les recommandations basées sur les risques
   */
  generateRecommendations(assessment: MedicalRiskAssessment): Observable<string[]> {
    return this.http
      .post<string[]>(`${this.riskAssessmentUrl}/recommendations`, assessment)
      .pipe(
        catchError(() => of(this.generateRecommendationsLocally(assessment)))
      );
  }

  /**
   * 📈 Obtenir une tendance de risque sur une période
   */
  getRiskTrend(patientId: number, days: number = 30): Observable<MedicalRiskAssessment[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http
      .get<MedicalRiskAssessment[]>(`${this.riskAssessmentUrl}/trend/${patientId}`, { params })
      .pipe(
        catchError(() => of(this.getLocalRiskAssessments().filter((r) => r.patientId === patientId)))
      );
  }

  /**
   * 💾 Sauvegarder un assessment
   */
  saveRiskAssessment(assessment: MedicalRiskAssessment): Observable<MedicalRiskAssessment> {
    return this.http.post<MedicalRiskAssessment>(this.riskAssessmentUrl, assessment).pipe(
      tap((saved) => this.saveRiskAssessmentLocally(saved)),
      catchError(() => {
        this.saveRiskAssessmentLocally(assessment);
        return of(assessment);
      })
    );
  }

  // =============== OUTILS PRIVÉS ===============

  /**
   * 🧮 Calcul local du score de risque (simplifié)
   */
  private calculateRiskLocally(
    medicalRecord: MedicalRecordDTO,
    prescriptions: PrescriptionDTO[],
    labResults: LabResultDTO[]
  ): MedicalRiskAssessment {
    const chronic = medicalRecord.chronicDiseases || [];
    const allergies = (medicalRecord.allergies || []) as AllergyDTO[];
    const histories = medicalRecord.medicalHistories || [];
    const activeRx = (prescriptions || []).filter(
      (p) => (p.status || 'ACTIVE').toUpperCase() !== 'INACTIVE'
    );

    const chronicScore = Math.min(32, chronic.length * 7);
    const allergyScore = Math.min(
      28,
      allergies.reduce((sum, a) => sum + this.allergySeverityWeight(a), 0)
    );
    const rxBurdenScore = Math.min(18, activeRx.length * 3);
    const historyScore = Math.min(12, histories.length * 2);

    const laboratoryAnomalies = this.analyzeLaboratoryAnomaliesLocally(labResults || []);
    const labScore = Math.min(
      28,
      laboratoryAnomalies.reduce((sum, row) => sum + (row.abnormalityType === 'CRITICAL' ? 12 : row.abnormalityType === 'HIGH' ? 8 : 5), 0)
    );

    const medicationInteractionRisks = this.calculateMedicationInteractionsLocally(activeRx);
    const interactionScore = Math.min(22, medicationInteractionRisks.length * 9);

    const overallScore = Math.min(
      100,
      Math.round(chronicScore + allergyScore + rxBurdenScore + labScore + interactionScore + historyScore)
    );

    const riskLevel = this.getRiskLevel(overallScore);
    const chronicText = chronic.map((d) => d.name).join(' ').toLowerCase();

    return {
      id: Date.now(),
      patientId: medicalRecord.patientId,
      medicalRecordId: medicalRecord.id || 0,
      assessmentDate: new Date().toISOString(),
      overallRiskScore: overallScore,
      riskLevel,
      riskCategories: {
        cardiacRisk: this.deriveCategoryScore(chronicText, ['cardio', 'heart', 'hypertension', 'coronary'], overallScore),
        diabetesRisk: this.deriveCategoryScore(chronicText, ['diabetes', 'glucose', 'hba1c', 'glyc'], overallScore),
        strokeRisk: this.deriveCategoryScore(chronicText, ['stroke', 'avc', 'tia', 'fibrillation'], overallScore),
        cancerRisk: this.deriveCategoryScore(chronicText, ['cancer', 'tumor', 'oncolog'], overallScore),
        renalRisk: this.deriveCategoryScore(chronicText, ['renal', 'kidney', 'dialysis', 'creatinine'], overallScore),
        respiratoryRisk: this.deriveCategoryScore(chronicText, ['asthma', 'copd', 'pulmonary', 'respiratory'], overallScore),
        mentalHealthRisk: this.deriveCategoryScore(chronicText, ['depression', 'anxiety', 'bipolar', 'psychiat'], overallScore),
        infectionRisk: Math.min(100, Math.round(allergyScore * 2 + (labResults?.length || 0) * 2))
      },
      chronicDiseaseComplications: chronic.map((d) => d.name),
      allergyRisks: allergies.map((a) => `${a.allergen}${a.severity ? ` (${a.severity})` : ''}`),
      medicationInteractionRisks,
      laboratoryAnomalies,
      recommendedActions: this.generateBasicRecommendations(overallScore),
      recommendedInterventions: [],
      assessedByAI: true,
      assessedByDoctor: false
    };
  }

  private allergySeverityWeight(a: AllergyDTO): number {
    const s = (a.severity || '').toUpperCase();
    if (s.includes('LIFE') || s.includes('ANAPHYL')) {
      return 14;
    }
    if (s.includes('SEVERE') || s === 'HIGH') {
      return 10;
    }
    if (s.includes('MODER') || s === 'MEDIUM') {
      return 6;
    }
    return 4;
  }

  private deriveCategoryScore(chronicHaystack: string, keywords: string[], overall: number): number {
    const hit = keywords.some((k) => chronicHaystack.includes(k));
    if (hit) {
      return Math.min(95, Math.max(35, overall + 12));
    }
    return Math.min(40, Math.round(overall * 0.35));
  }

  /**
   * 💊 Calcul des interactions localement
   */
  private calculateMedicationInteractionsLocally(
    prescriptions: PrescriptionDTO[]
  ): NonNullable<MedicalRiskAssessment['medicationInteractionRisks']> {
    const interactions: NonNullable<MedicalRiskAssessment['medicationInteractionRisks']> = [];

    for (let i = 0; i < prescriptions.length; i++) {
      for (let j = i + 1; j < prescriptions.length; j++) {
        const med1 = prescriptions[i].medicationName || '';
        const med2 = prescriptions[j].medicationName || '';
        const id1 = prescriptions[i].id;
        const id2 = prescriptions[j].id;

        if (this.hasKnownInteraction(med1, med2) && id1 != null && id2 != null) {
          interactions.push({
            prescriptionId: id1,
            conflictingPrescriptionIds: [id2],
            severity: 'MODERATE',
            description: `Potential drug interaction between "${med1}" and "${med2}" — clinical review recommended.`
          });
        }
      }
    }

    return interactions;
  }

  /**
   * 🧪 Analyse des anomalies de labo localement
   */
  private analyzeLaboratoryAnomaliesLocally(
    labResults: LabResultDTO[]
  ): NonNullable<MedicalRiskAssessment['laboratoryAnomalies']> {
    const anomalies: NonNullable<MedicalRiskAssessment['laboratoryAnomalies']> = [];

    labResults?.forEach((lab) => {
      if (lab.result && lab.referenceRange) {
        const isAbnormal = this.isAbnormalResult(lab.result, lab.referenceRange);
        if (isAbnormal) {
          anomalies.push({
            testName: lab.testName || 'Lab test',
            result: lab.result,
            abnormalityType: this.getAbnormalityType(lab.result, lab.referenceRange),
            clinicalSignificance: `Outside the usual reference range; clinical interpretation needed for ${lab.testName || 'this test'}.`
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * 🎯 Génération des recommandations localement
   */
  private generateRecommendationsLocally(assessment: MedicalRiskAssessment): string[] {
    const recommendations: string[] = [];

    if (assessment.overallRiskScore > 70) {
      recommendations.push('Schedule a prompt medical visit.');
      recommendations.push('Step up monitoring of vitals and labs.');
    }

    if (assessment.riskCategories.cardiacRisk && assessment.riskCategories.cardiacRisk > 50) {
      recommendations.push('Consider cardiology input and structured blood pressure follow-up.');
    }

    if (assessment.riskCategories.diabetesRisk && assessment.riskCategories.diabetesRisk > 40) {
      recommendations.push('Glycemic follow-up (HbA1c, fasting glucose) and endocrine referral if indicated.');
    }

    if (assessment.medicationInteractionRisks && assessment.medicationInteractionRisks.length > 0) {
      recommendations.push('Medication review with the prescriber (drug interactions detected).');
    }

    if (assessment.laboratoryAnomalies && assessment.laboratoryAnomalies.length > 0) {
      recommendations.push('Correlate lab abnormalities with clinical context and repeat testing if needed.');
    }

    return recommendations;
  }

  /**
   * 📝 Enrichissement du assessment
   */
  private enrichRiskAssessment(assessment: MedicalRiskAssessment): MedicalRiskAssessment {
    return {
      ...assessment,
      assessmentDate: assessment.assessmentDate || new Date().toISOString(),
      riskLevel: assessment.riskLevel || this.getRiskLevel(assessment.overallRiskScore)
    };
  }

  /**
   * 🎯 Déterminer le niveau de risque
   */
  private getRiskLevel(score: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MODERATE';
    return 'LOW';
  }

  /**
   * 🧮 Calcul du risque basé sur le résultat de labo
   */
  /**
   * ✅ Vérifier si résultat est anormal
   */
  private isAbnormalResult(result: string, referenceRange: string): boolean {
    const value = this.parseLabNumeric(result);
    const bounds = this.parseReferenceBounds(referenceRange);
    if (value === null || !bounds) {
      return false;
    }

    return value < bounds.min || value > bounds.max;
  }

  private parseLabNumeric(raw: string): number | null {
    const cleaned = String(raw).replace(',', '.').replace(/[^\d.-]/g, '');
    const match = cleaned.match(/-?\d+(\.\d+)?/);
    if (!match) {
      return null;
    }

    const n = parseFloat(match[0]);
    return Number.isFinite(n) ? n : null;
  }

  private parseReferenceBounds(referenceRange: string): { min: number; max: number } | null {
    const r = referenceRange.trim().replace(/\s+/g, ' ');

    const between = r.match(/^([\d.,]+)\s*-\s*([\d.,]+)$/);
    if (between) {
      const min = parseFloat(between[1].replace(',', '.'));
      const max = parseFloat(between[2].replace(',', '.'));
      return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null;
    }

    const lt = r.match(/^<\s*([\d.,]+)/i);
    if (lt) {
      const max = parseFloat(lt[1].replace(',', '.'));
      return Number.isFinite(max) ? { min: Number.NEGATIVE_INFINITY, max } : null;
    }

    const gt = r.match(/^>\s*([\d.,]+)/i);
    if (gt) {
      const min = parseFloat(gt[1].replace(',', '.'));
      return Number.isFinite(min) ? { min, max: Number.POSITIVE_INFINITY } : null;
    }

    return null;
  }

  /**
   * 📊 Type d'anomalie
   */
  private getAbnormalityType(result: string, referenceRange: string): 'LOW' | 'HIGH' | 'CRITICAL' {
    const value = this.parseLabNumeric(result);
    const bounds = this.parseReferenceBounds(referenceRange);
    if (value === null || !bounds) {
      return 'HIGH';
    }

    if (!Number.isFinite(bounds.min) && Number.isFinite(bounds.max)) {
      return value > bounds.max ? 'HIGH' : 'LOW';
    }

    if (Number.isFinite(bounds.min) && !Number.isFinite(bounds.max)) {
      return value < bounds.min ? 'HIGH' : 'LOW';
    }

    if (!Number.isFinite(bounds.min) || !Number.isFinite(bounds.max)) {
      return 'HIGH';
    }

    const span = Math.max(1e-6, bounds.max - bounds.min);
    if (value < bounds.min) {
      const deviation = (bounds.min - value) / span;
      return deviation > 0.5 ? 'CRITICAL' : 'LOW';
    }

    if (value > bounds.max) {
      const deviation = (value - bounds.max) / span;
      return deviation > 0.5 ? 'CRITICAL' : 'HIGH';
    }

    return 'HIGH';
  }

  /**
   * 💊 Vérifier les interactions connues
   */
  private hasKnownInteraction(med1: string, med2: string): boolean {
    const interactions = [
      ['warfarin', 'aspirin'],
      ['metformin', 'alcohol'],
      ['lisinopril', 'potassium'],
      ['simvastatin', 'erythromycin'],
      ['ibuprofen', 'lisinopril'],
      ['aspirin', 'clopidogrel']
    ];

    const normalized1 = med1.toLowerCase();
    const normalized2 = med2.toLowerCase();

    return interactions.some(
      (pair) =>
        (normalized1.includes(pair[0]) && normalized2.includes(pair[1])) ||
        (normalized1.includes(pair[1]) && normalized2.includes(pair[0]))
    );
  }

  /**
   * 📝 Recommandations de base
   */
  private generateBasicRecommendations(score: number): string[] {
    if (score > 70) {
      return ['Prompt medical consultation recommended.', 'Intensify monitoring per service protocols.'];
    }
    if (score > 50) {
      return ['Plan a follow-up visit.', 'Complete ordered ancillary tests.'];
    }
    return ['Continue routine follow-up.', 'Adhere to treatment and scheduled visits.'];
  }

  // =============== GESTION LOCALE ===============

  private getLocalRiskAssessments(): MedicalRiskAssessment[] {
    try {
      const data = localStorage.getItem(this.localRiskKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLocalRiskAssessments(assessments: MedicalRiskAssessment[]): void {
    localStorage.setItem(this.localRiskKey, JSON.stringify(assessments));
  }

  private saveRiskAssessmentLocally(assessment: MedicalRiskAssessment): void {
    const assessments = this.getLocalRiskAssessments();
    const index = assessments.findIndex((a) => a.id === assessment.id);
    if (index !== -1) {
      assessments[index] = assessment;
    } else {
      assessments.push(assessment);
    }
    this.setLocalRiskAssessments(assessments);
  }
}
