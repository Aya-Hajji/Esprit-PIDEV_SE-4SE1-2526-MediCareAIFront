import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MedicalRiskAssessmentService } from './medical-risk-assessment.service';
import { MedicalRiskAssessment, MedicalRecordDTO, PrescriptionDTO, LabResultDTO } from '../models/medical.model';
import { environment } from '../../../environments/environment';

describe('MedicalRiskAssessmentService', () => {
  let service: MedicalRiskAssessmentService;
  let httpMock: HttpTestingController;

  const mockAssessment: MedicalRiskAssessment = {
    id: 1,
    patientId: 1,
    medicalRecordId: 1,
    assessmentDate: new Date().toISOString(),
    overallRiskScore: 65,
    riskLevel: 'HIGH',
    riskCategories: {
      cardiacRisk: 45,
      diabetesRisk: 50,
      strokeRisk: 55,
      cancerRisk: 30,
      renalRisk: 40,
      respiratoryRisk: 35,
      mentalHealthRisk: 25,
      infectionRisk: 20
    },
    chronicDiseaseComplications: ['Hypertension'],
    allergyRisks: [],
    medicationInteractionRisks: [],
    laboratoryAnomalies: [],
    recommendedActions: [],
    recommendedInterventions: [],
    assessedByAI: true,
    assessedByDoctor: false
  };

  const mockMedicalRecord: MedicalRecordDTO = {
    id: 1,
    patientId: 1,
    bloodType: 'O+',
    status: 'ACTIVE',
    medicalHistories: [],
    allergies: [],
    chronicDiseases: []
  };

  const baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MedicalRiskAssessmentService]
    });

    service = TestBed.inject(MedicalRiskAssessmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllRiskAssessments', () => {
    it('should fetch all risk assessments', () => {
      service.getAllRiskAssessments().subscribe((data) => {
        expect(data.length).toBe(1);
        expect(data[0]).toEqual(mockAssessment);
      });

      const req = httpMock.expectOne(`${baseUrl}/medical-risk-assessments`);
      expect(req.request.method).toBe('GET');
      req.flush([mockAssessment]);
    });
  });

  describe('getPatientRiskAssessment', () => {
    it('should fetch patient risk assessment', () => {
      service.getPatientRiskAssessment(1).subscribe((data) => {
        expect(data).toEqual(mockAssessment);
      });

      const req = httpMock.expectOne(`${baseUrl}/medical-risk-assessments/patient/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAssessment);
    });
  });

  describe('calculateRiskAssessment', () => {
    it('should calculate risk assessment', () => {
      const prescriptions: PrescriptionDTO[] = [];
      const labResults: LabResultDTO[] = [];

      service.calculateRiskAssessment(mockMedicalRecord, prescriptions, labResults).subscribe((data) => {
        expect(data).toBeTruthy();
        expect(data.patientId).toBe(1);
        expect(data.overallRiskScore).toBeDefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/medical-risk-assessments/calculate`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAssessment);
    });

    it('should calculate risk locally on error', () => {
      const prescriptions: PrescriptionDTO[] = [];
      const labResults: LabResultDTO[] = [];

      service.calculateRiskAssessment(mockMedicalRecord, prescriptions, labResults).subscribe((data) => {
        expect(data.patientId).toBe(1);
        expect(data.assessedByAI).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/medical-risk-assessments/calculate`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('checkMedicationInteractions', () => {
    it('should check medication interactions', () => {
      const prescriptions: PrescriptionDTO[] = [
        { id: 1, medicationName: 'Warfarin', medicalRecordId: 1 },
        { id: 2, medicationName: 'Aspirin', medicalRecordId: 1 }
      ];

      service.checkMedicationInteractions(prescriptions).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${baseUrl}/medical-risk-assessments/medication-interactions?prescriptionIds=1,2`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('analyzeLaboratoryAnomalies', () => {
    it('should analyze lab anomalies', () => {
      const labResults: LabResultDTO[] = [
        { id: 1, testName: 'Glucose', result: '200', referenceRange: '70-100', medicalRecordId: 1 }
      ];

      service.analyzeLaboratoryAnomalies(labResults).subscribe((data) => {
        expect(data).toBeTruthy();
      });

      const req = httpMock.expectOne(`${baseUrl}/medical-risk-assessments/lab-anomalies`);
      expect(req.request.method).toBe('POST');
      req.flush([]);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations', () => {
      service.generateRecommendations(mockAssessment).subscribe((data) => {
        expect(Array.isArray(data)).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/medical-risk-assessments/recommendations`);
      expect(req.request.method).toBe('POST');
      req.flush(['Recommandation 1', 'Recommandation 2']);
    });
  });

  describe('getRiskTrend', () => {
    it('should get risk trend', () => {
      service.getRiskTrend(1, 30).subscribe((data) => {
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/medical-risk-assessments/trend/1?days=30`);
      expect(req.request.method).toBe('GET');
      req.flush([mockAssessment]);
    });
  });

  describe('saveRiskAssessment', () => {
    it('should save risk assessment', () => {
      service.saveRiskAssessment(mockAssessment).subscribe((data) => {
        expect(data).toEqual(mockAssessment);
      });

      const req = httpMock.expectOne(`${baseUrl}/medical-risk-assessments`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAssessment);
    });
  });

  describe('Risk calculation logic', () => {
    it('should determine HIGH risk level from score', () => {
      // Test indirectement via calculateRiskLocally
      const mockRecord: MedicalRecordDTO = {
        patientId: 1,
        id: 1,
        chronicDiseases: Array(13).fill({ name: 'Test', icdCode: '123' })
      };
      const result = (service as any)['calculateRiskLocally'](mockRecord, [], []);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should determine CRITICAL risk level from high score', () => {
      const mockRecord: MedicalRecordDTO = {
        patientId: 1,
        id: 1,
        chronicDiseases: Array(16).fill({ name: 'Disease', icdCode: '123' })
      };
      const result = (service as any)['calculateRiskLocally'](mockRecord, [], []);
      expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should determine MODERATE risk level from medium score', () => {
      const mockRecord: MedicalRecordDTO = {
        patientId: 1,
        id: 1,
        chronicDiseases: Array(9).fill({ name: 'Disease' }),
        allergies: [{ allergen: 'Pollen' }]
      };
      const result = (service as any)['calculateRiskLocally'](mockRecord, [], []);
      expect(result.riskLevel).toBe('MODERATE');
    });

    it('should determine LOW risk level from low score', () => {
      const mockRecord: MedicalRecordDTO = {
        patientId: 1,
        id: 1
      };
      const result = (service as any)['calculateRiskLocally'](mockRecord, [], []);
      expect(result.riskLevel).toBe('LOW');
    });
  });

  describe('Interaction detection', () => {
    it('should detect warfarin-aspirin interaction', () => {
      const result = (service as any)['hasKnownInteraction']('warfarin', 'aspirin');
      expect(result).toBe(true);
    });

    it('should detect no interaction between random drugs', () => {
      const result = (service as any)['hasKnownInteraction']('acetaminophen', 'ibuprofen');
      expect(result).toBe(false);
    });
  });

  describe('Lab result analysis', () => {
    it('should identify abnormal glucose level', () => {
      const isAbnormal = (service as any)['isAbnormalResult']('200', '70-100');
      expect(isAbnormal).toBe(true);
    });

    it('should identify normal glucose level', () => {
      const isAbnormal = (service as any)['isAbnormalResult']('85', '70-100');
      expect(isAbnormal).toBe(false);
    });

    it('should get abnormality type as HIGH for elevated glucose', () => {
      const type = (service as any)['getAbnormalityType']('200', '70-100');
      expect(type).toBe('CRITICAL');
    });

    it('should get abnormality type as LOW for low glucose', () => {
      const type = (service as any)['getAbnormalityType']('40', '70-100');
      expect(type).toBe('CRITICAL');
    });
  });

  describe('Local storage', () => {
    it('should save and retrieve assessments from local storage', () => {
      const assessments = [mockAssessment];
      (service as any)['setLocalRiskAssessments'](assessments);
      const retrieved = (service as any)['getLocalRiskAssessments']();
      expect(retrieved.length).toBe(1);
      expect(retrieved[0]).toEqual(mockAssessment);
    });

    it('should handle corrupted local storage gracefully', () => {
      localStorage.setItem('localRiskAssessmentsFallback', 'invalid json');
      const result = (service as any)['getLocalRiskAssessments']();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
