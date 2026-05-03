import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {

  // MyMemory API — free, no key needed, 5000 chars/day
  private readonly API = 'https://api.mymemory.translated.net/get';

  constructor(private http: HttpClient) {}

  /**
   * Translate text to English using MyMemory free API.
   * Returns original text if translation fails or text is already English.
   */
  translateToEnglish(text: string): Observable<string> {
    if (!text || text.trim().length === 0) return of(text);

    // Skip if already looks like English (basic heuristic)
    if (this.isLikelyEnglish(text)) return of(text);

    // Truncate to 500 chars to stay within free tier limits
    const truncated = text.length > 500 ? text.substring(0, 500) + '...' : text;

    const url = `${this.API}?q=${encodeURIComponent(truncated)}&langpair=auto|en`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const translated = res?.responseData?.translatedText;
        // MyMemory returns the original if it can't translate
        if (translated && translated !== truncated) {
          return translated;
        }
        return text;
      }),
      catchError(() => of(text)) // fallback: return original
    );
  }

  /**
   * Translate multiple texts in parallel.
   */
  translateMany(texts: string[]): Observable<string[]> {
    if (!texts || texts.length === 0) return of([]);
    return forkJoin(texts.map(t => this.translateToEnglish(t)));
  }

  /**
   * Basic heuristic: check if text is likely already English.
   * Avoids unnecessary API calls.
   */
  private isLikelyEnglish(text: string): boolean {
    const frenchWords = ['le ', 'la ', 'les ', 'de ', 'du ', 'des ', 'un ', 'une ',
                         'est ', 'sont ', 'avec ', 'pour ', 'dans ', 'sur ', 'par ',
                         'je ', 'tu ', 'il ', 'elle ', 'nous ', 'vous ', 'ils ',
                         'votre ', 'notre ', 'leur ', 'cette ', 'ce ', 'qui ', 'que '];
    const lower = text.toLowerCase();
    const frenchCount = frenchWords.filter(w => lower.includes(w)).length;
    return frenchCount < 2; // if fewer than 2 French words → likely English
  }
}
