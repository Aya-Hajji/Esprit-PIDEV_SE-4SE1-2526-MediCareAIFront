import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Disease } from '../models/disease.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiseaseService {
  private apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/diseases`;

  constructor(private http: HttpClient) {}

  getAllDiseases(): Observable<Disease[]> {
    return this.http.get<Disease[]>(this.apiUrl);
  }

  getDiseaseById(id: number): Observable<Disease> {
    return this.http.get<Disease>(`${this.apiUrl}/${id}`);
  }

  createDisease(disease: Disease): Observable<Disease> {
    return this.http.post<Disease>(this.apiUrl, disease);
  }

  updateDisease(id: number, disease: Disease): Observable<Disease> {
    return this.http.put<Disease>(`${this.apiUrl}/${id}`, disease);
  }

  deleteDisease(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addSymptomToDisease(diseaseId: number, symptomId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${diseaseId}/symptoms/${symptomId}`, {});
  }

  removeSymptomFromDisease(diseaseId: number, symptomId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${diseaseId}/symptoms/${symptomId}`);
  }

  addSpecialtyToDisease(diseaseId: number, specialtyId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${diseaseId}/specialty/${specialtyId}`, {});
  }
}