import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { UserService } from '../../../../shared/services/user.service';
import { buildUserDisplayMap, displayNameForUserId } from '../../../../shared/utils/user-display';
import { AppointmentDTO, TeleconsultationSessionDTO, VideoProvider } from '../../../../shared/models/appointment.model';

@Component({
  selector: 'app-teleconsultation-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teleconsultation-session.component.html',
  styleUrls: ['./teleconsultation-session.component.css']
})
export class TeleconsultationSessionComponent implements OnInit {
  appointmentId = 0;
  appointment: AppointmentDTO | null = null;
  doctorDisplayName = '';
  patientDisplayName = '';
  session: TeleconsultationSessionDTO | null = null;
  selectedProvider: VideoProvider = 'JITSI';

  loading = false;
  error: string | null = null;
  infoMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private userService: UserService
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
        this.resolveParticipantNames(appointment);
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
      provider: this.selectedProvider,
      startsAt: new Date().toISOString()
    };

    this.appointmentService.startTeleconsultationSession(this.appointmentId, payload, this.selectedProvider).subscribe({
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

  private resolveParticipantNames(appointment: AppointmentDTO): void {
    this.userService
      .getAllUsers()
      .pipe(catchError(() => of([])))
      .subscribe((users) => {
        const m = buildUserDisplayMap(users);
        this.doctorDisplayName = displayNameForUserId(m, appointment.doctorId);
        this.patientDisplayName = displayNameForUserId(m, appointment.patientId);
      });
  }

  get sessionContextTitle(): string {
    if (!this.appointment?.startTime) {
      return 'Teleconsultation';
    }
    return `Teleconsultation · ${new Date(this.appointment.startTime).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })}`;
  }
}
