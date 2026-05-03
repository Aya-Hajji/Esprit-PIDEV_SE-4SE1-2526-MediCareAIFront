import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Prescription } from '../../../../../types/pharmacy';
import { PharmacyApiService } from '../../services/pharmacyApi.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-prescriptions-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './prescriptions-list.component.html',
  styleUrls: ['./prescriptions-list.component.css']
})
export class PrescriptionsListComponent implements OnInit {
  prescriptions: Prescription[] = [];
  isLoading = true;
  error: string | null = null;
  selectedStatus: string = '';
  userRole: string | null = null;

  statuses = ['ACTIVE', 'EXPIRED', 'FULFILLED', 'REFILLED'];

  constructor(
    private pharmacyApi: PharmacyApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      this.userRole = user?.role;
    });
    this.loadPrescriptions();
  }

  loadPrescriptions(): void {
    this.isLoading = true;
    this.error = null;

    this.pharmacyApi.getPrescriptions().subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load prescriptions. Please try again.';
        console.error('Error loading prescriptions:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredPrescriptions(): Prescription[] {
    if (!this.selectedStatus) {
      return this.prescriptions;
    }
    return this.prescriptions.filter((p) => p.status === this.selectedStatus);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'EXPIRED':
        return 'status-expired';
      case 'FULFILLED':
        return 'status-fulfilled';
      case 'REFILLED':
        return 'status-refilled';
      default:
        return 'status-default';
    }
  }

  isDoctor(): boolean {
    return this.userRole === 'DOCTOR';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
