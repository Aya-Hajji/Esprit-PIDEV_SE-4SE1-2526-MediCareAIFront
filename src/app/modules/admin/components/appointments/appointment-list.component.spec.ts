import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { AppointmentListComponent } from './appointment-list.component';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { Appointment } from '../../../../shared/models/appointment.model';

describe('AppointmentListComponent', () => {
  let component: AppointmentListComponent;
  let fixture: ComponentFixture<AppointmentListComponent>;
  let appointmentServiceSpy: {
    getAllAppointments: ReturnType<typeof vi.fn>;
    markAsNoShow: ReturnType<typeof vi.fn>;
    cancelAppointment: ReturnType<typeof vi.fn>;
    deleteAppointment: ReturnType<typeof vi.fn>;
    updateAppointment: ReturnType<typeof vi.fn>;
    scheduleAppointmentReminder: ReturnType<typeof vi.fn>;
    sendAppointmentReminder: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigate: ReturnType<typeof vi.fn>;
    events: typeof EMPTY;
  };

  beforeEach(async () => {
    appointmentServiceSpy = {
      getAllAppointments: vi.fn(),
      markAsNoShow: vi.fn(),
      cancelAppointment: vi.fn(),
      deleteAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      scheduleAppointmentReminder: vi.fn(),
      sendAppointmentReminder: vi.fn()
    };

    routerSpy = { navigate: vi.fn(), events: EMPTY };

    appointmentServiceSpy.getAllAppointments.mockReturnValue(of([]));
    appointmentServiceSpy.markAsNoShow.mockReturnValue(of({} as Appointment));
    appointmentServiceSpy.cancelAppointment.mockReturnValue(of({} as Appointment));
    appointmentServiceSpy.deleteAppointment.mockReturnValue(of(void 0));
    appointmentServiceSpy.updateAppointment.mockReturnValue(of({} as Appointment));
    appointmentServiceSpy.scheduleAppointmentReminder.mockReturnValue(of({}));
    appointmentServiceSpy.sendAppointmentReminder.mockReturnValue(of({}));

    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppointmentListComponent],
      providers: [
        { provide: AppointmentService, useValue: appointmentServiceSpy as unknown as AppointmentService },
        { provide: Router, useValue: routerSpy as unknown as Router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and sort appointments by startTime descending', () => {
    const data: Appointment[] = [
      {
        id: 1,
        doctorId: 10,
        patientId: 20,
        startTime: '2026-03-01T09:00:00.000Z',
        endTime: '2026-03-01T10:00:00.000Z',
        consultationType: 'VIDEO',
        status: 'SCHEDULED'
      },
      {
        id: 2,
        doctorId: 10,
        patientId: 21,
        startTime: '2026-03-10T09:00:00.000Z',
        endTime: '2026-03-10T10:00:00.000Z',
        consultationType: 'IN_PERSON',
        status: 'COMPLETED'
      }
    ];

    appointmentServiceSpy.getAllAppointments.mockReturnValue(of(data));

    component.loadAppointments();

    expect(component.appointments.map((item) => item.id)).toEqual([2, 1]);
    expect(component.loading).toBe(false);
    expect(component.error).toBeNull();
  });

  it('should filter appointments by selected status', () => {
    component.appointments = [
      {
        id: 1,
        doctorId: 1,
        patientId: 2,
        startTime: '2026-03-01T09:00:00.000Z',
        endTime: '2026-03-01T10:00:00.000Z',
        consultationType: 'VIDEO',
        status: 'SCHEDULED'
      },
      {
        id: 2,
        doctorId: 1,
        patientId: 3,
        startTime: '2026-03-02T09:00:00.000Z',
        endTime: '2026-03-02T10:00:00.000Z',
        consultationType: 'PHONE',
        status: 'CANCELLED'
      }
    ];

    component.selectedStatus = 'CANCELLED';

    expect(component.filteredAppointments.length).toBe(1);
    expect(component.filteredAppointments[0].id).toBe(2);
  });

  it('should compute appointment statistics correctly', () => {
    component.appointments = [
      {
        id: 1,
        doctorId: 1,
        patientId: 2,
        startTime: '2026-03-01T09:00:00.000Z',
        endTime: '2026-03-01T10:00:00.000Z',
        consultationType: 'VIDEO',
        status: 'SCHEDULED'
      },
      {
        id: 2,
        doctorId: 1,
        patientId: 3,
        startTime: '2026-03-02T09:00:00.000Z',
        endTime: '2026-03-02T10:00:00.000Z',
        consultationType: 'PHONE',
        status: 'COMPLETED'
      },
      {
        id: 3,
        doctorId: 1,
        patientId: 4,
        startTime: '2026-03-03T09:00:00.000Z',
        endTime: '2026-03-03T10:00:00.000Z',
        consultationType: 'IN_PERSON',
        status: 'NO_SHOW'
      }
    ];

    expect(component.appointmentStats).toEqual({
      total: 3,
      scheduled: 1,
      completed: 1,
      cancelled: 0,
      noShow: 1
    });
  });

  it('should block reschedule when end time is before start time', () => {
    component.rescheduleAppointmentId = 5;
    component.rescheduleStartTime = '2026-03-31T12:00';
    component.rescheduleEndTime = '2026-03-31T11:00';

    component.submitReschedule();

    expect(component.actionError).toBe('End time must be after start time.');
    expect(appointmentServiceSpy.updateAppointment).not.toHaveBeenCalled();
  });

  it('should reset local test data and reload appointments when confirmed', () => {
    localStorage.setItem('localAppointmentsFallback', JSON.stringify([{ id: 999 }]));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const loadAppointmentsSpy = vi.spyOn(component, 'loadAppointments').mockImplementation(() => undefined);

    component.resetTestData();

    expect(localStorage.getItem('localAppointmentsFallback')).not.toBeNull();
    expect(loadAppointmentsSpy).toHaveBeenCalled();
  });
});
