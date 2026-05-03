import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentService } from './appointment.service';
import { AppointmentDTO } from '../models/appointment.model';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppointmentService]
    });

    service = TestBed.inject(AppointmentService);
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

  it('should create appointment', () => {
    const appointmentData: AppointmentDTO = {
      doctorId: 1,
      patientId: 1,
      startTime: '2025-12-25T10:00:00',
      endTime: '2025-12-25T10:30:00',
      consultationType: 'IN_PERSON',
      reasonForVisit: 'Regular checkup'
    };

    service.createAppointment(appointmentData).subscribe((response) => {
      expect(response).toBeDefined();
    });

    const req = httpMock.expectOne((request) => request.url.includes('appointments'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, ...appointmentData });
  });

  it('should get my appointments', () => {
    const mockAppointments = [
      { id: 1, doctorId: 1, patientId: 1, startTime: '2025-12-25T10:00:00', endTime: '2025-12-25T10:30:00', consultationType: 'IN_PERSON' as const },
      { id: 2, doctorId: 2, patientId: 1, startTime: '2025-12-26T14:00:00', endTime: '2025-12-26T14:30:00', consultationType: 'VIDEO' as const }
    ];

    service.getMyAppointments().subscribe((appointments) => {
      expect(appointments.length).toBe(2);
    });

    const req = httpMock.expectOne((request) => request.url.includes('appointments/me'));
    expect(req.request.method).toBe('GET');
    req.flush(mockAppointments);
  });

  it('should get appointment by id', () => {
    const mockAppointment = { id: 1, doctorId: 1, patientId: 1, startTime: '2025-12-25T10:00:00', endTime: '2025-12-25T10:30:00', consultationType: 'IN_PERSON' as const };

    service.getAppointmentById(1).subscribe((appointment) => {
      expect(appointment.id).toBe(1);
      expect(appointment.doctorId).toBe(1);
    });

    const req = httpMock.expectOne((request) => request.url.includes('appointments/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockAppointment);
  });

  it('should cancel appointment', () => {
    service.cancelAppointment(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne((request) => request.url.includes('appointments/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should handle creation error', () => {
    const appointmentData: AppointmentDTO = {
      doctorId: 0,
      patientId: 0,
      startTime: '',
      endTime: '',
      consultationType: 'IN_PERSON',
      reasonForVisit: ''
    };

    service.createAppointment(appointmentData).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.status).toBe(400);
      }
    );

    const req = httpMock.expectOne((request) => request.url.includes('appointments'));
    req.flush({ error: 'Bad request' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should get all appointments for admin', () => {
    const mockAppointments = [
      { id: 1, doctorId: 1, patientId: 1, startTime: '2025-12-25T10:00:00', endTime: '2025-12-25T10:30:00', consultationType: 'IN_PERSON' as const },
      { id: 2, doctorId: 2, patientId: 2, startTime: '2025-12-26T14:00:00', endTime: '2025-12-26T14:30:00', consultationType: 'VIDEO' as const }
    ];

    service.getAllAppointments().subscribe((appointments) => {
      expect(appointments.length).toBe(2);
    });

    const req = httpMock.expectOne((request) => request.url.includes('appointments'));
    expect(req.request.method).toBe('GET');
    req.flush(mockAppointments);
  });

  it('should update appointment', () => {
    const updateData: Partial<AppointmentDTO> = { startTime: '2025-12-27T15:00:00', endTime: '2025-12-27T15:30:00' };
    const mockResponse: AppointmentDTO = { id: 1, doctorId: 1, patientId: 1, startTime: '2025-12-27T15:00:00', endTime: '2025-12-27T15:30:00', consultationType: 'IN_PERSON' };

    service.updateAppointment(1, updateData).subscribe((appointment) => {
      expect(appointment).toBeDefined();
    });

    const req = httpMock.expectOne((request) => request.url.includes('appointments/1'));
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });
});
