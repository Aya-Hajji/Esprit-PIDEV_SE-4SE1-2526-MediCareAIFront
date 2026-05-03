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
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.tokenValue;

    const isAuthEndpoint =
      request.url.includes('/auth/login') ||
      request.url.includes('/auth/register');

    // ⚠️ TRAITEMENT SPÉCIAL POUR FormData
    // Le problème: le navigateur ajoute automatiquement "charset=UTF-8" au Content-Type
    // pour FormData, ce que certains backends rejettent (erreur 500)
    if (request.body instanceof FormData) {
      console.log('[AuthInterceptor] Détectée requête FormData');
      
      // Solution: supprimer COMPLÈTEMENT le Content-Type header
      // Laisser le navigateur le reconstruire SANS charset
      let newRequest = request.clone({ 
        headers: request.headers.delete('Content-Type')
      });
      
      // Ajouter l'Authorization si nécessaire
      if (token && !isAuthEndpoint) {
        newRequest = newRequest.clone({
          headers: newRequest.headers.set('Authorization', `Bearer ${token}`)
        });
      }
      
      console.log('[AuthInterceptor] FormData request cleaned (Content-Type supprimé)');
      console.log('[AuthInterceptor] Headers finaux:', newRequest.headers);
      
      return next.handle(newRequest).pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error, isAuthEndpoint))
      );
    }

    // Pour les requêtes JSON normales
    const headers: Record<string, string> = {};

    if (token && !isAuthEndpoint) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!request.headers.has('Content-Type')) {
      headers['Content-Type'] = 'application/json';
    }

    if (Object.keys(headers).length > 0) {
      request = request.clone({ setHeaders: headers });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, isAuthEndpoint))
    );
  }

  private handleError(error: HttpErrorResponse, isAuthEndpoint: boolean): Observable<never> {
    console.error(`HTTP Error ${error.status} on ${error.url}:`, error);

    if (error.status === 401) {
      console.warn('Token invalide ou expiré, déconnexion...');
      this.authService.logout();
      if (!isAuthEndpoint) {
        this.router.navigate(['/login']);
      }
    } else if (error.status === 403) {
      console.warn('Accès refusé (403) sur :', error.url);
    } else if (error.status === 500) {
      console.error('[AuthInterceptor] ERREUR 500 - Vérifier logs du backend');
      console.error('[AuthInterceptor] URL:', error.url);
    }

    return throwError(() => error);
  }
}