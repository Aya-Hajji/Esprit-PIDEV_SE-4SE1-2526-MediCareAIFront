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
  medicalRecordStats = { total: 0, active: 0, inactive: 0, archived: 0 };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser;
  }

  ngOnInit(): void {
    this.loadMedicalRecordStats();
    window.addEventListener('storage', () => this.loadMedicalRecordStats());
  }

  private loadMedicalRecordStats(): void {
    try {
      const raw = localStorage.getItem('localMedicalRecordsFallback');
      if (!raw) {
        this.medicalRecordStats = { total: 0, active: 0, inactive: 0, archived: 0 };
        return;
      }

      const parsed = JSON.parse(raw) as Array<{ status?: string }>;
      const total = Array.isArray(parsed) ? parsed.length : 0;
      const active = Array.isArray(parsed) ? parsed.filter((r) => r.status === 'ACTIVE').length : 0;
      const inactive = Array.isArray(parsed) ? parsed.filter((r) => r.status === 'INACTIVE').length : 0;
      const archived = Array.isArray(parsed) ? parsed.filter((r) => r.status === 'ARCHIVED').length : 0;

      this.medicalRecordStats = { total, active, inactive, archived };
    } catch {
      this.medicalRecordStats = { total: 0, active: 0, inactive: 0, archived: 0 };
    }
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
        return '/health-tracker/dashboard';
      default:
        return '/';
    }
  }
}
