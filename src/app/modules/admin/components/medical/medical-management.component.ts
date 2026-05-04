import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { SpecialtyService } from '../../../../shared/services/specialty.service';
import { MedicalService } from '../../../../shared/services/medical.service';
import { Specialty } from '../../../../shared/models/specialty.model';
import {
  AllergyDTO,
  Disease,
  LabResultDTO,
  MedicalImageDTO,
  MedicalRecordDTO,
  PrescriptionDTO,
  Symptom,
  VisitNoteDTO
} from '../../../../shared/models/medical.model';
import { User } from '../../../../shared/models/user.model';
import { UserService } from '../../../../shared/services/user.service';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { AppointmentDTO } from '../../../../shared/models/appointment.model';
import { buildUserDisplayMap, displayNameForUserId, getUserDisplayName } from '../../../../shared/utils/user-display';
import { ApiCatalogService } from '../../../../shared/services/api-catalog.service';
import { MedicalChatbotComponent } from './medical-chatbot.component';
import { MedicalRiskAssessmentComponent } from './medical-risk-assessment.component';

@Component({
  selector: 'app-medical-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MedicalChatbotComponent, MedicalRiskAssessmentComponent],
  templateUrl: './medical-management.component.html',
  styleUrls: ['./medical-management.component.css']
})
export class MedicalManagementComponent implements OnInit {
  specialties: Specialty[] = [];
  diseases: Disease[] = [];
  symptoms: Symptom[] = [];
  activeTab: 'specialties' | 'diseases' | 'symptoms' | 'records' = 'records';

  openReferencesTab(): void {
    if (this.specialtiesAvailable) {
      this.activeTab = 'specialties';
      return;
    }
    if (this.diseasesAvailable) {
      this.activeTab = 'diseases';
      return;
    }
    this.activeTab = 'symptoms';
  }
  loading = false;
  /** True while fetching the patient’s record list. */
  recordsLoading = false;
  /** True while loading prescriptions, labs, images, allergies, visit notes for the open record. */
  recordChildrenLoading = false;
  private recordChildrenRequestSeq = 0;

  specialtiesAvailable = true;
  diseasesAvailable = true;
  symptomsAvailable = true;

  newSpecialtyName = '';
  newSpecialtyDescription = '';
  /** Comma-separated synonyms for doctor routing / recommendations (optional). */
  newSpecialtyMatchTags = '';
  editingSpecialtyId: number | null = null;

  newDiseaseName = '';
  newDiseaseDescription = '';
  newDiseaseSpecialtyId: number | null = null;
  editingDiseaseId: number | null = null;

  newSymptomName = '';
  newSymptomDescription = '';
  editingSymptomId: number | null = null;

  patients: User[] = [];
  selectedPatientId: number | null = null;
  /** True after a successful "Load records" for the current patient (enables workflow checklist). */
  lastRecordsFetchSuccess = false;

  records: MedicalRecordDTO[] = [];
  selectedRecordId: number | null = null;
  selectedRecord: MedicalRecordDTO | null = null;

  prescriptions: PrescriptionDTO[] = [];
  medicalImages: MedicalImageDTO[] = [];
  labResults: LabResultDTO[] = [];
  allergies: AllergyDTO[] = [];
  visitNotes: VisitNoteDTO[] = [];

  newRecordBloodType = '';
  newRecordEmergencyContactName = '';
  newRecordEmergencyContactPhone = '';

  editRecordBloodType = '';
  editRecordEmergencyContactName = '';
  editRecordEmergencyContactPhone = '';
  editRecordStatus = 'ACTIVE';

  newPrescriptionMedication = '';
  newPrescriptionDosage = '';
  newPrescriptionFrequency = '';
  newPrescriptionDuration = '';
  newPrescriptionInstructions = '';

  newImageType = '';
  newImageUrl = '';
  newImageDescription = '';

  newLabName = '';
  newLabResult = '';
  newLabUnit = '';
  newLabReferenceRange = '';

  newAllergen = '';
  newAllergyReaction = '';
  newAllergySeverity = '';

  newVisitNote = '';
  newVisitDiagnosis = '';
  newVisitTreatmentPlan = '';

  visitNoteSearchPatientKeyword = '';
  visitNoteSearchDoctorKeyword = '';
  visitNoteSearchClinicalKeyword = '';
  visitNoteSearchActive = false;

  newMedicalHistoryCondition = '';
  newTreatmentText = '';
  teleconsultationAppointmentId: number | null = null;
  /** Picker labels for teleconsultation (no raw ids shown). */
  teleconsultAppointmentOptions: { id: number; label: string }[] = [];

  /** Sticky workflow: which section is highlighted in the encounter navigator. */
  activeClinicalStep = 'demographics';

  /** Ordered steps matching a typical ambulatory EHR (safety → narrative → orders → Rx → coordination). */
  readonly clinicalWorkflowSteps: ReadonlyArray<{ id: string; short: string; label: string; hint: string }> = [
    { id: 'demographics', short: '1', label: 'Demographics', hint: 'Identity, contacts, dossier status' },
    { id: 'allergies', short: '2', label: 'Allergies', hint: 'Before any prescribing' },
    { id: 'history', short: '3', label: 'History', hint: 'Problems & treatments timeline' },
    { id: 'encounter', short: '4', label: 'Visit note', hint: 'SOAP-style encounter documentation' },
    { id: 'labs', short: '5', label: 'Laboratory', hint: 'Results & interpretation aids' },
    { id: 'imaging', short: '6', label: 'Imaging', hint: 'Studies linked to the dossier' },
    { id: 'prescriptions', short: '7', label: 'Prescriptions', hint: 'After allergy review' },
    { id: 'telehealth', short: '8', label: 'Telehealth', hint: 'Video / phone session room' },
    { id: 'decision', short: '9', label: 'Decision support', hint: 'Risk, referrals, assistant' }
  ];

