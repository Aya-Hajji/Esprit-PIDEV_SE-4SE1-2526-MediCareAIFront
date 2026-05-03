import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MeetingService } from '../../services/meeting.service';
import { Subject, of } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-discussion-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discussion-editor.component.html',
  styleUrls: ['./discussion-editor.component.css']
})
export class DiscussionEditorComponent implements OnInit, OnDestroy {
  private readonly sessionMeetingMapKey = 'session_live_meeting_map';
  isLoading = false;
  errorMessage = '';
  redirectingMessage = 'Préparation de la réunion live...';
  
  sessionId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private meetingService: MeetingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.sessionId = +params['id'];
        console.log('[DiscussionEditor] SessionId from route:', this.sessionId);
        if (this.sessionId) {
          this.redirectToLiveMeeting(this.sessionId);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private redirectToLiveMeeting(sessionId: number) {
    this.isLoading = true;
    this.errorMessage = '';
    const storedMeetingId = this.getStoredMeetingId(sessionId);
    if (storedMeetingId) {
      this.isLoading = false;
      this.router.navigate(['/collaboration/dashboard/meetings', storedMeetingId, 'live']);
      return;
    }

    const syntheticMeetingId = Date.now();
    const roomName = this.meetingService.generateJitsiRoomName(syntheticMeetingId);
    const roomUrl = this.meetingService.getJitsiRoomUrl(roomName);
    const now = new Date();
    const scheduledDate = now.toISOString().split('T')[0];
    const scheduledTime = now.toTimeString().slice(0, 5);
    const payload: any = {
      title: `Réunion - Session #${sessionId}`,
      meetingLink: roomUrl,
      scheduledDate,
      scheduledTime,
      isRecorded: true
    };

    this.meetingService.createMeeting(payload).pipe(
      map((created: any) => created?.id),
      map((meetingId?: number) => {
        if (meetingId) {
          this.saveStoredMeetingId(sessionId, meetingId);
        }
        return meetingId;
      }),
      catchError((error) => {
        console.error('[DiscussionEditor] Auto-create meeting failed:', error);
        return of(undefined);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (meetingId?: number) => {
        this.isLoading = false;
        if (meetingId) {
          this.router.navigate(['/collaboration/dashboard/meetings', meetingId, 'live']);
          return;
        }
        this.errorMessage = 'Aucune réunion live disponible pour cette session.';
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Impossible de préparer la réunion live.';
      }
    });
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
      console.warn('[DiscussionEditor] Failed to persist session/meeting map:', error);
    }
  }

  goBack() {
    if (this.sessionId) {
      this.router.navigate(['/collaboration/dashboard', this.sessionId]);
    }
  }
}
