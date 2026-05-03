import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Allergy,
  AllergyHistory,
  MedicalHistory,
  Symptom,
  SymptomCheckerRequest,
  SymptomCheckerResult,
  VaccineRecord,
  MedicationHistory,
  Disease,
  LabTest,
  LabTestDTO,
  Vital,
  VitalHistory
} from '../models/allergy.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AllergyService {
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private allergiesUrl = `${this.baseUrl}/allergies`;
  private medicalHistoryUrl = `${this.baseUrl}/medical-history`;
  private symptomsUrl = `${this.baseUrl}/symptoms`;
  private vaccinesUrl = `${this.baseUrl}/vaccines`;
  private medicationsUrl = `${this.baseUrl}/medications`;
  private diseasesUrl = `${this.baseUrl}/diseases`;
  private labTestsUrl = `${this.baseUrl}/lab-tests`;
  private vitalsUrl = `${this.baseUrl}/vitals`;
  private symptomCheckerUrl = `${this.baseUrl}/symptom-checker`;

  constructor(private http: HttpClient) {}

  // ==================== ALLERGIES ====================

  /**
   * Record allergy
   */
  recordAllergy(allergy: Allergy): Observable<Allergy> {
    return this.http.post<Allergy>(this.allergiesUrl, allergy);
  }

  /**
   * Get allergies for a user
   */
  getAllergies(userId: number): Observable<Allergy[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Allergy[]>(this.allergiesUrl, { params });
  }

  /**
   * Get allergy by ID
   */
  getAllergyById(id: number): Observable<Allergy> {
    return this.http.get<Allergy>(`${this.allergiesUrl}/${id}`);
  }

  /**
   * Update allergy
   */
  updateAllergy(id: number, allergy: Partial<Allergy>): Observable<Allergy> {
    return this.http.put<Allergy>(`${this.allergiesUrl}/${id}`, allergy);
  }

  /**
   * Delete allergy
   */
  deleteAllergy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.allergiesUrl}/${id}`);
  }

  /**
   * Get allergy history with analysis
   */
  getAllergyHistory(userId: number): Observable<AllergyHistory> {
    return this.http.get<AllergyHistory>(`${this.allergiesUrl}/user/${userId}/history`);
  }

  /**
   * Get critical allergies (severity = CRITICAL)
   */
  getCriticalAllergies(userId: number): Observable<Allergy[]> {
    return this.http.get<Allergy[]>(`${this.allergiesUrl}/user/${userId}/critical`);
  }

  /**
   * Check for drug-allergy interaction
   */
  checkDrugAllergyInteraction(userId: number, medicineId: number): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('medicineId', medicineId.toString());

    return this.http.get(`${this.allergiesUrl}/check-interaction`, { params });
  }

  // ==================== MEDICAL HISTORY ====================

  /**
   * Add medical history entry
   */
  addMedicalHistory(medicalHistory: MedicalHistory): Observable<MedicalHistory> {
    return this.http.post<MedicalHistory>(this.medicalHistoryUrl, medicalHistory);
  }

  /**
   * Get medical history for a user
   */
  getMedicalHistory(userId: number): Observable<MedicalHistory[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<MedicalHistory[]>(this.medicalHistoryUrl, { params });
  }

  /**
   * Get medical history entry by ID
   */
  getMedicalHistoryById(id: number): Observable<MedicalHistory> {
    return this.http.get<MedicalHistory>(`${this.medicalHistoryUrl}/${id}`);
  }

  /**
   * Update medical history
   */
  updateMedicalHistory(id: number, medicalHistory: Partial<MedicalHistory>): Observable<MedicalHistory> {
    return this.http.put<MedicalHistory>(`${this.medicalHistoryUrl}/${id}`, medicalHistory);
  }

  /**
   * Delete medical history
   */
  deleteMedicalHistory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicalHistoryUrl}/${id}`);
  }

  // ==================== SYMPTOMS ====================

  /**
   * Log symptom
   */
  logSymptom(symptom: Symptom): Observable<Symptom> {
    return this.http.post<Symptom>(this.symptomsUrl, symptom);
  }

  /**
   * Get user symptoms
   */
  getUserSymptoms(userId: number): Observable<Symptom[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Symptom[]>(this.symptomsUrl, { params });
  }

  /**
   * Get symptom by ID
   */
  getSymptomById(id: number): Observable<Symptom> {
    return this.http.get<Symptom>(`${this.symptomsUrl}/${id}`);
  }

  /**
   * Delete symptom
   */
  deleteSymptom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.symptomsUrl}/${id}`);
  }

  // ==================== SYMPTOM CHECKER ====================

  /**
   * Check symptoms using AI
   */
  checkSymptoms(request: SymptomCheckerRequest): Observable<SymptomCheckerResult> {
    return this.http.post<SymptomCheckerResult>(this.symptomCheckerUrl, request);
  }

  /**
   * Get symptom suggestions
   */
  getSymptomSuggestions(keyword: string): Observable<string[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<string[]>(`${this.symptomCheckerUrl}/suggestions`, { params });
  }

  // ==================== VACCINES ====================

  /**
   * Record vaccine
   */
  recordVaccine(vaccine: VaccineRecord): Observable<VaccineRecord> {
    return this.http.post<VaccineRecord>(this.vaccinesUrl, vaccine);
  }

  /**
   * Get vaccine records for a user
   */
  getVaccineRecords(userId: number): Observable<VaccineRecord[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<VaccineRecord[]>(this.vaccinesUrl, { params });
  }

  /**
   * Get vaccine record by ID
   */
  getVaccineRecordById(id: number): Observable<VaccineRecord> {
    return this.http.get<VaccineRecord>(`${this.vaccinesUrl}/${id}`);
  }

  /**
   * Update vaccine record
   */
  updateVaccineRecord(id: number, vaccine: Partial<VaccineRecord>): Observable<VaccineRecord> {
    return this.http.put<VaccineRecord>(`${this.vaccinesUrl}/${id}`, vaccine);
  }

  /**
   * Get upcoming vaccine due dates
   */
  getUpcomingVaccines(userId: number): Observable<VaccineRecord[]> {
    return this.http.get<VaccineRecord[]>(`${this.vaccinesUrl}/user/${userId}/upcoming`);
  }

  // ==================== MEDICATION HISTORY ====================

  /**
   * Add medication to history
   */
  addMedication(medication: MedicationHistory): Observable<MedicationHistory> {
    return this.http.post<MedicationHistory>(this.medicationsUrl, medication);
  }

  /**
   * Get medication history for a user
   */
  getMedicationHistory(userId: number): Observable<MedicationHistory[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<MedicationHistory[]>(this.medicationsUrl, { params });
  }

  /**
   * Get current medications
   */
  getCurrentMedications(userId: number): Observable<MedicationHistory[]> {
    return this.http.get<MedicationHistory[]>(`${this.medicationsUrl}/user/${userId}/current`);
  }

  /**
   * Get medication by ID
   */
  getMedicationById(id: number): Observable<MedicationHistory> {
    return this.http.get<MedicationHistory>(`${this.medicationsUrl}/${id}`);
  }

  /**
   * Update medication
   */
  updateMedication(id: number, medication: Partial<MedicationHistory>): Observable<MedicationHistory> {
    return this.http.put<MedicationHistory>(`${this.medicationsUrl}/${id}`, medication);
  }

  /**
   * Delete medication
   */
  deleteMedication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicationsUrl}/${id}`);
  }

  // ==================== DISEASES ====================

  /**
   * Get all diseases
   */
  getAllDiseases(): Observable<Disease[]> {
    return this.http.get<Disease[]>(this.diseasesUrl);
  }

  /**
   * Get disease by ID
   */
  getDiseaseById(id: number): Observable<Disease> {
    return this.http.get<Disease>(`${this.diseasesUrl}/${id}`);
  }

  /**
   * Search diseases by keyword
   */
  searchDiseases(keyword: string): Observable<Disease[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<Disease[]>(`${this.diseasesUrl}/search`, { params });
  }

  // ==================== LAB TESTS ====================

  /**
   * Log lab test result
   */
  logLabTest(test: LabTestDTO): Observable<LabTest> {
    return this.http.post<LabTest>(this.labTestsUrl, test);
  }

  /**
   * Get lab test history for a user
   */
  getLabTestHistory(userId: number): Observable<LabTest[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<LabTest[]>(this.labTestsUrl, { params });
  }

  /**
   * Get lab test by ID
   */
  getLabTestById(id: number): Observable<LabTest> {
    return this.http.get<LabTest>(`${this.labTestsUrl}/${id}`);
  }

  /**
   * Get abnormal lab tests
   */
  getAbnormalLabTests(userId: number): Observable<LabTest[]> {
    return this.http.get<LabTest[]>(`${this.labTestsUrl}/user/${userId}/abnormal`);
  }

  /**
   * Update lab test
   */
  updateLabTest(id: number, test: Partial<LabTestDTO>): Observable<LabTest> {
    return this.http.put<LabTest>(`${this.labTestsUrl}/${id}`, test);
  }

  // ==================== VITALS ====================

  /**
   * Log vital signs
   */
  logVitals(vital: Vital): Observable<Vital> {
    return this.http.post<Vital>(this.vitalsUrl, vital);
  }

  /**
   * Get vital signs history
   */
  getVitalHistory(userId: number, dateRange?: string): Observable<Vital[]> {
    let params = new HttpParams().set('userId', userId.toString());
    if (dateRange) {
      params = params.set('dateRange', dateRange);
    }

    return this.http.get<Vital[]>(this.vitalsUrl, { params });
  }

  /**
   * Get vital signs with analytics
   */
  getVitalHistoryWithAnalytics(userId: number, dateRange?: string): Observable<VitalHistory> {
    let params = new HttpParams().set('userId', userId.toString());
    if (dateRange) {
      params = params.set('dateRange', dateRange);
    }

    return this.http.get<VitalHistory>(`${this.vitalsUrl}/analytics`, { params });
  }

  /**
   * Get latest vital signs
   */
  getLatestVitals(userId: number): Observable<Vital> {
    return this.http.get<Vital>(`${this.vitalsUrl}/user/${userId}/latest`);
  }

  /**
   * Delete vital entry
   */
  deleteVital(id: number): Observable<void> {
    return this.http.delete<void>(`${this.vitalsUrl}/${id}`);
  }
}
