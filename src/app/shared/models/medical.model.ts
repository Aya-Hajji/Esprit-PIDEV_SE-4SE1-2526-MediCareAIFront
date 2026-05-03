export interface Disease {
  id?: number;
  name: string;
  description?: string;
  causes?: string;
  treatment?: string;
  specialtyId: number;
  symptomIds?: number[];
}

export interface Symptom {
  id?: number;
  name: string;
  description?: string;
}

export interface MedicalRecord {
  id?: number;
  patientId: number;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status?: string;
  medicalHistories?: MedicalHistory[];
  allergies?: Allergy[];
  chronicDiseases?: ChronicDisease[];
}

export interface MedicalRecordDTO extends MedicalRecord {}

export interface VisitNoteDTO {
  id?: number;
  medicalRecordId: number;
  doctorId?: number;
  note: string;
  diagnosis?: string;
  treatmentPlan?: string;
  createdAt?: string;
}

export interface PrescriptionDTO {
  id?: number;
  medicalRecordId: number;
  doctorId?: number;
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  status?: string;
  createdAt?: string;
}

export interface MedicalImageDTO {
  id?: number;
  medicalRecordId: number;
  imageType?: string;
  imageUrl?: string;
  description?: string;
  uploadedAt?: string;
}

export interface LabResultDTO {
  id?: number;
  medicalRecordId: number;
  testName?: string;
  result?: string;
  unit?: string;
  referenceRange?: string;
  resultDate?: string;
}

export interface MedicalHistory {
  id?: number;
  condition: string;
  type?: string;
  description?: string;
  occurredAt?: string;
}

export interface Allergy {
  id?: number;
  allergen: string;
  reaction?: string;
  severity?: string;
}

export interface AllergyDTO extends Allergy {
  medicalRecordId: number;
}

export interface ChronicDisease {
  id?: number;
  name: string;
  icdCode?: string;
  diagnosedAt?: string;
  notes?: string;
}
