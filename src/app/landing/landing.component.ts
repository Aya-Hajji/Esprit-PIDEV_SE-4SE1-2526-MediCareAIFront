import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: false,
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  showLoginModal = false;
  currentUser$;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser;
  }

  navigateToRoleSelection() {
    this.showLoginModal = true;
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

  navigateToProfile(role?: string) {
    const normalizedRole = (role || '').toUpperCase().replace('ROLE_', '').trim();
    this.router.navigateByUrl(this.getDefaultRouteForRole(normalizedRole));
  }

  logout() {
    this.authService.logout();
    this.showLoginModal = false;
    this.router.navigate(['/']);
  }

  watchDemo() {
    // Open demo video in modal or new tab
    window.open('https://example.com/demo', '_blank');
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }

  private getDefaultRouteForRole(role: string): string {
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'PHARMACIST':
        return '/pharmacy/dashboard';
      case 'DOCTOR':
        return '/medical-record/dashboard';
      case 'NURSE':
        return '/appointments/dashboard';
      case 'PATIENT':
        return '/patient/dashboard';
      default:
        return '/';
    }
  }
}
