import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-medical-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-management.component.html',
  styleUrls: ['./medical-management.component.css']
})
export class MedicalManagementComponent implements OnInit {
  specialties: Specialty[] = [];
  diseases: Disease[] = [];
  activeTab: 'specialties' | 'diseases' | 'symptoms' | 'records' = 'specialties';
  loading = false;

  patients: User[] = [];
  selectedPatientId: number | null = null;

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

  newMedicalHistoryCondition = '';
  newTreatmentText = '';
  teleconsultationAppointmentId: number | null = null;

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private specialtyService: SpecialtyService,
    private medicalService: MedicalService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSpecialties();
    this.loadDiseases();
    this.loadPatients();
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
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.patients = users.filter((u) => u.role === 'PATIENT' && !!u.id);
      },
      error: () => this.setError('Failed to load patients list.')
    });
  }

  loadSpecialties(): void {
    this.specialtyService.getAllSpecialties().subscribe({
      next: (data) => this.specialties = data,
      error: (error) => console.error('Error loading specialties:', error)
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
        next: () => this.loadSpecialties(),
        error: (error) => console.error('Error:', error)
      });
    }
  }

  deleteDisease(id: number): void {
    if (confirm('Delete this disease?')) {
      this.medicalService.deleteDisease(id).subscribe({
        next: () => this.loadDiseases(),
        error: (error) => console.error('Error:', error)
      });
    }
  }

  loadRecordsByPatient(): void {
    if (!this.selectedPatientId) {
      this.setError('Select a patient first.');
      return;
    }

    this.medicalService.getMedicalRecordsByPatient(this.selectedPatientId).subscribe({
      next: (records) => {
        this.records = records;
        this.selectedRecordId = null;
        this.selectedRecord = null;
        this.resetRecordChildren();
        this.setSuccess('Patient records loaded successfully.');
      },
      error: () => this.setError('Unable to load medical records for selected patient.')
    });
  }

  createMedicalRecord(): void {
    if (!this.selectedPatientId) {
      this.setError('Select a patient before creating a record.');
      return;
    }

    const payload: MedicalRecordDTO = {
      patientId: this.selectedPatientId,
      bloodType: this.newRecordBloodType || undefined,
      emergencyContactName: this.newRecordEmergencyContactName || undefined,
      emergencyContactPhone: this.newRecordEmergencyContactPhone || undefined,
      status: 'ACTIVE'
    };

    this.medicalService.createMedicalRecord(payload).subscribe({
      next: () => {
        this.newRecordBloodType = '';
        this.newRecordEmergencyContactName = '';
        this.newRecordEmergencyContactPhone = '';
        this.loadRecordsByPatient();
      },
      error: () => this.setError('Failed to create medical record.')
    });
  }

  deleteMedicalRecord(id: number): void {
    if (!confirm('Delete this medical record?')) {
      return;
    }

    this.medicalService.deleteMedicalRecord(id).subscribe({
      next: () => this.loadRecordsByPatient(),
      error: () => this.setError('Failed to delete medical record.')
    });
  }

  selectRecord(record: MedicalRecordDTO): void {
    this.selectedRecordId = record.id || null;
    this.selectedRecord = record;
    this.loadRecordChildren();
  }

  private loadRecordChildren(): void {
    if (!this.selectedRecordId) {
      return;
    }

    const id = this.selectedRecordId;
    this.medicalService.getPrescriptionsByMedicalRecord(id).subscribe({ next: (data) => (this.prescriptions = data), error: () => (this.prescriptions = []) });
    this.medicalService.getMedicalImagesByMedicalRecord(id).subscribe({ next: (data) => (this.medicalImages = data), error: () => (this.medicalImages = []) });
    this.medicalService.getLabResultsByMedicalRecord(id).subscribe({ next: (data) => (this.labResults = data), error: () => (this.labResults = []) });
    this.medicalService.getAllergiesByMedicalRecord(id).subscribe({ next: (data) => (this.allergies = data), error: () => (this.allergies = []) });
    this.medicalService.getVisitNotesByMedicalRecord(id).subscribe({ next: (data) => (this.visitNotes = data), error: () => (this.visitNotes = []) });
  }

  private resetRecordChildren(): void {
    this.prescriptions = [];
    this.medicalImages = [];
    this.labResults = [];
    this.allergies = [];
    this.visitNotes = [];
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
        this.selectedRecord = record;
        this.newMedicalHistoryCondition = '';
        this.setSuccess('Medical history item added.');
      },
      error: () => this.setError('Failed to add medical history item.')
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
        this.selectedRecord = record;
        this.newTreatmentText = '';
        this.setSuccess('Treatment item added.');
      },
      error: () => this.setError('Failed to add treatment item.')
    });
  }

  createPrescription(): void {
    if (!this.selectedRecordId || !this.newPrescriptionMedication.trim()) {
      this.setError('Select a record and fill prescription medication.');
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

  createMedicalImage(): void {
    if (!this.selectedRecordId || !this.newImageUrl.trim()) {
      this.setError('Select a record and provide image URL.');
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

  createLabResult(): void {
    if (!this.selectedRecordId || !this.newLabName.trim()) {
      this.setError('Select a record and provide test name.');
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

  createAllergy(): void {
    if (!this.selectedRecordId || !this.newAllergen.trim()) {
      this.setError('Select a record and provide allergen.');
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
        this.loadRecordChildren();
      },
      error: () => this.setError('Failed to create visit note.')
    });
  }

  openTeleconsultationSession(): void {
    if (!this.teleconsultationAppointmentId) {
      this.setError('Enter an appointment ID to open teleconsultation session.');
      return;
    }

    this.router.navigate(['/appointments/session', this.teleconsultationAppointmentId]);
  }
}