  /** Physicians from the user directory filtered by catalog specialty (registered profile only). */
  directorySpecialtyId: number | null = null;
  directoryPhysicians: User[] = [];
  directoryLoading = false;

  successMessage: string | null = null;
  errorMessage: string | null = null;
  currentUserRole = '';
  medicalRecordCreateBlocked = false;

  constructor(
    private specialtyService: SpecialtyService,
    private medicalService: MedicalService,
    private apiCatalog: ApiCatalogService,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const roleFromToken = this.readRoleFromJwt();
    const roleFromAuthService = typeof this.authService.getUserRole === 'function'
      ? this.authService.getUserRole()
      : this.authService.currentUserValue?.role;
    this.currentUserRole = this.normalizeRole(roleFromToken || roleFromAuthService);
    this.medicalRecordCreateBlocked = false;
    this.initMedicalTaxonomyAvailability();
    this.loadPatients();
    this.loadTeleconsultationPickerOptions();
    this.initializeTestDataIfNeeded();
  }

  get selectedPatientDisplayName(): string {
    if (this.selectedPatientId == null) {
      return '';
    }
    const p = this.patients.find((u) => u.id === this.selectedPatientId);
    return p ? getUserDisplayName(p) : '';
  }

  /** UI checklist for the intake rail (non-blocking). */
  get journeyPatientSelected(): boolean {
    return this.selectedPatientId != null;
  }

  get journeyRecordsFetched(): boolean {
    return this.lastRecordsFetchSuccess && this.selectedPatientId != null;
  }

  get journeyDossierActive(): boolean {
    return this.selectedRecordId != null;
  }

  onPatientSelectionChange(): void {
    this.lastRecordsFetchSuccess = false;
  }

  private loadTeleconsultationPickerOptions(): void {
    forkJoin({
      appts: this.appointmentService.getAllAppointments().pipe(catchError(() => of([] as AppointmentDTO[]))),
      users: this.userService.getAllUsers().pipe(catchError(() => of([] as User[])))
    }).subscribe(({ appts, users }) => {
      const m = buildUserDisplayMap(users);
      const list = (appts || []).filter((a) => a.id != null && a.id > 0);
      list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      this.teleconsultAppointmentOptions = list.map((a) => ({
        id: a.id!,
        label: `${new Date(a.startTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })} · ${displayNameForUserId(m, a.doctorId)} · ${displayNameForUserId(m, a.patientId)}`
      }));
    });
  }

  private initializeTestDataIfNeeded(): void {
    try {
      const stored = localStorage.getItem('localMedicalRecordsFallback');
      if (stored && JSON.parse(stored).length > 0) {
        return;
      }
    } catch {
      // Ignore parse errors
    }

    const testRecords = this.generateTestMedicalRecords();
    if (testRecords.length > 0) {
      localStorage.setItem('localMedicalRecordsFallback', JSON.stringify(testRecords));
    }
  }

