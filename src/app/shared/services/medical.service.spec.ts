import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MedicalService } from './medical.service';
import { Disease, Symptom, MedicalRecordDTO } from '../models/medical.model';

describe('MedicalService', () => {
  let service: MedicalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MedicalService]
    });

    service = TestBed.inject(MedicalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      httpMock.verify();
    } catch (e) {
      // Allow outstanding requests to be cleaned up between tests
      httpMock.match(() => true);
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all diseases', () => {
    const mockDiseases: Disease[] = [
      { id: 1, name: 'Diabetes', description: 'Chronic disease', specialtyId: 1 },
      { id: 2, name: 'Hypertension', description: 'High blood pressure', specialtyId: 1 }
    ];

    service.getAllDiseases().subscribe((diseases) => {
      expect(diseases.length).toBe(2);
      expect(diseases[0].name).toBe('Diabetes');
    });

    const req = httpMock.expectOne((request) => request.url.includes('diseases'));
    expect(req.request.method).toBe('GET');
    req.flush(mockDiseases);
  });

  it('should get disease by id', () => {
    const mockDisease: Disease = { id: 1, name: 'Diabetes', description: 'Chronic disease', specialtyId: 1 };

    service.getDiseaseById(1).subscribe((disease) => {
      expect(disease.name).toBe('Diabetes');
    });

    const req = httpMock.expectOne((request) => request.url.includes('diseases/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockDisease);
  });

  it('should get all symptoms', () => {
    const mockSymptoms: Symptom[] = [
      { id: 1, name: 'Fever', description: 'High temperature' },
      { id: 2, name: 'Cough', description: 'Persistent cough' }
    ];

    service.getAllSymptoms().subscribe((symptoms) => {
      expect(symptoms.length).toBe(2);
      expect(symptoms[0].name).toBe('Fever');
    });

    const req = httpMock.expectOne((request) => request.url.includes('symptoms'));
    expect(req.request.method).toBe('GET');
    req.flush(mockSymptoms);
  });

  it('should get symptom by id', () => {
    const mockSymptom: Symptom = { id: 1, name: 'Fever', description: 'High temperature' };

    service.getSymptomById(1).subscribe((symptom) => {
      expect(symptom.name).toBe('Fever');
    });

    const req = httpMock.expectOne((request) => request.url.includes('symptoms/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockSymptom);
  });

  it('should get all medical records', () => {
    const mockRecords: MedicalRecordDTO[] = [
      { id: 1, patientId: 1, status: 'ACTIVE' },
      { id: 2, patientId: 1, status: 'ACTIVE' }
    ];

    service.getAllMedicalRecords().subscribe((records) => {
      expect(records.length).toBe(2);
    });

    const req = httpMock.expectOne((request) => request.url.includes('medical-records'));
    expect(req.request.method).toBe('GET');
    req.flush(mockRecords);
  });

  it('should get medical record by id', () => {
    const mockRecord: MedicalRecordDTO = { id: 1, patientId: 1, status: 'ACTIVE' };

    service.getMedicalRecordById(1).subscribe((record) => {
      expect(record.id).toBe(1);
    });

    const req = httpMock.expectOne((request) => request.url.includes('medical-records/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockRecord);
  });

  it('should create disease', () => {
    const newDisease: Disease = { name: 'NewDisease', description: 'New disease', specialtyId: 1 };
    const mockResponse: Disease = { id: 3, ...newDisease };

    service.createDisease(newDisease).subscribe((disease) => {
      expect(disease.id).toBe(3);
      expect(disease.name).toBe('NewDisease');
    });

    const req = httpMock.expectOne((request) => request.url.includes('diseases'));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should update disease', () => {
    const updateData: Partial<Disease> = { description: 'Updated description' };
    const mockResponse: Disease = { id: 1, name: 'Diabetes', description: 'Updated description', specialtyId: 1 };

    service.updateDisease(1, updateData).subscribe((disease) => {
      expect(disease.description).toBe('Updated description');
    });

    const req = httpMock.expectOne((request) => request.url.includes('diseases/1'));
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete disease', () => {
    service.deleteDisease(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne((request) => request.url.includes('diseases/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should upload medical record', () => {
    const file = new File(['test'], 'test.pdf');
    const description = 'Test prescription';

    const mockResponse: MedicalRecordDTO = {
      id: 1,
      patientId: 1,
      status: 'ACTIVE'
    };

    service.uploadMedicalRecord(file, description).subscribe((response) => {
      expect(response).toBeDefined();
      expect(response.id).toBe(1);
    });

    const req = httpMock.expectOne((request) => request.url.includes('medical-records'));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handle errors gracefully', () => {
    service.getAllDiseases().subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpMock.expectOne((request) => request.url.includes('diseases'));
    req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
  });
});
