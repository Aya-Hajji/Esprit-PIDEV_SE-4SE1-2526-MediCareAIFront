import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUser = this.authService.currentUserValue;
    console.log('AuthGuard - Current user:', currentUser);
    console.log('AuthGuard - Route URL:', state.url);
    console.log('AuthGuard - Required roles:', route.data['roles']);
    
    if (currentUser) {
      // Check if route requires specific role
      const requiredRoles = (route.data['roles'] || []) as string[];
      const currentUserRole = this.normalizeRole(currentUser.role);
      const normalizedRequiredRoles = requiredRoles.map((role) => this.normalizeRole(role));

      console.log('AuthGuard - Current user role (normalized):', currentUserRole);
      console.log('AuthGuard - Required roles (normalized):', normalizedRequiredRoles);

      if (normalizedRequiredRoles.length > 0 && normalizedRequiredRoles.indexOf(currentUserRole) === -1) {
        // Role not authorized, redirect to home page
        console.log('AuthGuard - Role not authorized, redirecting to home');
        this.router.navigate(['/']);
        return false;
      }

      // Authorized so return true
      console.log('AuthGuard - Authorized, proceeding to route');
      return true;
    }

    // Not logged in so redirect to login page with the return url
    console.log('AuthGuard - Not logged in, redirecting to login');
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  private normalizeRole(role: unknown): string {
    return (role || '').toString().toUpperCase().replace('ROLE_', '').trim();
  }
}
