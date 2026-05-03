import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MeetingService } from '../../services/meeting.service';
import { CollaborationService } from '../../services/collaboration.service';
import { MeetingExtended } from '../../models/collaboration.model';

@Component({
  selector: 'app-create-meeting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-meeting.component.html',
  styleUrls: ['./create-meeting.component.css']
})
export class CreateMeetingComponent implements OnInit {
  private readonly sessionMeetingMapKey = 'session_live_meeting_map';
  private readonly lastCreatedMeetingIdKey = 'last_created_meeting_id';
  private readonly lastCreatedMeetingLinkKey = 'last_created_meeting_link';
  private linkSessionId: number | null = null;
  meetingForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private meetingService: MeetingService,
    private collaborationService: CollaborationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    console.log('[CreateMeeting] Component initialized');
    const sessionIdParam = this.route.snapshot.queryParamMap.get('sessionId');
    this.linkSessionId = sessionIdParam ? Number(sessionIdParam) : null;
  }

  /**
   * Initialize form with fields
   */
  private initializeForm() {
    this.meetingForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      scheduledDate: ['', Validators.required],
      scheduledTime: ['14:00', Validators.required],
      allowRecording: [true],
      duration: [60, [Validators.required, Validators.min(15), Validators.max(480)]]
    });
  }

  /**
   * Create meeting
   */
  createMeeting() {
    if (this.meetingForm.invalid) {
      this.errorMessage = 'Formulaire invalide';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.meetingForm.value;
    const meetingId = Date.now();
    const roomName = this.meetingService.generateJitsiRoomName(meetingId);
    const roomUrl = this.meetingService.getJitsiRoomUrl(roomName);

    const meeting: Partial<MeetingExtended> = {
      title: formValue.title,
      meetingLink: roomUrl,
      scheduledDate: formValue.scheduledDate,
      scheduledTime: formValue.scheduledTime,
      duration: formValue.duration,
      isRecorded: formValue.allowRecording
    };

    this.meetingService.createMeeting(meeting).subscribe({
      next: (createdMeeting: MeetingExtended) => {
        console.log('[CreateMeeting] ✅ Réunion créée:', createdMeeting);
        if (createdMeeting?.id) {
          localStorage.setItem(this.lastCreatedMeetingIdKey, String(createdMeeting.id));
        }
        if ((createdMeeting as any)?.meetingLink) {
          localStorage.setItem(this.lastCreatedMeetingLinkKey, String((createdMeeting as any).meetingLink));
        }
        if (this.linkSessionId && createdMeeting?.id) {
          this.saveSessionMeetingMap(this.linkSessionId, createdMeeting.id);
        }
        this.successMessage = '✅ Réunion créée avec succès !';
        
        setTimeout(() => {
          this.router.navigate(['/collaboration/dashboard/meetings']);
        }, 2000);
      },
      error: (error) => {
        console.error('[CreateMeeting] ❌ Erreur:', error);
        this.errorMessage = error?.error?.message || 'Erreur lors de la création de la réunion';
        this.isLoading = false;
      }
    });
  }

  private saveSessionMeetingMap(sessionId: number, meetingId: number): void {
    try {
      const raw = localStorage.getItem(this.sessionMeetingMapKey);
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      map[String(sessionId)] = meetingId;
      localStorage.setItem(this.sessionMeetingMapKey, JSON.stringify(map));
    } catch (error) {
      console.warn('[CreateMeeting] Failed to persist session/meeting map:', error);
    }
  }

  /**
   * Cancel and go back
   */
  cancel() {
    this.router.navigate(['/collaboration/dashboard/meetings']);
  }

  /**
   * Get today's date for minimum selection
   */
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
