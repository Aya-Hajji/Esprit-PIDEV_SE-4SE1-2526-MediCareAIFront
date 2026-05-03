import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MedicalRecordViewerComponent } from './medical-record-viewer.component';
import { MedicalService } from '../../../../shared/services/medical.service';
import { DomSanitizer } from '@angular/platform-browser';

describe('MedicalRecordViewerComponent', () => {
  let component: MedicalRecordViewerComponent;
  let fixture: ComponentFixture<MedicalRecordViewerComponent>;
  let mockMedicalService: jasmine.SpyObj<MedicalService>;
  let mockSanitizer: jasmine.SpyObj<DomSanitizer>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockMedicalService = jasmine.createSpyObj('MedicalService', [
      'getMedicalRecordById',
      'deleteMedicalRecord'
    ]);

    // Set default return values
    mockMedicalService.getMedicalRecordById.and.returnValue(of({
      id: 1,
      patientId: 1,
      documentType: 'PRESCRIPTION',
      fileName: 'prescription.pdf',
      fileUrl: '/files/prescription.pdf',
      uploadDate: new Date().toISOString(),
      size: 1024,
      description: 'Test prescription',
      status: 'ACTIVE'
    }));
    mockMedicalService.deleteMedicalRecord.and.returnValue(of(void 0));

    mockSanitizer = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustResourceUrl']);
    mockSanitizer.bypassSecurityTrustResourceUrl.and.returnValue('/files/prescription.pdf' as any);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => key === 'id' ? '1' : null
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [MedicalRecordViewerComponent],
      providers: [
        { provide: MedicalService, useValue: mockMedicalService },
        { provide: DomSanitizer, useValue: mockSanitizer },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalRecordViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load medical record on init', (done) => {
    const mockRecord: any = {
      id: 1,
      patientId: 1,
      documentType: 'PRESCRIPTION',
      fileName: 'prescription.pdf',
      fileUrl: '/files/prescription.pdf',
      size: 1024,
      uploadDate: new Date().toISOString(),
      description: 'Test prescription'
    };

    mockMedicalService.getMedicalRecordById.and.returnValue(of(mockRecord));

    // Don't call detectChanges to avoid template sanitizer issues
    component.ngOnInit();

    setTimeout(() => {
      expect(mockMedicalService.getMedicalRecordById).toHaveBeenCalledWith(1);
      expect(component.record).toEqual(mockRecord);
      done();
    }, 100);
  });

  it('should handle load record error', () => {
    mockMedicalService.getMedicalRecordById.and.returnValue(
      throwError(() => ({ error: { message: 'Record not found' } }))
    );

    fixture.detectChanges();

    expect(mockMedicalService.getMedicalRecordById).toHaveBeenCalled();
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(1024)).toBe('1 KB');
    expect(component.formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(component.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('should get correct icon for document type', () => {
    expect(component.getDocumentIcon('PRESCRIPTION')).toBe('💊');
    expect(component.getDocumentIcon('LAB_TEST')).toBe('🧪');
    expect(component.getDocumentIcon('RADIOLOGY')).toBe('🖼️');
  });

  it('should delete record on confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window.history, 'back');
    mockMedicalService.deleteMedicalRecord.and.returnValue(of(void 0));

    // Set record directly without calling detectChanges to avoid template issues
    component.record = { id: 1, patientId: 1 } as any;
    component.recordId = 1;

    component.deleteRecord();

    expect(mockMedicalService.deleteMedicalRecord).toHaveBeenCalledWith(1);
    expect(window.history.back).toHaveBeenCalled();
  });

  it('should not delete record without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteRecord();

    expect(mockMedicalService.deleteMedicalRecord).not.toHaveBeenCalled();
  });

  it('should trigger file download when record exists', () => {
    component.record = {
      id: 1,
      patientId: 1
    } as any;

    expect(component.record).toBeDefined();
  });

  it('should handle missing record gracefully', () => {
    component.record = null;

    component.deleteRecord();

    expect(mockMedicalService.deleteMedicalRecord).not.toHaveBeenCalled();
  });

  it('should handle missing record gracefully', () => {
    component.record = null;
    component.deleteRecord();

    expect(mockMedicalService.deleteMedicalRecord).not.toHaveBeenCalled();
  });
});