  private generateTestMedicalRecords(): MedicalRecordDTO[] {
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const statuses: Array<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'> = ['ACTIVE', 'ACTIVE', 'INACTIVE', 'ACTIVE'];
    const contactNames = ['John Smith', 'Marie Dupont', 'Ahmed Hassan', 'Elena Garcia', 'Lisa Chen'];

    const records: MedicalRecordDTO[] = [];

    for (let i = 1; i <= 5; i++) {
      records.push({
        id: i,
        patientId: (i % 4) + 1,
        bloodType: bloodTypes[i % bloodTypes.length],
        emergencyContactName: contactNames[i % contactNames.length],
        emergencyContactPhone: `+216 ${Math.floor(Math.random() * 90) + 10} ${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
        status: statuses[i % statuses.length],
        medicalHistories: [
          {
            id: i,
            type: 'HISTORY',
            condition: `Medical history entry ${i}`,
            occurredAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      });
    }

    return records;
  }

  canWriteMedicalRecords(): boolean {
    return true;
  }

  private ensureWritePermission(actionLabel: string): boolean {
    void actionLabel;
    return true;
  }

  private initMedicalTaxonomyAvailability(): void {
    this.specialtiesAvailable = true;
    this.loadSpecialties();

    this.diseasesAvailable = true;
    this.loadDiseases();

    this.symptomsAvailable = true;
    this.loadSymptoms();
  }

  private setSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
  }

  private setError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
  }

  loadPatients(): void {
    this.userService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;

      },
      error: () => this.setError('Failed to load patients list.')
    });
  }

  loadSpecialties(): void {
    this.specialtyService.getAllSpecialties().subscribe({
      next: (data) => {
        this.specialties = data;
        this.specialtiesAvailable = true;
      },
      error: () => {
        this.specialties = [];
        this.specialtiesAvailable = true;
        this.setError('Specialties data could not be loaded. Using empty fallback list.');
      }
    });
  }

  loadDiseases(): void {
    this.medicalService.getAllDiseases().subscribe({
      next: (data) => this.diseases = data,
      error: (error) => console.error('Error loading diseases:', error)
    });
  }

  deleteSpecialty(id: number): void {
    if (confirm('Delete this specialty?')) {
      this.specialtyService.deleteSpecialty(id).subscribe({
        next: () => {
          this.setSuccess('Specialty deleted.');
          this.specialties = this.specialties.filter((specialty) => specialty.id !== id);
          this.loadSpecialties();
        },
        error: () => this.setError('Failed to delete specialty.')
      });
    }
  }

  startEditSpecialty(specialty: Specialty): void {
    this.editingSpecialtyId = specialty.id || null;
    this.newSpecialtyName = specialty.name;
    this.newSpecialtyDescription = specialty.description || '';
    this.newSpecialtyMatchTags = specialty.matchTags || '';
  }

  cancelEditSpecialty(): void {
    this.editingSpecialtyId = null;
    this.newSpecialtyName = '';
    this.newSpecialtyDescription = '';
    this.newSpecialtyMatchTags = '';
  }

  saveSpecialty(): void {
    const name = this.newSpecialtyName.trim();
    if (!name || name.length < 3) {
      this.setError('Specialty name is required (minimum 3 characters).');
      return;
    }

    if (name.length > 100) {
      this.setError('Specialty name must not exceed 100 characters.');
      return;
    }

    const desc = this.newSpecialtyDescription.trim();
    if (desc.length > 500) {
      this.setError('Specialty description must not exceed 500 characters.');
      return;
    }

    const tags = this.newSpecialtyMatchTags.trim();
    if (tags.length > 400) {
      this.setError('Match tags must not exceed 400 characters.');
      return;
    }

    const payload: Specialty = {
      name: name,
      description: desc || undefined,
      matchTags: tags || undefined
    };

    if (this.editingSpecialtyId) {
      this.specialtyService.updateSpecialty(this.editingSpecialtyId, payload).subscribe({
        next: (updatedSpecialty) => {
          this.setSuccess('Specialty updated.');
          this.specialties = this.specialties.map((specialty) =>
            specialty.id === this.editingSpecialtyId ? { ...specialty, ...updatedSpecialty } : specialty
          );
          this.cancelEditSpecialty();
          this.loadSpecialties();
        },
        error: () => this.setError('Failed to update specialty.')
      });
      return;
    }

    this.specialtyService.createSpecialty(payload).subscribe({
      next: (createdSpecialty) => {
        this.setSuccess('Specialty created.');
        this.specialties = [...this.specialties, createdSpecialty];
        this.cancelEditSpecialty();
        this.loadSpecialties();
      },
      error: () => this.setError('Failed to create specialty.')
    });
  }

  deleteDisease(id: number): void {
    if (confirm('Delete this disease?')) {
      this.medicalService.deleteDisease(id).subscribe({
        next: () => {
          this.setSuccess('Disease deleted.');
          this.diseases = this.diseases.filter((disease) => disease.id !== id);
          this.loadDiseases();
        },
        error: () => this.setError('Failed to delete disease.')
      });
    }
  }

  startEditDisease(disease: Disease): void {
    this.editingDiseaseId = disease.id || null;
    this.newDiseaseName = disease.name;
    this.newDiseaseDescription = disease.description || '';
    this.newDiseaseSpecialtyId = disease.specialtyId;
  }

  cancelEditDisease(): void {
    this.editingDiseaseId = null;
    this.newDiseaseName = '';
    this.newDiseaseDescription = '';
    this.newDiseaseSpecialtyId = null;
  }

  saveDisease(): void {
    if (!this.newDiseaseName.trim() || !this.newDiseaseSpecialtyId) {
      this.setError('Disease name and specialty are required.');
      return;
    }

    const payload: Disease = {
      name: this.newDiseaseName.trim(),
      description: this.newDiseaseDescription.trim() || undefined,
      specialtyId: this.newDiseaseSpecialtyId
    };

    if (this.editingDiseaseId) {
      this.medicalService.updateDisease(this.editingDiseaseId, payload).subscribe({
        next: (updatedDisease) => {
          this.setSuccess('Disease updated.');
          this.diseases = this.diseases.map((disease) =>
            disease.id === this.editingDiseaseId ? { ...disease, ...updatedDisease } : disease
          );
          this.cancelEditDisease();
          this.loadDiseases();
        },
        error: () => this.setError('Failed to update disease.')
      });
      return;
    }

    this.medicalService.createDisease(payload).subscribe({
      next: (createdDisease) => {
        this.setSuccess('Disease created.');
        this.diseases = [...this.diseases, createdDisease];
        this.cancelEditDisease();
        this.loadDiseases();
      },
      error: () => this.setError('Failed to create disease.')
    });
  }

  loadSymptoms(): void {
    this.medicalService.getAllSymptoms().subscribe({
      next: (data) => (this.symptoms = data),
      error: () => this.setError('Failed to load symptoms.')
    });
  }

  startEditSymptom(symptom: Symptom): void {
    this.editingSymptomId = symptom.id || null;
    this.newSymptomName = symptom.name;
    this.newSymptomDescription = symptom.description || '';
  }

  cancelEditSymptom(): void {
    this.editingSymptomId = null;
    this.newSymptomName = '';
    this.newSymptomDescription = '';
  }

  saveSymptom(): void {
    const name = this.newSymptomName.trim();
    if (!name || name.length < 3) {
      this.setError('Symptom name is required (minimum 3 characters).');
      return;
    }

    if (name.length > 100) {
      this.setError('Symptom name must not exceed 100 characters.');
      return;
    }

    const desc = this.newSymptomDescription.trim();
    if (desc.length > 500) {
      this.setError('Symptom description must not exceed 500 characters.');
      return;
    }

    const payload: Symptom = {
      name: this.newSymptomName.trim(),
      description: this.newSymptomDescription.trim() || undefined
    };

    if (this.editingSymptomId) {
      this.medicalService.updateSymptom(this.editingSymptomId, payload).subscribe({
        next: (updatedSymptom) => {
          this.setSuccess('Symptom updated.');
          this.symptoms = this.symptoms.map((symptom) =>
            symptom.id === this.editingSymptomId ? { ...symptom, ...updatedSymptom } : symptom
          );
          this.cancelEditSymptom();
          this.loadSymptoms();
        },
        error: () => this.setError('Failed to update symptom.')
      });
      return;
    }

    this.medicalService.createSymptom(payload).subscribe({
      next: (createdSymptom) => {
        this.setSuccess('Symptom created.');
        this.symptoms = [...this.symptoms, createdSymptom];
        this.cancelEditSymptom();
        this.loadSymptoms();
      },
      error: () => this.setError('Failed to create symptom.')
    });
  }

  deleteSymptom(id: number): void {
    if (!confirm('Delete this symptom?')) {
      return;
    }

    this.medicalService.deleteSymptom(id).subscribe({
      next: () => {
        this.setSuccess('Symptom deleted.');
        this.symptoms = this.symptoms.filter((symptom) => symptom.id !== id);
        this.loadSymptoms();
      },
      error: () => this.setError('Failed to delete symptom.')
    });
  }

  loadRecordsByPatient(successMessage?: string): void {
    if (!this.selectedPatientId) {
      this.setError('Select a patient first.');
      return;
    }

    const defaultMsg = 'Patient records loaded successfully.';
    this.recordsLoading = true;
    this.medicalService.getMedicalRecordsByPatient(this.selectedPatientId).subscribe({
        next: (records) => {
          this.recordsLoading = false;
          this.lastRecordsFetchSuccess = true;
          this.applyLoadedRecords(records, successMessage ?? defaultMsg);
        },
      error: (error: HttpErrorResponse) => {
        if (error.status === 403 && this.currentUserRole === 'DOCTOR') {
          this.medicalService
            .getMyRecords()
            .pipe(finalize(() => (this.recordsLoading = false)))
            .subscribe({
              next: (records) => {
                this.lastRecordsFetchSuccess = true;
                this.applyLoadedRecords(
                  records,
                  'Loaded your own medical records. Backend denied patient-specific access for DOCTOR role.'
                );
              },
              error: (fallbackError: HttpErrorResponse) => {
                this.setError(this.extractApiErrorMessage(fallbackError, 'Unable to load medical records.'));
              }
            });
          return;
        }

        this.recordsLoading = false;
        this.setError(this.extractApiErrorMessage(error, 'Unable to load medical records for selected patient.'));
      }
    });
  }

  createMedicalRecord(): void {
    if (!this.ensureWritePermission('Create Medical Record')) {
      return;
    }

    if (!this.canCreateMedicalRecord()) {
      this.setError('Please provide valid medical record information before creating.');
      return;
    }

    const patientId = Number(this.selectedPatientId);
    if (!Number.isInteger(patientId) || patientId <= 0) {
      this.setError('Select a patient before creating a record.');
      return;
    }

    const normalizedBloodType = this.normalizeBloodType(this.newRecordBloodType);
    const emergencyContactName = this.newRecordEmergencyContactName.trim();
    const emergencyContactPhone = this.newRecordEmergencyContactPhone.trim();

    if (emergencyContactPhone && !this.isValidPhone(emergencyContactPhone)) {
      this.setError('Emergency contact phone format is invalid.');
      return;
    }

    if (emergencyContactName && !this.isValidContactName(emergencyContactName)) {
      this.setError('Emergency contact name is invalid. Use 2-100 letters only.');
      return;
    }

    if (normalizedBloodType && !this.isValidBloodType(normalizedBloodType)) {
      this.setError('Blood type is invalid. Use A+, A-, B+, B-, AB+, AB-, O+, or O-.');
      return;
    }

    const payload: MedicalRecordDTO = {
      patientId,
      bloodType: normalizedBloodType || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      status: 'ACTIVE'
    };

    this.medicalService.createMedicalRecord(payload).subscribe({
      next: () => {
        this.medicalRecordCreateBlocked = false;
        this.newRecordBloodType = '';
        this.newRecordEmergencyContactName = '';
        this.newRecordEmergencyContactPhone = '';
        this.loadRecordsByPatient('Medical record created.');
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 403) {
          this.medicalRecordCreateBlocked = true;
        }
        this.setError(this.extractApiErrorMessage(error, 'Failed to create medical record.'));
      }
    });
  }

  private applyLoadedRecords(records: MedicalRecordDTO[], successMessage: string): void {
    this.records = records;
    this.selectedRecordId = null;
    this.selectedRecord = null;
    this.resetRecordChildren();
    this.setSuccess(successMessage);
  }

  deleteMedicalRecord(id: number): void {
    if (!confirm('Delete this medical record?')) {
      return;
    }

    const wasSelected = this.selectedRecordId === id;
    const patientId = this.selectedPatientId;

    this.medicalService.deleteMedicalRecord(id).subscribe({
      next: () => {
        if (!patientId) {
          this.records = this.records.filter((r) => r.id !== id);
          if (wasSelected) {
            this.clearRecordWorkspace();
          }
          this.setSuccess('Medical record deleted.');
          return;
        }

        this.medicalService.getMedicalRecordsByPatient(patientId).subscribe({
          next: (records) => {
            this.records = records;
            if (wasSelected) {
              this.clearRecordWorkspace();
            } else if (this.selectedRecordId != null && records.some((r) => r.id === this.selectedRecordId)) {
              const still = records.find((r) => r.id === this.selectedRecordId)!;
              this.selectedRecord = still;
              this.syncRecordEditForm(still);
              this.loadRecordChildren();
            }
            this.setSuccess('Medical record deleted.');
          },
          error: (err: HttpErrorResponse) =>
            this.setError(this.extractApiErrorMessage(err, 'Record was deleted but the list could not be refreshed.'))
        });
      },
      error: (err: HttpErrorResponse) =>
        this.setError(this.extractApiErrorMessage(err, 'Failed to delete medical record.'))
    });
  }

  selectRecord(record: MedicalRecordDTO): void {
    this.selectedRecordId = record.id || null;
    this.selectedRecord = record;
    this.syncRecordEditForm(record);
    this.visitNoteSearchActive = false;
    this.activeClinicalStep = 'demographics';
    this.loadRecordChildren();
  }

  scrollToClinicalSection(stepId: string): void {
    this.activeClinicalStep = stepId;
    queueMicrotask(() => {
      document.getElementById(`clinical-${stepId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /** Reference data: show specialty name on disease rows. */
  getSpecialtyLabelForDisease(specialtyId: number | null | undefined): string {
    if (specialtyId == null) {
      return '—';
    }
    return this.specialties.find((s) => s.id === specialtyId)?.name ?? '—';
  }

  saveRecordDetails(): void {
    if (!this.ensureWritePermission('Update Medical Record')) {
      return;
    }

    if (!this.canUpdateMedicalRecord()) {
      this.setError('Please fix invalid record details before updating.');
      return;
    }

    if (!this.selectedRecordId) {
      this.setError('Select a record first.');
      return;
    }

    const normalizedBloodType = this.normalizeBloodType(this.editRecordBloodType);
    const emergencyContactName = this.editRecordEmergencyContactName.trim();
    const emergencyContactPhone = this.editRecordEmergencyContactPhone.trim();

    if (emergencyContactPhone && !this.isValidPhone(emergencyContactPhone)) {
      this.setError('Emergency contact phone format is invalid.');
      return;
    }

    if (emergencyContactName && !this.isValidContactName(emergencyContactName)) {
      this.setError('Emergency contact name is invalid. Use 2-100 letters only.');
      return;
    }

    if (normalizedBloodType && !this.isValidBloodType(normalizedBloodType)) {
      this.setError('Blood type is invalid. Use A+, A-, B+, B-, AB+, AB-, O+, or O-.');
      return;
    }

    const payload: Partial<MedicalRecordDTO> = {
      bloodType: normalizedBloodType || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      status: this.editRecordStatus || undefined
    };

    this.medicalService.updateMedicalRecord(this.selectedRecordId, payload).subscribe({
      next: (record) => {
        this.selectedRecord = record;
        this.syncRecordEditForm(record);
        this.records = this.records.map((item) => (item.id === record.id ? record : item));
        this.setSuccess('Medical record updated.');
      },
      error: (error: HttpErrorResponse) => this.setError(this.extractApiErrorMessage(error, 'Failed to update medical record.'))
    });
  }

  private loadRecordChildren(): void {
    if (!this.selectedRecordId) {
      return;
    }

    const id = this.selectedRecordId;
    const seq = ++this.recordChildrenRequestSeq;
    this.recordChildrenLoading = true;

    forkJoin({
      prescriptions: this.medicalService.getPrescriptionsByMedicalRecord(id).pipe(catchError(() => of([]))),
      medicalImages: this.medicalService.getMedicalImagesByMedicalRecord(id).pipe(catchError(() => of([]))),
      labResults: this.medicalService.getLabResultsByMedicalRecord(id).pipe(catchError(() => of([]))),
      allergies: this.medicalService.getAllergiesByMedicalRecord(id).pipe(catchError(() => of([]))),
      visitNotes: this.medicalService.getVisitNotesByMedicalRecord(id).pipe(catchError(() => of([])))
    })
      .pipe(
        finalize(() => {
          if (seq === this.recordChildrenRequestSeq) {
            this.recordChildrenLoading = false;
          }
        })
      )
      .subscribe({
        next: (data) => {
          if (seq !== this.recordChildrenRequestSeq || this.selectedRecordId !== id) {
            return;
          }
          this.prescriptions = data.prescriptions;
          this.medicalImages = data.medicalImages;
          this.labResults = data.labResults;
          this.allergies = data.allergies;
          this.visitNotes = data.visitNotes;
        }
      });
  }

  /** Clears the open record workspace (selection + clinical children). */
  private clearRecordWorkspace(): void {
    this.selectedRecordId = null;
    this.selectedRecord = null;
    this.resetRecordChildren();
  }

  /** Keeps the records list in sync when the server returns an updated primary record. */
  private patchRecordInLists(updated: MedicalRecordDTO): void {
    if (!updated.id) {
      return;
    }
    this.records = this.records.map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
    if (this.selectedRecordId === updated.id) {
      this.selectedRecord = updated;
    }
  }

  private resetRecordChildren(): void {
    this.prescriptions = [];
    this.medicalImages = [];
    this.labResults = [];
    this.allergies = [];
    this.visitNotes = [];
  }

  private syncRecordEditForm(record: MedicalRecordDTO): void {
    this.editRecordBloodType = record.bloodType || '';
    this.editRecordEmergencyContactName = record.emergencyContactName || '';
    this.editRecordEmergencyContactPhone = record.emergencyContactPhone || '';
    this.editRecordStatus = record.status || 'ACTIVE';
  }

  addMedicalHistory(): void {
    if (!this.selectedRecord?.id || !this.newMedicalHistoryCondition.trim()) {
      this.setError('Select a record and provide medical history text.');
      return;
    }

    const current = this.selectedRecord.medicalHistories || [];
    const updated = [
      ...current,
      {
        condition: this.newMedicalHistoryCondition.trim(),
        type: 'HISTORY',
        occurredAt: new Date().toISOString()
      }
    ];

    this.medicalService.updateMedicalRecord(this.selectedRecord.id, { medicalHistories: updated }).subscribe({
      next: (record) => {
        this.patchRecordInLists(record);
        this.newMedicalHistoryCondition = '';
        this.setSuccess('Medical history item added.');
      },
      error: (err: HttpErrorResponse) =>
        this.setError(this.extractApiErrorMessage(err, 'Failed to add medical history item.'))
    });
  }

  addTreatment(): void {
    if (!this.selectedRecord?.id || !this.newTreatmentText.trim()) {
      this.setError('Select a record and provide treatment text.');
      return;
    }

    const current = this.selectedRecord.medicalHistories || [];
    const updated = [
      ...current,
      {
        condition: this.newTreatmentText.trim(),
        type: 'TREATMENT',
        occurredAt: new Date().toISOString()
      }
    ];

    this.medicalService.updateMedicalRecord(this.selectedRecord.id, { medicalHistories: updated }).subscribe({
      next: (record) => {
        this.patchRecordInLists(record);
        this.newTreatmentText = '';
        this.setSuccess('Treatment item added.');
      },
      error: (err: HttpErrorResponse) =>
        this.setError(this.extractApiErrorMessage(err, 'Failed to add treatment item.'))
    });
  }

  createPrescription(): void {
    if (
      !this.selectedRecordId ||
      !this.newPrescriptionMedication.trim() ||
      !this.newPrescriptionDosage.trim() ||
      !this.newPrescriptionFrequency.trim()
    ) {
      this.setError('Medication, dosage, and frequency are required.');
      return;
    }

    const payload: PrescriptionDTO = {
      medicalRecordId: this.selectedRecordId,
      medicationName: this.newPrescriptionMedication,
      dosage: this.newPrescriptionDosage,
      frequency: this.newPrescriptionFrequency,
      duration: this.newPrescriptionDuration,
      instructions: this.newPrescriptionInstructions,
      status: 'ACTIVE'
    };

    this.medicalService.createPrescription(payload).subscribe({
      next: () => {
        this.newPrescriptionMedication = '';
        this.newPrescriptionDosage = '';
        this.newPrescriptionFrequency = '';
        this.newPrescriptionDuration = '';
        this.newPrescriptionInstructions = '';
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to create prescription.')
    });
  }

  deletePrescription(id: number): void {
    if (!confirm('Delete this prescription?')) {
      return;
    }

    this.medicalService.deletePrescription(id).subscribe({
      next: () => {
        this.setSuccess('Prescription deleted.');
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to delete prescription.')
    });
  }

  createMedicalImage(): void {
    if (!this.selectedRecordId || !this.newImageUrl.trim()) {
      this.setError('Select a record and provide image URL.');
      return;
    }

    if (!this.isValidUrl(this.newImageUrl.trim())) {
      this.setError('Image URL must be a valid http(s) URL.');
      return;
    }

    const payload: MedicalImageDTO = {
      medicalRecordId: this.selectedRecordId,
      imageType: this.newImageType,
      imageUrl: this.newImageUrl,
      description: this.newImageDescription
    };

    this.medicalService.createMedicalImage(payload).subscribe({
      next: () => {
        this.newImageType = '';
        this.newImageUrl = '';
        this.newImageDescription = '';
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to create medical image.')
    });
  }

  deleteMedicalImage(id: number): void {
    if (!confirm('Delete this medical image?')) {
      return;
    }

    this.medicalService.deleteMedicalImage(id).subscribe({
      next: () => {
        this.setSuccess('Medical image deleted.');
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to delete medical image.')
    });
  }

  createLabResult(): void {
    if (!this.selectedRecordId || !this.newLabName.trim() || !this.newLabResult.trim()) {
      this.setError('Test name and result are required.');
      return;
    }

    const payload: LabResultDTO = {
      medicalRecordId: this.selectedRecordId,
      testName: this.newLabName,
      result: this.newLabResult,
      unit: this.newLabUnit,
      referenceRange: this.newLabReferenceRange,
      resultDate: new Date().toISOString()
    };

    this.medicalService.createLabResult(payload).subscribe({
      next: () => {
        this.newLabName = '';
        this.newLabResult = '';
        this.newLabUnit = '';
        this.newLabReferenceRange = '';
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to create lab result.')
    });
  }

  deleteLabResult(id: number): void {
    if (!confirm('Delete this lab result?')) {
      return;
    }

    this.medicalService.deleteLabResult(id).subscribe({
      next: () => {
        this.setSuccess('Lab result deleted.');
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to delete lab result.')
    });
  }

  createAllergy(): void {
    if (!this.selectedRecordId || !this.newAllergen.trim() || !this.newAllergySeverity.trim()) {
      this.setError('Allergen and severity are required.');
      return;
    }

    const payload: AllergyDTO = {
      medicalRecordId: this.selectedRecordId,
      allergen: this.newAllergen,
      reaction: this.newAllergyReaction,
      severity: this.newAllergySeverity
    };

    this.medicalService.createAllergy(payload).subscribe({
      next: () => {
        this.newAllergen = '';
        this.newAllergyReaction = '';
        this.newAllergySeverity = '';
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to create allergy item.')
    });
  }

  deleteAllergy(id: number): void {
    if (!confirm('Delete this allergy?')) {
      return;
    }

    this.medicalService.deleteAllergy(id).subscribe({
      next: () => {
        this.setSuccess('Allergy deleted.');
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to delete allergy.')
    });
  }

  createVisitNote(): void {
    if (!this.selectedRecordId || !this.newVisitNote.trim()) {
      this.setError('Select a record and provide visit note text.');
      return;
    }

    const payload: VisitNoteDTO = {
      medicalRecordId: this.selectedRecordId,
      note: this.newVisitNote,
      diagnosis: this.newVisitDiagnosis,
      treatmentPlan: this.newVisitTreatmentPlan,
      createdAt: new Date().toISOString()
    };

    this.medicalService.createVisitNote(payload).subscribe({
      next: () => {
        this.newVisitNote = '';
        this.newVisitDiagnosis = '';
        this.newVisitTreatmentPlan = '';
        this.visitNoteSearchActive = false;
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to create visit note.')
    });
  }

  searchVisitNotes(): void {
    const hasFilter =
      !!this.visitNoteSearchPatientKeyword.trim()
      || !!this.visitNoteSearchDoctorKeyword.trim()
      || !!this.visitNoteSearchClinicalKeyword.trim();

    if (!hasFilter) {
      this.setError('Provide at least one visit note search filter.');
      return;
    }

    this.medicalService.searchVisitNotes({
      patientKeyword: this.visitNoteSearchPatientKeyword.trim() || undefined,
      doctorKeyword: this.visitNoteSearchDoctorKeyword.trim() || undefined,
      clinicalKeyword: this.visitNoteSearchClinicalKeyword.trim() || undefined
    }).subscribe({
      next: (rows) => {
        this.visitNotes = rows;
        this.visitNoteSearchActive = true;
        this.setSuccess(`Visit notes search completed (${rows.length} results).`);
      },
      error: (error: HttpErrorResponse) => {
        this.setError(this.extractApiErrorMessage(error, 'Failed to search visit notes.'));
      }
    });
  }

  clearVisitNotesSearch(): void {
    this.visitNoteSearchPatientKeyword = '';
    this.visitNoteSearchDoctorKeyword = '';
    this.visitNoteSearchClinicalKeyword = '';
    this.visitNoteSearchActive = false;

    if (this.selectedRecordId) {
      this.loadRecordChildren();
    } else {
      this.visitNotes = [];
    }
  }

  deleteVisitNote(id: number): void {
    if (!confirm('Delete this visit note?')) {
      return;
    }

    this.medicalService.deleteVisitNote(id).subscribe({
      next: () => {
        this.setSuccess('Visit note deleted.');
        this.visitNoteSearchActive = false;
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to delete visit note.')
    });
  }

  openTeleconsultationSession(): void {
    if (!this.teleconsultationAppointmentId) {
      this.setError('Enter an appointment ID to open teleconsultation session.');
      return;
    }

    this.router.navigate(['/appointments/session', this.teleconsultationAppointmentId]);
  }

  explainLabResult(result: LabResultDTO): string {
    const testName = (result.testName || 'This test').trim();
    const testValue = [result.result, result.unit].filter(Boolean).join(' ').trim() || 'not provided';
    const range = (result.referenceRange || '').trim();

    if (!range) {
      return `${testName} result is ${testValue}. Ask your doctor if follow-up is needed.`;
    }

    return `${testName} result is ${testValue}. Typical reference range is ${range}. Your doctor can confirm whether this is normal for your condition.`;
  }

  explainMedicalImage(image: MedicalImageDTO): string {
    const type = (image.imageType || 'Medical image').trim();
    return `${type} is stored in your record for doctor review and future comparison.`;
  }

  isValidPhone(value: string): boolean {
    const normalized = value.trim();
    if (!normalized) {
      return false;
    }

    // Accept common formats like +216 55 123 456, (216) 55-123-456, 55123456.
    if (!/^\+?[\d\s().-]+$/.test(normalized)) {
      return false;
    }

    const digitsOnly = normalized.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }

  isValidBloodType(value: string): boolean {
    const normalized = this.normalizeBloodType(value);
    if (!normalized) {
      return true;
    }

    return /^(A|B|AB|O)[+-]$/.test(normalized);
  }

  isValidContactName(value: string): boolean {
    const normalized = value.trim();
    if (!normalized) {
      return true;
    }

    if (normalized.length < 2 || normalized.length > 100) {
      return false;
    }

    return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(normalized);
  }

  canCreateMedicalRecord(): boolean {
    if (!this.selectedPatientId || this.medicalRecordCreateBlocked || !this.canWriteMedicalRecords()) {
      return false;
    }

    return this.isValidBloodType(this.newRecordBloodType)
      && this.isValidContactName(this.newRecordEmergencyContactName)
      && (!this.newRecordEmergencyContactPhone || this.isValidPhone(this.newRecordEmergencyContactPhone));
  }

  canUpdateMedicalRecord(): boolean {
    if (!this.selectedRecordId || !this.canWriteMedicalRecords()) {
      return false;
    }

    return this.isValidBloodType(this.editRecordBloodType)
      && this.isValidContactName(this.editRecordEmergencyContactName)
      && (!this.editRecordEmergencyContactPhone || this.isValidPhone(this.editRecordEmergencyContactPhone));
  }

  private normalizeBloodType(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, '');
  }

  get medicalRecordStats(): { total: number; active: number; inactive: number; archived: number } {
    return {
      total: this.records.length,
      active: this.records.filter(r => r.status === 'ACTIVE').length,
      inactive: this.records.filter(r => r.status === 'INACTIVE').length,
      archived: this.records.filter(r => r.status === 'ARCHIVED').length
    };
  }

  resetTestData(): void {
    if (confirm('Reset to generate new medical test data?')) {
      localStorage.removeItem('localMedicalRecordsFallback');
      this.records = [];
      this.selectedRecordId = null;
      this.selectedRecord = null;
      this.initializeTestDataIfNeeded();
      this.loadRecordsByPatient();
    }
  }

  private isValidUrl(value: string): boolean {
    try {
      const url = new URL(value.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private extractApiErrorMessage(error: HttpErrorResponse, fallback: string): string {
    if (error?.status === 403) {
      const role = this.currentUserRole || 'CURRENT_USER';
      if (role === 'DOCTOR') {
        return 'Access denied by backend for DOCTOR on this Medical Records action. You can still view your own records; creating records may require backend permission update.';
      }

      if (role === 'ADMIN') {
        return 'Access denied by backend for ADMIN on POST /medical-records. Frontend cannot bypass this; backend security must allow ADMIN for create.';
      }

      return `Access denied by backend for role ${role} on Medical Records. If you selected a different role in login UI, sign out and sign in again; backend permissions always follow token role.`;
    }

    const source = error?.error;

    if (typeof source === 'string' && source.trim()) {
      return source;
    }

    if (source && typeof source === 'object') {
      const payload = source as Record<string, unknown>;
      const message = payload['message'] || payload['error'] || payload['detail'];
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }

  private normalizeRole(role: unknown): string {
    return (role || '').toString().toUpperCase().replace('ROLE_', '').trim();
  }

  private readRoleFromJwt(): string {
    const token = localStorage.getItem('authToken') || '';
    if (!token || !token.includes('.')) {
      return '';
    }

    try {
      const payloadPart = token.split('.')[1] || '';
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = atob(padded);
      const payload = JSON.parse(decoded) as Record<string, unknown>;
      const role = payload['role'] || payload['roles'] || payload['authority'] || payload['authorities'];

      if (Array.isArray(role)) {
        return this.normalizeRole(role[0]);
      }

      return this.normalizeRole(role);
    } catch {
      return '';
    }
  }

  // ============= Referrals — physician directory (catalog specialty only) =============

  loadPhysicianDirectory(): void {
    if (this.directorySpecialtyId == null || this.directorySpecialtyId <= 0) {
      this.setError('Choose a specialty from the catalog.');
      this.directoryPhysicians = [];
      return;
    }

    this.directoryLoading = true;
    this.directoryPhysicians = [];
    const sid = this.directorySpecialtyId;

    this.userService
      .getDoctors()
      .pipe(
        catchError(() => of([] as User[])),
        finalize(() => {
          this.directoryLoading = false;
        })
      )
      .subscribe({
        next: (doctors) => {
          const list = (doctors || []).filter(
            (u) => this.normalizeRole(u.role) === 'DOCTOR' && u.specialtyId === sid
          );
          list.sort((a, b) => getUserDisplayName(a).localeCompare(getUserDisplayName(b)));
          this.directoryPhysicians = list;
          if (list.length === 0) {
            this.setError('No physicians in the directory with this registered specialty. Assign specialty on doctor profiles in User management.');
          } else {
            this.setSuccess(`Listed ${list.length} physician(s) for this specialty.`);
          }
        },
        error: () => {
          this.setError('Could not load physicians from the server.');
          this.directoryPhysicians = [];
        }
      });
  }

  clearPhysicianDirectory(): void {
    this.directoryPhysicians = [];
    this.directorySpecialtyId = null;
  }

  specialtyLabelForUser(user: User): string {
    const id = user.specialtyId;
    if (id == null) {
      return '—';
    }
    return this.specialties.find((s) => s.id === id)?.name ?? `#${id}`;
  }

  /**
   * Copy directory email to the clipboard (contact only).
   * Reminder mail delivery is configured on the server (`spring.mail.*`), not verified from the UI.
   */
  copyPhysicianEmail(user: User): void {
    const name = getUserDisplayName(user);
    const email = user.email?.trim();
    if (!email) {
      this.setError(`${name} has no email on file.`);
      return;
    }
    const done = () => this.setSuccess(`Copied ${email} — open Appointments to schedule; reminders use Gmail SMTP in Spring.`);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(email).then(done).catch(() => this.setSuccess(`Email: ${email}`));
    } else {
      done();
    }
  }
}
