import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../../shared/services/appointment.service';

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment-booking.component.html',
  styleUrls: ['./appointment-booking.component.css']
})
export class AppointmentBookingComponent implements OnInit {
  bookingForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  minDate: string = '';

  consultationTypes = ['IN_PERSON', 'VIDEO', 'PHONE'];

  private formBuilder = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);

  ngOnInit(): void {
    this.setMinDate();
    this.initializeForm();
  }

  private setMinDate(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];
  }

  private initializeForm(): void {
    this.bookingForm = this.formBuilder.group({
      doctorName: ['', Validators.required],
      specialty: ['', Validators.required],
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      consultationType: ['IN_PERSON', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.bookingForm.invalid) {
      return;
    }

    this.loading = true;
    const patientId = parseInt(localStorage.getItem('userId') || '0', 10);

    const appointmentData = {
      patientId,
      doctorId: parseInt(this.bookingForm.value.doctorName || '0', 10),
      startTime: `${this.bookingForm.value.appointmentDate}T${this.bookingForm.value.appointmentTime}`,
      endTime: `${this.bookingForm.value.appointmentDate}T${this.bookingForm.value.appointmentTime}`,
      consultationType: this.bookingForm.value.consultationType,
      reasonForVisit: this.bookingForm.value.reason
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.success = 'Appointment booked successfully! Awaiting doctor confirmation.';
        setTimeout(() => {
          this.router.navigate(['/appointments']);
        }, 2000);
      },
      error: (error: any) => {
        this.loading = false;
        this.error = error?.error?.message || 'Failed to book appointment';
      }
    });
  }

  get f() {
    return this.bookingForm.controls;
  }
}
