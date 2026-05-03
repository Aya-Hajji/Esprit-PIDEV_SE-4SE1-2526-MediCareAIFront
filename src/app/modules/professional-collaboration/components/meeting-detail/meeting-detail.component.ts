import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MeetingService } from '../../services/meeting.service';
import { MeetingExtended, MeetingParticipant } from '../../models/collaboration.model';
import { getUserIdFromStorage } from '../../../../shared/utils/user-id-helper';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../../shared/services/user.service';

@Component({
  selector: 'app-meeting-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './meeting-detail.component.html',
  styleUrls: ['./meeting-detail.component.css']
})
export class MeetingDetailComponent implements OnInit {
  meeting: MeetingExtended | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  userId = getUserIdFromStorage();
  inviteForm!: FormGroup;
  showInviteForm = false;

  constructor(
    private meetingService: MeetingService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]]
    });
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadMeeting(+params['id']);
      }
    });
  }

  loadMeeting(id: number) {
    this.isLoading = true;
    this.errorMessage = '';

    this.meetingService.getMeetingById(id).subscribe({
      next: (meeting) => {
        this.meeting = meeting;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading meeting:', error);
        this.errorMessage = 'Erreur lors du chargement de la réunion';
        this.isLoading = false;
      }
    });
  }

  editMeeting() {
    if (this.meeting) {
      this.router.navigate(['/collaboration/dashboard/meeting/edit', this.meeting.id]);
    }
  }

  deleteMeeting() {
    if (this.meeting?.id && confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
      this.meetingService.deleteMeeting(this.meeting.id).subscribe({
        next: () => {
          this.successMessage = 'Réunion supprimée avec succès';
          setTimeout(() => {
            this.router.navigate(['/collaboration/dashboard/meetings']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error deleting meeting:', error);
          this.errorMessage = 'Erreur lors de la suppression de la réunion';
        }
      });
    }
  }

  joinMeeting() {
    if (this.meeting?.meetingLink && this.canJoin()) {
      window.open(this.meeting.meetingLink, '_blank');
    }
  }

  goBack() {
    this.router.navigate(['/collaboration/dashboard/meetings']);
  }

  canEdit(): boolean {
    return this.meeting?.organizerId === +(this.userId || 0);
  }

  canDelete(): boolean {
    return this.meeting?.organizerId === +(this.userId || 0);
  }

  canJoin(): boolean {
    return (this.meeting?.isUpcoming === true || this.meeting?.isOngoing === true) && 
           !!this.meeting?.meetingLink;
  }

  inviteParticipantByEmail() {
    if (!this.meeting?.id) return;
    if (this.inviteForm.invalid) {
      this.errorMessage = 'Veuillez saisir un email valide.';
      return;
    }

    const email = (this.inviteForm.get('email')?.value || '').toString().trim();
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.getUserByEmail(email).subscribe({
      next: (user) => {
        const userId = user?.id;
        if (!userId) {
          this.errorMessage = 'Utilisateur introuvable pour cet email.';
          return;
        }

        this.meetingService.addParticipant(this.meeting!.id!, userId).subscribe({
          next: () => {
            this.successMessage = 'Participant ajouté à la réunion.';
            this.showInviteForm = false;
            this.inviteForm.reset({ email: '' });
            // Reload meeting to refresh participants list/count
            this.loadMeeting(this.meeting!.id!);
            setTimeout(() => (this.successMessage = ''), 3000);
          },
          error: (error) => {
            const msg = error?.error?.message || error?.message || 'Erreur inconnue';
            this.errorMessage = `Erreur invitation: ${msg}`;
          }
        });
      },
      error: (error) => {
        const msg = error?.error?.message || error?.message || 'Erreur inconnue';
        this.errorMessage = `Email introuvable: ${msg}`;
      }
    });
  }

  getStatusColor(): string {
    switch (this.meeting?.status) {
      case 'SCHEDULED': return '#ffc107';
      case 'IN_PROGRESS': return '#4CAF50';
      case 'COMPLETED': return '#2196F3';
      case 'CANCELLED': return '#f44336';
      default: return '#999';
    }
  }

  getStatusDisplay(): string {
    const statusMap: { [key: string]: string } = {
      'SCHEDULED': 'Programmée',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminée',
      'CANCELLED': 'Annulée'
    };
    return statusMap[this.meeting?.status || ''] || this.meeting?.status || '';
  }

  getTimeUntilMeeting(): string {
    return this.meeting ? this.meetingService.getTimeUntilMeeting(this.meeting) : '';
  }

  formatDateTime(): string {
    if (this.meeting?.scheduledDate && this.meeting?.scheduledTime) {
      const date = new Date(this.meeting.scheduledDate);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return '';
  }
}
