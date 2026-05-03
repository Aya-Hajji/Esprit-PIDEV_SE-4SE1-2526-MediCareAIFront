import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { Mood, Sleep, Stress } from '../../../../shared/models/health-tracking.model';
import { HealthTrackerService } from '../../../../shared/services/health-tracker.service';
import { DashboardNotificationComponent } from '../../components/dashboard-notification/dashboard-notification.component';
import { HealthCorrelationsComponent } from '../../components/health-correlations/health-correlations.component';
import { NotificationService } from '../../services/notification.service';

type DashboardShortcut = {
  title: string;
  description: string;
  route: string;
  badge: string;
  tone: 'emerald' | 'mint' | 'teal' | 'lime' | 'jade' | 'sea';
};

type PregnancyShortcut = {
  title: string;
  description: string;
  route: string;
  tone: 'rose' | 'sky';
};

@Component({
  selector: 'app-health-tracker-dashboard',
  imports: [CommonModule, RouterLink, DashboardNotificationComponent, HealthCorrelationsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly healthTrackerService = inject(HealthTrackerService);
  private readonly notificationService = inject(NotificationService);

  readonly currentUserId = signal<number | null>(null);
  readonly moods = signal<Mood[]>([]);
  readonly sleeps = signal<Sleep[]>([]);
  readonly stresses = signal<Stress[]>([]);

  readonly dashboardShortcuts: DashboardShortcut[] = [
    {
      title: 'Well-being Metrics',
      description: 'Capture mood, sleep, stress and activity in one streamlined form.',
      route: '/health-tracker/metrics',
      badge: 'Core',
      tone: 'emerald'
    },
    {
      title: 'Mood Journal',
      description: 'Log emotional state with intensity and notes.',
      route: '/health-tracker/mood',
      badge: 'Daily',
      tone: 'mint'
    },
    {
      title: 'Sleep Tracker',
      description: 'Record hours and quality with a clean sleep entry flow.',
      route: '/health-tracker/sleep',
      badge: 'Night',
      tone: 'teal'
    },
    {
      title: 'Stress Monitor',
      description: 'Track stress level and notes with fast CRUD actions.',
      route: '/health-tracker/stress',
      badge: 'Calm',
      tone: 'lime'
    },
    {
      title: 'AI Nutrition',
      description: 'Upload a food image and get calories plus confidence.',
      route: '/health-tracker/nutrition-ai',
      badge: 'AI',
      tone: 'sea'
    },
    {
      title: 'Medication Reminder',
      description: 'Build medication reminders and keep them organized.',
      route: '/health-tracker/medication/reminder',
      badge: 'Care',
      tone: 'jade'
    },
    {
      title: 'Medication Schedule',
      description: 'Manage dosage, timing and periodic medication plans.',
      route: '/health-tracker/medication/schedule',
      badge: 'Plan',
      tone: 'sea'
    }
  ];

  readonly pregnancyShortcuts: PregnancyShortcut[] = [
    {
      title: 'Pregnancy Tracking',
      description: 'Follow pregnancy progress, week, symptoms and weight.',
      route: '/pregnancy/tracking',
      tone: 'rose'
    },
    {
      title: 'Pregnancy Checkups',
      description: 'Keep doctor visits and notes inside a dedicated flow.',
      route: '/pregnancy/checkup',
      tone: 'sky'
    }
  ];

  constructor() {
    this.bootstrapDashboardData();
  }

  private bootstrapDashboardData(): void {
    const localUserId = this.resolveUserIdFromSession();
    if (localUserId) {
      this.currentUserId.set(localUserId);
      this.loadNotificationSignals(localUserId);
      return;
    }

    this.authService.getCurrentUserId().subscribe({
      next: (resolvedUserId) => {
        if (!resolvedUserId) {
          return;
        }

        this.currentUserId.set(resolvedUserId);
        this.loadNotificationSignals(resolvedUserId);
      }
    });
  }

  private loadNotificationSignals(userId: number): void {
    forkJoin({
      moods: this.healthTrackerService.getMoodHistory(userId, '30d'),
      sleeps: this.healthTrackerService.getSleepHistory(userId, '30d'),
      stresses: this.healthTrackerService.getStressHistory(userId, '30d')
    })
      .pipe(finalize(() => undefined))
      .subscribe({
        next: ({ moods, sleeps, stresses }) => {
          this.moods.set(this.toMoodList(moods));
          this.sleeps.set(this.toSleepList(sleeps));
          this.stresses.set(this.toStressList(stresses ?? []));
          this.notificationService.refreshFromData(this.moods(), this.sleeps(), this.stresses());
        },
        error: () => {
          this.notificationService.refreshFromData([], [], []);
        }
      });
  }

  private toMoodList(items: Array<{ [key: string]: unknown }>): Mood[] {
    return items.map((item) => {
      const rawDate = (item['date'] as string) || (item['timestamp'] as string) || new Date().toISOString().slice(0, 10);
      const rawNote = (item['note'] as string | undefined) ?? (item['notes'] as string | undefined);
      const fallbackId = item['moodId'] as number | undefined;

      return {
        id: (item['id'] as number | undefined) ?? fallbackId,
        userId: Number(item['userId'] ?? 0),
        level: Number(item['level'] ?? item['intensity'] ?? 5),
        note: rawNote,
        date: rawDate
      };
    });
  }

  private toSleepList(items: Array<{ [key: string]: unknown }>): Sleep[] {
    return items.map((item) => {
      const rawDate = ((item['date'] as string) || (item['timestamp'] as string) || new Date().toISOString()).toString();

      return {
        id: (item['id'] as number | undefined) ?? (item['sleepId'] as number | undefined),
        userId: Number(item['userId'] ?? 0),
        hours: Number(item['hours'] ?? item['duration'] ?? 0),
        quality: Number(item['quality'] ?? 0),
        date: this.normalizeDate(rawDate),
        createdAt: item['createdAt'] as string | undefined
      };
    });
  }

  private toStressList(items: Array<{ [key: string]: unknown }>): Stress[] {
    return (items ?? []).map((item) => {
      return {
        id: (item['id'] as number | undefined) ?? (item['stressId'] as number | undefined),
        userId: Number(item['userId'] ?? 0),
        level: Number(item['level'] ?? 0),
        trigger: (item['trigger'] as string | undefined) ?? undefined,
        notes: (item['notes'] as string | undefined) ?? (item['note'] as string | undefined) ?? undefined,
        timestamp: ((item['timestamp'] as string | undefined) ?? (item['date'] as string | undefined) ?? new Date().toISOString()).toString(),
        createdAt: item['createdAt'] as string | undefined
      };
    });
  }

  private resolveUserIdFromSession(): number | null {
    const authUserRaw = localStorage.getItem('authUser');
    if (authUserRaw) {
      try {
        const authUser = JSON.parse(authUserRaw) as { id?: number | string };
        const authUserId = Number(authUser?.id);
        if (Number.isFinite(authUserId) && authUserId > 0) {
          return authUserId;
        }
      } catch {
        // Ignore invalid authUser JSON and fall back to other sources.
      }
    }

    const raw = localStorage.getItem('userId');
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    const token = localStorage.getItem('authToken');
    return this.extractNumericUserIdFromToken(token);
  }

  private normalizeDate(value: string | undefined): string {
    if (!value) {
      return '';
    }

    if (value.includes('T')) {
      return new Date(value).toISOString().slice(0, 10);
    }

    return value;
  }

  private extractNumericUserIdFromToken(token: string | null): number | null {
    if (!token || !token.includes('.')) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded) as { userId?: number | string; id?: number | string; sub?: number | string };
      const candidate = Number(parsed.userId ?? parsed.id ?? parsed.sub);

      return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
    } catch {
      return null;
    }
  }
}