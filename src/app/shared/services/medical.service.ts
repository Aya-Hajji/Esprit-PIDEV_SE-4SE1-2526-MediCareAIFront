import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
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
import { ApiCatalogService } from './api-catalog.service';

@Injectable({
  providedIn: 'root'
})
export class MedicalService {
  private readonly forceLocalCrud = true;
  private readonly localMedicalRecordsKey = 'localMedicalRecordsFallback';
  private readonly localDiseasesKey = 'localDiseasesFallback';
  private readonly localSymptomsKey = 'localSymptomsFallback';
  private baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  private diseaseUrl = `${this.baseUrl}/diseases`;
  private symptomUrl = `${this.baseUrl}/symptoms`;
  private medicalRecordUrl = `${this.baseUrl}/medical-records`;
  private visitNoteUrl = `${this.baseUrl}/visit-notes`;
  private prescriptionUrl = `${this.baseUrl}/prescriptions`;
  private medicalImageUrl = `${this.baseUrl}/medical-images`;
  private labResultUrl = `${this.baseUrl}/lab-results`;
  private allergyUrl = `${this.baseUrl}/allergies`;

  constructor(
    private http: HttpClient,
    private apiCatalog: ApiCatalogService
  ) {}

  // Diseases
  getAllDiseases(): Observable<Disease[]> {
    return this.http.get<unknown>(this.diseaseUrl).pipe(
      map((response) => this.normalizeDiseaseList(response)),
      tap((rows) => this.setLocalDiseases(rows)),
      catchError(() => of(this.getLocalDiseases()))
    );
  }

  getDiseaseById(id: number): Observable<Disease> {
    return this.http.get<unknown>(`${this.diseaseUrl}/${id}`).pipe(
      map((response) => this.normalizeDisease(response)),
      catchError(() => of(this.getLocalDiseases().find((item) => item.id === id) || this.normalizeDisease({ id })))
    );
  }

  getDiseasesBySpecialty(specialtyId: number): Observable<Disease[]> {
    return this.http.get<Disease[]>(`${this.diseaseUrl}/by-specialty/${specialtyId}`).pipe(
      catchError(() => of(this.getLocalDiseases().filter((item) => item.specialtyId === specialtyId)))
    );
  }

  createDisease(disease: Disease): Observable<Disease> {
    return this.http.post<unknown>(this.diseaseUrl, disease).pipe(
      map((response) => this.normalizeDisease(response)),
      tap((created) => this.saveLocalDisease(created)),
      catchError(() => {
        const created = this.createLocalDisease(disease);
        this.saveLocalDisease(created);
        return of(created);
      })
    );
  }

  updateDisease(id: number, disease: Partial<Disease>): Observable<Disease> {
    return this.http.put<unknown>(`${this.diseaseUrl}/${id}`, disease).pipe(
      map((response) => this.normalizeDisease(response)),
      tap((updated) => this.saveLocalDisease({ ...updated, id })),
      catchError(() => {
        const current = this.getLocalDiseases().find((item) => item.id === id) || this.normalizeDisease({ id });
        const updated = { ...current, ...disease, id };
        this.saveLocalDisease(updated);
        return of(updated);
      })
    );
  }

  deleteDisease(id: number): Observable<void> {
    return this.http.delete<void>(`${this.diseaseUrl}/${id}`).pipe(
      tap(() => this.setLocalDiseases(this.getLocalDiseases().filter((item) => item.id !== id))),
      catchError(() => {
        this.setLocalDiseases(this.getLocalDiseases().filter((item) => item.id !== id));
        return of(void 0);
      })
    );
  }

  // Symptoms
  getAllSymptoms(): Observable<Symptom[]> {
    return this.http.get<unknown>(this.symptomUrl).pipe(
      map((response) => this.normalizeSymptomList(response)),
      tap((rows) => this.setLocalSymptoms(rows)),
      catchError(() => of(this.getLocalSymptoms()))
    );
  }

  getSymptomById(id: number): Observable<Symptom> {
    return this.http.get<unknown>(`${this.symptomUrl}/${id}`).pipe(
      map((response) => this.normalizeSymptom(response)),
      catchError(() => of(this.getLocalSymptoms().find((item) => item.id === id) || this.normalizeSymptom({ id })))
    );
  }

  createSymptom(symptom: Symptom): Observable<Symptom> {
    return this.http.post<unknown>(this.symptomUrl, symptom).pipe(
      map((response) => this.normalizeSymptom(response)),
      tap((created) => this.saveLocalSymptom(created)),
      catchError(() => {
        const created = this.createLocalSymptom(symptom);
        this.saveLocalSymptom(created);
        return of(created);
      })
    );
  }

  updateSymptom(id: number, symptom: Partial<Symptom>): Observable<Symptom> {
    return this.http.put<unknown>(`${this.symptomUrl}/${id}`, symptom).pipe(
      map((response) => this.normalizeSymptom(response)),
      tap((updated) => this.saveLocalSymptom({ ...updated, id })),
      catchError(() => {
        const current = this.getLocalSymptoms().find((item) => item.id === id) || this.normalizeSymptom({ id });
        const updated = { ...current, ...symptom, id };
        this.saveLocalSymptom(updated);
        return of(updated);
      })
    );
  }

