import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { AppointmentDTO, TeleconsultationSessionDTO } from '../../../../shared/models/appointment.model';

@Component({
  selector: 'app-teleconsultation-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teleconsultation-session.component.html',
  styleUrls: ['./teleconsultation-session.component.css']
})
export class TeleconsultationSessionComponent implements OnInit {
  appointmentId = 0;
  appointment: AppointmentDTO | null = null;
  session: TeleconsultationSessionDTO | null = null;

  loading = false;
  error: string | null = null;
  infoMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Invalid appointment id.';
      return;
    }

    this.appointmentId = id;
    this.loadContext();
  }

  loadContext(): void {
    this.loading = true;
    this.error = null;

    this.appointmentService.getAppointmentById(this.appointmentId).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.loadSession();
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load appointment context.';
      }
    });
  }

  loadSession(): void {
    this.appointmentService.getTeleconsultationSession(this.appointmentId).subscribe({
      next: (session) => {
        this.session = session;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.infoMessage = 'No active teleconsultation found yet. You can start one now.';
      }
    });
  }

  startSession(): void {
    this.loading = true;
    this.error = null;
    this.infoMessage = null;

    const payload: Partial<TeleconsultationSessionDTO> = {
      appointmentId: this.appointmentId,
      startsAt: new Date().toISOString()
    };

    this.appointmentService.startTeleconsultationSession(this.appointmentId, payload).subscribe({
      next: (session) => {
        this.session = session;
        this.loading = false;
        this.infoMessage = 'Teleconsultation session started.';
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to start teleconsultation session.';
      }
    });
  }

  joinSession(): void {
    this.loading = true;
    this.error = null;

    this.appointmentService.joinTeleconsultationSession(this.appointmentId).subscribe({
      next: (session) => {
        this.session = session;
        this.loading = false;

        if (session.meetingLink) {
          window.open(session.meetingLink, '_blank', 'noopener,noreferrer');
        } else {
          this.infoMessage = 'Session joined. Meeting link is not available yet.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to join teleconsultation session.';
      }
    });
  }
}
