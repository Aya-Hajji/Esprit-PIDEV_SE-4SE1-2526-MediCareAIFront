import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentDTO } from '../../../../shared/models/appointment.model';
import { AppointmentService } from '../../../../shared/services/appointment.service';

@Component({
  selector: 'app-appointment-reminders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-reminders.component.html',
  styleUrls: ['./appointment-reminders.component.css']
})
export class AppointmentRemindersComponent implements OnInit {
  appointments: AppointmentDTO[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.appointmentService.getAllAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments
          .filter((a) => a.status === 'SCHEDULED')
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load scheduled appointments.';
      }
    });
  }

  quickSendReminder(appointment: AppointmentDTO): void {
    if (!appointment.id) {
      return;
    }

    this.appointmentService.sendAppointmentReminder(appointment.id, 'EMAIL').subscribe();
  }

  openDetails(appointment: AppointmentDTO): void {
    if (!appointment.id) {
      return;
    }

    this.router.navigate(['/appointments/details', appointment.id]);
  }
}
