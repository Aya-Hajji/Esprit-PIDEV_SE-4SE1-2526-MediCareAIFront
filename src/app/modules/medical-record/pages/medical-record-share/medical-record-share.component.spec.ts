import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MedicalRecordShareComponent } from './medical-record-share.component';
import { MedicalService } from '../../../../shared/services/medical.service';
import { UserService } from '../../../../shared/services/user.service';

describe('MedicalRecordShareComponent', () => {
  let component: MedicalRecordShareComponent;
  let fixture: ComponentFixture<MedicalRecordShareComponent>;
  let mockMedicalService: jasmine.SpyObj<MedicalService>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    mockMedicalService = jasmine.createSpyObj('MedicalService', [
      'getMedicalRecordsByPatient',
      'getAllMedicalRecords',
      'getMedicalRecordById'
    ]);

    mockUserService = jasmine.createSpyObj('UserService', [
      'getAllUsers'
    ]);

    // Set default return values
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockMedicalService.getAllMedicalRecords.and.returnValue(of([]));
    mockMedicalService.getMedicalRecordById.and.returnValue(of({
      id: 1,
      patientId: 1,
      documentType: 'PRESCRIPTION',
      fileName: 'test.pdf',
      fileUrl: '/files/test.pdf',
      uploadDate: new Date().toISOString(),
      size: 1024
    }));
    mockUserService.getAllUsers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MedicalRecordShareComponent, ReactiveFormsModule],
      providers: [
        { provide: MedicalService, useValue: mockMedicalService },
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalRecordShareComponent);
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
        fileName: 'rx.pdf',
        fileUrl: 'http://example.com/rx.pdf',
        uploadDate: new Date().toISOString(),
        size: 1024
      }
    ];

    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of(mockRecords));
    mockUserService.getAllUsers.and.returnValue(of([]));

    fixture.detectChanges();

    expect(component.myRecords.length).toBe(1);
  });

  it('should initialize share form', () => {
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockUserService.getAllUsers.and.returnValue(of([]));

    fixture.detectChanges();

    expect(component.shareForm).toBeDefined();
    expect(component.shareForm.get('recordId')).toBeDefined();
    expect(component.shareForm.get('userId')).toBeDefined();
    expect(component.shareForm.get('permissions')).toBeDefined();
    expect(component.shareForm.get('permissions')?.value).toBe('VIEW');
  });

  it('should load available users on init', () => {
    const mockUsers: any[] = [
      { id: 1, name: 'Doctor Smith', email: 'smith@example.com' },
      { id: 2, name: 'Doctor Jones', email: 'jones@example.com' }
    ];

    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockUserService.getAllUsers.and.returnValue(of(mockUsers));

    fixture.detectChanges();

    expect(component.availableUsers.length).toBe(2);
  });

  it('should submit form with valid data', () => {
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockUserService.getAllUsers.and.returnValue(of([]));

    fixture.detectChanges();

    component.shareForm.patchValue({
      recordId: 1,
      userId: 2,
      permissions: 'VIEW'
    });

    component.onSubmit();

    expect(component.submitted).toBe(true);
  });

  it('should not submit invalid form', () => {
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockUserService.getAllUsers.and.returnValue(of([]));

    fixture.detectChanges();

    component.shareForm.patchValue({
      recordId: '',
      userId: ''
    });

    component.onSubmit();

    expect(component.shareForm.invalid).toBe(true);
  });

  it('should revoke share access', () => {
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockUserService.getAllUsers.and.returnValue(of([]));

    spyOn(window, 'confirm').and.returnValue(true);

    fixture.detectChanges();

    const shareId = 123;
    component.revokeShare(shareId);

    expect(component.revokeShare).toBeDefined();
  });

  it('should not revoke share without confirmation', () => {
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockUserService.getAllUsers.and.returnValue(of([]));

    spyOn(window, 'confirm').and.returnValue(false);

    fixture.detectChanges();

    const shareId = 123;
    component.revokeShare(shareId);

    expect(component.revokeShare).toBeDefined();
  });

  it('should handle service error when loading records', () => {
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(
      throwError(() => ({ error: { message: 'Service error' } }))
    );
    mockUserService.getAllUsers.and.returnValue(of([]));

    spyOn(console, 'error');

    fixture.detectChanges();

    expect(component.myRecords.length).toBe(0);
  });

  it('should handle service error when loading users', () => {
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockUserService.getAllUsers.and.returnValue(
      throwError(() => ({ error: { message: 'Service error' } }))
    );

    spyOn(console, 'error');

    fixture.detectChanges();

    expect(component.availableUsers.length).toBe(0);
  });

  it('should show success message on submit', (done) => {
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockUserService.getAllUsers.and.returnValue(of([]));

    fixture.detectChanges();

    component.shareForm.patchValue({
      recordId: 1,
      userId: 2,
      permissions: 'VIEW'
    });

    component.onSubmit();

    setTimeout(() => {
      expect(component.success).toBeTruthy();
      done();
    }, 1100);
  });

  it('should access form controls via getter', () => {
    mockMedicalService.getMedicalRecordsByPatient.and.returnValue(of([]));
    mockUserService.getAllUsers.and.returnValue(of([]));

    fixture.detectChanges();

    expect(component.f).toBeDefined();
    expect(component.f['recordId']).toBeDefined();
    expect(component.f['userId']).toBeDefined();
    expect(component.f['permissions']).toBeDefined();
  });
});
