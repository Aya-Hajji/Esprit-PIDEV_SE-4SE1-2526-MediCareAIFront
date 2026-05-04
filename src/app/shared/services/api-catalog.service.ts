import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiCatalogService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  private readonly openApiUrl = `${this.baseUrl}/v3/api-docs`;
  private paths$: Observable<Set<string>> | null = null;

  constructor(private http: HttpClient) {}

  hasPath(path: string): Observable<boolean> {
    return this.getPaths().pipe(
      map((paths) => {
        // If OpenAPI is unreachable, don't block API calls.
        if (paths.size === 0) {
          return true;
        }

        return paths.has(path);
      })
    );
  }

  private getPaths(): Observable<Set<string>> {
    if (this.paths$) {
      return this.paths$;
    }

    this.paths$ = this.http.get<unknown>(this.openApiUrl).pipe(
      map((doc) => this.extractPaths(doc)),
      catchError(() => of(new Set<string>())),
      shareReplay(1)
    );

    return this.paths$;
  }

  private extractPaths(doc: unknown): Set<string> {
    if (!doc || typeof doc !== 'object') {
      return new Set<string>();
    }

    const source = doc as Record<string, unknown>;
    const rawPaths = source['paths'];

    if (!rawPaths || typeof rawPaths !== 'object') {
      return new Set<string>();
    }

    return new Set<string>(Object.keys(rawPaths as Record<string, unknown>));
  }
}

