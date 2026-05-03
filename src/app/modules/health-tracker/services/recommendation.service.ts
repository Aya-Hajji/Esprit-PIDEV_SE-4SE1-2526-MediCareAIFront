import { Injectable } from '@angular/core';
import { HealthAlert, Mood, Sleep } from '../../../shared/models/health-tracking.model';
import {
  DashboardNotificationItem,
  DoctorRecommendation,
  MoodSleepAnalysisResult,
  RecommendationStore
} from '../models/dashboard-notification.model';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private readonly activitiesKey = 'activitiesRecommendations';
  private readonly wellnessTipsKey = 'wellnessTips';
  private readonly doctorsKey = 'doctorsRecommendations';

  analyzeMoodSleep(moods: Mood[], sleeps: Sleep[]): MoodSleepAnalysisResult {
    const moodByDate = this.aggregateMoodByDate(moods);
    const sleepByDate = this.aggregateSleepByDate(sleeps);
    const badStreak = this.calculateBadStreak(moodByDate, sleepByDate);

    const activitiesRecommendations = badStreak >= 3 ? this.buildActivityRecommendations(badStreak) : [];
    const wellnessTips = badStreak >= 3 ? this.buildWellnessTips(badStreak) : [];
    const doctorsRecommendations = badStreak > 5 ? this.buildDoctorRecommendations() : [];

    const store: RecommendationStore = {
      activitiesRecommendations,
      wellnessTips,
      doctorsRecommendations
    };

    this.persistRecommendations(store);

    return {
      badStreak,
      notifications: this.buildNotifications(badStreak, store),
      store
    };
  }

  loadStoredRecommendations(): RecommendationStore {
    return {
      activitiesRecommendations: this.readStringArray(this.activitiesKey),
      wellnessTips: this.readStringArray(this.wellnessTipsKey),
      doctorsRecommendations: this.readDoctorRecommendations()
    };
  }

  clearStoredRecommendations(): void {
    localStorage.removeItem(this.activitiesKey);
    localStorage.removeItem(this.wellnessTipsKey);
    localStorage.removeItem(this.doctorsKey);
  }

  formatHealthAlert(alert: DashboardNotificationItem): HealthAlert {
    return {
      id: Number(alert.id.replace(/[^0-9]/g, '')) || Date.now(),
      message: alert.title,
      level: alert.tone === 'doctor' ? 'URGENT' : alert.tone === 'warning' ? 'WARNING' : 'INFO',
      ignored: false,
      recommendation: alert.description,
      activity: alert.entries[0] ?? ''
    };
  }

  private calculateBadStreak(moodByDate: Record<string, number>, sleepByDate: Record<string, number>): number {
    const sharedDates = Object.keys(moodByDate)
      .filter((date) => sleepByDate[date] !== undefined)
      .sort((a, b) => a.localeCompare(b));

    let longestBadStreak = 0;
    let currentStreak = 0;
    let previousDate = '';

    for (const date of sharedDates) {
      const isBadDay = this.isBadMood(moodByDate[date]) && this.isBadSleep(sleepByDate[date]);
      const isConsecutive = previousDate ? this.isConsecutiveDay(previousDate, date) : true;

      if (isBadDay && isConsecutive) {
        currentStreak += 1;
      } else if (isBadDay) {
        currentStreak = 1;
      } else {
        currentStreak = 0;
      }

      longestBadStreak = Math.max(longestBadStreak, currentStreak);
      previousDate = date;
    }

    return longestBadStreak;
  }

  private buildActivityRecommendations(streak: number): string[] {
    const base = [
      'Walk for 20 minutes daily to boost your energy.',
      'Practice 5 minutes of deep breathing morning and evening.',
      'Reduce screen time at least 1 hour before sleep.'
    ];

    if (streak >= 4) {
      base.push('Try a regular bedtime routine with fixed sleep times.');
    }

    return base;
  }

  private buildWellnessTips(streak: number): string[] {
    const tips = [
      'Drink water regularly throughout the day.',
      'Avoid caffeine late in the day.',
      'Write down one positive thing each evening to lighten mental burden.'
    ];

    if (streak >= 4) {
      tips.push('Talk to someone close or a professional if fatigue or sadness persists.');
    }

    return tips;
  }

  private buildDoctorRecommendations(): DoctorRecommendation[] {
    return [
      { doctor: 'Dr. Ahmed Ben Ali', speciality: 'Psychiatrist' },
      { doctor: 'Dr. Mariem Trabelsi', speciality: 'General Practitioner' },
      { doctor: 'Dr. Nabil Haddad', speciality: 'Sleep Specialist' }
    ];
  }

  private buildNotifications(streak: number, store: RecommendationStore): DashboardNotificationItem[] {
    const notifications: DashboardNotificationItem[] = [];

    if (streak >= 3) {
      notifications.push({
        id: 'health-warning',
        title: 'Fragile mood and sleep',
        description: `We detected ${streak} consecutive days with low mood and less than 6 hours of sleep.`,
        tone: 'warning',
        badge: 'Alert',
        entries: [...store.activitiesRecommendations, ...store.wellnessTips],
        dismissible: true
      });
    }

    if (streak > 5 && store.doctorsRecommendations.length > 0) {
      notifications.push({
        id: 'doctor-consultation',
        title: 'Medical consultation recommended',
        description: 'The issue persists for over 5 days. Medical consultation is recommended.',
        tone: 'doctor',
        badge: 'Critical',
        entries: store.doctorsRecommendations.map((doctor) => `${doctor.doctor} — ${doctor.speciality}`),
        dismissible: true
      });
    }

    if (store.wellnessTips.length > 0) {
      notifications.push({
        id: 'wellness-tips',
        title: 'Wellness tips',
        description: 'Here are some tips to stabilize your energy and mood.',
        tone: 'tip',
        badge: 'Info',
        entries: store.wellnessTips,
        dismissible: true
      });
    }

    return notifications;
  }

  private persistRecommendations(store: RecommendationStore): void {
    localStorage.setItem(this.activitiesKey, JSON.stringify(store.activitiesRecommendations));
    localStorage.setItem(this.wellnessTipsKey, JSON.stringify(store.wellnessTips));
    localStorage.setItem(this.doctorsKey, JSON.stringify(store.doctorsRecommendations));
  }

  private readStringArray(key: string): string[] {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
    } catch {
      return [];
    }
  }

  private readDoctorRecommendations(): DoctorRecommendation[] {
    const raw = localStorage.getItem(this.doctorsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item) => ({
          doctor: String((item as Record<string, unknown>)?.['doctor'] ?? ''),
          speciality: String((item as Record<string, unknown>)?.['speciality'] ?? '')
        }))
        .filter((item) => item.doctor.length > 0 || item.speciality.length > 0);
    } catch {
      return [];
    }
  }

  private aggregateMoodByDate(items: Mood[]): Record<string, number> {
    const buckets: Record<string, number[]> = {};

    for (const item of items) {
      const date = this.normalizeDate(item.date);
      if (!date) {
        continue;
      }

      buckets[date] = buckets[date] ?? [];
      buckets[date].push(item.level);
    }

    return Object.fromEntries(
      Object.entries(buckets).map(([date, levels]) => [date, levels.reduce((sum, level) => sum + level, 0) / levels.length])
    );
  }

  private aggregateSleepByDate(items: Sleep[]): Record<string, number> {
    const buckets: Record<string, number[]> = {};

    for (const item of items) {
      const date = this.normalizeDate(item.date);
      if (!date) {
        continue;
      }

      buckets[date] = buckets[date] ?? [];
      buckets[date].push(item.hours);
    }

    return Object.fromEntries(
      Object.entries(buckets).map(([date, hours]) => [date, hours.reduce((sum, value) => sum + value, 0) / hours.length])
    );
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

  private isBadMood(level: number): boolean {
    return Number(level) <= 4;
  }

  private isBadSleep(hours: number): boolean {
    return Number(hours) < 6;
  }

  private isConsecutiveDay(previousDate: string, currentDate: string): boolean {
    const previous = new Date(previousDate);
    const current = new Date(currentDate);
    const previousUtc = Date.UTC(previous.getFullYear(), previous.getMonth(), previous.getDate());
    const currentUtc = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
    const diff = Math.round((currentUtc - previousUtc) / (1000 * 60 * 60 * 24));
    return diff === 1;
  }
}