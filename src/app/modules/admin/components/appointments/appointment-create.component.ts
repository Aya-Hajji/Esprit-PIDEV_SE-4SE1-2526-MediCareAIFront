import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './appointment-create.component.html',
  styleUrls: ['./appointment-create.component.css']
})
export class AppointmentCreateComponent implements OnInit {
  appointmentForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  
  doctors: User[] = [];
  patients: User[] = [];
  consultationTypes = ['IN_PERSON', 'VIDEO', 'PHONE'];
  loadingUsers = false;

  constructor(
    private formBuilder: FormBuilder,
    private appointmentService: AppointmentService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.appointmentForm = this.formBuilder.group({
      doctorId: ['', Validators.required],
      patientId: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      consultationType: ['IN_PERSON', Validators.required],
      reasonForVisit: [''],
      timeZone: ['UTC'],
      urgent: [false]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.applyPrefillFromQuery();
  }

  applyPrefillFromQuery(): void {
    this.route.queryParamMap.subscribe((params) => {
      const doctorId = params.get('doctorId');
      const startTime = params.get('startTime');
      const endTime = params.get('endTime');
      const consultationType = params.get('consultationType');

      this.appointmentForm.patchValue({
        doctorId: doctorId || this.appointmentForm.value.doctorId,
        startTime: startTime || this.appointmentForm.value.startTime,
        endTime: endTime || this.appointmentForm.value.endTime,
        consultationType: consultationType || this.appointmentForm.value.consultationType
      });
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.doctors = users.filter(u => u.role === 'DOCTOR');
        this.patients = users.filter(u => u.role === 'PATIENT');
        this.loadingUsers = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Failed to load doctors and patients';
        this.loadingUsers = false;
      }
    });
  }

  get f() {
    return this.appointmentForm.controls;
  }

  onStartTimeChange(): void {
    const startTime = this.appointmentForm.get('startTime')?.value;
    if (startTime) {
      // Automatically set end time to 1 hour after start time
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      
      // Format to datetime-local format
      const endTimeString = endDate.toISOString().slice(0, 16);
      this.appointmentForm.patchValue({ endTime: endTimeString });
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      Object.keys(this.appointmentForm.controls).forEach(key => {
        this.appointmentForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = null;

    const appointmentData = {
      doctorId: parseInt(this.appointmentForm.value.doctorId),
      patientId: parseInt(this.appointmentForm.value.patientId),
      startTime: new Date(this.appointmentForm.value.startTime).toISOString(),
      endTime: new Date(this.appointmentForm.value.endTime).toISOString(),
      consultationType: this.appointmentForm.value.consultationType,
      reasonForVisit: this.appointmentForm.value.reasonForVisit || undefined,
      timeZone: this.appointmentForm.value.timeZone,
      urgent: this.appointmentForm.value.urgent,
      status: 'SCHEDULED' as const
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/admin/appointments']);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to create appointment';
        console.error('Error creating appointment:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/appointments']);
  }

  navigateToAvailability(): void {
    this.router.navigate(['/appointments/availability']);
  }
}
