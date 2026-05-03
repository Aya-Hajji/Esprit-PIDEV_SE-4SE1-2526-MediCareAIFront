import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GenderGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    const userGender = this.resolveCurrentGender();

    if (userGender === 'FEMALE') {
      return true;
    }

    this.router.navigate(['/health-tracker/dashboard']);
    return false;
  }

  private resolveCurrentGender(): string {
    const currentUser = this.authService.currentUserValue;
    const directGender = this.normalizeGender(currentUser?.gender || currentUser?.user?.gender);
    if (directGender) {
      return directGender;
    }

    const authUserRaw = localStorage.getItem('authUser');
    if (authUserRaw) {
      try {
        const authUser = JSON.parse(authUserRaw) as { gender?: string; user?: { gender?: string } };
        const storedGender = this.normalizeGender(authUser?.gender || authUser?.user?.gender);
        if (storedGender) {
          return storedGender;
        }
      } catch {
        // ignore invalid authUser JSON and continue fallback
      }
    }

    const persistedGender = this.normalizeGender(localStorage.getItem('userGender'));
    if (persistedGender) {
      return persistedGender;
    }

    const token = localStorage.getItem('authToken');
    return this.extractGenderFromToken(token);
  }

  private normalizeGender(value: unknown): string {
    const normalized = (value || '').toString().trim().toUpperCase();
    if (normalized === 'F') {
      return 'FEMALE';
    }
    if (normalized === 'M') {
      return 'MALE';
    }
    return normalized;
  }

  private extractGenderFromToken(token: string | null): string {
    if (!token || !token.includes('.')) {
      return '';
    }

    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return '';
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded) as {
        gender?: string;
        sex?: string;
        user?: { gender?: string; sex?: string };
      };

      return this.normalizeGender(parsed.gender || parsed.sex || parsed.user?.gender || parsed.user?.sex);
    } catch {
      return '';
    }
  }
}
