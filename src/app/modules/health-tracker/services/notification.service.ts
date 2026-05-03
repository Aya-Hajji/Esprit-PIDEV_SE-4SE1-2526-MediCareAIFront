import { Injectable, computed, inject, signal } from '@angular/core';
import { DashboardNotificationItem } from '../models/dashboard-notification.model';
import { RecommendationService } from './recommendation.service';
import { Mood, Sleep, Stress } from '../../../shared/models/health-tracking.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly recommendationService = inject(RecommendationService);

  readonly notifications = signal<DashboardNotificationItem[]>([]);
  readonly isOpen = signal(true);
  readonly isLoading = signal(false);
  readonly selectedNotificationId = signal('');
  readonly badgeCount = computed(() => this.notifications().length);
  readonly hasNotifications = computed(() => this.notifications().length > 0);

  refreshFromData(moods: Mood[], sleeps: Sleep[], stresses: Stress[] = []): void {
    const analysis = this.recommendationService.analyzeMoodSleep(moods, sleeps);
    const store = analysis.store;
    const badStreak = analysis.badStreak;

    const moodAvg = moods.length > 0 ? Math.round(moods.reduce((s, m) => s + (m.level ?? 0), 0) / moods.length) : 0;
    const stressAvg = stresses.length > 0 ? Math.round(stresses.reduce((s, st) => s + (st.level ?? 0), 0) / stresses.length) : 0;

    const notifications: DashboardNotificationItem[] = [];

    // Urgent
    const urgentCondition = moodAvg <= 2 || stressAvg >= 8 || badStreak > 5;
    notifications.push({
      id: 'alert-urgent',
      title: urgentCondition ? 'Urgent alert' : 'Urgent alert — stable',
      description: urgentCondition
        ? 'Very high stress or very low mood detected — consider medical consultation.'
        : 'No critical situation identified recently.',
      tone: 'doctor',
      badge: urgentCondition ? 'Urgent' : 'Stable',
      entries: urgentCondition && store.doctorsRecommendations.length > 0
        ? store.doctorsRecommendations.map((d) => `${d.doctor} — ${d.speciality}`)
        : ['No critical action required at this time.'],
      dismissible: true
    });

    // High / Warning
    const highCondition = moodAvg <= 4 || stressAvg >= 6 || badStreak >= 3;
    notifications.push({
      id: 'alert-high',
      title: highCondition ? 'High risk' : 'Moderate risk',
      description: highCondition
        ? 'Stress/mood signals detected — recommended activities and tips available.'
        : 'No major signals — keep monitoring your status.' ,
      tone: 'warning',
      badge: highCondition ? 'Important' : 'Info',
      entries: highCondition
        ? [...(store.activitiesRecommendations ?? []), ...(store.wellnessTips ?? [])]
        : ['Nothing to report — keep up your good habits.'],
      dismissible: true
    });

    // Low / Informational
    const lowCondition = !highCondition && !urgentCondition;
    notifications.push({
      id: 'alert-low',
      title: lowCondition ? 'Wellness tips' : 'Tips',
      description: lowCondition
        ? 'Your state appears stable — here are some preventive recommendations.'
        : 'Targeted actions are available if needed.',
      tone: 'tip',
      badge: 'Info',
      entries: store.wellnessTips.length > 0 ? store.wellnessTips : ['No active tips at this time.'],
      dismissible: true
    });

    this.notifications.set(notifications);
    this.isOpen.set(notifications.length > 0 && (urgentCondition || highCondition));
    this.selectedNotificationId.set(notifications[0]?.id ?? '');
  }

  loadForUser(userId: number): void {
    void userId;
  }

  togglePanel(): void {
    this.isOpen.set(!this.isOpen());
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  dismissNotification(notificationId: string): void {
    const remaining = this.notifications().filter((notification) => notification.id !== notificationId);
    this.notifications.set(remaining);

    if (this.selectedNotificationId() === notificationId) {
      this.selectedNotificationId.set(remaining[0]?.id ?? '');
    }

    if (remaining.length === 0) {
      this.closePanel();
    }
  }

  focusNotification(notificationId: string): void {
    this.selectedNotificationId.set(notificationId);
    this.isOpen.set(true);
  }

  getSelectedNotification(): DashboardNotificationItem | undefined {
    return this.notifications().find((notification) => notification.id === this.selectedNotificationId());
  }
}