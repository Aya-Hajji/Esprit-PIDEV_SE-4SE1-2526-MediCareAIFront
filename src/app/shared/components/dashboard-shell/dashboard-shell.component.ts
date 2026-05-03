import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-shell.component.html',
  styleUrls: ['./dashboard-shell.component.css']
})
export class DashboardShellComponent {
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

  get isPharmacistOrAdmin(): boolean {
    return this.currentRole === 'PHARMACIST' || this.currentRole === 'ADMIN';
  }

  get isPatientOrAdmin(): boolean {
    return this.currentRole === 'PATIENT' || this.currentRole === 'ADMIN';
  }

  get isPatient(): boolean {
    return this.currentRole === 'PATIENT';
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
        return '/patient/dashboard';
      default:
        return '/';
    }
  }

  private normalizeRole(role: unknown): string {
    return (role || '').toString().toUpperCase().replace('ROLE_', '').trim();
  }
}
