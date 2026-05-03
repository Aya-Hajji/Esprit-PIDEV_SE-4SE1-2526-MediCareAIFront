import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AppointmentBookingComponent } from './appointment-booking.component';
import { AppointmentService } from '../../../../shared/services/appointment.service';

describe('AppointmentBookingComponent', () => {
  let component: AppointmentBookingComponent;
  let fixture: ComponentFixture<AppointmentBookingComponent>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;

  beforeEach(async () => {
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', [
      'createAppointment'
    ]);

    await TestBed.configureTestingModule({
      imports: [AppointmentBookingComponent, ReactiveFormsModule],
      providers: [
        { provide: AppointmentService, useValue: mockAppointmentService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentBookingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize booking form on init', () => {
    fixture.detectChanges();

    expect(component.bookingForm).toBeDefined();
    expect(component.bookingForm.get('doctorName')).toBeDefined();
    expect(component.bookingForm.get('specialty')).toBeDefined();
    expect(component.bookingForm.get('appointmentDate')).toBeDefined();
    expect(component.bookingForm.get('appointmentTime')).toBeDefined();
    expect(component.bookingForm.get('consultationType')).toBeDefined();
    expect(component.bookingForm.get('reason')).toBeDefined();
  });

  it('should provide consultation types', () => {
    expect(component.consultationTypes).toContain('IN_PERSON');
    expect(component.consultationTypes).toContain('VIDEO');
    expect(component.consultationTypes).toContain('PHONE');
  });

  it('should set minimum date to tomorrow', () => {
    fixture.detectChanges();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedMinDate = tomorrow.toISOString().split('T')[0];

    expect(component.minDate).toBe(expectedMinDate);
  });

  it('should not submit invalid form', () => {
    fixture.detectChanges();

    component.bookingForm.patchValue({
      doctorName: '',
      specialty: '',
      appointmentDate: '',
      appointmentTime: ''
    });

    component.onSubmit();

    expect(component.bookingForm.invalid).toBe(true);
    expect(mockAppointmentService.createAppointment).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', () => {
    mockAppointmentService.createAppointment.and.returnValue(of({ id: 123 } as any));

    fixture.detectChanges();

    component.bookingForm.patchValue({
      doctorName: 'Dr. Smith',
      specialty: 'Cardiology',
      appointmentDate: '2026-04-01',
      appointmentTime: '10:00',
      consultationType: 'IN_PERSON',
      reason: 'Regular checkup and consultation'
    });

    component.onSubmit();

    expect(component.submitted).toBe(true);
    expect(mockAppointmentService.createAppointment).toHaveBeenCalled();
  });

  it('should require minimum 10 characters for reason', () => {
    fixture.detectChanges();

    component.bookingForm.patchValue({
      doctorName: 'Dr. Smith',
      specialty: 'Cardiology',
      appointmentDate: '2026-04-01',
      appointmentTime: '10:00',
      reason: 'Short'
    });

    expect(component.bookingForm.get('reason')?.valid).toBeFalsy();
  });

  it('should set default consultation type to IN_PERSON', () => {
    fixture.detectChanges();

    expect(component.bookingForm.get('consultationType')?.value).toBe('IN_PERSON');
  });

  it('should handle appointment booking error', () => {
    mockAppointmentService.createAppointment.and.returnValue(
      throwError(() => ({ error: { message: 'Booking failed' } }))
    );

    fixture.detectChanges();

    component.bookingForm.patchValue({
      doctorName: 'Dr. Smith',
      specialty: 'Cardiology',
      appointmentDate: '2026-04-01',
      appointmentTime: '10:00',
      consultationType: 'IN_PERSON',
      reason: 'Regular checkup and consultation'
    });

    component.onSubmit();

    expect(component.error).toBeTruthy();
  });

  it('should show success message on successful booking', (done) => {
    mockAppointmentService.createAppointment.and.returnValue(of({ id: 123 } as any));

    fixture.detectChanges();

    component.bookingForm.patchValue({
      doctorName: 'Dr. Smith',
      specialty: 'Cardiology',
      appointmentDate: '2026-04-01',
      appointmentTime: '10:00',
      consultationType: 'IN_PERSON',
      reason: 'Regular checkup and consultation'
    });

    component.onSubmit();

    setTimeout(() => {
      expect(component.success).toBeTruthy();
      done();
    }, 100);
  });

  it('should access form controls via getter', () => {
    fixture.detectChanges();

    expect(component.f).toBeDefined();
    expect(component.f['doctorName']).toBeDefined();
    expect(component.f['specialty']).toBeDefined();
    expect(component.f['appointmentDate']).toBeDefined();
  });
});
