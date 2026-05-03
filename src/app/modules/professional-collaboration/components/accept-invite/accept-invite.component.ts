import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InvitationService, InvitationToken } from '../../services/invitation.service';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accept-invite.component.html',
  styleUrls: ['./accept-invite.component.css']
})
export class AcceptInviteComponent implements OnInit {
  private readonly sessionMeetingMapKey = 'session_live_meeting_map';
  token: string | null = null;
  invitation: InvitationToken | null = null;
  isLoading = true;
  isAccepting = false;
  errorMessage = '';
  successMessage = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.token = params['token'];
      console.log('[AcceptInvite] Token from URL:', this.token);
      
      if (!this.token) {
        this.errorMessage = '❌ Token d\'invitation invalide ou manquant';
        this.isLoading = false;
        return;
      }

      // Retrieve invitation details
      this.invitation = this.invitationService.getInvitationByToken(this.token);
      
      if (!this.invitation) {
        this.errorMessage = '❌ L\'invitation est invalide ou a expiré';
        this.isLoading = false;
        return;
      }

      console.log('[AcceptInvite] Invitation retrieved:', this.invitation);
      this.isLoading = false;
    });
  }

  /**
   * Accepte l'invitation et ajoute l'utilisateur à la session
   */
  acceptInvitation(): void {
    if (!this.invitation) {
      this.errorMessage = '❌ Invitation invalide';
      return;
    }

    this.isAccepting = true;
    console.log('[AcceptInvite] Accepting invitation:', this.invitation);

    // In a real scenario, you would call a backend endpoint here
    // For now, we'll just mark it as accepted in the service
    const acceptedInvitation = this.invitationService.acceptInvitationToken(this.token!);

    if (!acceptedInvitation) {
      this.errorMessage = '❌ Erreur lors de l\'acceptation de l\'invitation';
      this.isAccepting = false;
      return;
    }

    // Display success message
    this.successMessage = '✅ Invitation acceptée avec succès!';
    console.log('[AcceptInvite] Invitation accepted successfully');

    // Redirect after 2 seconds
    // Resolve the meeting linked to this collaboration session
    setTimeout(() => {
      const sessionId = this.invitation!.sessionId;
      const meetingId = this.invitation!.meetingId;

      // Fast path: invitation already carries the linked meeting id
      if (meetingId) {
        console.log('[AcceptInvite] Redirecting directly with invitation meetingId:', meetingId);
        this.router.navigate(['/collaboration/dashboard/meetings', meetingId, 'live']);
        return;
      }

      const mappedMeetingId = this.getStoredMeetingId(sessionId);
      if (mappedMeetingId) {
        console.log('[AcceptInvite] Redirecting with mapped session meeting:', mappedMeetingId);
        this.router.navigate(['/collaboration/dashboard/meetings', mappedMeetingId, 'live']);
        return;
      }

      console.log('[AcceptInvite] No linked meeting found, redirecting to session');
      this.router.navigate(['/collaboration/dashboard', sessionId]);
    }, 2000);
  }

  private getStoredMeetingId(sessionId: number): number | undefined {
    try {
      const raw = localStorage.getItem(this.sessionMeetingMapKey);
      if (!raw) return undefined;
      const map = JSON.parse(raw) as Record<string, number>;
      const value = Number(map[String(sessionId)]);
      return Number.isFinite(value) && value > 0 ? value : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Rejette l'invitation
   */
  rejectInvitation(): void {
    console.log('[AcceptInvite] Invitation rejected');
    this.router.navigate(['/collaboration/dashboard/meetings']);
  }
}
