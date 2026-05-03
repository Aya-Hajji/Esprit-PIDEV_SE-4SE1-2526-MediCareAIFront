import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MedicalService } from '../../../../shared/services/medical.service';

interface MedicalRecord {
  id?: number;
  patientId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  size: number;
  description?: string;
  status?: string;
}

@Component({
  selector: 'app-medical-record-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './medical-record-viewer.component.html',
  styleUrls: ['./medical-record-viewer.component.css']
})
export class MedicalRecordViewerComponent implements OnInit {
  loading = true;
  record: MedicalRecord | null = null;
  error = '';
  recordId: number | null = null;

  private route = inject(ActivatedRoute);
  private medicalService = inject(MedicalService);

  ngOnInit(): void {
    this.recordId = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
    if (this.recordId) {
      this.loadRecord();
    }
  }

  private loadRecord(): void {
    if (!this.recordId) return;

    this.medicalService.getMedicalRecordById(this.recordId).subscribe({
      next: (data: any) => {
        this.record = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading record:', error);
        this.error = 'Failed to load the medical record';
        this.loading = false;
      }
    });
  }

  downloadRecord(): void {
    if (!this.record) return;
    const link = document.createElement('a');
    link.href = this.record.fileUrl;
    link.download = this.record.fileName;
    link.click();
  }

  deleteRecord(): void {
    if (!this.record?.id) return;

    if (confirm('Are you sure you want to delete this medical record?')) {
      this.medicalService.deleteMedicalRecord(this.record.id).subscribe({
        next: () => {
          window.history.back();
        },
        error: (error: any) => {
          console.error('Error deleting record:', error);
          this.error = 'Failed to delete the medical record';
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getDocumentIcon(type: string): string {
    const icons: any = {
      PRESCRIPTION: '💊',
      LAB_TEST: '🧪',
      RADIOLOGY: '🖼️',
      DOCTOR_NOTE: '📝',
      VACCINATION: '💉',
      OTHER: '📄'
    };
    return icons[type] || '📄';
  }
}
