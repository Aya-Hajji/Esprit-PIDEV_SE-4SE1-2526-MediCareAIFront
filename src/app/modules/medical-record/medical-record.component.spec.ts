import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { MedicalService } from '../../shared/services/medical.service';

describe('MedicalRecordModule', () => {
  let mockMedicalService: jasmine.SpyObj<MedicalService>;

  beforeEach(async () => {
    mockMedicalService = jasmine.createSpyObj('MedicalService', [
      'getMedicalRecordsByPatient',
      'getAllMedicalRecords'
    ]);

    await TestBed.configureTestingModule({
      providers: [
        { provide: MedicalService, useValue: mockMedicalService }
      ]
    }).compileComponents();
  });

  it('should provide MedicalService', () => {
    const service = TestBed.inject(MedicalService);
    expect(service).toBeDefined();
  });

  it('should have medical records methods', () => {
    expect(mockMedicalService.getMedicalRecordsByPatient).toBeDefined();
    expect(mockMedicalService.getAllMedicalRecords).toBeDefined();
  });

  it('should retrieve patient medical records', () => {
    const mockRecords: any[] = [
      { id: 1, patientId: 1, documentType: 'PRESCRIPTION', fileName: 'rx.pdf', uploadDate: new Date().toISOString(), size: 100 },
      { id: 2, patientId: 1, documentType: 'LAB_TEST', fileName: 'lab.pdf', uploadDate: new Date().toISOString(), size: 200 }
    ];

    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of(mockRecords));
    mockMedicalService.getMedicalRecordsByPatient(1).subscribe((records: any) => {
      expect(records.length).toBe(2);
    });
  });

  it('should retrieve all medical records', () => {
    const mockRecords: any[] = [
      { id: 1, patientId: 1, documentType: 'PRESCRIPTION', fileName: 'rx.pdf', uploadDate: new Date().toISOString(), size: 100 }
    ];

    mockMedicalService.getAllMedicalRecords.and.returnValue(of(mockRecords));
    mockMedicalService.getAllMedicalRecords().subscribe((records: any) => {
      expect(records.length).toBe(1);
    });
  });
});
