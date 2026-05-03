import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from '../../../../shared/services/medical.service';

@Component({
  selector: 'app-medical-record-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medical-record-upload.component.html',
  styleUrls: ['./medical-record-upload.component.css']
})
export class MedicalRecordUploadComponent implements OnInit {
  uploadForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  selectedFile: File | null = null;

  documentTypes = ['PRESCRIPTION', 'LAB_RESULT', 'IMAGING', 'REPORT', 'VACCINATION', 'OTHER'];

  private formBuilder = inject(FormBuilder);
  private medicalService = inject(MedicalService);

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.uploadForm = this.formBuilder.group({
      documentType: ['PRESCRIPTION', Validators.required],
      description: ['', [Validators.required, Validators.minLength(5)]],
      file: ['', Validators.required]
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file type (allow PDF and images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.type)) {
        this.selectedFile = file;
        this.uploadForm.patchValue({ file: file.name });
        this.error = '';
      } else {
        this.error = 'Please select a valid file (PDF or image)';
        this.selectedFile = null;
      }
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.uploadForm.invalid || !this.selectedFile) {
      this.error = 'Please fill in all fields and select a file';
      return;
    }

    this.loading = true;
    const userId = parseInt(localStorage.getItem('userId') || '0', 10);

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('userId', userId.toString());
    formData.append('documentType', this.uploadForm.value.documentType);
    formData.append('description', this.uploadForm.value.description);

    // For now, use a generic upload method - adjust based on actual API
    this.medicalService.uploadMedicalRecord(this.selectedFile, this.uploadForm.value.description).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Medical record uploaded successfully!';
        this.uploadForm.reset({ documentType: 'PRESCRIPTION' });
        this.selectedFile = null;
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (error: any) => {
        this.loading = false;
        this.error = error?.error?.message || 'Failed to upload medical record';
      }
    });
  }

  get f() {
    return this.uploadForm.controls;
  }
}
