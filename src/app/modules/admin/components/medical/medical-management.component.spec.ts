import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { MedicalManagementComponent } from './medical-management.component';
import { SpecialtyService } from '../../../../shared/services/specialty.service';
import { MedicalService } from '../../../../shared/services/medical.service';
import { ApiCatalogService } from '../../../../shared/services/api-catalog.service';
import { UserService } from '../../../../shared/services/user.service';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { AuthService } from '../../../../services/auth.service';
import { MedicalRecordDTO } from '../../../../shared/models/medical.model';

describe('MedicalManagementComponent', () => {
  let component: MedicalManagementComponent;
  let fixture: ComponentFixture<MedicalManagementComponent>;

  let specialtyServiceSpy: {
    getAllSpecialties: ReturnType<typeof vi.fn>;
    createSpecialty: ReturnType<typeof vi.fn>;
    updateSpecialty: ReturnType<typeof vi.fn>;
    deleteSpecialty: ReturnType<typeof vi.fn>;
  };
  let medicalServiceSpy: any;
  let apiCatalogServiceSpy: {
    hasPath: ReturnType<typeof vi.fn>;
  };
  let userServiceSpy: {
    getPatients: ReturnType<typeof vi.fn>;
    getDoctors: ReturnType<typeof vi.fn>;
    getAllUsers: ReturnType<typeof vi.fn>;
  };
  let appointmentServiceSpy: {
    getAllAppointments: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: Pick<AuthService, 'getUserRole' | 'currentUserValue'>;

  beforeEach(async () => {
    specialtyServiceSpy = {
      getAllSpecialties: vi.fn(),
      createSpecialty: vi.fn(),
      updateSpecialty: vi.fn(),
      deleteSpecialty: vi.fn()
    };

    medicalServiceSpy = {
      getAllDiseases: vi.fn(),
      createDisease: vi.fn(),
      updateDisease: vi.fn(),
      deleteDisease: vi.fn(),
      getAllSymptoms: vi.fn(),
      createSymptom: vi.fn(),
      updateSymptom: vi.fn(),
      deleteSymptom: vi.fn(),
      getMedicalRecordsByPatient: vi.fn(),
      getMyRecords: vi.fn(),
      createMedicalRecord: vi.fn(),
      updateMedicalRecord: vi.fn(),
      deleteMedicalRecord: vi.fn(),
      getPrescriptionsByMedicalRecord: vi.fn(),
      getMedicalImagesByMedicalRecord: vi.fn(),
      getLabResultsByMedicalRecord: vi.fn(),
      getAllergiesByMedicalRecord: vi.fn(),
      getVisitNotesByMedicalRecord: vi.fn(),
      createPrescription: vi.fn(),
      deletePrescription: vi.fn(),
      createMedicalImage: vi.fn(),
      deleteMedicalImage: vi.fn(),
      createLabResult: vi.fn(),
      deleteLabResult: vi.fn(),
      createAllergy: vi.fn(),
      deleteAllergy: vi.fn(),
      createVisitNote: vi.fn(),
      deleteVisitNote: vi.fn()
    };

    apiCatalogServiceSpy = { hasPath: vi.fn() };
    userServiceSpy = { getPatients: vi.fn(), getDoctors: vi.fn(), getAllUsers: vi.fn() };
    appointmentServiceSpy = { getAllAppointments: vi.fn() };
    routerSpy = { navigate: vi.fn() };

    authServiceMock = {
      getUserRole: () => 'ADMIN',
      currentUserValue: { role: 'ADMIN' } as AuthService['currentUserValue']
    };

    specialtyServiceSpy.getAllSpecialties.mockReturnValue(of([]));

    medicalServiceSpy.getAllDiseases.mockReturnValue(of([]));
    medicalServiceSpy.createDisease.mockReturnValue(of({ id: 1, name: 'D', specialtyId: 1 }));
    medicalServiceSpy.updateDisease.mockReturnValue(of({ id: 1, name: 'D', specialtyId: 1 }));
    medicalServiceSpy.deleteDisease.mockReturnValue(of(void 0));

    medicalServiceSpy.getAllSymptoms.mockReturnValue(of([]));
    medicalServiceSpy.createSymptom.mockReturnValue(of({ id: 1, name: 'S' }));
    medicalServiceSpy.updateSymptom.mockReturnValue(of({ id: 1, name: 'S' }));
    medicalServiceSpy.deleteSymptom.mockReturnValue(of(void 0));

    medicalServiceSpy.getMedicalRecordsByPatient.mockReturnValue(of([]));
    medicalServiceSpy.getMyRecords.mockReturnValue(of([]));
    medicalServiceSpy.createMedicalRecord.mockReturnValue(of({ id: 1, patientId: 1 } as MedicalRecordDTO));
    medicalServiceSpy.updateMedicalRecord.mockReturnValue(of({ id: 1, patientId: 1 } as MedicalRecordDTO));
    medicalServiceSpy.deleteMedicalRecord.mockReturnValue(of(void 0));

    medicalServiceSpy.getPrescriptionsByMedicalRecord.mockReturnValue(of([]));
    medicalServiceSpy.getMedicalImagesByMedicalRecord.mockReturnValue(of([]));
    medicalServiceSpy.getLabResultsByMedicalRecord.mockReturnValue(of([]));
    medicalServiceSpy.getAllergiesByMedicalRecord.mockReturnValue(of([]));
    medicalServiceSpy.getVisitNotesByMedicalRecord.mockReturnValue(of([]));

    medicalServiceSpy.createPrescription.mockReturnValue(of({ id: 1, medicalRecordId: 1 }));
    medicalServiceSpy.deletePrescription.mockReturnValue(of(void 0));
    medicalServiceSpy.createMedicalImage.mockReturnValue(of({ id: 1, medicalRecordId: 1 }));
    medicalServiceSpy.deleteMedicalImage.mockReturnValue(of(void 0));
    medicalServiceSpy.createLabResult.mockReturnValue(of({ id: 1, medicalRecordId: 1 }));
    medicalServiceSpy.deleteLabResult.mockReturnValue(of(void 0));
    medicalServiceSpy.createAllergy.mockReturnValue(of({ id: 1, medicalRecordId: 1, allergen: 'Pollen' }));
    medicalServiceSpy.deleteAllergy.mockReturnValue(of(void 0));
    medicalServiceSpy.createVisitNote.mockReturnValue(of({ id: 1, medicalRecordId: 1, note: 'n' }));
    medicalServiceSpy.deleteVisitNote.mockReturnValue(of(void 0));

    apiCatalogServiceSpy.hasPath.mockReturnValue(of(true));
    userServiceSpy.getPatients.mockReturnValue(
      of([{ id: 1, email: 'patient@demo.com', role: 'PATIENT', firstName: 'Jane', lastName: 'Doe' }])
    );
    userServiceSpy.getDoctors.mockReturnValue(of([]));
    userServiceSpy.getAllUsers.mockReturnValue(of([]));
    appointmentServiceSpy.getAllAppointments.mockReturnValue(of([]));

    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [MedicalManagementComponent],
      providers: [
        { provide: SpecialtyService, useValue: specialtyServiceSpy as unknown as SpecialtyService },
        { provide: MedicalService, useValue: medicalServiceSpy as unknown as MedicalService },
        { provide: ApiCatalogService, useValue: apiCatalogServiceSpy as unknown as ApiCatalogService },
        { provide: UserService, useValue: userServiceSpy as unknown as UserService },
        { provide: AppointmentService, useValue: appointmentServiceSpy as unknown as AppointmentService },
        { provide: Router, useValue: routerSpy as unknown as Router },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate phone and contact name constraints', () => {
    expect(component.isValidPhone('+216 55 123 456')).toBe(true);
    expect(component.isValidPhone('12')).toBe(false);

    expect(component.isValidContactName('Marie Dupont')).toBe(true);
    expect(component.isValidContactName('1')).toBe(false);
  });

  it('should compute medical record statistics correctly', () => {
    component.records = [
      { id: 1, patientId: 1, status: 'ACTIVE' },
      { id: 2, patientId: 1, status: 'INACTIVE' },
      { id: 3, patientId: 2, status: 'ARCHIVED' },
      { id: 4, patientId: 2, status: 'ACTIVE' }
    ];

    expect(component.medicalRecordStats).toEqual({
      total: 4,
      active: 2,
      inactive: 1,
      archived: 1
    });
  });

  it('should return false in canCreateMedicalRecord when form data is invalid', () => {
    component.selectedPatientId = 1;
    component.newRecordBloodType = 'X1';
    component.newRecordEmergencyContactName = 'John Doe';
    component.newRecordEmergencyContactPhone = '+216 55 123 456';

    expect(component.canCreateMedicalRecord()).toBe(false);
  });

  it('should not create medical record when canCreateMedicalRecord is false', () => {
    component.selectedPatientId = 1;
    component.newRecordBloodType = 'INVALID';

    component.createMedicalRecord();

    expect(medicalServiceSpy.createMedicalRecord).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Please provide valid medical record information before creating.');
  });

  it('should prevent saveSpecialty when name is too short', () => {
    component.newSpecialtyName = 'ab';
    component.newSpecialtyDescription = 'desc';

    component.saveSpecialty();

    expect(specialtyServiceSpy.createSpecialty).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Specialty name is required (minimum 3 characters).');
  });

  it('should reset local test data and reload patient records when confirmed', () => {
    localStorage.setItem('localMedicalRecordsFallback', JSON.stringify([{ id: 777 }]));
    component.records = [{ id: 1, patientId: 1 }];
    component.selectedRecordId = 1;
    component.selectedRecord = { id: 1, patientId: 1 };

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const loadRecordsSpy = vi.spyOn(component, 'loadRecordsByPatient').mockImplementation(() => undefined);

    component.resetTestData();

    expect(component.records.length).toBe(0);
    expect(component.selectedRecordId).toBeNull();
    expect(component.selectedRecord).toBeNull();
    expect(loadRecordsSpy).toHaveBeenCalled();
    expect(localStorage.getItem('localMedicalRecordsFallback')).not.toBeNull();
  });
});
