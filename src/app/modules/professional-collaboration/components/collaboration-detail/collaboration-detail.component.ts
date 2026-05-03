import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollaborationService } from '../../services/collaboration.service';
import { InvitationService, InvitationToken } from '../../services/invitation.service';
import { MeetingService } from '../../services/meeting.service';
import { SessionExtended, SharedDocument } from '../../models/collaboration.model';
import { getUserIdFromStorage } from '../../../../shared/utils/user-id-helper';
import { Subject, timeout, of, Observable } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-collaboration-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './collaboration-detail.component.html',
  styleUrls: ['./collaboration-detail.component.css']
})
export class CollaborationDetailComponent implements OnInit, OnDestroy {
  private readonly sessionMeetingMapKey = 'session_live_meeting_map';
  private readonly lastCreatedMeetingIdKey = 'last_created_meeting_id';
  private readonly lastCreatedMeetingLinkKey = 'last_created_meeting_link';

  session: SessionExtended | null = null;
  documents: SharedDocument[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  activeTab = 'overview';

  uploadForm!: FormGroup;
  showUploadForm = false;

  inviteForm!: FormGroup;
  showInviteForm = false;
  showQuickInviteForm = false; // For quick invite in overview section
  isSubmitting = false;
  isLinkingMeeting = false;

  // Invitation link properties
  lastInvitationLink: string | null = null;
  showInvitationLink = false;
  lastInvitedEmail: string = '';

  currentUserId: number | null = getUserIdFromStorage();
  private destroy$ = new Subject<void>();

  constructor(
    private collaborationService: CollaborationService,
    private invitationService: InvitationService,
    private meetingService: MeetingService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeUploadForm();
    this.initializeInviteForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      console.log('Route params received:', { id, params });
      if (id && !isNaN(id)) {
        this.loadSession(id);
      } else {
        this.errorMessage = 'ID de session invalide';
        console.error('Invalid session ID:', id, params);
      }
    });
  }

  initializeUploadForm() {
    this.uploadForm = this.fb.group({
      file: [null, Validators.required],
      // Description is optional - only validate length if provided
      description: ['', [Validators.maxLength(500)]]
    });
  }

  initializeInviteForm() {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      role: ['VIEWER', Validators.required]
    });
  }

  loadSession(id: number) {
    this.isLoading = true;
    this.errorMessage = '';

    console.log(`[CollaborationDetail] Loading session ${id}...`);

    // Add 10-second timeout to prevent infinite loading
    this.collaborationService.getSessionById(id).pipe(
      timeout(10000),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (session) => {
        console.log(`[CollaborationDetail] Session ${id} loaded successfully:`, session);
        console.log('[CollaborationDetail] Session properties:', Object.keys(session));
        console.log('[CollaborationDetail] Session title:', session?.title);
        console.log('[CollaborationDetail] Session status:', session?.status);
        console.log('[CollaborationDetail] Session participants:', session?.participants?.length || 0);
        this.session = session;
        this.cdr.markForCheck(); // Force change detection
        this.loadDocuments(id);
        
        // Initialize empty participants array if not present
        // Do NOT call the /participants endpoint as it returns 500
        // Use only what getSessionById() returns
        if (!this.session.participants) {
          console.log('[CollaborationDetail] Initializing empty participants array');
          this.session.participants = [];
        }
        
        this.isLoading = false;
        this.cdr.markForCheck(); // Force change detection after setting isLoading
      },
      error: (error) => {
        console.error(`[CollaborationDetail] Error loading session ${id}:`, error);
        const errorMsg = error?.name === 'TimeoutError' 
          ? 'Le serveur ne répond pas. Vérifiez votre connexion.'
          : (error?.message || 'Erreur inconnue');
        this.errorMessage = `Erreur lors du chargement de la session: ${errorMsg}`;
        this.isLoading = false;
      }
    });
  }

  // DEPRECATED: Do not use this method - endpoint returns 500
  // Participants are loaded from getSessionById() response instead
  loadParticipants(sessionId: number) {
    console.warn('[CollaborationDetail] loadParticipants() is deprecated and disabled');
    return; // Don't call the failing /participants endpoint
  }

  loadDocuments(sessionId: number) {
    console.log(`[CollaborationDetail] Loading documents for session ${sessionId}...`);
    this.collaborationService.getSessionDocuments(sessionId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (docs) => {
        console.log(`[CollaborationDetail] Documents loaded:`, docs);
        this.documents = docs;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error(`[CollaborationDetail] Error loading documents:`, error);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('[CollaborationDetail] File selected:', { name: file.name, size: file.size, type: file.type });
      this.uploadForm.patchValue({ file });
      this.cdr.markForCheck();
    }
  }

  uploadDocument() {
    console.log('[CollaborationDetail] Upload attempt - Form valid:', this.uploadForm.valid, 'Form errors:', this.uploadForm.errors);
    
    if (this.uploadForm.invalid || !this.session?.id) {
      if (!this.uploadForm.valid) {
        const errors = this.uploadForm.errors;
        console.error('[CollaborationDetail] Form errors:', errors);
        this.errorMessage = 'Formulaire invalide. Assurez-vous d\'avoir sélectionné un fichier.';
      } else {
        this.errorMessage = 'Session invalide. Veuillez recharger la page.';
      }
      return;
    }

    const file = this.uploadForm.get('file')?.value;
    const description = this.uploadForm.get('description')?.value;

    if (!file) {
      this.errorMessage = 'Aucun fichier sélectionné';
      return;
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      this.errorMessage = 'Le fichier dépasse la taille maximale de 50MB';
      console.warn('[CollaborationDetail] File too large:', { fileName: file.name, size: file.size });
      return;
    }

    // Validate file type (basic check)
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                          'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'application/vnd.ms-excel',
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'text/plain'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.errorMessage = `Type de fichier non autorisé: ${file.type}. Types acceptés: images, PDF, Word, Excel`;
      console.warn('[CollaborationDetail] File type not allowed:', { fileName: file.name, type: file.type });
      return;
    }

    console.log('[CollaborationDetail] Uploading document:', { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type,
      sessionId: this.session.id,
      hasDescription: !!description
    });
    
    this.errorMessage = ''; // Clear previous errors
    this.successMessage = '';
    this.isLoading = true;

    this.collaborationService.uploadDocument(this.session.id, file, description).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (doc) => {
        console.log('[CollaborationDetail] Document uploaded successfully:', doc);
        this.successMessage = `Document "${file.name}" téléchargé avec succès`;
        this.showUploadForm = false;
        this.uploadForm.reset();
        this.isLoading = false;
        if (this.session?.id) {
          this.loadDocuments(this.session.id);
        }
        this.cdr.markForCheck();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('[CollaborationDetail] Error uploading document:', error);
        console.error('[CollaborationDetail] Error type:', error?.constructor?.name);
        console.error('[CollaborationDetail] Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.message,
          errorBody: error?.error
        });
        
        // Handle specific error cases
        let errorMsg = 'Erreur lors du téléchargement du document';
        if (error?.status === 401) {
          errorMsg = 'Authentification requise. Veuillez vous reconnecter.';
        } else if (error?.status === 403) {
          errorMsg = 'Vous n\'avez pas la permission de télécharger dans cette session.';
        } else if (error?.status === 400) {
          errorMsg = 'Requête invalide: ' + (error?.error?.message || 'Vérifiez les données envoyées');
        } else if (error?.status === 500) {
          errorMsg = 'Erreur serveur (500). Le backend a rencontré un problème. Contactez l\'administrateur.';
        } else if (error?.message) {
          errorMsg = error.message;
        }
        
        this.errorMessage = errorMsg;
        this.isLoading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  deleteDocument(id: number) {
    if (!id || !confirm('Supprimer ce document ?')) return;

    this.collaborationService.deleteDocument(id).subscribe({
      next: () => {
        this.successMessage = 'Document supprimé';
        if (this.session?.id) {
  this.loadDocuments(this.session.id);
}
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => this.errorMessage = 'Erreur lors de la suppression'
    });
  }

  editSession() {
    if (this.session?.id) {
      this.router.navigate(['/collaboration/dashboard/edit', this.session.id]);
    }
  }

  deleteSession() {
    if (!this.session?.id || !confirm('Supprimer cette session ?')) return;

    this.collaborationService.deleteSession(this.session.id).subscribe({
      next: () => {
        this.successMessage = 'Session supprimée';
        setTimeout(() => this.router.navigate(['/collaboration/dashboard']), 2000);
      },
      error: () => this.errorMessage = 'Erreur lors de la suppression'
    });
  }

  goBack() {
    this.router.navigate(['/collaboration/dashboard']);
  }

  // Permissions
  canEdit(): boolean {
    if (!this.session) return false;
    return this.session.organizerId === this.currentUserId || 
           this.session.isOwner === true;
  }

  canDelete(): boolean {
    if (!this.session) return false;
    return this.session.organizerId === this.currentUserId || 
           this.session.isOwner === true;
  }

  // Helpers
  getInitial(name: string | undefined | null): string {
    if (!name || name.trim() === '') return '?';
    return name.charAt(0).toUpperCase();
  }

  getFileIcon(fileType: string | undefined): string {
    if (!fileType) return '📎';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    return '📎';
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Navigation methods for new features
  goToDiscussions() {
    if (this.session?.id) {
      const sessionId = this.session.id;

      this.ensureLiveMeetingForSession(sessionId).pipe(takeUntil(this.destroy$)).subscribe({
        next: ({ meetingId }) => {
          if (meetingId) {
            this.router.navigate(['/collaboration/dashboard/meetings', meetingId, 'live']);
            return;
          }
          this.errorMessage = 'Impossible de démarrer la réunion live pour cette session.';
        },
        error: () => {
          this.errorMessage = 'Impossible de démarrer la réunion live pour cette session.';
        }
      });
    }
  }

  goToDocumentDetail(documentId: number) {
    if (this.session?.id) {
      this.router.navigate(['/collaboration/dashboard/document', this.session.id, documentId]);
    }
  }

  private ensureLiveMeetingForSession(sessionId: number): Observable<{ meetingId?: number; meetingLink?: string }> {
    const storedMeetingId = this.getStoredMeetingId(sessionId);
    if (storedMeetingId) {
      return of({ meetingId: storedMeetingId, meetingLink: this.session?.meetingLink });
    }

    const lastCreatedMeetingId = this.getLastCreatedMeetingId();
    if (lastCreatedMeetingId) {
      this.saveStoredMeetingId(sessionId, lastCreatedMeetingId);
      return of({
        meetingId: lastCreatedMeetingId,
        meetingLink: this.getLastCreatedMeetingLink() || this.session?.meetingLink
      });
    }

    const syntheticMeetingId = Date.now();
    const roomName = this.meetingService.generateJitsiRoomName(syntheticMeetingId);
    const roomUrl = this.meetingService.getJitsiRoomUrl(roomName);
    const now = new Date();
    const scheduledDate = now.toISOString().split('T')[0];
    const scheduledTime = now.toTimeString().slice(0, 5);
    const meetingPayload: any = {
      title: `Réunion - Session #${sessionId} - ${this.session?.title || 'Cas médical'}`,
      meetingLink: roomUrl,
      scheduledDate,
      scheduledTime,
      isRecorded: true
    };

    return this.meetingService.createMeeting(meetingPayload).pipe(
      map((createdMeeting: any) => {
        if (createdMeeting?.id) {
          this.saveStoredMeetingId(sessionId, createdMeeting.id);
        }
        return {
          meetingId: createdMeeting?.id,
          meetingLink: createdMeeting?.meetingLink || roomUrl
        };
      }),
      catchError((error) => {
        console.error('[CollaborationDetail] Auto-create meeting failed:', error);
        return of({ meetingId: undefined, meetingLink: this.session?.meetingLink });
      })
    );
  }

  private getLastCreatedMeetingId(): number | undefined {
    const value = Number(localStorage.getItem(this.lastCreatedMeetingIdKey));
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

  private getLastCreatedMeetingLink(): string | undefined {
    const value = localStorage.getItem(this.lastCreatedMeetingLinkKey);
    return value || undefined;
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

  private saveStoredMeetingId(sessionId: number, meetingId: number): void {
    try {
      const raw = localStorage.getItem(this.sessionMeetingMapKey);
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      map[String(sessionId)] = meetingId;
      localStorage.setItem(this.sessionMeetingMapKey, JSON.stringify(map));
    } catch (error) {
      console.warn('[CollaborationDetail] Failed to persist session/meeting map:', error);
    }
  }

  getLinkedMeetingIdForCurrentSession(): number | undefined {
    if (!this.session?.id) return undefined;
    return this.getStoredMeetingId(this.session.id);
  }

  linkSessionToMeetingById(rawMeetingId: string): void {
    if (!this.session?.id) {
      this.errorMessage = 'Session invalide.';
      return;
    }

    const meetingId = Number(rawMeetingId);
    if (!Number.isFinite(meetingId) || meetingId <= 0) {
      this.errorMessage = 'Veuillez saisir un ID de réunion valide.';
      return;
    }

    this.isLinkingMeeting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.meetingService.getMeetingById(meetingId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.saveStoredMeetingId(this.session!.id!, meetingId);
        this.successMessage = `Session #${this.session!.id} liée à la réunion #${meetingId}.`;
        this.isLinkingMeeting = false;
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: () => {
        this.errorMessage = `La réunion #${meetingId} n'existe pas ou n'est pas accessible.`;
        this.isLinkingMeeting = false;
      }
    });
  }

  linkSessionToLastCreatedMeeting(): void {
    if (!this.session?.id) {
      this.errorMessage = 'Session invalide.';
      return;
    }

    const lastMeetingId = this.getLastCreatedMeetingId();
    if (!lastMeetingId) {
      this.errorMessage = 'Aucune réunion récente trouvée. Créez d\'abord une réunion.';
      return;
    }

    this.saveStoredMeetingId(this.session.id, lastMeetingId);
    this.successMessage = `Session #${this.session.id} liée à la dernière réunion créée (#${lastMeetingId}).`;
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  inviteParticipant() {
    if (!this.session?.id) {
      this.errorMessage = 'Session invalide. Veuillez recharger la page.';
      return;
    }
    if (this.inviteForm.invalid) {
      this.errorMessage = 'Veuillez saisir un email valide.';
      return;
    }

    const email = (this.inviteForm.get('email')?.value || '').toString().trim();
    const role = this.inviteForm.get('role')?.value as 'EDITOR' | 'VIEWER';

    this.errorMessage = '';
    this.successMessage = '';

    // Check if already participant BEFORE sending request
    if (this.session?.participants && this.session.participants.length > 0) {
      const alreadyInvited = this.session.participants.some(p => 
        p.email?.toLowerCase() === email.toLowerCase()
      );
      if (alreadyInvited) {
        console.warn('[CollaborationDetail] User already participant:', email);
        this.errorMessage = `❌ ${email} est déjà participant dans cette session.`;
        setTimeout(() => (this.errorMessage = ''), 5000);
        return;
      }
    }

    this.isSubmitting = true;

    console.log('[CollaborationDetail] Inviting participant:', { sessionId: this.session.id, email, role });

    this.collaborationService.inviteParticipant(this.session.id, email, role).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (participant) => {
        console.log('[CollaborationDetail] Participant invited successfully:', participant);
        
        // Generate invitation token and link
        const sessionId = this.session?.id;
        if (!sessionId) {
          console.error('[CollaborationDetail] Session ID is missing');
          this.errorMessage = '❌ Erreur: ID de session manquant';
          return;
        }

        this.ensureLiveMeetingForSession(sessionId).pipe(takeUntil(this.destroy$)).subscribe({
          next: ({ meetingId, meetingLink }) => {
            const invitationToken = this.invitationService.generateInvitationToken(
              sessionId,
              email,
              role,
              meetingId,
              meetingLink || this.session?.meetingLink
            );
            const invitationLink = this.invitationService.generateInvitationLink(invitationToken.token);

            this.lastInvitationLink = invitationLink;
            this.lastInvitedEmail = email;
            this.showInvitationLink = true;

            this.successMessage = '✅ Participant invité avec succès! Un lien d\'invitation live a été généré.';
            this.showInviteForm = false;
            this.showQuickInviteForm = false; // Close quick invite form too
            this.inviteForm.reset({ email: '', role: 'VIEWER' });

            // Add newly invited participant to local array instead of reloading
            // This avoids the 500 error on the participants endpoint
            if (this.session && !this.session.participants) {
              this.session.participants = [];
            }
            if (this.session?.participants && participant) {
              const exists = this.session.participants.some(p => p.id === participant.id);
              if (!exists) {
                console.log('[CollaborationDetail] Adding newly invited participant to list:', participant);
                this.session.participants = [...this.session.participants, participant];
              }
            }

            this.isSubmitting = false;
            this.cdr.markForCheck();
            setTimeout(() => (this.successMessage = ''), 5000);
          },
          error: (meetingError) => {
            console.error('[CollaborationDetail] Error resolving/creating linked meeting:', meetingError);
            this.errorMessage = 'Participant invité, mais impossible de préparer la réunion live.';
            this.isSubmitting = false;
            this.cdr.markForCheck();
            setTimeout(() => (this.errorMessage = ''), 5000);
          }
        });
      },
      error: (error) => {
        console.error('[CollaborationDetail] Error inviting participant:', error);
        const msg: string = (error?.error?.message || error?.message || 'Erreur inconnue').toString().toLowerCase();

        // "Already participant" → show as info, not error
        const alreadyKeywords = ['déjà', 'already', 'exist', 'duplicate', 'conflict'];
        if (alreadyKeywords.some(k => msg.includes(k))) {
          this.successMessage = `ℹ️ ${email} est déjà participant dans cette session.`;
          this.showInviteForm = false;
          this.showQuickInviteForm = false;
          this.inviteForm.reset({ email: '', role: 'VIEWER' });
        } else {
          this.errorMessage = `Erreur lors de l'invitation: ${error?.error?.message || error?.message || 'Erreur inconnue'}`;
          setTimeout(() => (this.errorMessage = ''), 5000);
        }
        this.isSubmitting = false;
        this.cdr.markForCheck();
        setTimeout(() => (this.successMessage = ''), 5000);
      }
    });
  }

  deleteParticipant(participantId: number, participantName: string) {
    if (!this.session?.id || !confirm(`Êtes-vous sûr de vouloir supprimer ${participantName}?`)) return;

    console.log('[CollaborationDetail] Deleting participant:', { sessionId: this.session.id, participantId });

    this.collaborationService.deleteParticipant(this.session.id, participantId).subscribe({
      next: () => {
        console.log('[CollaborationDetail] Participant deleted successfully');
        this.successMessage = `${participantName} a été supprimé de la session`;
        
        // Remove participant from local array instead of reloading
        // This avoids the 500 error on the participants endpoint
        if (this.session?.participants) {
          this.session.participants = this.session.participants.filter(p => p.id !== participantId);
          console.log('[CollaborationDetail] Participant removed from local list');
        }
        
        this.cdr.markForCheck();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        console.error('[CollaborationDetail] Error deleting participant:', error);
        const msg = error?.error?.message || error?.message || 'Erreur inconnue';
        this.errorMessage = `Erreur lors de la suppression du participant: ${msg}`;
        this.cdr.markForCheck();
        setTimeout(() => (this.errorMessage = ''), 5000);
      }
    });
  }

  /**
   * Copie le lien d'invitation dans le presse-papiers
   */
  copyInvitationLink(): void {
    if (!this.lastInvitationLink) return;

    navigator.clipboard.writeText(this.lastInvitationLink).then(() => {
      console.log('[CollaborationDetail] Invitation link copied to clipboard');
      this.successMessage = '✅ Lien d\'invitation copié!';
      setTimeout(() => (this.successMessage = ''), 3000);
    }).catch(error => {
      console.error('[CollaborationDetail] Failed to copy link:', error);
      this.errorMessage = '❌ Erreur lors de la copie du lien';
      setTimeout(() => (this.errorMessage = ''), 3000);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}