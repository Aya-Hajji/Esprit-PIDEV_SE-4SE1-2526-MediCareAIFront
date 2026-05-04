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

// ============ MÉTIERS AVANCÉS ============

/**
 * 📊 MedicalTimeline - Chronologie complète et intelligente des événements médicaux
 * Métier avancé pour visualiser et analyser l'évolution chronologique de la santé du patient
 */
export interface MedicalTimeline {
  id?: number;
  patientId: number;
  medicalRecordId: number;
  eventType: 'DIAGNOSIS' | 'PRESCRIPTION' | 'VISIT' | 'LAB_RESULT' | 'IMAGING' | 'PROCEDURE' | 'ALLERGY_ALERT' | 'HOSPITALIZATION';
  eventTitle: string;
  eventDescription?: string;
  eventDate: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  relatedEntities?: {
    diseaseIds?: number[];
    doctorId?: number;
    symptomIds?: number[];
    prescriptionIds?: number[];
    labResultIds?: number[];
    imageIds?: number[];
  };
  clinicalImpact?: string; // résumé de l'impact clinique
  relatedDiagnosis?: string;
  linkedEvents?: number[]; // IDs des événements liés
  trend?: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  confidence?: number; // Score de confiance en %
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ⚠️ MedicalRiskAssessment - Évaluation des risques de santé
 * Métier avancé pour l'analyse prédictive et la détection des risques sanitaires
 */
export interface MedicalRiskAssessment {
  id?: number;
  patientId: number;
  medicalRecordId: number;
  assessmentDate: string;
  overallRiskScore: number; // 0-100 basé sur l'IA
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskCategories: {
    cardiacRisk?: number;
    diabetesRisk?: number;
    strokeRisk?: number;
    cancerRisk?: number;
    renalRisk?: number;
    respiratoryRisk?: number;
    mentalHealthRisk?: number;
    infectionRisk?: number;
  };
  chronicDiseaseComplications?: string[];
  allergyRisks?: string[];
  medicationInteractionRisks?: {
    prescriptionId: number;
    conflictingPrescriptionIds: number[];
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    description: string;
  }[];
  laboratoryAnomalies?: {
    testName: string;
    result: string;
    abnormalityType: 'LOW' | 'HIGH' | 'CRITICAL';
    clinicalSignificance: string;
  }[];
  recommendedActions?: string[];
  recommendedInterventions?: string[];
  nextAssessmentDate?: string;
  assessedByAI?: boolean;
  assessedByDoctor?: boolean;
  doctorNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 📋 MedicalConsentForm - Gestion des consentements et autorisations médicales
 * Métier avancé pour la conformité légale (RGPD, consentements éclairés)
 */
export interface MedicalConsentForm {
  id?: number;
  medicalRecordId: number;
  patientId: number;
  doctorId?: number;
  consentType: 'TREATMENT' | 'SURGERY' | 'IMAGING' | 'MEDICATION' | 'RESEARCH' | 'DATA_SHARING' | 'PHOTOGRAPHY' | 'GENETIC_TESTING';
  title: string;
  description?: string;
  consentText: string;
  documentUrl?: string;
  status: 'PENDING' | 'SIGNED' | 'REVOKED' | 'EXPIRED';
  isExplicitConsent: boolean;
  isInformedConsent?: boolean; // Consentement éclairé
  requiresSignature: boolean;
  signaturePath?: string;
  signatureDate?: string;
  signedByPatient: boolean;
  signedByGuardian?: boolean;
  guardianName?: string;
  guardianRelationship?: string;
  validFrom?: string;
  validUntil?: string;
  scope?: {
    treatmentTypes?: string[];
    duration?: string;
    procedures?: string[];
    conditions?: string[];
  };
  revokedAt?: string;
  revocationReason?: string;
  legalReviewedBy?: string;
  legalReviewDate?: string;
  complianceStatus?: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW_NEEDED';
  attachments?: {
    filename: string;
    url: string;
    uploadedAt: string;
  }[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 🗂️ MedicalDocumentArchive - Archivage et gestion des documents médicaux
 * Métier avancé pour le stockage, la classification et la récupération des documents
 */
export interface MedicalDocumentArchive {
  id?: number;
  medicalRecordId: number;
  patientId: number;
  documentType: 'PRESCRIPTION' | 'IMAGING' | 'LAB_RESULT' | 'VISIT_REPORT' | 'SURGICAL_REPORT' | 'DISCHARGE_SUMMARY' | 'REFERRAL' | 'TEST_RESULT' | 'VACCINE_RECORD' | 'OTHER';
  category?: string; // Classification personnalisée
  title: string;
  description?: string;
  documentUrl: string;
  fileName: string;
  fileSize?: number; // En bytes
  fileMimeType?: string; // PDF, JPEG, etc.
  uploadedBy?: number; // doctorId ou adminId
  uploadedAt: string;
  documentDate: string; // Date du document
  expirationDate?: string; // Pour documents temporaires
  isEncrypted: boolean;
  encryptionAlgorithm?: string;
  accessLevel: 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL';
  tags?: string[]; // Pour recherche: #cardio, #urgent, #follow-up
  keywords?: string[];
  relatedVisitId?: number;
  relatedPrescriptionIds?: number[];
  relatedLabResultIds?: number[];
  relatedImagingIds?: number[];
  isArchived: boolean;
  archiveLocation?: string; // Cloud storage path
  backupLocation?: string; // Backup path
  retentionPolicy?: {
    retentionYears: number;
    deleteAfterDate?: string;
    autoDeleteEnabled: boolean;
  };
  accessLog?: {
    accessedBy: number;
    accessTime: string;
    action: 'VIEW' | 'DOWNLOAD' | 'PRINT';
  }[];
  sharedWith?: {
    userId: number;
    userRole: string;
    sharedAt: string;
    expiresAt?: string;
  }[];
  versionHistory?: {
    versionNumber: number;
    uploadedAt: string;
    uploadedBy: number;
    changes?: string;
  }[];
  complianceChecked: boolean;
  complianceCheckDate?: string;
  complianceNotes?: string;
  qualityScore?: number; // 0-100 pour qualité du scan/image
  ocrAvailable: boolean;
  ocrText?: string; // Texte extrait par OCR
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
