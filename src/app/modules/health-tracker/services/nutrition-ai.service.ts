import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NutritionAnalysis, NutritionCalorieBand } from '../models/nutrition-ai.model';

type NutritionAnalysisResponse = Record<string, unknown>;

@Injectable({
  providedIn: 'root'
})
export class NutritionAiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private readonly analyzeUrl = `${this.baseUrl}/api/nutrition/analyze`;
  private readonly historyStorageKey = 'nutrition-ai-history';

  analyzeNutrition(imageFile: File): Observable<NutritionAnalysis> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<NutritionAnalysisResponse>(this.analyzeUrl, formData).pipe(
      map((response) => this.normalizeAnalysis(response, imageFile.name))
    );
  }

  loadHistory(): Observable<NutritionAnalysis[]> {
    return of(this.readHistory());
  }

  saveHistory(entry: NutritionAnalysis): Observable<NutritionAnalysis[]> {
    const history = [entry, ...this.readHistory()]
      .slice(0, 8)
      .sort((left, right) => new Date(right.analyzedAt).getTime() - new Date(left.analyzedAt).getTime());

    localStorage.setItem(this.historyStorageKey, JSON.stringify(history));
    return of(history);
  }

  clearHistory(): Observable<void> {
    localStorage.removeItem(this.historyStorageKey);
    return of(void 0);
  }

  private normalizeAnalysis(response: NutritionAnalysisResponse, imageName: string): NutritionAnalysis {
    const foodName = this.asString(response['foodName'] ?? response['name'] ?? response['label'] ?? response['food']) || 'Unknown food';
    const calories = this.asNumber(response['calories'] ?? response['estimatedCalories'] ?? response['calorie'] ?? response['energy']) ?? 0;
    const confidenceValue = this.asNumber(response['confidence'] ?? response['score'] ?? response['probability']) ?? 0;
    const analyzedAt = this.asString(response['analyzedAt'] ?? response['timestamp'] ?? response['createdAt']) || new Date().toISOString();
    const confidence = confidenceValue <= 1 ? Math.round(confidenceValue * 100) : Math.round(confidenceValue);

    return {
      id: this.asOptionalNumber(response['id']),
      foodName,
      calories: Math.max(0, Math.round(calories)),
      confidence: Math.max(0, Math.min(100, confidence)),
      analyzedAt,
      imageName,
      calorieBand: this.getCalorieBand(calories)
    };
  }

  private readHistory(): NutritionAnalysis[] {
    const rawHistory = localStorage.getItem(this.historyStorageKey);
    if (!rawHistory) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawHistory) as NutritionAnalysis[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private getCalorieBand(calories: number): NutritionCalorieBand {
    if (calories < 250) {
      return 'low';
    }

    if (calories < 500) {
      return 'medium';
    }

    return 'high';
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private asOptionalNumber(value: unknown): number | undefined {
    const parsed = this.asNumber(value);
    return parsed === null ? undefined : parsed;
  }
}