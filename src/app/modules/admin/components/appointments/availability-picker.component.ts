import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { AvailabilityDTO } from '../../../../shared/models/appointment.model';
import { User } from '../../../../shared/models/user.model';
import { UserService } from '../../../../shared/services/user.service';

@Component({
  selector: 'app-availability-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availability-picker.component.html',
  styleUrls: ['./availability-picker.component.css']
})
export class AvailabilityPickerComponent implements OnInit {
  doctors: User[] = [];
  selectedDoctorId: number | null = null;
  selectedDate = '';
  selectedConsultationType: 'IN_PERSON' | 'VIDEO' | 'PHONE' = 'VIDEO';

  availableSlots: AvailabilityDTO[] = [];
  loadingDoctors = false;
  loadingSlots = false;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.selectedDate = new Date().toISOString().slice(0, 10);
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loadingDoctors = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.doctors = users.filter((u) => u.role === 'DOCTOR' && !!u.id);
        this.loadingDoctors = false;
      },
      error: () => {
        this.loadingDoctors = false;
        this.error = 'Failed to load doctors.';
      }
    });
  }

  loadAvailableSlots(): void {
    if (!this.selectedDoctorId) {
      this.error = 'Please select a doctor.';
      return;
    }

    this.loadingSlots = true;
    this.error = null;

    this.appointmentService.getAvailableDoctorAvailability(this.selectedDoctorId).subscribe({
      next: (slots) => {
        this.availableSlots = slots.filter((slot) => this.isOnSelectedDate(slot.startTime));
        this.loadingSlots = false;
      },
      error: () => {
        this.loadingSlots = false;
        this.error = 'Failed to load available slots.';
      }
    });
  }

  bookSlot(slot: AvailabilityDTO): void {
    if (!slot.doctorId || !slot.startTime || !slot.endTime) {
      this.error = 'Selected slot is missing required data.';
      return;
    }

    this.router.navigate(['/appointments/create'], {
      queryParams: {
        doctorId: slot.doctorId,
        startTime: this.toDateTimeLocal(slot.startTime),
        endTime: this.toDateTimeLocal(slot.endTime),
        consultationType: this.selectedConsultationType
      }
    });
  }

  private isOnSelectedDate(isoDate: string): boolean {
    if (!this.selectedDate || !isoDate) {
      return false;
    }

    const date = new Date(isoDate);
    const formatted = date.toISOString().slice(0, 10);
    return formatted === this.selectedDate;
  }

  private toDateTimeLocal(isoDate: string): string {
    const date = new Date(isoDate);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }
}
