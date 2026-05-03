import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { HealthEvent, Feedback, FeedbackRequestDTO } from '../models/health-event.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HealthEventService {
  private apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/events`;
  private feedbackUrl = `${environment.apiUrl.replace(/\/+$/, '')}/feedback`;

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

  addParticipant(eventId: number, userId?: number | null): Observable<void> {
    if (!Number.isFinite(Number(userId)) || Number(userId) <= 0) {
      return throwError(() => new Error('User ID is required to join event.'));
    }

    const normalizedUserId = Number(userId);
    const url = `${this.apiUrl}/${eventId}/participants/${normalizedUserId}`;
    console.log(`[HealthEventService] POST ${url}`);
    return this.http.post<void>(url, {});
  }

  removeParticipant(eventId: number, userId?: number | null): Observable<void> {
    if (!Number.isFinite(Number(userId)) || Number(userId) <= 0) {
      return throwError(() => new Error('User ID is required to leave event.'));
    }

    const normalizedUserId = Number(userId);
    const url = `${this.apiUrl}/${eventId}/participants/${normalizedUserId}`;
    console.log(`[HealthEventService] DELETE ${url}`);
    return this.http.delete<void>(url);
  }

  // Feedbacks
  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.feedbackUrl);
  }

  getFeedbackById(id: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.feedbackUrl}/${id}`);
  }

  getFeedbacksByEvent(eventId: number): Observable<Feedback[]> {
    return this.getAllFeedbacks().pipe(
      map((feedbacks) => feedbacks.filter((feedback) => {
        const relationId = Number(
          feedback.healthEventId
          ?? feedback.healthEvent?.id
          ?? feedback.event?.id
        );
        return Number.isFinite(relationId) && relationId === eventId;
      }))
    );
  }

  getFeedbacksByRating(minRating: number): Observable<Feedback[]> {
    return this.getAllFeedbacks().pipe(
      map((feedbacks) => feedbacks.filter((feedback) => feedback.rating >= minRating))
    );
  }

  createFeedback(feedback: FeedbackRequestDTO): Observable<Feedback> {
    return this.http.post<Feedback>(this.feedbackUrl, this.buildFeedbackPayload(feedback));
  }

  updateFeedback(id: number, feedback: FeedbackRequestDTO): Observable<Feedback> {
    return this.http.put<Feedback>(`${this.feedbackUrl}/${id}`, this.buildFeedbackPayload(feedback));
  }

  deleteFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`${this.feedbackUrl}/${id}`);
  }

  private buildFeedbackPayload(feedback: FeedbackRequestDTO): Record<string, unknown> {
    const eventId = Number(feedback.healthEventId);
    const userId = Number(feedback.userId);

    const payload: Record<string, unknown> = {
      userName: feedback.userName,
      comment: feedback.comment,
      rating: feedback.rating,
      healthEventId: Number.isFinite(eventId) ? eventId : undefined,
      healthEvent: Number.isFinite(eventId) ? { id: eventId } : undefined,
      event: Number.isFinite(eventId) ? { id: eventId } : undefined,
      userId: Number.isFinite(userId) ? userId : undefined,
      user: Number.isFinite(userId) ? { id: userId } : undefined
    };

    // Strip undefined keys before sending request body.
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  }

}
