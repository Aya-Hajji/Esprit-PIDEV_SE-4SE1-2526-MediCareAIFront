import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { MedicalRecordListComponent } from './medical-record-list.component';
import { MedicalService } from '../../../../shared/services/medical.service';

describe('MedicalRecordListComponent', () => {
  let component: MedicalRecordListComponent;
  let fixture: ComponentFixture<MedicalRecordListComponent>;
  let mockMedicalService: jasmine.SpyObj<MedicalService>;

  beforeEach(async () => {
    mockMedicalService = jasmine.createSpyObj('MedicalService', [
      'getMedicalRecordsByPatient',
      'deleteMedicalRecord'
    ]);

    // Set default return values
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockMedicalService.deleteMedicalRecord.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [MedicalRecordListComponent, FormsModule, RouterTestingModule],
      providers: [
        { provide: MedicalService, useValue: mockMedicalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalRecordListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load medical records on init', () => {
    const mockRecords: any[] = [
      {
        id: 1,
        patientId: 1,
        documentType: 'PRESCRIPTION',
        fileName: 'prescription.pdf',
        fileUrl: 'http://example.com/prescription.pdf',
        uploadDate: new Date().toISOString(),
        size: 1024,
        description: 'Test prescription'
      }
    ];
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of(mockRecords));

    fixture.detectChanges();

    expect(mockMedicalService.getMedicalRecordsByPatient).toHaveBeenCalled();
    expect(component.medicalRecords.length).toBe(1);
  });

  it('should filter records by document type', () => {
    component.medicalRecords = [
      { id: 1, patientId: 1, documentType: 'PRESCRIPTION', fileName: 'rx.pdf', fileUrl: 'http://example.com/rx.pdf', uploadDate: new Date().toISOString(), size: 100 },
      { id: 2, patientId: 1, documentType: 'LAB_TEST', fileName: 'lab.pdf', fileUrl: 'http://example.com/lab.pdf', uploadDate: new Date().toISOString(), size: 200 },
      { id: 3, patientId: 1, documentType: 'PRESCRIPTION', fileName: 'rx2.pdf', fileUrl: 'http://example.com/rx2.pdf', uploadDate: new Date().toISOString(), size: 150 }
    ];

    component.filterType = 'PRESCRIPTION';
    component.filterAndSort();

    expect(component.filteredRecords.length).toBe(2);
  });

  it('should search records by filename', () => {
    component.medicalRecords = [
      { id: 1, patientId: 1, documentType: 'PRESCRIPTION', fileName: 'prescription.pdf', fileUrl: 'http://example.com/prescription.pdf', uploadDate: new Date().toISOString(), size: 100 },
      { id: 2, patientId: 1, documentType: 'LAB_TEST', fileName: 'lab_test.pdf', fileUrl: 'http://example.com/lab_test.pdf', uploadDate: new Date().toISOString(), size: 200 }
    ];

    component.searchQuery = 'prescription';
    component.filterAndSort();

    expect(component.filteredRecords.length).toBe(1);
    expect(component.filteredRecords[0].fileName).toContain('prescription');
  });

  it('should sort records by date', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    component.medicalRecords = [
      { id: 1, documentType: 'PRESCRIPTION', fileName: 'rx1.pdf', uploadDate: yesterday.toISOString(), size: 100, patientId: 1 },
      { id: 2, documentType: 'LAB_TEST', fileName: 'lab.pdf', uploadDate: now.toISOString(), size: 200, patientId: 1 }
    ] as any;

    component.sortBy = 'date';
    component.filterAndSort();

    expect(component.filteredRecords[0].id).toBe(2); // Newest first
  });

  it('should sort records by name', () => {
    component.medicalRecords = [
      { id: 1, documentType: 'PRESCRIPTION', fileName: 'zebra.pdf', uploadDate: '', size: 100, patientId: 1 },
      { id: 2, documentType: 'LAB_TEST', fileName: 'apple.pdf', uploadDate: '', size: 200, patientId: 1 }
    ] as any;

    component.sortBy = 'name';
    component.filterAndSort();

    expect(component.filteredRecords[0].fileName).toBe('apple.pdf');
  });

  it('should delete record on confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockMedicalService.deleteMedicalRecord.and.returnValue(of(void 0));

    component.medicalRecords = [
      { id: 1, documentType: 'PRESCRIPTION', fileName: 'rx.pdf', uploadDate: '', size: 100, patientId: 1 }
    ] as any;

    component.deleteRecord(1);

    expect(mockMedicalService.deleteMedicalRecord).toHaveBeenCalledWith(1);
  });

  it('should not delete record without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteRecord(1);

    expect(mockMedicalService.deleteMedicalRecord).not.toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    mockMedicalService.deleteMedicalRecord.and.returnValue(
      throwError(() => ({ error: { message: 'Delete failed' } }))
    );

    component.deleteRecord(1);

    expect(window.alert).toHaveBeenCalled();
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 Bytes');
    expect(component.formatFileSize(1024)).toBe('1 KB');
    expect(component.formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('should return correct document icon', () => {
    expect(component.getDocumentIcon('PRESCRIPTION')).toBe('💊');
    expect(component.getDocumentIcon('LAB_TEST')).toBe('🧪');
    expect(component.getDocumentIcon('RADIOLOGY')).toBe('🖼️');
    expect(component.getDocumentIcon('DOCTOR_NOTE')).toBe('📝');
  });
});
