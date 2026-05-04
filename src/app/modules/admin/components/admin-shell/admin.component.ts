import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {
  isSidebarOpen = false;
  currentRole = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser.subscribe((user) => {
      this.currentRole = this.normalizeRole(user?.role);
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get isAdmin(): boolean {
    return this.currentRole === 'ADMIN';
  }

  get isDoctorOrAdmin(): boolean {
    return this.currentRole === 'DOCTOR' || this.currentRole === 'ADMIN';
  }

  get isNurseOrAdmin(): boolean {
    return this.currentRole === 'NURSE' || this.currentRole === 'ADMIN';
  }

  get isPharmacistOrAdmin(): boolean {
    return this.currentRole === 'PHARMACIST' || this.currentRole === 'ADMIN';
  }

  get isPatientOrAdmin(): boolean {
    return this.currentRole === 'PATIENT' || this.currentRole === 'ADMIN';
  }

  get dashboardRoute(): string {
    switch (this.currentRole) {
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

  private normalizeRole(role: unknown): string {
    return (role || '').toString().toUpperCase().replace('ROLE_', '').trim();
  }
}
