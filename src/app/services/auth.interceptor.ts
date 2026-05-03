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
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token from the service
    let token = this.authService.tokenValue;

    // Development-only fallback: when running locally and no token is present,
    // allow attaching a developer-provided token from `environment.devAuthToken`.
    // This helps local devs reproduce authenticated flows without logging in.
    if (!token && !environment.production && environment.devAuthToken) {
      console.warn('AuthInterceptor: using development fallback token from environment.devAuthToken');
      token = environment.devAuthToken;
    }

    // Clone the request and add authorization header if token exists
    // But DON'T add token to login/register endpoints
    const url = request.url;
    const isPublicAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/verify-email') ||
      url.includes('/auth/resend-verification') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');
    
    if (token && !isPublicAuthEndpoint) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Ensure Content-Type is set for API requests
    if (!request.headers.has('Content-Type') && !(request.body instanceof FormData)) {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);

        // Only a 401 should force a logout. A 403 usually means the backend
        // rejected the action for the current user, but the session is still valid.
        if (error.status === 0) {
          console.error(
            'Cannot reach API — check that the base URL matches the backend (default http://localhost:8090/MediCareAI), the server is running, and that nothing is blocking the request (firewall, wrong port, or mixed content).',
            error
          );
        }

        if (error.status === 401) {
          console.warn('Auth error detected, clearing tokens...');
          this.authService.logout();
          if (!isPublicAuthEndpoint) {
            this.router.navigate(['/login']);
          }
        } else if (error.status === 403) {
          console.warn('Forbidden request rejected by backend. Keeping the current session intact.');
        }

        return throwError(() => error);
      })
    );
  }
}
