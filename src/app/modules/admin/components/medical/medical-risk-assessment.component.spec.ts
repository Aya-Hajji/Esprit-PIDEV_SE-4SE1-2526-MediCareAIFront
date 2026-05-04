import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicalRiskAssessmentComponent } from './medical-risk-assessment.component';
import { MedicalRiskAssessmentService } from '../../../../shared/services/medical-risk-assessment.service';
import { MedicalService } from '../../../../shared/services/medical.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MedicalRiskAssessment, MedicalRecordDTO } from '../../../../shared/models/medical.model';
import { vi } from 'vitest';

describe('MedicalRiskAssessmentComponent', () => {
  let component: MedicalRiskAssessmentComponent;
  let fixture: ComponentFixture<MedicalRiskAssessmentComponent>;
  let riskService: any;
  let medicalService: any;

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
    chronicDiseaseComplications: ['Hypertension', 'Type 2 diabetes'],
    allergyRisks: ['Penicillin', 'Peanuts'],
    medicationInteractionRisks: [],
    laboratoryAnomalies: [],
    recommendedActions: ['Seek care promptly', 'Increase monitoring'],
    recommendedInterventions: [],
    assessedByAI: true,
    assessedByDoctor: false
  };

  beforeEach(async () => {
    const riskServiceSpy = {
      getPatientRiskAssessment: vi.fn().mockReturnValue(of(null)),
      calculateRiskAssessment: vi.fn().mockReturnValue(of(mockAssessment)),
      generateRecommendations: vi.fn().mockReturnValue(of([])),
      getRiskTrend: vi.fn().mockReturnValue(of([]))
    };

    const medicalServiceSpy = {
      getMedicalRecordByPatientId: vi.fn().mockReturnValue(of(null))
    };

    await TestBed.configureTestingModule({
      imports: [MedicalRiskAssessmentComponent, HttpClientTestingModule],
      providers: [
        { provide: MedicalRiskAssessmentService, useValue: riskServiceSpy },
        { provide: MedicalService, useValue: medicalServiceSpy }
      ]
    }).compileComponents();

    riskService = TestBed.inject(MedicalRiskAssessmentService) as any;
    medicalService = TestBed.inject(MedicalService) as any;

    fixture = TestBed.createComponent(MedicalRiskAssessmentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load patient risk assessment on init', () => {
    component.patientId = 1;
    riskService.getPatientRiskAssessment.mockReturnValue(of(mockAssessment));
    riskService.generateRecommendations.mockReturnValue(of(['Recommendation 1', 'Recommendation 2']));
    riskService.getRiskTrend.mockReturnValue(of([mockAssessment]));

    component.ngOnInit();

    expect(riskService.getPatientRiskAssessment).toHaveBeenCalledWith(1);
  });

  it('should display HIGH risk correctly', () => {
    component.assessment = mockAssessment;
    fixture.detectChanges();

    expect(component.getRiskColor('HIGH')).toBe('#fd7e14');
    expect(component.getRiskIcon('HIGH')).toBe('🟠');
  });

  it('should get correct risk level from score', () => {
    expect(component.getRiskColor('CRITICAL')).toBe('#dc3545');
    expect(component.getRiskColor('HIGH')).toBe('#fd7e14');
    expect(component.getRiskColor('MODERATE')).toBe('#ffc107');
    expect(component.getRiskColor('LOW')).toBe('#28a745');
  });

  it('should format date correctly', () => {
    const dateString = '2026-04-28T10:30:00Z';
    const formatted = component.formatDate(dateString);
    expect(formatted).toContain('2026');
  });

  it('should handle tab switching', () => {
    component.selectedTab = 'summary';
    expect(component.selectedTab).toBe('summary');

    component.selectedTab = 'details';
    expect(component.selectedTab).toBe('details');
  });

  it('should return empty medication interactions when none exist', () => {
    component.medicationInteractions = [];
    const highSeverity = component.getHighSeverityInteractions();
    expect(highSeverity.length).toBe(0);
  });

  it('should return empty critical anomalies when none exist', () => {
    component.laboratoryScanResults = [];
    const critical = component.getCriticalAnomalies();
    expect(critical.length).toBe(0);
  });

  it('should refresh assessment', () => {
    const mockRecord: MedicalRecordDTO = {
      id: 1,
      patientId: 1,
      bloodType: 'O+',
      status: 'ACTIVE',
      medicalHistories: [],
      allergies: [],
      chronicDiseases: []
    };

    component.patientId = 1;
    component.medicalRecord = mockRecord;
    riskService.calculateRiskAssessment.mockReturnValue(of(mockAssessment));
    riskService.generateRecommendations.mockReturnValue(of([]));
    riskService.getRiskTrend.mockReturnValue(of([]));

    component.refreshAssessment();

    expect(riskService.calculateRiskAssessment).toHaveBeenCalled();
  });

  it('should get AI status as validated', () => {
    component.assessment = mockAssessment;
    expect(component.getAIStatus()).toBe('Assessed by AI');
  });

  it('should get doctor status as pending', () => {
    component.assessment = mockAssessment;
    expect(component.getDoctorStatus()).toBe('Clinician validation required');
  });

  it('should update assessment when new data arrives', () => {
    const newAssessment: MedicalRiskAssessment = { ...mockAssessment, overallRiskScore: 75 };
    component.assessment = newAssessment;
    expect(component.assessment.overallRiskScore).toBe(75);
  });
});
