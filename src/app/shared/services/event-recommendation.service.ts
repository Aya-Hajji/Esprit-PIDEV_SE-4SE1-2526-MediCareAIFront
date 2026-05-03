import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HealthEvent } from '../models/health-event.model';
import { environment } from '../../../environments/environment';

export type GroupedEventRecommendations = Record<string, HealthEvent[]>;

@Injectable({
  providedIn: 'root'
})
export class EventRecommendationService {
  private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/events/recommendations`;

  constructor(private http: HttpClient) {}

  getRecommendations(userId: number): Observable<HealthEvent[]> {
    if (!Number.isFinite(userId) || userId <= 0) {
      return of([]);
    }

    return this.http.get(`${this.apiUrl}/${userId}`, { responseType: 'text' }).pipe(
      map((rawResponse) => this.parseRecommendationsList(rawResponse)),
      catchError((error) => {
        console.warn('[EventRecommendationService] getRecommendations failed', error);
        return of([]);
      })
    );
  }

  getGroupedRecommendations(userId: number): Observable<GroupedEventRecommendations> {
    if (!Number.isFinite(userId) || userId <= 0) {
      return of({});
    }

    return this.http.get(`${this.apiUrl}/${userId}/grouped`, { responseType: 'text' }).pipe(
      map((rawResponse) => this.parseGroupedRecommendations(rawResponse)),
      switchMap((grouped) => {
        if (grouped) {
          return of(grouped);
        }

        // Fallback: use flat recommendations endpoint then group client-side.
        return this.getRecommendations(userId).pipe(
          map((events) => this.groupEventsByCategory(events))
        );
      }),
      catchError((error) => {
        console.warn('[EventRecommendationService] getGroupedRecommendations failed', error);
        return of({});
      })
    );
  }

  private parseGroupedRecommendations(rawResponse: string): GroupedEventRecommendations | null {
    const recovered = this.recoverJson(rawResponse);
    if (!recovered) {
      console.warn('[EventRecommendationService] Grouped response did not contain parseable JSON snippet');
      return null;
    }

    const parsed = this.tryParseJson(recovered);
    console.log('[EventRecommendationService] parseGroupedRecommendations - Recovered string:', recovered);
    console.log('[EventRecommendationService] parseGroupedRecommendations - Parsed object:', parsed);

    if (parsed === null || parsed === undefined) {
      console.warn('[EventRecommendationService] No parsed grouped JSON');
      return null;
    }

    // Handle double-encoded JSON strings
    let value: any = parsed;
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch (_) {
        // leave as string
      }
    }

    // If backend returned a flat array, group client-side
    if (Array.isArray(value)) {
      return this.groupEventsByCategory(value as HealthEvent[]);
    }

    if (typeof value === 'object' && value !== null) {
      // If object already looks like grouped (values are arrays), accept it
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length > 0 && entries.every(([, v]) => Array.isArray(v))) {
        return entries.reduce<GroupedEventRecommendations>((accumulator, [category, events]) => {
          accumulator[category] = Array.isArray(events) ? (events as HealthEvent[]) : [];
          return accumulator;
        }, {});
      }

      // Common envelope keys that may contain the flat list
      const arrayKeys = ['data', 'recommendations', 'items', 'results', 'events'];
      for (const k of arrayKeys) {
        if (Array.isArray((value as any)[k])) {
          return this.groupEventsByCategory((value as any)[k] as HealthEvent[]);
        }
      }

      // Some backends nest grouped under a `grouped` key
      if (value.grouped && typeof value.grouped === 'object') {
        const groupedObj = value.grouped;
        if (Object.values(groupedObj).every(Array.isArray)) {
          return groupedObj as GroupedEventRecommendations;
        }
      }
    }

    console.warn('[EventRecommendationService] Parsed grouped JSON is not an object');
    return null;
  }

  private parseRecommendationsList(rawResponse: string): HealthEvent[] {
    const recovered = this.recoverJson(rawResponse);
    if (!recovered) {
      console.warn('[EventRecommendationService] Flat response did not contain parseable JSON snippet');
      return [];
    }

    const parsed = this.tryParseJson(recovered);
    if (parsed === null || parsed === undefined) {
      console.warn('[EventRecommendationService] No parsed flat JSON — recovered snippet:', recovered.slice(0, 800));
      return [];
    }

    // If backend returned an array directly
    if (Array.isArray(parsed)) return parsed as HealthEvent[];

    // If wrapped in a common envelope, extract
    if (typeof parsed === 'object' && parsed !== null) {
      const arrayKeys = ['data', 'recommendations', 'items', 'results', 'events'];
      for (const k of arrayKeys) {
        if (Array.isArray((parsed as any)[k])) {
          return (parsed as any)[k] as HealthEvent[];
        }
      }
    }

    console.warn('[EventRecommendationService] Parsed flat JSON is not an array — recovered snippet:', recovered.slice(0, 800));
    return [];
  }

  /**
   * Attempt to recover a JSON substring from an otherwise noisy response.
   * - Strips BOM, trims whitespace
   * - Finds the first '{' or '[' and extracts a balanced JSON block
   * - Returns null if no reasonable JSON block is found
   */
  private recoverJson(raw: string): string | null {
    if (!raw || typeof raw !== 'string') {
      return null;
    }

    // Remove UTF BOM if present and normalize
    let s = raw.replace(/^\uFEFF/, '').trim();
    if (!s) {
      return null;
    }

    // Find first JSON opening char
    const firstBrace = Math.min(
      ...['{', '[']
        .map((ch) => s.indexOf(ch))
        .filter((idx) => idx >= 0)
    );

    if (!isFinite(firstBrace) || firstBrace < 0) {
      // No JSON opening found
      return null;
    }

    // Extract a balanced JSON block starting at firstBrace
    const openChar = s[firstBrace];
    const closeChar = openChar === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = firstBrace; i < s.length; i++) {
      const ch = s[i];
      if (inString) {
        if (escape) {
          escape = false;
        } else if (ch === '\\') {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === openChar) {
        depth++;
      } else if (ch === closeChar) {
        depth--;
        if (depth === 0) {
          const candidate = s.slice(firstBrace, i + 1).trim();
          return candidate || null;
        }
      }
    }

    // If we get here, we couldn't find a balanced closing char
    // Try a looser regex extraction as a last resort (first JSON-like block)
    const regex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
    const m = s.match(regex);
    return m && m[0] ? m[0] : null;
  }

  /**
   * Try parsing JSON with progressive trimming heuristics.
   * Returns the parsed value on success, or null on failure.
   */
  private tryParseJson(input: string): unknown | null {
    if (!input || typeof input !== 'string') return null;

    const s = input.replace(/^\uFEFF/, '');

    // 1) Try raw parse
    try {
      return JSON.parse(s);
    } catch (_) {
      // continue
    }

    // 2) Attempt progressive trimming by last-close positions
    const closes: number[] = [];
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '}' || ch === ']') closes.push(i);
    }

    for (let k = closes.length - 1; k >= 0; k--) {
      const candidate = s.slice(0, closes[k] + 1);
      try {
        return JSON.parse(candidate);
      } catch (_) {
        // try earlier close
      }
    }

    // 3) Try extracting the first JSON-like block (already used in recoverJson), then try parse
    const m = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (m && m[0]) {
      try {
        return JSON.parse(m[0]);
      } catch (_) {
        // fall through
      }
    }

    // 4) Give up
    return null;
  }

  private groupEventsByCategory(events: HealthEvent[]): GroupedEventRecommendations {
    return (events || []).reduce<GroupedEventRecommendations>((accumulator, event) => {
      const key = (event?.category || 'OTHER').toString();
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(event);
      return accumulator;
    }, {});
  }
}