import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RefillRequest } from '../../../../../types/pharmacy';
import { PharmacyApiService } from '../../services/pharmacyApi.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-refills',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './refills.component.html',
  styleUrls: ['./refills.component.css']
})
export class RefillsComponent implements OnInit {
  refills: RefillRequest[] = [];
  isLoading = true;
  error: string | null = null;
  successMessage: string | null = null;
  selectedStatus = '';
  prescriptionId = '';
  userRole: string | null = null;

  statuses = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'];

  constructor(
    private pharmacyApi: PharmacyApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      this.userRole = user?.role || null;
    });
    this.loadRefills();
  }

  loadRefills(): void {
    this.isLoading = true;
    this.error = null;

    this.pharmacyApi.getRefills().subscribe({
      next: (refills) => {
        this.refills = refills || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load refill requests.';
        this.isLoading = false;
        console.error('Refill load error:', err);
      }
    });
  }

  submitRefillRequest(): void {
    const prescriptionId = this.prescriptionId.trim();
    if (!prescriptionId) {
      this.error = 'Please enter a prescription ID.';
      return;
    }

    this.error = null;
    this.successMessage = null;

    this.pharmacyApi.requestRefill(prescriptionId).subscribe({
      next: () => {
        this.successMessage = 'Refill request submitted successfully.';
        this.prescriptionId = '';
        this.loadRefills();
      },
      error: (err) => {
        this.error = 'Failed to submit refill request.';
        console.error('Refill request error:', err);
      }
    });
  }

  deleteRefill(id: string): void {
    if (!confirm('Delete this refill request?')) {
      return;
    }

    this.pharmacyApi.deleteRefillRequest(id).subscribe({
      next: () => {
        this.successMessage = 'Refill request deleted.';
        this.loadRefills();
      },
      error: (err) => {
        this.error = 'Failed to delete refill request.';
        console.error('Refill delete error:', err);
      }
    });
  }

  get filteredRefills(): RefillRequest[] {
    if (!this.selectedStatus) {
      return this.refills;
    }
    return this.refills.filter((r) => r.status === this.selectedStatus);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'EXPIRED': return 'status-expired';
      default: return 'status-default';
    }
  }

  isPatient(): boolean {
    return (this.userRole || '').toUpperCase() === 'PATIENT';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }
}