  deleteSymptom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.symptomUrl}/${id}`).pipe(
      tap(() => this.setLocalSymptoms(this.getLocalSymptoms().filter((item) => item.id !== id))),
      catchError(() => {
        this.setLocalSymptoms(this.getLocalSymptoms().filter((item) => item.id !== id));
        return of(void 0);
      })
    );
  }

  // Medical Records
  getAllMedicalRecords(): Observable<MedicalRecordDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.getLocalMedicalRecords());
    }

    return this.getLenient(this.medicalRecordUrl).pipe(
      map((response) => this.normalizeMedicalRecordList(response)),
      tap((rows) => this.setLocalMedicalRecords(rows)),
      catchError(() => of(this.getLocalMedicalRecords()))
    );
  }

  getMedicalRecordsByPatient(patientId: number): Observable<MedicalRecordDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.getLocalMedicalRecords().filter((item) => item.patientId === patientId));
    }

    return this
      .getLenient(`${this.medicalRecordUrl}/patient/${patientId}`)
      .pipe(
        map((response) => this.normalizeMedicalRecordList(response)),
        tap((rows) => this.setLocalMedicalRecords(this.mergeMedicalRecords(this.getLocalMedicalRecords(), rows))),
        catchError(() => of(this.getLocalMedicalRecords().filter((item) => item.patientId === patientId)))
      );
  }

  getMedicalRecordById(id: number): Observable<MedicalRecordDTO> {
    if (this.forceLocalCrud) {
      return of(this.getLocalMedicalRecords().find((item) => item.id === id) || this.normalizeMedicalRecord({ id }));
    }

    return this.getLenient(`${this.medicalRecordUrl}/${id}`).pipe(
      map((response) => this.normalizeMedicalRecord(response)),
      catchError(() => of(this.getLocalMedicalRecords().find((item) => item.id === id) || this.normalizeMedicalRecord({ id })))
    );
  }

  getMedicalRecordByPatientId(patientId: number): Observable<MedicalRecordDTO> {
    if (this.forceLocalCrud) {
      return of(this.pickPrimaryMedicalRecordForPatient(patientId));
    }

    return this.getLenient(`${this.medicalRecordUrl}/patient/${patientId}`).pipe(
      map((response) => this.normalizeMedicalRecord(response)),
      catchError(() => of(this.pickPrimaryMedicalRecordForPatient(patientId)))
    );
  }

  createMedicalRecord(record: MedicalRecordDTO): Observable<MedicalRecordDTO> {
    if (this.forceLocalCrud) {
      const created = this.createLocalMedicalRecord(record);
      const merged = this.mergeMedicalRecords(this.getLocalMedicalRecords(), [created]);
      this.setLocalMedicalRecords(merged);
      return of(created);
    }

    return this
      .postLenient(this.medicalRecordUrl, this.toBackendMedicalRecordPayload(record))
      .pipe(
        map((response) => this.normalizeMedicalRecord(response)),
        tap((created) => {
          const merged = this.mergeMedicalRecords(this.getLocalMedicalRecords(), [created]);
          this.setLocalMedicalRecords(merged);
        }),
        catchError(() => {
          const created = this.createLocalMedicalRecord(record);
          const merged = this.mergeMedicalRecords(this.getLocalMedicalRecords(), [created]);
          this.setLocalMedicalRecords(merged);
          return of(created);
        })
      );
  }

  updateMedicalRecord(id: number, record: Partial<MedicalRecordDTO>): Observable<MedicalRecordDTO> {
    if (this.forceLocalCrud) {
      const existing = this.getLocalMedicalRecords().find((item) => item.id === id)
        || this.createLocalMedicalRecord({ patientId: record.patientId || 0 } as MedicalRecordDTO);
      const updated: MedicalRecordDTO = { ...existing, ...record, id };
      const rows = this.getLocalMedicalRecords().map((item) => (item.id === id ? updated : item));
      this.setLocalMedicalRecords(rows);
      return of(updated);
    }

    return this
      .putLenient(`${this.medicalRecordUrl}/${id}`, this.toBackendMedicalRecordPayload(record))
      .pipe(
        map((response) => this.normalizeMedicalRecord(response)),
        tap((updated) => {
          const rows = this.getLocalMedicalRecords().map((item) => (item.id === id ? { ...item, ...updated, id } : item));
          this.setLocalMedicalRecords(rows);
        }),
        catchError(() => {
          const existing = this.getLocalMedicalRecords().find((item) => item.id === id) || this.createLocalMedicalRecord({ patientId: record.patientId || 0 } as MedicalRecordDTO);
          const updated: MedicalRecordDTO = { ...existing, ...record, id };
          const rows = this.getLocalMedicalRecords().map((item) => (item.id === id ? updated : item));
          this.setLocalMedicalRecords(rows);
          return of(updated);
        })
      );
  }

  deleteMedicalRecord(id: number): Observable<void> {
    if (this.forceLocalCrud) {
      this.setLocalMedicalRecords(this.getLocalMedicalRecords().filter((item) => item.id !== id));
      return of(void 0);
    }

    return this.http.delete<void>(`${this.medicalRecordUrl}/${id}`).pipe(
      tap(() => this.setLocalMedicalRecords(this.getLocalMedicalRecords().filter((item) => item.id !== id))),
      catchError(() => {
        this.setLocalMedicalRecords(this.getLocalMedicalRecords().filter((item) => item.id !== id));
        return of(void 0);
      })
    );
  }

  // Visit Notes
  getVisitNoteById(id: number): Observable<VisitNoteDTO> {
    return this.http.get<unknown>(`${this.visitNoteUrl}/${id}`).pipe(map((response) => this.normalizeVisitNote(response)));
  }

  createVisitNote(visitNote: VisitNoteDTO): Observable<VisitNoteDTO> {
    return this.http
      .post<unknown>(this.visitNoteUrl, this.toBackendVisitNotePayload(visitNote))
      .pipe(map((response) => this.normalizeVisitNote(response)));
  }

  updateVisitNote(id: number, visitNote: Partial<VisitNoteDTO>): Observable<VisitNoteDTO> {
    return this.http
      .put<unknown>(`${this.visitNoteUrl}/${id}`, this.toBackendVisitNotePayload(visitNote))
      .pipe(map((response) => this.normalizeVisitNote(response)));
  }

  deleteVisitNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.visitNoteUrl}/${id}`);
  }

  getVisitNotesByMedicalRecord(medicalRecordId: number): Observable<VisitNoteDTO[]> {
    return this.http
      .get<unknown>(`${this.visitNoteUrl}/medical-record/${medicalRecordId}`)
      .pipe(map((response) => this.normalizeVisitNoteList(response)));
  }

  searchVisitNotes(filters: {
    patientKeyword?: string;
    doctorKeyword?: string;
    clinicalKeyword?: string;
  }): Observable<VisitNoteDTO[]> {
    const params = this.buildVisitNoteSearchParams(filters);

    return this.http
      .get<unknown>(`${this.visitNoteUrl}/search`, { params })
      .pipe(map((response) => this.normalizeVisitNoteList(response)));
  }

  // Prescriptions
  getPrescriptionById(id: number): Observable<PrescriptionDTO> {
    return this.http
      .get<unknown>(`${this.prescriptionUrl}/${id}`)
      .pipe(map((response) => this.normalizePrescription(response)));
  }

  createPrescription(prescription: PrescriptionDTO): Observable<PrescriptionDTO> {
    return this.http
      .post<unknown>(this.prescriptionUrl, this.toBackendPrescriptionPayload(prescription))
      .pipe(map((response) => this.normalizePrescription(response)));
  }

  updatePrescription(id: number, prescription: Partial<PrescriptionDTO>): Observable<PrescriptionDTO> {
    return this.http
      .put<unknown>(`${this.prescriptionUrl}/${id}`, this.toBackendPrescriptionPayload(prescription))
      .pipe(map((response) => this.normalizePrescription(response)));
  }

  deletePrescription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.prescriptionUrl}/${id}`);
  }

  getPrescriptionsByMedicalRecord(medicalRecordId: number): Observable<PrescriptionDTO[]> {
    return this.http
      .get<unknown>(`${this.prescriptionUrl}/medical-record/${medicalRecordId}`)
      .pipe(map((response) => this.normalizePrescriptionList(response)));
  }

  // Medical Images
  getMedicalImageById(id: number): Observable<MedicalImageDTO> {
    return this.http
      .get<unknown>(`${this.medicalImageUrl}/${id}`)
      .pipe(map((response) => this.normalizeMedicalImage(response)));
  }

  createMedicalImage(medicalImage: MedicalImageDTO): Observable<MedicalImageDTO> {
    return this.http
      .post<unknown>(this.medicalImageUrl, this.toBackendMedicalImagePayload(medicalImage))
      .pipe(map((response) => this.normalizeMedicalImage(response)));
  }

  updateMedicalImage(id: number, medicalImage: Partial<MedicalImageDTO>): Observable<MedicalImageDTO> {
    return this.http
      .put<unknown>(`${this.medicalImageUrl}/${id}`, this.toBackendMedicalImagePayload(medicalImage))
      .pipe(map((response) => this.normalizeMedicalImage(response)));
  }

  deleteMedicalImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicalImageUrl}/${id}`);
  }

  getMedicalImagesByMedicalRecord(medicalRecordId: number): Observable<MedicalImageDTO[]> {
    return this.http
      .get<unknown>(`${this.medicalImageUrl}/medical-record/${medicalRecordId}`)
      .pipe(map((response) => this.normalizeMedicalImageList(response)));
  }

  // Lab Results
  getLabResultById(id: number): Observable<LabResultDTO> {
    return this.http.get<unknown>(`${this.labResultUrl}/${id}`).pipe(map((response) => this.normalizeLabResult(response)));
  }

  createLabResult(labResult: LabResultDTO): Observable<LabResultDTO> {
    return this.http
      .post<unknown>(this.labResultUrl, this.toBackendLabResultPayload(labResult))
      .pipe(map((response) => this.normalizeLabResult(response)));
  }

  updateLabResult(id: number, labResult: Partial<LabResultDTO>): Observable<LabResultDTO> {
    return this.http
      .put<unknown>(`${this.labResultUrl}/${id}`, this.toBackendLabResultPayload(labResult))
      .pipe(map((response) => this.normalizeLabResult(response)));
  }

  deleteLabResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.labResultUrl}/${id}`);
  }

  getLabResultsByMedicalRecord(medicalRecordId: number): Observable<LabResultDTO[]> {
    return this.http
      .get<unknown>(`${this.labResultUrl}/medical-record/${medicalRecordId}`)
      .pipe(map((response) => this.normalizeLabResultList(response)));
  }

  // Allergies
  getAllergyById(id: number): Observable<AllergyDTO> {
    return this.http.get<unknown>(`${this.allergyUrl}/${id}`).pipe(map((response) => this.normalizeAllergy(response)));
  }

  createAllergy(allergy: AllergyDTO): Observable<AllergyDTO> {
    return this.http
      .post<unknown>(this.allergyUrl, this.toBackendAllergyPayload(allergy))
      .pipe(map((response) => this.normalizeAllergy(response)));
  }

  updateAllergy(id: number, allergy: Partial<AllergyDTO>): Observable<AllergyDTO> {
    return this.http
      .put<unknown>(`${this.allergyUrl}/${id}`, this.toBackendAllergyPayload(allergy))
      .pipe(map((response) => this.normalizeAllergy(response)));
  }

  deleteAllergy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.allergyUrl}/${id}`);
  }

  getAllergiesByMedicalRecord(medicalRecordId: number): Observable<AllergyDTO[]> {
    return this.http
      .get<unknown>(`${this.allergyUrl}/medical-record/${medicalRecordId}`)
      .pipe(map((response) => this.normalizeAllergyList(response)));
  }

  // Backward-compatible aliases
  getAllRecords(): Observable<MedicalRecordDTO[]> {
    return this.getAllMedicalRecords();
  }

  getMyRecords(): Observable<MedicalRecordDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.getLocalMedicalRecords());
    }

    return this.getLenient(`${this.medicalRecordUrl}/me`).pipe(
      map((response) => this.normalizeMedicalRecordList(response)),
      catchError(() => of(this.getLocalMedicalRecords()))
    );
  }

  private getLocalMedicalRecords(): MedicalRecordDTO[] {
    try {
      const raw = localStorage.getItem(this.localMedicalRecordsKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((item) => this.normalizeMedicalRecord(item)) : [];
    } catch {
      return [];
    }
  }

  private setLocalMedicalRecords(rows: MedicalRecordDTO[]): void {
    try {
      localStorage.setItem(this.localMedicalRecordsKey, JSON.stringify(rows));
    } catch {
      // Ignore storage errors.
    }
  }

  private mergeMedicalRecords(existing: MedicalRecordDTO[], incoming: MedicalRecordDTO[]): MedicalRecordDTO[] {
    const mapById = new Map<number, MedicalRecordDTO>();
    existing.forEach((item) => {
      if (item.id) {
        mapById.set(item.id, item);
      }
    });

    incoming.forEach((item) => {
      if (item.id) {
        mapById.set(item.id, item);
      }
    });

    return Array.from(mapById.values());
  }

  private createLocalMedicalRecord(input: MedicalRecordDTO): MedicalRecordDTO {
    const nextId = this.getLocalMedicalRecords().reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
    return {
      id: nextId,
      patientId: input.patientId || 0,
      bloodType: input.bloodType || undefined,
      emergencyContactName: input.emergencyContactName || undefined,
      emergencyContactPhone: input.emergencyContactPhone || undefined,
      status: input.status || 'ACTIVE',
      medicalHistories: input.medicalHistories?.length ? [...input.medicalHistories] : undefined,
      allergies: input.allergies?.length ? [...input.allergies] : undefined,
      chronicDiseases: input.chronicDiseases?.length ? [...input.chronicDiseases] : undefined
    };
  }

  private pickPrimaryMedicalRecordForPatient(patientId: number): MedicalRecordDTO {
    const rows = this.getLocalMedicalRecords().filter((item) => item.patientId === patientId);
    if (rows.length === 0) {
      return this.normalizeMedicalRecord({ patientId });
    }

    const active = rows.filter((r) => (r.status || '').toUpperCase() === 'ACTIVE');
    const pool = active.length > 0 ? active : rows;
    return pool.reduce((best, cur) => {
      const bid = best.id || 0;
      const cid = cur.id || 0;
      return cid >= bid ? cur : best;
    });
  }

  private getLenient(url: string): Observable<unknown> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map((raw) => this.parseLenientResponse(raw))
    );
  }

  private postLenient(url: string, body: unknown): Observable<unknown> {
    return this.http.post(url, body, { responseType: 'text' }).pipe(
      map((raw) => this.parseLenientResponse(raw))
    );
  }

  private putLenient(url: string, body: unknown): Observable<unknown> {
    return this.http.put(url, body, { responseType: 'text' }).pipe(
      map((raw) => this.parseLenientResponse(raw))
    );
  }

  private parseLenientResponse(raw: string): unknown {
    const value = (raw || '').trim();
    if (!value) {
      return [];
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
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

  private normalizeDiseaseList(response: unknown): Disease[] {
    return this.extractArrayResponse(response)
      .map((row) => this.normalizeDisease(row))
      .filter((row) => !!row.name);
  }

  private normalizeDisease(response: unknown): Disease {
    const source = this.unwrapObject(response);
    return {
      id: this.readNumber(source['id']) || undefined,
      name: this.readString(source['name']),
      description: this.readString(source['description']) || undefined,
      causes: this.readString(source['causes']) || undefined,
      treatment: this.readString(source['treatment']) || undefined,
      specialtyId: this.readNumber(source['specialtyId']) || 0,
      symptomIds: this.readNumberArray(source['symptomIds'])
    };
  }

  private getLocalDiseases(): Disease[] {
    try {
      const data = localStorage.getItem(this.localDiseasesKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLocalDiseases(diseases: Disease[]): void {
    localStorage.setItem(this.localDiseasesKey, JSON.stringify(diseases));
  }

  private saveLocalDisease(disease: Disease): void {
    const diseases = this.getLocalDiseases();
    const index = diseases.findIndex((item) => item.id === disease.id);

    if (index !== -1) {
      diseases[index] = disease;
    } else {
      diseases.push(disease);
    }

    this.setLocalDiseases(diseases);
  }

  private createLocalDisease(disease: Disease): Disease {
    const diseases = this.getLocalDiseases();
    const nextId = diseases.length > 0 ? Math.max(...diseases.map((item) => item.id || 0)) + 1 : 1;
    return { ...disease, id: disease.id || nextId };
  }

  private normalizeSymptomList(response: unknown): Symptom[] {
    return this.extractArrayResponse(response)
      .map((row) => this.normalizeSymptom(row))
      .filter((row) => !!row.name);
  }

  private normalizeSymptom(response: unknown): Symptom {
    const source = this.unwrapObject(response);
    return {
      id: this.readNumber(source['id']) || undefined,
      name: this.readString(source['name']),
      description: this.readString(source['description']) || undefined
    };
  }

  private getLocalSymptoms(): Symptom[] {
    try {
      const data = localStorage.getItem(this.localSymptomsKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLocalSymptoms(symptoms: Symptom[]): void {
    localStorage.setItem(this.localSymptomsKey, JSON.stringify(symptoms));
  }

  private saveLocalSymptom(symptom: Symptom): void {
    const symptoms = this.getLocalSymptoms();
    const index = symptoms.findIndex((item) => item.id === symptom.id);

    if (index !== -1) {
      symptoms[index] = symptom;
    } else {
      symptoms.push(symptom);
    }

    this.setLocalSymptoms(symptoms);
  }

  private createLocalSymptom(symptom: Symptom): Symptom {
    const symptoms = this.getLocalSymptoms();
    const nextId = symptoms.length > 0 ? Math.max(...symptoms.map((item) => item.id || 0)) + 1 : 1;
    return { ...symptom, id: symptom.id || nextId };
  }

  private normalizeMedicalRecordList(response: unknown): MedicalRecordDTO[] {
    return this.extractArrayResponse(response)
      .map((row) => this.normalizeMedicalRecord(row))
      .filter((row) => !!row.patientId);
  }

  private normalizeMedicalRecord(response: unknown): MedicalRecordDTO {
    const source = this.unwrapObject(response);
    const rawHistory = source['medicalHistories'] ?? source['medicalHistory'];
    const medicalHistories = this.normalizeMedicalHistories(rawHistory);
    const hasMedicalHistories = Array.isArray(medicalHistories) && medicalHistories.length > 0;
    const chronicDiseases = this.normalizeChronicDiseases(source['chronicDiseases']);
    const recordId = this.readNumber(source['id']) || 0;
    const allergies = this.normalizeAllergiesEmbedded(source['allergies'], recordId);

    return {
      id: this.readNumber(source['id']) || undefined,
      patientId: this.readNumber(source['patientId']) || 0,
      bloodType: this.readString(source['bloodType']) || undefined,
      emergencyContactName: this.readString(source['emergencyContactName']) || undefined,
      emergencyContactPhone: this.readString(source['emergencyContactPhone']) || undefined,
      status: this.readString(source['status']) || undefined,
      medicalHistories: hasMedicalHistories ? medicalHistories : undefined,
      chronicDiseases: chronicDiseases.length > 0 ? chronicDiseases : undefined,
      allergies: allergies.length > 0 ? allergies : undefined
    };
  }

  private normalizeAllergiesEmbedded(raw: unknown, medicalRecordId: number): AllergyDTO[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    const rows: AllergyDTO[] = [];

    raw.forEach((item) => {
      if (!item || typeof item !== 'object') {
        return;
      }

      const source = item as Record<string, unknown>;
      const allergen = this.readString(source['allergen']) || this.readString(source['allergyName']);
      if (!allergen) {
        return;
      }

      rows.push({
        id: this.readNumber(source['id']) || undefined,
        medicalRecordId: this.readNumber(source['medicalRecordId']) || medicalRecordId,
        allergen,
        reaction: this.readString(source['reaction']) || undefined,
        severity: this.readString(source['severity']) || undefined
      });
    });

    return rows;
  }

  private toBackendMedicalRecordPayload(input: Partial<MedicalRecordDTO>): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    const patientId = this.readNumber(input.patientId);
    if (patientId) {
      body['patientId'] = patientId;
    }

    const bloodType = this.readString(input.bloodType);
    if (bloodType) {
      body['bloodType'] = bloodType;
    }

    const emergencyContactName = this.readString(input.emergencyContactName);
    if (emergencyContactName) {
      body['emergencyContactName'] = emergencyContactName;
    }

    const emergencyContactPhone = this.readString(input.emergencyContactPhone);
    if (emergencyContactPhone) {
      body['emergencyContactPhone'] = emergencyContactPhone;
    }

    const status = this.readString(input.status);
    if (status) {
      body['status'] = status;
    }

    // Backend DTO expects plain strings, not arrays/objects, for history fields.
    const medicalHistoryText = this.toMedicalHistoryText(input.medicalHistories);
    if (medicalHistoryText) {
      body['medicalHistory'] = medicalHistoryText;
    }

    const chronicDiseasesText = this.toChronicDiseasesText(input.chronicDiseases);
    if (chronicDiseasesText) {
      body['chronicDiseases'] = chronicDiseasesText;
    }

    if (Array.isArray(input.medicalHistories) && input.medicalHistories.length > 0) {
      body['medicalHistories'] = input.medicalHistories;
    }

    if (Array.isArray(input.chronicDiseases) && input.chronicDiseases.length > 0) {
      body['chronicDiseasesLegacy'] = input.chronicDiseases;
    }

    return body;
  }

  private toMedicalHistoryText(input: MedicalRecordDTO['medicalHistories']): string {
    if (!Array.isArray(input) || input.length === 0) {
      return '';
    }

    return input
      .map((item) => this.readString(item.condition) || this.readString(item.description))
      .filter((item) => !!item)
      .join('; ');
  }

  private toChronicDiseasesText(input: MedicalRecordDTO['chronicDiseases']): string {
    if (!Array.isArray(input) || input.length === 0) {
      return '';
    }

    return input
      .map((item) => this.readString(item?.name) || this.readString(item?.icdCode))
      .filter((item) => !!item)
      .join(', ');
  }

  private normalizeChronicDiseases(value: unknown): NonNullable<MedicalRecordDTO['chronicDiseases']> {
    if (Array.isArray(value)) {
      const rows: NonNullable<MedicalRecordDTO['chronicDiseases']> = [];

      value.forEach((item) => {
        if (!item || typeof item !== 'object') {
          return;
        }

        const source = item as Record<string, unknown>;
        const name = this.readString(source['name']);
        if (!name) {
          return;
        }

        rows.push({
          id: this.readNumber(source['id']) || undefined,
          name,
          icdCode: this.readString(source['icdCode']) || undefined,
          diagnosedAt: this.readString(source['diagnosedAt']) || undefined,
          notes: this.readString(source['notes']) || undefined
        });
      });

      return rows;
    }

    const text = this.readString(value);
    if (!text) {
      return [];
    }

    return text
      .split(',')
      .map((item) => item.trim())
      .filter((item) => !!item)
      .map((name) => ({ name }));
  }

  private normalizeVisitNoteList(response: unknown): VisitNoteDTO[] {
    return this.extractArrayResponse(response)
      .map((row) => this.normalizeVisitNote(row))
      .filter((row) => !!row.medicalRecordId);
  }

  private normalizeVisitNote(response: unknown): VisitNoteDTO {
    const source = this.unwrapObject(response);
    return {
      id: this.readNumber(source['id']) || undefined,
      medicalRecordId: this.readNumber(source['medicalRecordId']) || 0,
      doctorId: this.readNumber(source['doctorId']) || undefined,
      note: this.readString(source['note']) || this.readString(source['subjective']) || '',
      diagnosis: this.readString(source['diagnosis']) || this.readString(source['assessment']) || undefined,
      treatmentPlan: this.readString(source['treatmentPlan']) || this.readString(source['plan']) || undefined,
      createdAt: this.readString(source['createdAt']) || this.readString(source['visitDate']) || undefined
    };
  }

  private toBackendVisitNotePayload(input: Partial<VisitNoteDTO>): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    const medicalRecordId = this.readNumber(input.medicalRecordId);
    if (medicalRecordId) {
      body['medicalRecordId'] = medicalRecordId;
    }

    const doctorId = this.readNumber(input.doctorId);
    if (doctorId) {
      body['doctorId'] = doctorId;
    }

    const note = this.readString(input.note);
    if (note) {
      body['subjective'] = note;
      body['note'] = note;
    }

    const diagnosis = this.readString(input.diagnosis);
    if (diagnosis) {
      body['assessment'] = diagnosis;
      body['diagnosis'] = diagnosis;
    }

    const treatmentPlan = this.readString(input.treatmentPlan);
    if (treatmentPlan) {
      body['plan'] = treatmentPlan;
      body['treatmentPlan'] = treatmentPlan;
    }

    body['visitDate'] = this.readString(input.createdAt) || new Date().toISOString();
    body['finalized'] = false;

    return body;
  }

  private buildVisitNoteSearchParams(filters: {
    patientKeyword?: string;
    doctorKeyword?: string;
    clinicalKeyword?: string;
  }): HttpParams {
    let params = new HttpParams();

    if (filters.patientKeyword && filters.patientKeyword.trim()) {
      params = params.set('patientKeyword', filters.patientKeyword.trim());
    }

    if (filters.doctorKeyword && filters.doctorKeyword.trim()) {
      params = params.set('doctorKeyword', filters.doctorKeyword.trim());
    }

    if (filters.clinicalKeyword && filters.clinicalKeyword.trim()) {
      params = params.set('clinicalKeyword', filters.clinicalKeyword.trim());
    }

    return params;
  }

  private normalizePrescriptionList(response: unknown): PrescriptionDTO[] {
    return this.extractArrayResponse(response)
      .map((row) => this.normalizePrescription(row))
      .filter((row) => !!row.medicalRecordId);
  }

  private normalizePrescription(response: unknown): PrescriptionDTO {
    const source = this.unwrapObject(response);
    return {
      id: this.readNumber(source['id']) || undefined,
      medicalRecordId: this.readNumber(source['medicalRecordId']) || 0,
      doctorId: this.readNumber(source['doctorId']) || undefined,
      medicationName: this.readString(source['medicationName']) || undefined,
      dosage: this.readString(source['dosage']) || undefined,
      frequency: this.readString(source['frequency']) || undefined,
      duration: this.readString(source['duration']) || undefined,
      instructions: this.readString(source['instructions']) || undefined,
      status: typeof source['active'] === 'boolean' ? (source['active'] ? 'ACTIVE' : 'INACTIVE') : this.readString(source['status']) || undefined,
      createdAt: this.readString(source['createdAt']) || this.readString(source['prescriptionDate']) || undefined
    };
  }

  private toBackendPrescriptionPayload(input: Partial<PrescriptionDTO>): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    const medicalRecordId = this.readNumber(input.medicalRecordId);
    if (medicalRecordId) {
      body['medicalRecordId'] = medicalRecordId;
    }

    const doctorId = this.readNumber(input.doctorId);
    if (doctorId) {
      body['doctorId'] = doctorId;
    }

    const medicationName = this.readString(input.medicationName);
    if (medicationName) {
      body['medicationName'] = medicationName;
    }

    const dosage = this.readString(input.dosage);
    if (dosage) {
      body['dosage'] = dosage;
    }

    const duration = this.readString(input.duration);
    if (duration) {
      body['duration'] = duration;
    }

    const instructions = this.readString(input.instructions);
    if (instructions) {
      body['instructions'] = instructions;
    }

    body['prescriptionDate'] = this.readString(input.createdAt) || new Date().toISOString();

    if (typeof input.status === 'string' && input.status.trim()) {
      body['active'] = input.status.toUpperCase() !== 'INACTIVE';
    } else {
      body['active'] = true;
    }

    return body;
  }

  private normalizeMedicalImageList(response: unknown): MedicalImageDTO[] {
    return this.extractArrayResponse(response)
      .map((row) => this.normalizeMedicalImage(row))
      .filter((row) => !!row.medicalRecordId);
  }

  private normalizeMedicalImage(response: unknown): MedicalImageDTO {
    const source = this.unwrapObject(response);
    return {
      id: this.readNumber(source['id']) || undefined,
      medicalRecordId: this.readNumber(source['medicalRecordId']) || 0,
      imageType: this.readString(source['imageType']) || undefined,
      imageUrl: this.readString(source['imageUrl']) || undefined,
      description: this.readString(source['description']) || undefined,
      uploadedAt: this.readString(source['uploadedAt']) || this.readString(source['uploadDate']) || undefined
    };
  }

  private toBackendMedicalImagePayload(input: Partial<MedicalImageDTO>): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    const medicalRecordId = this.readNumber(input.medicalRecordId);
    if (medicalRecordId) {
      body['medicalRecordId'] = medicalRecordId;
    }

    const imageType = this.readString(input.imageType);
    if (imageType) {
      body['imageType'] = imageType;
    }

    const imageUrl = this.readString(input.imageUrl);
    if (imageUrl) {
      body['imageUrl'] = imageUrl;
    }

    const description = this.readString(input.description);
    if (description) {
      body['description'] = description;
    }

    body['uploadDate'] = this.readString(input.uploadedAt) || new Date().toISOString();

    return body;
  }

  private normalizeLabResultList(response: unknown): LabResultDTO[] {
    return this.extractArrayResponse(response)
      .map((row) => this.normalizeLabResult(row))
      .filter((row) => !!row.medicalRecordId);
  }

  private normalizeLabResult(response: unknown): LabResultDTO {
    const source = this.unwrapObject(response);
    return {
      id: this.readNumber(source['id']) || undefined,
      medicalRecordId: this.readNumber(source['medicalRecordId']) || 0,
      testName: this.readString(source['testName']) || undefined,
      result: this.readString(source['result']) || undefined,
      unit: this.readString(source['unit']) || undefined,
      referenceRange: this.readString(source['referenceRange']) || this.readString(source['normalRange']) || undefined,
      resultDate: this.readString(source['resultDate']) || this.readString(source['testDate']) || undefined
    };
  }

  private toBackendLabResultPayload(input: Partial<LabResultDTO>): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    const medicalRecordId = this.readNumber(input.medicalRecordId);
    if (medicalRecordId) {
      body['medicalRecordId'] = medicalRecordId;
    }

    const testName = this.readString(input.testName);
    if (testName) {
      body['testName'] = testName;
    }

    const result = this.readString(input.result);
    if (result) {
      body['result'] = result;
    }

    const unit = this.readString(input.unit);
    if (unit) {
      body['unit'] = unit;
    }

    const referenceRange = this.readString(input.referenceRange);
    if (referenceRange) {
      body['normalRange'] = referenceRange;
    }

    body['testDate'] = this.readString(input.resultDate) || new Date().toISOString();

    return body;
  }

  private normalizeAllergyList(response: unknown): AllergyDTO[] {
    return this.extractArrayResponse(response)
      .map((row) => this.normalizeAllergy(row))
      .filter((row) => !!row.medicalRecordId);
  }

  private normalizeAllergy(response: unknown): AllergyDTO {
    const source = this.unwrapObject(response);
    return {
      id: this.readNumber(source['id']) || undefined,
      medicalRecordId: this.readNumber(source['medicalRecordId']) || 0,
      allergen: this.readString(source['allergen']) || this.readString(source['allergyName']) || '',
      reaction: this.readString(source['reaction']) || undefined,
      severity: this.readString(source['severity']) || undefined
    };
  }

  private toBackendAllergyPayload(input: Partial<AllergyDTO>): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    const medicalRecordId = this.readNumber(input.medicalRecordId);
    if (medicalRecordId) {
      body['medicalRecordId'] = medicalRecordId;
    }

    const allergen = this.readString(input.allergen);
    if (allergen) {
      body['allergyName'] = allergen;
      body['allergen'] = allergen;
    }

    const reaction = this.readString(input.reaction);
    if (reaction) {
      body['reaction'] = reaction;
    }

    const severity = this.readString(input.severity);
    if (severity) {
      body['severity'] = severity;
    }

    return body;
  }

  private normalizeMedicalHistories(raw: unknown): MedicalRecordDTO['medicalHistories'] {
    if (!Array.isArray(raw)) {
      return undefined;
    }

    const mapped = raw
      .map((item) => {
        if (typeof item === 'string') {
          return { condition: item, type: 'HISTORY' };
        }

        if (item && typeof item === 'object') {
          const source = item as Record<string, unknown>;
          const condition = this.readString(source['condition']) || this.readString(source['description']);
          if (!condition) {
            return null;
          }

          return {
            id: this.readNumber(source['id']) || undefined,
            condition,
            type: this.readString(source['type']) || undefined,
            description: this.readString(source['description']) || undefined,
            occurredAt: this.readString(source['occurredAt']) || undefined
          };
        }

        return null;
      })
      .filter((item) => !!item);

    return mapped.length > 0 ? mapped : undefined;
  }

  private extractArrayResponse(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object') {
      const source = response as Record<string, unknown>;
      if (Array.isArray(source['content'])) {
        return source['content'];
      }
      if (Array.isArray(source['data'])) {
        return source['data'];
      }
      if (Array.isArray(source['items'])) {
        return source['items'];
      }
      if (Array.isArray(source['records'])) {
        return source['records'];
      }
    }

    return [];
  }

  private unwrapObject(response: unknown): Record<string, unknown> {
    if (!response || typeof response !== 'object') {
      return {};
    }

    const source = response as Record<string, unknown>;
    if (source['data'] && typeof source['data'] === 'object' && !Array.isArray(source['data'])) {
      return source['data'] as Record<string, unknown>;
    }

    return source;
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private readNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private readNumberArray(value: unknown): number[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const mapped = value
      .map((item) => this.readNumber(item))
      .filter((item): item is number => item !== null);

    return mapped.length > 0 ? mapped : undefined;
  }

  private readObjectArray(value: unknown): Record<string, unknown>[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const mapped = value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
    return mapped.length > 0 ? mapped : undefined;
  }
}

