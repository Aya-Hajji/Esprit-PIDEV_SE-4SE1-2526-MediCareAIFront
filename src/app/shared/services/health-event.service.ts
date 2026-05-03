import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HealthEvent, Feedback } from '../models/health-event.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HealthEventService {
  private apiUrl = `${environment.apiUrl}/events`;
  private feedbackUrl = `${environment.apiUrl}/feedbacks`;

  constructor(private http: HttpClient) {}

  // Health Events
  getAllEvents(): Observable<HealthEvent[]> {
    return this.http.get<HealthEvent[]>(this.apiUrl);
  }

  getUpcomingEvents(): Observable<HealthEvent[]> {
    return this.http.get<HealthEvent[]>(`${this.apiUrl}/upcoming`);
  }

  getEventById(id: number): Observable<HealthEvent> {
    return this.http.get<HealthEvent>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: HealthEvent): Observable<HealthEvent> {
    return this.http.post<HealthEvent>(this.apiUrl, event);
  }

  updateEvent(id: number, event: Partial<HealthEvent>): Observable<HealthEvent> {
    return this.http.put<HealthEvent>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addParticipant(eventId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${eventId}/participants/${userId}`, {});
  }

  removeParticipant(eventId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${eventId}/participants/${userId}`);
  }

  // Feedbacks
  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.feedbackUrl);
  }

  getFeedbackById(id: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.feedbackUrl}/${id}`);
  }

  getFeedbacksByEvent(eventId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.feedbackUrl}/by-event/${eventId}`);
  }

  getFeedbacksByRating(minRating: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.feedbackUrl}/by-rating/${minRating}`);
  }

  createFeedback(feedback: Feedback): Observable<Feedback> {
    return this.http.post<Feedback>(this.feedbackUrl, feedback);
  }

  updateFeedback(id: number, feedback: Partial<Feedback>): Observable<Feedback> {
    return this.http.put<Feedback>(`${this.feedbackUrl}/${id}`, feedback);
  }

  deleteFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`${this.feedbackUrl}/${id}`);
  }
}
