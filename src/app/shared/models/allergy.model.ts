/**
 * Allergy and Medical History Models
 */

export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
export type AllergyType = 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'SEASONAL' | 'OTHER';

export interface Allergy {
  id?: number;
  userId: number;
  allergen: string; // e.g., "Penicillin", "Peanuts", "Pollen"
  allergyType: AllergyType;
  severity: AllergySeverity;
  reaction: string; // e.g., "Anaphylaxis", "Rash", "Itching"
  dateOccurred: string; // When was it discovered
  notes?: string;
  treatment?: string; // How it's treated (e.g., "EpiPen", "Antihistamine")
  medicalHistory?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AllergyDTO extends Allergy {}

export interface AllergyHistory {
  userId: number;
  allergies: Allergy[];
  criticalAllergies: Allergy[]; // Filter for CRITICAL severity
  medicationAllergies: Allergy[]; // Filter by type
}

export interface MedicalHistory {
  id?: number;
  userId: number;
  condition: string;
  diagnosisDate?: string;
  resolution?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Symptom {
  id?: number;
  userId: number;
  name: string;
  severity: number; // 1-10 scale
  duration?: string; // e.g., "2 days", "1 week"
  onset?: string; // When it started
  notes?: string;
  timestamp: string;
  createdAt?: string;
}

export interface SymptomCheckerRequest {
  symptoms: string[];
  duration?: string;
  severity?: number;
  medicalHistory?: string[];
}

export interface SymptomCheckerResult {
  matchingConditions: Array<{
    conditionName: string;
    confidence: number; // 0-100
    description: string;
    recommendations: string[];
    whenToSeekHelp: string;
  }>;
  warning?: string;
  disclamer: string;
}

export interface VaccineRecord {
  id?: number;
  userId: number;
  vaccineName: string;
  administeredDate: string;
  administrator?: string;
  administeredLocation?: string;
  batchNumber?: string;
  sideEffects?: string;
  nextDoseDueDate?: string;
  status?: 'COMPLETED' | 'PENDING';
  createdAt?: string;
}

export interface MedicationHistory {
  id?: number;
  userId: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  reason: string; // Why it was prescribed
  prescribedBy?: string;
  sideEffects?: string;
  status?: 'ACTIVE' | 'DISCONTINUED';
  createdAt?: string;
}

export interface Disease {
  id?: number;
  name: string;
  description?: string;
  symptoms?: string[];
  treatmentOptions?: string[];
  prevention?: string[];
  commonlyAffected?: string; // demographics
  severity?: 'MILD' | 'MODERATE' | 'SEVERE';
}

export interface LabTest {
  id?: number;
  userId: number;
  testName: string;
  testDate: string;
  resultDate?: string;
  result?: string;
  normalRange?: string;
  unit?: string;
  doctorNotes?: string;
  status?: 'PENDING' | 'COMPLETED' | 'ABNORMAL';
  createdAt?: string;
}

export interface LabTestDTO extends LabTest {}

export interface Vital {
  id?: number;
  userId: number;
  bloodPressure?: string; // e.g., "120/80"
  heartRate?: number; // bpm
  temperature?: number; // Celsius
  respiratoryRate?: number; // breaths per minute
  oxygenSaturation?: number; // SpO2 percentage
  weight?: number; // kg
  height?: number; // cm
  timestamp: string;
  createdAt?: string;
}

export interface VitalHistory {
  userId: number;
  vitals: Vital[];
  dateRange?: string;
  averages?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
  };
}
