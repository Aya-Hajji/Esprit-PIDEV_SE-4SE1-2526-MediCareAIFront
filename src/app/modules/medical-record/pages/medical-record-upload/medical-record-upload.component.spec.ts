import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MedicalRecordUploadComponent } from './medical-record-upload.component';
import { MedicalService } from '../../../../shared/services/medical.service';

describe('MedicalRecordUploadComponent', () => {
  let component: MedicalRecordUploadComponent;
  let fixture: ComponentFixture<MedicalRecordUploadComponent>;
  let mockMedicalService: jasmine.SpyObj<MedicalService>;

  beforeEach(async () => {
    mockMedicalService = jasmine.createSpyObj('MedicalService', [
      'uploadMedicalRecord'
    ]);

    // Set default return values
    mockMedicalService.uploadMedicalRecord.and.returnValue(of({
      id: 1,
      patientId: 1,
      documentType: 'OTHER',
      fileName: 'test.pdf',
      fileUrl: '/files/test.pdf',
      uploadDate: new Date().toISOString(),
      size: 1024
    }));

    await TestBed.configureTestingModule({
      imports: [MedicalRecordUploadComponent, ReactiveFormsModule],
      providers: [
        { provide: MedicalService, useValue: mockMedicalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalRecordUploadComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize upload form', () => {
    fixture.detectChanges();

    expect(component.uploadForm).toBeDefined();
    expect(component.uploadForm.get('documentType')).toBeDefined();
    expect(component.uploadForm.get('file')).toBeDefined();
    expect(component.uploadForm.get('description')).toBeDefined();
  });

  it('should provide available document types', () => {
    expect(component.documentTypes).toContain('PRESCRIPTION');
    expect(component.documentTypes).toContain('LAB_RESULT');
    expect(component.documentTypes).toContain('IMAGING');
    expect(component.documentTypes).toContain('REPORT');
  });

  it('should handle file selection with valid PDF', () => {
    fixture.detectChanges();
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = {
      target: {
        files: [mockFile]
      }
    } as any;

    component.onFileSelected(fileInput);

    expect(component.selectedFile).toEqual(mockFile);
    expect(component.error).toBe('');
  });

  it('should reject invalid file types', () => {
    const exeFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
    const fileInput = {
      target: {
        files: [exeFile]
      }
    } as any;

    component.onFileSelected(fileInput);

    expect(component.selectedFile).toBeNull();
    expect(component.error).toContain('Please select a valid file');
  });

  it('should accept image files', () => {
    fixture.detectChanges();
    const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = {
      target: {
        files: [imageFile]
      }
    } as any;

    component.onFileSelected(fileInput);

    expect(component.selectedFile).toEqual(imageFile);
    expect(component.error).toBe('');
  });

  it('should not submit form without file', () => {
    mockMedicalService.uploadMedicalRecord.and.returnValue(of({} as any));

    fixture.detectChanges();

    component.uploadForm.patchValue({
      documentType: 'PRESCRIPTION',
      description: 'Test document'
    });

    component.onSubmit();

    expect(component.error).toBeTruthy();
    expect(mockMedicalService.uploadMedicalRecord).not.toHaveBeenCalled();
  });

  it('should not submit invalid form', () => {
    mockMedicalService.uploadMedicalRecord.and.returnValue(of({} as any));

    fixture.detectChanges();

    component.uploadForm.patchValue({
      documentType: 'PRESCRIPTION',
      description: ''
    });

    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    component.selectedFile = mockFile;

    component.onSubmit();

    expect(component.uploadForm.invalid).toBe(true);
  });

  it('should submit form with valid data', fakeAsync(() => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    mockMedicalService.uploadMedicalRecord.and.returnValue(of({} as any));

    fixture.detectChanges();

    component.uploadForm.patchValue({
      documentType: 'PRESCRIPTION',
      description: 'Test prescription document',
      file: 'test.pdf'
    });
    fixture.detectChanges();
    component.selectedFile = mockFile;
    
    // Verify form and selectedFile are set
    expect(component.uploadForm.valid).toBe(true);
    expect(component.selectedFile).not.toBeNull();

    component.onSubmit();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(mockMedicalService.uploadMedicalRecord).toHaveBeenCalled();
  }));

  it('should handle upload error', () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    mockMedicalService.uploadMedicalRecord.and.returnValue(
      throwError(() => ({ error: { message: 'Upload failed' } }))
    );

    fixture.detectChanges();

    component.uploadForm.patchValue({
      documentType: 'PRESCRIPTION',
      description: 'Test document'
    });
    component.selectedFile = mockFile;

    component.onSubmit();

    expect(component.loading).toBe(false);
    expect(component.error).toBeTruthy();
  });

  it('should show success message on upload', fakeAsync(() => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    mockMedicalService.uploadMedicalRecord.and.returnValue(of({} as any));

    fixture.detectChanges();

    component.uploadForm.patchValue({
      documentType: 'PRESCRIPTION',
      description: 'Test document',
      file: 'test.pdf'
    });
    fixture.detectChanges();
    component.selectedFile = mockFile;

    component.onSubmit();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.success).toBeTruthy();
  }));

  it('should reset form and clear file after successful upload', fakeAsync(() => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    mockMedicalService.uploadMedicalRecord.and.returnValue(of({} as any));

    fixture.detectChanges();

    component.uploadForm.patchValue({
      documentType: 'PRESCRIPTION',
      description: 'Test document',
      file: 'test.pdf'
    });
    fixture.detectChanges();
    component.selectedFile = mockFile;

    component.onSubmit();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.uploadForm.get('documentType')?.value).toBe('PRESCRIPTION');
    expect(component.selectedFile).toBeNull();
  }));

  it('should access form controls via getter', () => {
    fixture.detectChanges();

    expect(component.f).toBeDefined();
    expect(component.f['documentType']).toBeDefined();
    expect(component.f['file']).toBeDefined();
    expect(component.f['description']).toBeDefined();
  });
});
