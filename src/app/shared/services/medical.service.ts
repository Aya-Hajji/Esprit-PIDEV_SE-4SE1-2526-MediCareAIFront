import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AllergyDTO,
  Disease,
  LabResultDTO,
  MedicalImageDTO,
  MedicalRecordDTO,
  PrescriptionDTO,
  Symptom,
  VisitNoteDTO
} from '../models/medical.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicalService {
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private diseaseUrl = `${this.baseUrl}/diseases`;
  private symptomUrl = `${this.baseUrl}/symptoms`;
  private medicalRecordUrl = `${this.baseUrl}/medical-records`;
  private visitNoteUrl = `${this.baseUrl}/visit-notes`;
  private prescriptionUrl = `${this.baseUrl}/prescriptions`;
  private medicalImageUrl = `${this.baseUrl}/medical-images`;
  private labResultUrl = `${this.baseUrl}/lab-results`;
  private allergyUrl = `${this.baseUrl}/allergies`;

  constructor(private http: HttpClient) {}

  // Diseases
  getAllDiseases(): Observable<Disease[]> {
    return this.http.get<Disease[]>(this.diseaseUrl);
  }

  getDiseaseById(id: number): Observable<Disease> {
    return this.http.get<Disease>(`${this.diseaseUrl}/${id}`);
  }

  getDiseasesBySpecialty(specialtyId: number): Observable<Disease[]> {
    return this.http.get<Disease[]>(`${this.diseaseUrl}/by-specialty/${specialtyId}`);
  }

  createDisease(disease: Disease): Observable<Disease> {
    return this.http.post<Disease>(this.diseaseUrl, disease);
  }

  updateDisease(id: number, disease: Partial<Disease>): Observable<Disease> {
    return this.http.put<Disease>(`${this.diseaseUrl}/${id}`, disease);
  }

  deleteDisease(id: number): Observable<void> {
    return this.http.delete<void>(`${this.diseaseUrl}/${id}`);
  }

  // Symptoms
  getAllSymptoms(): Observable<Symptom[]> {
    return this.http.get<Symptom[]>(this.symptomUrl);
  }

  getSymptomById(id: number): Observable<Symptom> {
    return this.http.get<Symptom>(`${this.symptomUrl}/${id}`);
  }

  createSymptom(symptom: Symptom): Observable<Symptom> {
    return this.http.post<Symptom>(this.symptomUrl, symptom);
  }

  updateSymptom(id: number, symptom: Partial<Symptom>): Observable<Symptom> {
    return this.http.put<Symptom>(`${this.symptomUrl}/${id}`, symptom);
  }

  deleteSymptom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.symptomUrl}/${id}`);
  }

  // Medical Records
  getAllMedicalRecords(): Observable<MedicalRecordDTO[]> {
    return this.http.get<MedicalRecordDTO[]>(this.medicalRecordUrl);
  }

  getMedicalRecordsByPatient(patientId: number): Observable<MedicalRecordDTO[]> {
    return this.http.get<MedicalRecordDTO[]>(`${this.medicalRecordUrl}/patient/${patientId}`);
  }

  getMedicalRecordById(id: number): Observable<MedicalRecordDTO> {
    return this.http.get<MedicalRecordDTO>(`${this.medicalRecordUrl}/${id}`);
  }

  createMedicalRecord(record: MedicalRecordDTO): Observable<MedicalRecordDTO> {
    return this.http.post<MedicalRecordDTO>(this.medicalRecordUrl, record);
  }

  updateMedicalRecord(id: number, record: Partial<MedicalRecordDTO>): Observable<MedicalRecordDTO> {
    return this.http.put<MedicalRecordDTO>(`${this.medicalRecordUrl}/${id}`, record);
  }

  deleteMedicalRecord(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicalRecordUrl}/${id}`);
  }

  // Visit Notes
  getVisitNoteById(id: number): Observable<VisitNoteDTO> {
    return this.http.get<VisitNoteDTO>(`${this.visitNoteUrl}/${id}`);
  }

  createVisitNote(visitNote: VisitNoteDTO): Observable<VisitNoteDTO> {
    return this.http.post<VisitNoteDTO>(this.visitNoteUrl, visitNote);
  }

  updateVisitNote(id: number, visitNote: Partial<VisitNoteDTO>): Observable<VisitNoteDTO> {
    return this.http.put<VisitNoteDTO>(`${this.visitNoteUrl}/${id}`, visitNote);
  }

  deleteVisitNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.visitNoteUrl}/${id}`);
  }

  getVisitNotesByMedicalRecord(medicalRecordId: number): Observable<VisitNoteDTO[]> {
    return this.http.get<VisitNoteDTO[]>(`${this.visitNoteUrl}/medical-record/${medicalRecordId}`);
  }

  // Prescriptions
  getPrescriptionById(id: number): Observable<PrescriptionDTO> {
    return this.http.get<PrescriptionDTO>(`${this.prescriptionUrl}/${id}`);
  }

  createPrescription(prescription: PrescriptionDTO): Observable<PrescriptionDTO> {
    return this.http.post<PrescriptionDTO>(this.prescriptionUrl, prescription);
  }

  updatePrescription(id: number, prescription: Partial<PrescriptionDTO>): Observable<PrescriptionDTO> {
    return this.http.put<PrescriptionDTO>(`${this.prescriptionUrl}/${id}`, prescription);
  }

  deletePrescription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.prescriptionUrl}/${id}`);
  }

  getPrescriptionsByMedicalRecord(medicalRecordId: number): Observable<PrescriptionDTO[]> {
    return this.http.get<PrescriptionDTO[]>(`${this.prescriptionUrl}/medical-record/${medicalRecordId}`);
  }

  // Medical Images
  getMedicalImageById(id: number): Observable<MedicalImageDTO> {
    return this.http.get<MedicalImageDTO>(`${this.medicalImageUrl}/${id}`);
  }

  createMedicalImage(medicalImage: MedicalImageDTO): Observable<MedicalImageDTO> {
    return this.http.post<MedicalImageDTO>(this.medicalImageUrl, medicalImage);
  }

  updateMedicalImage(id: number, medicalImage: Partial<MedicalImageDTO>): Observable<MedicalImageDTO> {
    return this.http.put<MedicalImageDTO>(`${this.medicalImageUrl}/${id}`, medicalImage);
  }

  deleteMedicalImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicalImageUrl}/${id}`);
  }

  getMedicalImagesByMedicalRecord(medicalRecordId: number): Observable<MedicalImageDTO[]> {
    return this.http.get<MedicalImageDTO[]>(`${this.medicalImageUrl}/medical-record/${medicalRecordId}`);
  }

  // Lab Results
  getLabResultById(id: number): Observable<LabResultDTO> {
    return this.http.get<LabResultDTO>(`${this.labResultUrl}/${id}`);
  }

  createLabResult(labResult: LabResultDTO): Observable<LabResultDTO> {
    return this.http.post<LabResultDTO>(this.labResultUrl, labResult);
  }

  updateLabResult(id: number, labResult: Partial<LabResultDTO>): Observable<LabResultDTO> {
    return this.http.put<LabResultDTO>(`${this.labResultUrl}/${id}`, labResult);
  }

  deleteLabResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.labResultUrl}/${id}`);
  }

  getLabResultsByMedicalRecord(medicalRecordId: number): Observable<LabResultDTO[]> {
    return this.http.get<LabResultDTO[]>(`${this.labResultUrl}/medical-record/${medicalRecordId}`);
  }

  // Allergies
  getAllergyById(id: number): Observable<AllergyDTO> {
    return this.http.get<AllergyDTO>(`${this.allergyUrl}/${id}`);
  }

  createAllergy(allergy: AllergyDTO): Observable<AllergyDTO> {
    return this.http.post<AllergyDTO>(this.allergyUrl, allergy);
  }

  updateAllergy(id: number, allergy: Partial<AllergyDTO>): Observable<AllergyDTO> {
    return this.http.put<AllergyDTO>(`${this.allergyUrl}/${id}`, allergy);
  }

  deleteAllergy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.allergyUrl}/${id}`);
  }

  getAllergiesByMedicalRecord(medicalRecordId: number): Observable<AllergyDTO[]> {
    return this.http.get<AllergyDTO[]>(`${this.allergyUrl}/medical-record/${medicalRecordId}`);
  }

  // Backward-compatible aliases
  getAllRecords(): Observable<MedicalRecordDTO[]> {
    return this.getAllMedicalRecords();
  }

  getMyRecords(): Observable<MedicalRecordDTO[]> {
    return this.http.get<MedicalRecordDTO[]>(`${this.medicalRecordUrl}/me`);
  }

  getRecordById(id: number): Observable<MedicalRecordDTO> {
    return this.getMedicalRecordById(id);
  }

  createRecord(patientIdOrRecord: number | MedicalRecordDTO, record?: MedicalRecordDTO): Observable<MedicalRecordDTO> {
    if (typeof patientIdOrRecord === 'number') {
      const payload: MedicalRecordDTO = {
        ...(record || ({} as MedicalRecordDTO)),
        patientId: record?.patientId ?? patientIdOrRecord
      };
      return this.createMedicalRecord(payload);
    }

    return this.createMedicalRecord(patientIdOrRecord);
  }

  updateRecord(id: number, record: Partial<MedicalRecordDTO>): Observable<MedicalRecordDTO> {
    return this.updateMedicalRecord(id, record);
  }

  deleteRecord(id: number): Observable<void> {
    return this.deleteMedicalRecord(id);
  }
}
