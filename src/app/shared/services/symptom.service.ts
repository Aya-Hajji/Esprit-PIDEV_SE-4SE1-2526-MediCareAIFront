import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Symptom } from '../models/symptom.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SymptomService {
  private apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/symptoms`;

  constructor(private http: HttpClient) {}

  getAllSymptoms(): Observable<Symptom[]> {
    return this.http.get<Symptom[]>(this.apiUrl);
  }

  getSymptomById(id: number): Observable<Symptom> {
    return this.http.get<Symptom>(`${this.apiUrl}/${id}`);
  }

  createSymptom(symptom: Symptom): Observable<Symptom> {
    return this.http.post<Symptom>(this.apiUrl, symptom);
  }

  updateSymptom(id: number, symptom: Symptom): Observable<Symptom> {
    return this.http.put<Symptom>(`${this.apiUrl}/${id}`, symptom);
  }

  deleteSymptom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}