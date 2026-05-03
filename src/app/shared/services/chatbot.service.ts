import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ChatbotRequest {
  symptomNames: string[];
}

// Response for PATIENT: list of specialties with their diseases
export interface SpecialtyDiagnosis {
  id: number;
  name: string;
  description: string;
  diseases: string[];
}

// Response for DOCTOR: list of diseases with full details
export interface DiseaseDiagnosis {
  id: number;
  name: string;
  description?: string;
  symptoms?: string[];
  specialtyName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/chatbot`;

  constructor(private http: HttpClient) {}

  /**
   * Patient endpoint: returns matching specialties based on symptoms
   * POST /chatbot/patient/diagnose
   */
  diagnosePatient(symptomNames: string[]): Observable<SpecialtyDiagnosis[]> {
    const body: ChatbotRequest = { symptomNames };
    return this.http.post<SpecialtyDiagnosis[]>(`${this.apiUrl}/patient/diagnose`, body).pipe(
      map(res => Array.isArray(res) ? res : []),
      catchError(err => {
        console.error('[ChatbotService] diagnosePatient error:', err);
        throw err; // re-throw so component can handle it
      })
    );
  }

  /**
   * Doctor endpoint: returns matching diseases based on symptoms
   * POST /chatbot/doctor/diagnose
   */
  diagnoseDoctor(symptomNames: string[]): Observable<DiseaseDiagnosis[]> {
    const body: ChatbotRequest = { symptomNames };
    return this.http.post<DiseaseDiagnosis[]>(`${this.apiUrl}/doctor/diagnose`, body).pipe(
      map(res => Array.isArray(res) ? res : []),
      catchError(err => {
        console.error('[ChatbotService] diagnoseDoctor error:', err);
        throw err; // re-throw so component can handle it
      })
    );
  }
}
