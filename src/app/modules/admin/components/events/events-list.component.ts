import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, map, of, retry, timeout } from 'rxjs';
import { HealthEventService } from '../../../../shared/services/health-event.service';
import { Feedback, HealthEvent } from '../../../../shared/models/health-event.model';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../shared/services/user.service';
import { EventReminder, ReminderService } from '../../../../shared/services/reminder.service';
import { EventRecommendationService } from '../../../../shared/services/event-recommendation.service';

type RecommendationGroup = {
  category: string;
  events: HealthEvent[];
};

type AdminViewTab = 'events' | 'feedbacks';

type FeedbackRequestDTO = {
  userName: string;
  comment: string;
  rating: number;
  healthEventId: number;
  userId: number;
};

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {
  events: HealthEvent[] = [];
  feedbacks: Feedback[] = [];
  selectedFeedbackEvent: HealthEvent | null = null;
  feedbackLoading = false;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  activeReminders: EventReminder[] = [];
  showReminderPopup = false;
  isPatient = false;
  recommendationsLoading = false;
  recommendationsError: string | null = null;
  showRecommendations = false;
  recommendationGroups: RecommendationGroup[] = [];
  recommendedEvents: HealthEvent[] = [];

  isAdmin = false;
  adminViewTab: AdminViewTab = 'events';
  currentUserId: number | null = null;
  currentUserEmail: string | null = null;
  currentUserName: string | null = null;
  currentUserIdentity: string | null = null;
  isResolvingUserId = false;
  private pendingUserIdResolvers: Array<() => void> = [];

  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  editingEventId: number | null = null;
  editingFeedbackId: number | null = null;
  feedbackMode: 'create' | 'edit' = 'create';
  feedbackForm: Feedback = {
    userName: '',
    comment: '',
    rating: 5
  };

  joinedEventIds = new Set<number>();
  joiningEventIds = new Set<number>();

  // Search
  searchQuery = '';
  filteredEvents: HealthEvent[] = [];

  readonly categories: Array<NonNullable<HealthEvent['category']>> = [
    'VACCINATION',
    'AWARENESS',
    'TRAINING',
    'CONSULTATION',
    'OTHER'
  ];

  eventForm: Required<Pick<HealthEvent, 'title' | 'category' | 'description' | 'eventDate' | 'location'>> = {
    title: '',
    category: 'OTHER',
    description: '',
    eventDate: '',
    location: ''
  };

  constructor(
    private eventService: HealthEventService,
    private authService: AuthService,
    private userService: UserService,
    private reminderService: ReminderService,
    private eventRecommendationService: EventRecommendationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initUserContext();
    if (!this.isAdmin && !this.currentUserId) {
      this.resolveCurrentUserId(undefined, true);
    }
    this.loadEvents();
    this.loadReminders();
  }

  private loadReminders(preserveExistingOnEmpty = false): void {
    this.reminderService.triggerCheck().subscribe({
      next: (reminders: EventReminder[]) => {
        const nextReminders = reminders || [];
        if (nextReminders.length > 0) {
          this.activeReminders = nextReminders;
        } else if (!preserveExistingOnEmpty) {
          this.activeReminders = [];
        }

        if (this.activeReminders.length > 0) {
          this.showReminderPopup = true;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.showReminderPopup = false;
            this.activeReminders = [];
            this.cdr.detectChanges();
          }, 15000);
        }
      },
      error: (err) => {
        console.error('[loadReminders] Error triggering reminder check:', err);
        this.activeReminders = [];
      }
    });
  }

  closeReminderPopup(): void {
    this.showReminderPopup = false;
  }

  loadRecommendations(): void {
    if (!this.isPatient) {
      return;
    }

    if (!this.currentUserId) {
      this.resolveCurrentUserId(() => this.loadRecommendations(), false);
      return;
    }

    this.recommendationsLoading = true;
    this.recommendationsError = null;
    this.showRecommendations = true;
    this.cdr.detectChanges();

    this.eventRecommendationService.getRecommendations(this.currentUserId).subscribe({
      next: (orderedEvents) => {
        if (Array.isArray(orderedEvents) && orderedEvents.length > 0) {
          const orderedIds = orderedEvents.map((e) => e.id);

          this.events.sort((a, b) => {
            const idxA = orderedIds.indexOf(a.id);
            const idxB = orderedIds.indexOf(b.id);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });

          this.events = [...this.events];
          this.applySearch();
        }
        this.recommendationsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.recommendationsError = 'Unable to load recommendations.';
        this.recommendationsLoading = false;
        this.cdr.detectChanges();
        this.showRecommendations = false;
      }
    });
  }

  hideRecommendations(): void {
    this.showRecommendations = false;
    this.loadEvents();
  }

  private shouldCheckReminderForEvent(event: HealthEvent): boolean {
    if (!event.eventDate) {
      return false;
    }

    const eventTime = new Date(event.eventDate).getTime();
    if (!Number.isFinite(eventTime)) {
      return false;
    }

    const now = Date.now();
    const diffMs = eventTime - now;
    const next24hMs = 24 * 60 * 60 * 1000;
    return diffMs >= 0 && diffMs <= next24hMs;
  }

  private initUserContext(): void {
    const user = this.authService.currentUserValue;

    const role = this.normalizeRole(user?.role);
    this.isAdmin = role === 'ADMIN';
    this.isPatient = role === 'PATIENT';
    this.currentUserEmail = (user?.email || '').toString().trim() || null;
    if (!this.currentUserEmail) {
      this.currentUserEmail = this.extractEmailFromToken(this.authService.tokenValue);
    }
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    this.currentUserName = (user?.fullName || fullName || this.currentUserEmail || '').toString().trim() || null;
    this.currentUserIdentity = (
      user?.username ||
      user?.userName ||
      this.currentUserEmail?.split('@')[0] ||
      this.extractIdentityFromToken(this.authService.tokenValue) ||
      ''
    )
      .toString()
      .trim() || null;

    const parsedId = Number(
      user?.id ??
        user?.userId ??
        user?.uid ??
        user?.data?.id ??
        user?.profile?.id ??
        user?.user?.id ??
        user?.user?.userId
    );
    this.currentUserId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;

    if (!this.currentUserId) {
      this.currentUserId = this.extractNumericIdDeep(user);
    }

    if (!this.currentUserId) {
      this.currentUserId = this.extractUserIdFromToken(this.authService.tokenValue);
    }

    if (this.currentUserId) {
      try {
        localStorage.removeItem(`joined_events_${this.currentUserId}`);
      } catch {
        /* ignore */
      }
    }
  }

  private normalizeRole(role: unknown): string {
    return (role || '').toString().toUpperCase().replace('ROLE_', '').trim();
  }

  loadEvents(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.eventService
      .getAllEvents()
      .pipe(
        timeout(10000),
        retry({ count: 1, delay: 350 }),
        catchError(() => of([] as HealthEvent[])),
        map((events) => (Array.isArray(events) ? events : [])),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (events) => {
          this.events = events;

          if (this.selectedFeedbackEvent?.id) {
            const refreshed = this.events.find((e) => e.id === this.selectedFeedbackEvent?.id);
            if (refreshed) this.selectedFeedbackEvent = refreshed;
          }

          if (!this.isAdmin && !this.currentUserId) {
            this.currentUserId = this.tryResolveUserIdFromLoadedEvents();
            if (this.currentUserId) this.flushUserIdResolvers();
          }

          this.normalizeParticipantCounts();
          this.rebuildJoinedEventIds();
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Failed to load events';
        }
      });
  }

  private normalizeParticipantCounts(): void {
    this.events = this.events.map((event) => {
      let count = 0;
      if (Array.isArray((event as any).participants) && (event as any).participants.length > 0) {
        count = (event as any).participants.length;
      } else if (Array.isArray(event.participantIds) && event.participantIds.length > 0) {
        count = event.participantIds.length;
      } else if (typeof (event as any).numberOfParticipants === 'number' && (event as any).numberOfParticipants >= 0) {
        count = (event as any).numberOfParticipants;
      } else if (typeof (event as any).participantCount === 'number' && (event as any).participantCount >= 0) {
        count = (event as any).participantCount;
      } else if (typeof (event as any).participantsCount === 'number' && (event as any).participantsCount >= 0) {
        count = (event as any).participantsCount;
      } else if (typeof (event as any).totalParticipants === 'number' && (event as any).totalParticipants >= 0) {
        count = (event as any).totalParticipants;
      }

      return { ...event, numberOfParticipants: count, participantCount: count } as any;
    });

    if (this.selectedFeedbackEvent?.id) {
      const refreshed = this.events.find((e) => e.id === this.selectedFeedbackEvent?.id);
      if (refreshed) this.selectedFeedbackEvent = refreshed;
    }

    this.applySearch();
  }

  onSearchChange(): void {
    this.applySearch();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applySearch();
  }

  private applySearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredEvents = [...this.events];
    } else {
      this.filteredEvents = this.events.filter((e) => (e.title || '').toLowerCase().includes(q));
    }
  }

  loadFeedbacks(): void {
    if (!this.isAdmin) return;

    this.loading = true;
    this.error = null;
    this.eventService.getAllFeedbacks().subscribe({
      next: (feedbacks) => {
        this.feedbacks = feedbacks;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load feedbacks';
        this.loading = false;
      }
    });
  }

  openEventFeedbackPanel(event: HealthEvent): void {
    if (this.isAdmin || !event.id) return;

    if (this.selectedFeedbackEvent?.id === event.id) {
      this.closeEventFeedbackPanel();
      return;
    }

    this.selectedFeedbackEvent = event;
    this.feedbackMode = 'create';
    this.editingFeedbackId = null;
    this.feedbackForm = this.buildEmptyFeedbackForm(event.id);
    this.loadFeedbacksForEvent(event.id);
  }

  closeEventFeedbackPanel(): void {
    this.selectedFeedbackEvent = null;
    this.feedbackLoading = false;
    this.editingFeedbackId = null;
    this.feedbackMode = 'create';
    this.feedbackForm = {
      userName: '',
      comment: '',
      rating: 5
    };
  }

  loadFeedbacksForEvent(eventId: number): void {
    this.feedbackLoading = true;
    this.error = null;
    this.eventService.getFeedbacksByEvent(eventId).subscribe({
      next: (feedbacks) => {
        this.feedbacks = feedbacks;
        this.feedbackLoading = false;
      },
      error: () => {
        this.error = 'Failed to load feedbacks for this event';
        this.feedbackLoading = false;
      }
    });
  }

  openCreateModal(): void {
    if (!this.isAdmin) return;
    this.modalMode = 'add';
    this.editingEventId = null;
    this.eventForm = {
      title: '',
      category: 'OTHER',
      description: '',
      eventDate: '',
      location: ''
    };
    this.showModal = true;
  }

  deleteFeedback(feedback: Feedback): void {
    if (!feedback.id) return;
    if (confirm('Delete this feedback?')) {
      this.eventService.deleteFeedback(feedback.id).subscribe({
        next: () => {
          this.success = 'Feedback deleted successfully.';
          this.error = null;
          if (this.isAdmin) {
            this.loadFeedbacks();
          } else if (this.selectedFeedbackEvent?.id) {
            this.loadFeedbacksForEvent(this.selectedFeedbackEvent.id);
          }
        },
        error: () => {
          this.error = 'Unable to delete feedback.';
        }
      });
    }
  }

  submitFeedback(): void {
    const selectedEventId = this.selectedFeedbackEvent?.id ?? this.feedbackForm.healthEventId;
    if (!selectedEventId) return;

    if (!this.currentUserId) {
      this.resolveCurrentUserId(() => this.submitFeedback(), false);
      return;
    }

    const payload: FeedbackRequestDTO = {
      userName: this.feedbackForm.userName?.trim() || this.currentUserName || this.currentUserEmail || 'Anonymous',
      comment: this.feedbackForm.comment?.trim() || '',
      rating: Math.max(1, Math.min(5, Number(this.feedbackForm.rating) || 5)),
      healthEventId: selectedEventId,
      userId: this.currentUserId
    };

    const request$ =
      this.feedbackMode === 'edit' && this.editingFeedbackId
        ? this.eventService.updateFeedback(this.editingFeedbackId, payload)
        : this.eventService.createFeedback(payload);

    request$.subscribe({
      next: () => {
        this.success =
          this.feedbackMode === 'edit' ? 'Feedback updated successfully.' : 'Feedback created successfully.';
        this.error = null;
        this.feedbackMode = 'create';
        this.editingFeedbackId = null;
        this.feedbackForm = this.buildEmptyFeedbackForm(selectedEventId);
        if (this.isAdmin) {
          this.loadFeedbacks();
        } else {
          this.loadFeedbacksForEvent(selectedEventId);
        }
      },
      error: () => {
        this.error = this.feedbackMode === 'edit' ? 'Unable to update feedback.' : 'Unable to create feedback.';
      }
    });
  }

  openEditModal(event: HealthEvent): void {
    if (!this.isAdmin || !event.id) return;
    this.modalMode = 'edit';
    this.editingEventId = event.id;
    this.eventForm = {
      title: event.title || '',
      category: (event as any).category || 'OTHER',
      description: (event as any).description || '',
      eventDate: this.toDateTimeLocalValue(event.eventDate),
      location: (event as any).location || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  submitEvent(): void {
    if (!this.isAdmin) return;
    const title = this.eventForm.title.trim();
    if (!title || !this.eventForm.eventDate) {
      this.error = 'Title and date are required.';
      return;
    }

    const payload: Partial<HealthEvent> = {
      title,
      category: this.eventForm.category,
      description: this.eventForm.description?.trim() || undefined,
      location: this.eventForm.location?.trim() || undefined,
      eventDate: this.eventForm.eventDate
    };

    const request$ =
      this.modalMode === 'add'
        ? this.eventService.createEvent(payload as HealthEvent)
        : this.eventService.updateEvent(this.editingEventId!, payload);

    request$.subscribe({
      next: () => {
        this.success = this.modalMode === 'add' ? 'Event created.' : 'Event updated.';
        this.error = null;
        this.closeModal();
        this.loadEvents();
      },
      error: () => {
        this.error = 'Unable to save event.';
      }
    });
  }

  deleteEvent(id: number): void {
    if (!this.isAdmin) return;
    if (confirm('Delete this event?')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          this.success = 'Event deleted.';
          this.loadEvents();
        },
        error: () => {
          this.error = 'Unable to delete event.';
        }
      });
    }
  }

  setAdminViewTab(tab: AdminViewTab): void {
    this.adminViewTab = tab;
    this.error = null;
    this.success = null;

    if (tab === 'feedbacks' && this.feedbacks.length === 0) {
      this.loadFeedbacks();
    }
  }

  isMyFeedback(feedback: Feedback): boolean {
    const feedbackAuthor = (feedback.userName || '').trim().toLowerCase();
    const currentUserName = (this.currentUserName || '').trim().toLowerCase();
    const currentUserEmail = (this.currentUserEmail || '').trim().toLowerCase();
    return !!feedbackAuthor && (feedbackAuthor === currentUserName || feedbackAuthor === currentUserEmail);
  }

  startCreateFeedback(event: HealthEvent): void {
    if (!event.id) return;
    this.selectedFeedbackEvent = event;
    this.feedbackMode = 'create';
    this.editingFeedbackId = null;
    this.feedbackForm = this.buildEmptyFeedbackForm(event.id);
    this.loadFeedbacksForEvent(event.id);
  }

  startEditMyFeedback(feedback: Feedback): void {
    const eventId = feedback.healthEventId;
    if (!eventId) return;

    const selectedEvent = this.events.find((event) => event.id === eventId) || null;
    if (selectedEvent) {
      this.selectedFeedbackEvent = selectedEvent;
    }

    this.feedbackMode = 'edit';
    this.editingFeedbackId = feedback.id ?? null;
    this.feedbackForm = {
      id: feedback.id,
      userName: feedback.userName || this.currentUserName || this.currentUserEmail || '',
      comment: feedback.comment || '',
      rating: feedback.rating || 5,
      createdAt: feedback.createdAt,
      healthEventId: eventId
    };
  }

  joinEvent(event: HealthEvent): void {
    if (!event.id) return;
    if (this.joiningEventIds.has(event.id)) return;

    if (!this.currentUserId) {
      this.resolveCurrentUserId(() => this.performJoin(event), false);
      return;
    }

    this.performJoin(event);
  }

  private performJoin(event: HealthEvent): void {
    if (!event.id || !this.currentUserId) return;

    const originalEvent = this.events.find((e) => e.id === event.id) || event;

    this.joiningEventIds.add(originalEvent.id!);
    const previousState = { ...originalEvent } as any;
    this.applyParticipationChange(originalEvent, true);
    const nextJoined = new Set(this.joinedEventIds);
    nextJoined.add(originalEvent.id!);
    this.joinedEventIds = nextJoined;

    this.eventService
      .addParticipant(originalEvent.id!, this.currentUserId)
      .pipe(
        finalize(() => {
          this.joiningEventIds.delete(originalEvent.id!);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.success = 'You joined the event successfully.';
          this.error = null;
          if (this.shouldCheckReminderForEvent(originalEvent)) {
            this.loadReminders(true);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(`[joinEvent] error:`, err);
          Object.assign(originalEvent as any, previousState);
          const rollbackJoinedIds = new Set(this.joinedEventIds);
          rollbackJoinedIds.delete(originalEvent.id!);
          this.joinedEventIds = rollbackJoinedIds;
          this.persistJoinedIds(this.joinedEventIds);
          this.error = 'Unable to join this event.';
          this.cdr.markForCheck();
        }
      });
  }

  leaveEvent(event: HealthEvent): void {
    if (!event.id || !this.currentUserId) return;

    const originalEvent = this.events.find((e) => e.id === event.id) || event;

    if (confirm('Are you sure you want to leave this event?')) {
      const previousState = { ...originalEvent } as any;
      this.applyParticipationChange(originalEvent, false);
      const nextJoinedEventIds = new Set(this.joinedEventIds);
      nextJoinedEventIds.delete(originalEvent.id!);
      this.joinedEventIds = nextJoinedEventIds;

      this.eventService.removeParticipant(originalEvent.id!, this.currentUserId).subscribe({
        next: () => {
          this.success = 'You left the event.';
          this.error = null;
          this.loadReminders();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(`[leaveEvent] Error:`, err);
          Object.assign(originalEvent as any, previousState);
          const rollbackJoined = new Set(this.joinedEventIds);
          rollbackJoined.add(originalEvent.id!);
          this.joinedEventIds = rollbackJoined;
          this.persistJoinedIds(this.joinedEventIds);
          this.error = 'Unable to leave this event.';
          this.cdr.markForCheck();
        }
      });
    }
  }

  canJoin(event: HealthEvent): boolean {
    return !this.isAdmin && !!event.id && !this.isAlreadyJoined(event) && !this.joiningEventIds.has(event.id!);
  }

  isJoinInProgress(event: HealthEvent): boolean {
    return !!event.id && this.joiningEventIds.has(event.id);
  }

  isAlreadyJoined(event: HealthEvent): boolean {
    if (!event.id) return false;
    if (!this.currentUserId) return false;
    if (this.joinedEventIds.has(event.id)) return true;

    if (Array.isArray(event.participantIds)) {
      return event.participantIds.map(Number).includes(this.currentUserId);
    }

    if (Array.isArray((event as any).participants)) {
      return (event as any).participants.some((p: any) => Number(p?.id) === this.currentUserId);
    }

    return false;
  }

  getParticipantsCount(event: HealthEvent): number {
    try {
      if (typeof (event as any).numberOfParticipants === 'number' && (event as any).numberOfParticipants >= 0) {
        return (event as any).numberOfParticipants;
      }
      if (typeof (event as any).participantCount === 'number' && (event as any).participantCount >= 0) {
        return (event as any).participantCount;
      }
      if (Array.isArray((event as any).participants)) {
        return (event as any).participants.length;
      }
      if (Array.isArray(event.participantIds)) {
        return event.participantIds.length;
      }
      return 0;
    } catch (error) {
      console.error('[getParticipantsCount] Error:', error, 'Event:', event);
      return 0;
    }
  }

  getParticipantsList(event: HealthEvent): Array<{ id?: number; fullName?: string; email?: string }> {
    if (Array.isArray((event as any).participants) && (event as any).participants.length > 0) {
      return (event as any).participants;
    }
    if (Array.isArray(event.participantIds) && event.participantIds.length > 0) {
      return event.participantIds.map((id) => ({ id }));
    }
    return [];
  }

  getParticipantInitials(p: { id?: number; fullName?: string; email?: string }): string {
    if (p.fullName) {
      const parts = p.fullName.trim().split(/\s+/);
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
    }
    if (p.email) {
      return p.email.substring(0, 2).toUpperCase();
    }
    return p.id ? `#${p.id}` : '?';
  }

  getFeedbackEventTitle(feedback: Feedback): string {
    const matchedEvent = this.events.find((event) => event.id === feedback.healthEventId);
    return matchedEvent?.title || `Event #${feedback.healthEventId ?? '—'}`;
  }

  private buildEmptyFeedbackForm(eventId: number): Feedback {
    return {
      userName: this.currentUserName || this.currentUserEmail || '',
      comment: '',
      rating: 5,
      healthEventId: eventId
    };
  }

  trackByEventId(index: number, event: HealthEvent): number {
    return event.id ?? index;
  }

  private applyParticipationChange(event: HealthEvent, joined: boolean): void {
    if (!this.currentUserId || !event.id) {
      return;
    }

    const participantId = this.currentUserId;
    const participantSummary = {
      id: participantId,
      fullName: this.currentUserName || undefined,
      email: this.currentUserEmail || undefined
    };
    const participantIds = [...(event.participantIds ?? [])];
    const updatedEvent: any = {
      ...event,
      participantIds,
      participants: Array.isArray((event as any).participants) ? [...(event as any).participants] : (event as any).participants
    };

    if (joined) {
      if (!participantIds.map(Number).includes(participantId)) {
        updatedEvent.participantIds = [...participantIds, participantId];
      }
      if (Array.isArray(updatedEvent.participants)) {
        const alreadyPresent = updatedEvent.participants.some((p: any) => Number(p?.id) === participantId);
        if (!alreadyPresent) {
          updatedEvent.participants = [...updatedEvent.participants, participantSummary];
        }
      }
    } else {
      updatedEvent.participantIds = participantIds.filter((id) => Number(id) !== participantId);
      if (Array.isArray(updatedEvent.participants)) {
        updatedEvent.participants = updatedEvent.participants.filter((p: any) => Number(p?.id) !== participantId);
      }
    }

    const newCount =
      Array.isArray(updatedEvent.participants) && updatedEvent.participants.length > 0
        ? updatedEvent.participants.length
        : Array.isArray(updatedEvent.participantIds)
          ? updatedEvent.participantIds.length
          : Math.max(0, Number((event as any).numberOfParticipants ?? (event as any).participantCount ?? 0) + (joined ? 1 : -1));

    updatedEvent.numberOfParticipants = newCount;
    updatedEvent.participantCount = newCount;

    if (joined) {
      this.joinedEventIds = new Set([...this.joinedEventIds, event.id!]);
    } else {
      const nextJoinedEventIds = new Set(this.joinedEventIds);
      nextJoinedEventIds.delete(event.id!);
      this.joinedEventIds = nextJoinedEventIds;
    }

    this.persistJoinedIds(this.joinedEventIds);

    this.events = this.events.map((existingEvent) => (existingEvent.id === event.id ? (updatedEvent as HealthEvent) : existingEvent));

    if (this.selectedFeedbackEvent?.id === event.id) {
      this.selectedFeedbackEvent = updatedEvent as HealthEvent;
    }
  }

  private toDateTimeLocalValue(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  private get joinedStorageKey(): string {
    return `joined_events_${this.currentUserId ?? 'anon'}`;
  }

  private persistJoinedIds(ids: Set<number>): void {
    try {
      localStorage.setItem(this.joinedStorageKey, JSON.stringify([...ids]));
    } catch {
      // ignore
    }
  }

  private rebuildJoinedEventIds(): void {
    if (!this.currentUserId) return;

    const joined = new Set<number>();

    for (const event of this.events) {
      if (!event.id) continue;
      const ids = Array.isArray(event.participantIds) ? event.participantIds.map(Number) : [];
      if (ids.includes(this.currentUserId)) {
        joined.add(event.id);
      } else if (Array.isArray((event as any).participants) && (event as any).participants.some((p: any) => Number(p?.id) === this.currentUserId)) {
        joined.add(event.id);
      }
    }

    this.joinedEventIds = new Set(joined);
    this.persistJoinedIds(joined);
  }

  private resolveCurrentUserId(onResolved?: () => void, silent = false): void {
    if (this.currentUserId) {
      if (onResolved) {
        onResolved();
      }
      return;
    }

    if (onResolved) {
      this.pendingUserIdResolvers.push(onResolved);
    }

    if (this.isResolvingUserId) {
      return;
    }

    const eventDerivedUserId = this.tryResolveUserIdFromLoadedEvents();
    if (eventDerivedUserId) {
      this.currentUserId = eventDerivedUserId;
      this.error = null;
      this.flushUserIdResolvers();
      return;
    }

    const tokenUserId = this.extractUserIdFromToken(this.authService.tokenValue);
    if (tokenUserId) {
      this.currentUserId = tokenUserId;
      this.error = null;
      this.flushUserIdResolvers();
      return;
    }

    this.isResolvingUserId = true;
    this.resolveUserIdByEmail(onResolved, silent);
  }

  private resolveUserIdByEmail(onResolved?: () => void, silent = false): void {
    if (!this.currentUserEmail) {
      this.handleJwtFallback(onResolved, silent);
      return;
    }

    this.userService.getUserByEmail(this.currentUserEmail).pipe(
      timeout(5000),
      catchError(() => of(null))
    ).subscribe({
      next: (user) => {
        if (user) {
          const parsedId = Number(
            (user as any)?.id
            ?? (user as any)?.userId
            ?? (user as any)?.uid
            ?? (user as any)?.data?.id
            ?? (user as any)?.user?.id
          );
          this.currentUserId = Number.isFinite(parsedId) && parsedId > 0
            ? parsedId
            : this.extractNumericIdDeep(user);

          this.isResolvingUserId = false;

          if (this.currentUserId) {
            this.error = null;
            this.flushUserIdResolvers();
            return;
          }
        }

        this.handleJwtFallback(onResolved, silent);
      }
    });
  }

  private handleJwtFallback(_onResolved?: () => void, silent = false): void {
    const tokenUserId = this.extractUserIdFromToken(this.authService.tokenValue);
    if (tokenUserId) {
      this.currentUserId = tokenUserId;
      this.isResolvingUserId = false;
      this.error = null;
      this.flushUserIdResolvers();
      return;
    }

    this.isResolvingUserId = false;
    this.clearUserIdResolvers();
    if (!silent) {
      this.error = 'Unable to detect current user ID. Please log out and log in again.';
    }
  }

  private tryResolveUserIdFromLoadedEvents(): number | null {
    if (!this.currentUserEmail) {
      return null;
    }

    const targetEmail = this.currentUserEmail.toLowerCase().trim();
    for (const event of this.events) {
      if (!Array.isArray((event as any).participants)) continue;

      const matched = (event as any).participants.find((participant: any) => (participant?.email || '').toLowerCase().trim() === targetEmail);
      const parsedId = Number(matched?.id);
      if (Number.isFinite(parsedId) && parsedId > 0) {
        return parsedId;
      }
    }

    return null;
  }

  private flushUserIdResolvers(): void {
    if (!this.currentUserId || this.pendingUserIdResolvers.length === 0) {
      return;
    }

    const resolvers = [...this.pendingUserIdResolvers];
    this.pendingUserIdResolvers = [];
    for (const resolver of resolvers) {
      resolver();
    }

    if (this.events.length > 0) {
      this.normalizeParticipantCounts();
      this.rebuildJoinedEventIds();
    }
    this.cdr.detectChanges();
  }

  private clearUserIdResolvers(): void {
    this.pendingUserIdResolvers = [];
  }

  private extractNumericIdDeep(value: unknown): number | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const queue: unknown[] = [value];
    const seen = new Set<unknown>();
    const idKeys = new Set(['id', 'userId', 'uid', 'user_id', 'userID']);

    while (queue.length) {
      const current = queue.shift();
      if (!current || typeof current !== 'object' || seen.has(current)) {
        continue;
      }

      seen.add(current);
      if (Array.isArray(current)) {
        for (const item of current) {
          queue.push(item);
        }
        continue;
      }

      const record = current as Record<string, unknown>;
      for (const [key, raw] of Object.entries(record)) {
        if (idKeys.has(key)) {
          const candidate = Number(raw);
          if (Number.isFinite(candidate) && candidate > 0) {
            return candidate;
          }
        }

        if (raw && typeof raw === 'object') {
          queue.push(raw);
        }
      }
    }

    return null;
  }

  private extractUserIdFromToken(token: string | null): number | null {
    if (!token || !token.includes('.')) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));
      const candidate = Number(
        decoded?.id ??
          decoded?.userId ??
          decoded?.uid ??
          decoded?.user_id ??
          decoded?.userID ??
          decoded?.nameid ??
          decoded?.name_id ??
          decoded?.sub
      );

      return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
    } catch {
      return null;
    }
  }

  private extractEmailFromToken(token: string | null): string | null {
    if (!token || !token.includes('.')) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));
      const value = (decoded?.email ?? decoded?.upn ?? decoded?.preferred_username ?? decoded?.sub ?? '').toString().trim();
      return value.includes('@') ? value : null;
    } catch {
      return null;
    }
  }

  private extractIdentityFromToken(token: string | null): string | null {
    if (!token || !token.includes('.')) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));
      const value = (
        decoded?.preferred_username ??
          decoded?.username ??
          decoded?.name ??
          decoded?.unique_name ??
          decoded?.sub ??
          ''
      )
        .toString()
        .trim();
      return value || null;
    } catch {
      return null;
    }
  }
}
