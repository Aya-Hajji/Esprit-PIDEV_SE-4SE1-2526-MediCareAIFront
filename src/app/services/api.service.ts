import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  private readonly apiTimeout = environment.apiTimeout || 10000;

  constructor(private http: HttpClient) {}

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  clearToken(): void {
    localStorage.removeItem('authToken');
  }

  get<T>(endpoint: string, options: { params?: HttpParams | Record<string, string | number | boolean>; headers?: HttpHeaders } = {}): Observable<T> {
    return this.http
      .get<T>(this.buildUrl(endpoint), {
        ...options,
        headers: this.buildHeaders(options.headers),
        params: this.buildParams(options.params)
      })
      .pipe(timeout(this.apiTimeout), catchError((error) => this.handleError(error)));
  }

  post<T>(endpoint: string, body: unknown, options: { params?: HttpParams | Record<string, string | number | boolean>; headers?: HttpHeaders } = {}): Observable<T> {
    return this.http
      .post<T>(this.buildUrl(endpoint), body, {
        ...options,
        headers: this.buildHeaders(options.headers),
        params: this.buildParams(options.params)
      })
      .pipe(timeout(this.apiTimeout), catchError((error) => this.handleError(error)));
  }

  put<T>(endpoint: string, body: unknown, options: { params?: HttpParams | Record<string, string | number | boolean>; headers?: HttpHeaders } = {}): Observable<T> {
    return this.http
      .put<T>(this.buildUrl(endpoint), body, {
        ...options,
        headers: this.buildHeaders(options.headers),
        params: this.buildParams(options.params)
      })
      .pipe(timeout(this.apiTimeout), catchError((error) => this.handleError(error)));
  }

  delete<T>(endpoint: string, options: { params?: HttpParams | Record<string, string | number | boolean>; headers?: HttpHeaders } = {}): Observable<T> {
    return this.http
      .delete<T>(this.buildUrl(endpoint), {
        ...options,
        headers: this.buildHeaders(options.headers),
        params: this.buildParams(options.params)
      })
      .pipe(timeout(this.apiTimeout), catchError((error) => this.handleError(error)));
  }

  private buildUrl(endpoint: string): string {
    if (!endpoint) {
      return this.apiUrl;
    }

    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    return `${this.apiUrl}/${endpoint.replace(/^\/+/, '')}`;
  }

  private buildHeaders(existing?: HttpHeaders): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = existing || new HttpHeaders();

    if (!headers.has('Content-Type')) {
      headers = headers.set('Content-Type', 'application/json');
    }

    if (token && !headers.has('Authorization')) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private buildParams(params?: HttpParams | Record<string, string | number | boolean>): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    if (params instanceof HttpParams) {
      return params;
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }

  private handleError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.clearToken();
        localStorage.removeItem('authUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
      }

      const message = error.error?.message || `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;
      return throwError(() => new Error(message));
    }

    return throwError(() => new Error('An unexpected error occurred.'));
  }
}

