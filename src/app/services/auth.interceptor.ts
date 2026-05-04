import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly errorLogCooldownMs = 10000;
  private readonly recentErrorLogs = new Map<string, number>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token from the service
    const token = this.authService.tokenValue;

    // Clone the request and add authorization header if token exists
    // But DON'T add token to login/register endpoints
    const isAuthEndpoint = request.url.includes('/auth/login') || request.url.includes('/auth/register');
    const isGoogleGemini = request.url.includes('generativelanguage.googleapis.com');

    if (token && !isAuthEndpoint && !isGoogleGemini) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Remove null/undefined values from JSON bodies to prevent backend primitive parsing failures.
    if (request.body && this.isJsonObjectBody(request.body)) {
      const sanitizedBody = this.sanitizeRequestBody(request.body);
      request = request.clone({ body: sanitizedBody });
    }

    // Availability endpoint is strict with primitive booleans; coerce null-like values defensively.
    if (request.url.includes('/availabilities') && request.body) {
      request = request.clone({ body: this.coerceBooleanLikeNulls(request.body) });
    }

    // Only set Content-Type for JSON payload requests.
    // Adding it to body-less requests can trigger avoidable CORS preflight calls.
    if (
      request.body !== null &&
      request.body !== undefined &&
      !request.headers.has('Content-Type') &&
      !(request.body instanceof FormData)
    ) {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logHttpError(error, request.url);

        if (error.status === 500 && request.url.includes('/availabilities')) {
          console.error('Availability request body at failure:', request.body);
        }
        
        // 401 means token is invalid/expired. Do not auto-logout on 403 (forbidden),
        // because it can be endpoint permission-specific and should not clear auth state.
        if (error.status === 401) {
          console.warn('Auth error detected, clearing tokens...');
          this.authService.logout();
          if (!isAuthEndpoint) {
            this.router.navigate(['/login']);
          }
        }
        
        return throwError(() => error);
      })
    );
  }

  private isJsonObjectBody(body: unknown): body is Record<string, unknown> {
    if (!body || typeof body !== 'object') {
      return false;
    }

    if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
      return false;
    }

    return true;
  }

  private sanitizeRequestBody(input: unknown): unknown {
    if (Array.isArray(input)) {
      return input
        .map((item) => this.sanitizeRequestBody(item))
        .filter((item) => item !== undefined);
    }

    if (!input || typeof input !== 'object') {
      return input;
    }

    const source = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    Object.keys(source).forEach((key) => {
      const value = source[key];
      if (value === null || value === undefined) {
        return;
      }

      result[key] = this.sanitizeRequestBody(value);
    });

    return result;
  }

  private coerceBooleanLikeNulls(input: unknown): unknown {
    if (Array.isArray(input)) {
      return input.map((item) => this.coerceBooleanLikeNulls(item));
    }

    if (!input || typeof input !== 'object') {
      return input;
    }

    const source = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    Object.keys(source).forEach((key) => {
      const value = source[key];
      const normalizedKey = key.toLowerCase();
      const looksBoolean =
        normalizedKey.startsWith('is') ||
        normalizedKey.startsWith('has') ||
        normalizedKey.startsWith('can') ||
        normalizedKey.endsWith('ed') ||
        normalizedKey.endsWith('able') ||
        normalizedKey.endsWith('active') ||
        normalizedKey.endsWith('enabled') ||
        ['blocked', 'urgent', 'premium', 'available'].includes(normalizedKey);

      if (value === null || value === undefined) {
        if (looksBoolean) {
          result[key] = false;
        }
        return;
      }

      result[key] = this.coerceBooleanLikeNulls(value);
    });

    return result;
  }

  private logHttpError(error: HttpErrorResponse, url: string): void {
    // Expected backend policy denial for medical-record writes should not flood console.
    if (error.status === 403 && url.includes('/medical-records')) {
      return;
    }

    // Spring returns 500 with "No static resource …" when no @RestController matches the path;
    // our services fall back to local/offline logic — avoid scary console.error spam.
    if (error.status === 500 && this.isMissingBackendRouteNoise(error, url)) {
      return;
    }

    // Status 0 = browser could not connect (backend stopped, wrong port, mixed content, offline).
    // Avoid noisy console.error stacks; services already fall back to cached / local data where implemented.
    if (error.status === 0) {
      const sig0 = '0:network';
      const now0 = Date.now();
      const last0 = this.recentErrorLogs.get(sig0) ?? 0;
      if (now0 - last0 >= this.errorLogCooldownMs) {
        this.recentErrorLogs.set(sig0, now0);
        console.warn(
          `[MediCareAI] API unreachable (example: ${url}). Start Spring Boot (backend application.properties: server.port, server.servlet.context-path) or update src/environments/environment.ts.`
        );
      }
      return;
    }

    const signature = `${error.status}:${url}`;
    const now = Date.now();
    const lastLoggedAt = this.recentErrorLogs.get(signature) ?? 0;

    if (now - lastLoggedAt < this.errorLogCooldownMs) {
      return;
    }

    this.recentErrorLogs.set(signature, now);
    console.error(`HTTP ${error.status} for ${url}:`, error.error?.message || error.message);
  }

  private isMissingBackendRouteNoise(error: HttpErrorResponse, url: string): boolean {
    const msg = String(
      (typeof error.error === 'object' && error.error && 'message' in error.error
        ? (error.error as { message?: string }).message
        : '') || error.message || ''
    );
    if (!msg.includes('No static resource')) {
      return false;
    }
    const optional =
      url.includes('/medical-risk-assessments') ||
      url.includes('/auth/doctors/recommend');
    return optional;
  }
}
