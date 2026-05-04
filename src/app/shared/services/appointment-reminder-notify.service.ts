import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { AppointmentService } from './appointment.service';

/**
 * Watches local NOTIFICATION reminders and shows a browser notification + in-app banner.
 */
@Injectable({ providedIn: 'root' })
export class AppointmentReminderNotifyService {
  private subscription: Subscription | null = null;
  private readonly shownIds = new Set<number>();

  readonly lastBanner$ = new BehaviorSubject<string | null>(null);

  constructor(private readonly appointmentService: AppointmentService) {}

  start(): void {
    if (this.subscription) {
      return;
    }
    this.subscription = interval(30_000).subscribe(() => this.poll());
  }

  private poll(): void {
    const fired = this.appointmentService.consumeDueInAppReminders();
    for (const row of fired) {
      if (!row.id || this.shownIds.has(row.id)) {
        continue;
      }
      this.shownIds.add(row.id);
      const when = row.remindAt ? new Date(row.remindAt).toLocaleString() : '';
      const msg = `Reminder: appointment #${row.appointmentId} (scheduled ${when}).`;
      this.lastBanner$.next(msg);
      this.raiseBrowserNotification(msg);
      window.setTimeout(() => this.lastBanner$.next(null), 14_000);
    }
  }

  private raiseBrowserNotification(body: string): void {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification('MediCareAI — Appointment reminder', { body });
      return;
    }
    if (Notification.permission === 'default') {
      void Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification('MediCareAI — Appointment reminder', { body });
        }
      });
    }
  }

  requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || typeof Notification === 'undefined' || !Notification.requestPermission) {
      return Promise.resolve('denied');
    }
    return Notification.requestPermission();
  }

  dismissBanner(): void {
    this.lastBanner$.next(null);
  }
}
