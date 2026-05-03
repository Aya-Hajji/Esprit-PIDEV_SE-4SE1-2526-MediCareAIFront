import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface EventReminder {
  eventId?: number;
  eventTitle?: string;
  eventDate?: string;
  recipientEmail?: string;
  message?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/events/reminders`;

  constructor(private http: HttpClient) {}

  /**
   * Trigger backend reminder check endpoint.
   * The backend service will:
   * - Check events occurring within the next 24 hours
   * - Generate and send reminders to participants
   * - Handle duplicate prevention using in-memory Set
   * - Return array of EventReminder objects
   */
  triggerCheck(): Observable<EventReminder[]> {
    return this.http.get<EventReminder[]>(`${this.apiUrl}/check`).pipe(
      timeout(5000),
      catchError((err) => {
        console.warn('[ReminderService] triggerCheck failed', err);
        return of([]);
      })
    );
  }
}