import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from '../../../../shared/services/medical.service';
import { UserService } from '../../../../shared/services/user.service';

@Component({
  selector: 'app-medical-record-share',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medical-record-share.component.html',
  styleUrls: ['./medical-record-share.component.css']
})
export class MedicalRecordShareComponent implements OnInit {
  shareForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  myRecords: any[] = [];
  availableUsers: any[] = [];
  sharedHistory: any[] = [];

  private fb = inject(FormBuilder);
  private medicalService = inject(MedicalService);
  private userService = inject(UserService);

  ngOnInit(): void {
    this.initializeForm();
    this.loadMyRecords();
    this.loadAvailableUsers();
  }

  private initializeForm(): void {
    this.shareForm = this.fb.group({
      recordId: ['', Validators.required],
      userId: ['', Validators.required],
      permissions: ['VIEW', Validators.required],
      expiryDate: ['']
    });
  }

  private loadMyRecords(): void {
    const userId = parseInt(localStorage.getItem('userId') || '0', 10);
    this.medicalService.getMedicalRecordsByPatient(userId).subscribe({
      next: (data: any) => {
        this.myRecords = Array.isArray(data) ? data : [];
      },
      error: (error: any) => {
        console.error('Error loading records:', error);
      }
    });
  }

  private loadAvailableUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data: any) => {
        this.availableUsers = Array.isArray(data) ? data : data?.users || [];
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.shareForm.invalid) {
      return;
    }

    this.loading = true;
    // For now, just show success message
    // In a real implementation, call an API endpoint
    setTimeout(() => {
      this.loading = false;
      this.success = 'Medical record shared successfully!';
      this.shareForm.reset({ permissions: 'VIEW' });
      this.submitted = false;
      setTimeout(() => {
        this.success = '';
      }, 3000);
    }, 1000);
  }

  revokeShare(id: number): void {
    if (confirm('Are you sure you want to revoke this share?')) {
      // For now, just show confirmation
      alert('Share revoked successfully');
    }
  }

  get f() {
    return this.shareForm.controls;
  }
}
