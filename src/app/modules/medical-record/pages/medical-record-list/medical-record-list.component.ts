import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-medical-record-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './medical-record-list.component.html',
  styleUrls: ['./medical-record-list.component.css']
})
export class MedicalRecordListComponent implements OnInit {
  loading = true;
  medicalRecords: MedicalRecord[] = [];
  filteredRecords: MedicalRecord[] = [];
  searchQuery = '';
  filterType = 'ALL';
  sortBy = 'date';

  documentTypes = ['PRESCRIPTION', 'LAB_TEST', 'RADIOLOGY', 'DOCTOR_NOTE', 'VACCINATION', 'OTHER'];

  private medicalService = inject(MedicalService);

  ngOnInit(): void {
    this.loadMedicalRecords();
  }

  private loadMedicalRecords(): void {
    const userId = parseInt(localStorage.getItem('userId') || '0', 10);
    this.medicalService.getMedicalRecordsByPatient(userId).subscribe({
      next: (data: any) => {
        this.medicalRecords = Array.isArray(data) ? data : data?.records || [];
        this.filterAndSort();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading medical records:', error);
        this.loading = false;
      }
    });
  }

  filterAndSort(): void {
    let filtered = [...this.medicalRecords];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.fileName.toLowerCase().includes(query) ||
          r.documentType.toLowerCase().includes(query) ||
          (r.description?.toLowerCase().includes(query) || false)
      );
    }

    // Apply type filter
    if (this.filterType && this.filterType !== 'ALL') {
      filtered = filtered.filter((r) => r.documentType === this.filterType);
    }

    // Apply sorting
    if (this.sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    } else if (this.sortBy === 'name') {
      filtered.sort((a, b) => a.fileName.localeCompare(b.fileName));
    } else if (this.sortBy === 'type') {
      filtered.sort((a, b) => a.documentType.localeCompare(b.documentType));
    }

    this.filteredRecords = filtered;
  }

  onSearchChange(): void {
    this.filterAndSort();
  }

  onFilterChange(): void {
    this.filterAndSort();
  }

  onSortChange(): void {
    this.filterAndSort();
  }

  downloadRecord(record: MedicalRecord): void {
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = record.fileUrl;
    link.download = record.fileName;
    link.click();
  }

  deleteRecord(id: number | undefined): void {
    if (!id) return;

    if (confirm('Are you sure you want to delete this medical record?')) {
      this.medicalService.deleteMedicalRecord(id).subscribe({
        next: () => {
          this.medicalRecords = this.medicalRecords.filter((r) => r.id !== id);
          this.filterAndSort();
        },
        error: (error: any) => {
          console.error('Error deleting record:', error);
          alert('Failed to delete the medical record');
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
