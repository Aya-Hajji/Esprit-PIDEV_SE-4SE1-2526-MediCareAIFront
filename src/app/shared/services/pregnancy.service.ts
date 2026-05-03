import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PregnancyWeek = {
  title: string;
  size: string;
  description: string;
  image?: string;
};

@Injectable({
  providedIn: 'root'
})
export class PregnancyService {
  private readonly http = inject(HttpClient);
  // Ensure base points to backend host; fallback to explicit localhost if misconfigured
  private readonly baseUrl = (environment.apiUrl && String(environment.apiUrl).trim()) || 'http://localhost:8090';

  // Call backend to compute the timeline for a given LMP (last menstrual period)
  getTimeline(lmp?: string): Observable<any> {
    const url = `${this.baseUrl.replace(/\/+$/, '')}/pregnancy/timeline`;
    const params = lmp ? { params: { lmp } } : undefined;
    return this.http.get<any>(url, params);
  }

  // Call backend to get the current pregnancy week (backend returns number or object)
  getCurrentWeek(lmp?: string): Observable<number> {
    const url = `${this.baseUrl.replace(/\/+$/, '')}/pregnancy/current-week`;
    const options = lmp ? { params: { lmp } } : undefined;
    return this.http.get<any>(url, options).pipe(
      map((resp) => {
        if (resp == null) return 1;
        if (typeof resp === 'number') return Math.max(1, Math.min(40, resp));
        if (typeof resp === 'string' && resp.trim() !== '') {
          const parsed = Number(resp);
          if (!Number.isNaN(parsed)) return Math.max(1, Math.min(40, parsed));
        }
        if (resp.currentWeek || resp.week) {
          const candidate = Number(resp.currentWeek ?? resp.week);
          if (!Number.isNaN(candidate)) return Math.max(1, Math.min(40, candidate));
        }
        return 1;
      })
    );
  }

  // Load the local JSON dataset of pregnancy weeks (images + descriptions)
  getLocalWeeksData(): Observable<Record<string, PregnancyWeek>> {
    return this.http.get<Record<string, PregnancyWeek>>('assets/data/pregnancy_weeks.json');
  }
}
