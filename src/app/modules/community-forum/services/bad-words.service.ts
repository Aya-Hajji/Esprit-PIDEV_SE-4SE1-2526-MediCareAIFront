import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface BadWordsResult {
  isClean: boolean;           // true = texte propre, false = bloqué
  detectedWords: string[];    // mots interdits détectés
  message: string;            // message à afficher à l'utilisateur
}

@Injectable({ providedIn: 'root' })
export class BadWordsService {

  private readonly backendUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/forum/check-content`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  /**
   * Check text via backend Bad Words API.
   * Backend endpoint: POST /api/forum/check-content
   * Body: { text: string }
   * Response: { clean: boolean, badWords?: string[] }
   *           OR { isClean: boolean, detectedWords?: string[] }
   *           OR { status: "OK"|"BLOCKED", words?: string[] }
   */
  checkText(text: string): Observable<BadWordsResult> {
    if (!text || text.trim().length === 0) {
      return of({ isClean: true, detectedWords: [], message: '' });
    }

    return this.http.post<any>(
      this.backendUrl,
      { text: text.trim() },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => this.normalizeResponse(response)),
      catchError(error => {
        console.warn('[BadWords] Backend check failed:', error?.status, '— allowing text');
        // If backend is unavailable, allow the text (non-blocking)
        return of({ isClean: true, detectedWords: [], message: '' });
      })
    );
  }

  /**
   * Normalize various backend response shapes into BadWordsResult.
   */
  private normalizeResponse(response: any): BadWordsResult {
    // Shape 1: { clean: true/false, badWords: [...] }
    if (response?.clean !== undefined) {
      const words = response.badWords || response.words || [];
      return {
        isClean: response.clean === true,
        detectedWords: words,
        message: response.clean
          ? ''
          : `Votre texte contient des mots inappropriés : ${words.join(', ')}. Veuillez les supprimer.`
      };
    }

    // Shape 2: { isClean: true/false, detectedWords: [...] }
    if (response?.isClean !== undefined) {
      const words = response.detectedWords || response.words || [];
      return {
        isClean: response.isClean === true,
        detectedWords: words,
        message: response.isClean
          ? ''
          : `Votre texte contient des mots inappropriés : ${words.join(', ')}. Veuillez les supprimer.`
      };
    }

    // Shape 3: { status: "OK" | "BLOCKED", words: [...] }
    if (response?.status !== undefined) {
      const isClean = response.status === 'OK' || response.status === 'ok';
      const words = response.words || response.badWords || response.detectedWords || [];
      return {
        isClean,
        detectedWords: words,
        message: isClean
          ? ''
          : `Votre texte contient des mots inappropriés${words.length ? ' : ' + words.join(', ') : ''}. Veuillez les supprimer.`
      };
    }

    // Unknown shape — allow by default
    console.warn('[BadWords] Unknown response shape:', response);
    return { isClean: true, detectedWords: [], message: '' };
  }
}
