import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Correlation } from '../models/correlation.model';

@Injectable({
  providedIn: 'root'
})
export class CorrelationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private readonly correlationsUrl = `${this.baseUrl}/api/correlations`;

  getCorrelations(userId: number): Observable<Correlation[]> {
    return this.http.get<unknown>(`${this.correlationsUrl}/${userId}`).pipe(
      map((response) => this.normalizeCorrelations(response))
    );
  }

  private normalizeCorrelations(response: unknown): Correlation[] {
    const items = Array.isArray(response) ? response : [];

    return items
      .map((item) => this.normalizeCorrelation(item))
      .filter((item): item is Correlation => Boolean(item));
  }

  private normalizeCorrelation(item: unknown): Correlation | null {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const raw = item as Record<string, unknown>;
    const date = this.normalizeDate(raw['date'] ?? raw['timestamp'] ?? raw['day']);

    if (!date) {
      return null;
    }

    return {
      date,
      sleepHours: this.toNumber(raw['sleepHours'] ?? raw['sleep_hours'] ?? raw['sleep'] ?? raw['hours']),
      moodLevel: this.toNumber(raw['moodLevel'] ?? raw['mood_level'] ?? raw['mood'] ?? raw['level']),
      stressLevel: this.toNumber(raw['stressLevel'] ?? raw['stress_level'] ?? raw['stress'] ?? raw['stressValue'])
    };
  }

  private normalizeDate(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return '';
    }

    const normalized = value.includes('T') ? new Date(value).toISOString().slice(0, 10) : value.slice(0, 10);
    return normalized;
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
