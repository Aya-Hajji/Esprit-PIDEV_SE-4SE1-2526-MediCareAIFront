import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, map, of, retry, timeout, finalize } from 'rxjs';
import { HealthEventService } from '../../../../shared/services/health-event.service';
import { Feedback, FeedbackRequestDTO, HealthEvent } from '../../../../shared/models/health-event.model';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../shared/services/user.service';
import { ReminderService, EventReminder } from '../../../../shared/services/reminder.service';
import { EventRecommendationService } from '../../../../shared/services/event-recommendation.service';

type RecommendationGroup = {
  category: string;
  events: HealthEvent[];
};

type AdminViewTab = 'events' | 'feedbacks';

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
  
  // reminders: frontend does not display UI; only trigger backend check

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
    // Trigger backend reminder check immediately (endpoint does not require userId)
    // Backend will check events within 24h and send reminders to participants.
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

          // Auto-close after 15 seconds
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
    this.cdr.detectChanges(); // Force UI to show sorting/loading state immediately

    this.eventRecommendationService.getRecommendations(this.currentUserId).subscribe({
      next: (orderedEvents) => {
        if (Array.isArray(orderedEvents) && orderedEvents.length > 0) {
          // Instead of replacing the list, we re-order the existing 'this.events' array
          // based on the order returned from the recommendation engine.
          // This guarantees that all original object references (and their states/buttons) stay intact.
          const orderedIds = orderedEvents.map(e => e.id);
          
          this.events.sort((a, b) => {
            const idxA = orderedIds.indexOf(a.id);
            const idxB = orderedIds.indexOf(b.id);
            
            // If both are in recommendations, follow backend order
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            // Recommendations first
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            // Otherwise maintain existing order
            return 0;
          });
          
          // Trigger change detection to refresh the UI
          this.events = [...this.events];
          this.applySearch(); // keep filteredEvents in sync with sorted order
        }
        this.recommendationsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.recommendationsError = 'Unable to load recommendations.';
        this.recommendationsLoading = false;
        this.cdr.detectChanges(); // Force UI refresh on error
        this.showRecommendations = false;
      }
    });
  }

  hideRecommendations(): void {
    this.showRecommendations = false;
    // Reload original events list to restore default order
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
    console.log('[initUserContext] Auth user:', user);
    
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
      user?.username
      || user?.userName
      || this.currentUserEmail?.split('@')[0]
      || this.extractIdentityFromToken(this.authService.tokenValue)
      || ''
    ).toString().trim() || null;

    const parsedId = Number(
      user?.id
      ?? user?.userId
      ?? user?.uid
      ?? user?.data?.id
      ?? user?.profile?.id
      ?? user?.user?.id
      ?? user?.user?.userId
    );
    this.currentUserId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;

    if (!this.currentUserId) {
      this.currentUserId = this.extractNumericIdDeep(user);
    }

    // Fallback to JWT claims when auth user object has no numeric id.
    if (!this.currentUserId) {
      this.currentUserId = this.extractUserIdFromToken(this.authService.tokenValue);
    }

    console.log('[initUserContext] Extracted user context:', {
      isAdmin: this.isAdmin,
      currentUserEmail: this.currentUserEmail,
      currentUserName: this.currentUserName,
      currentUserIdentity: this.currentUserIdentity,
      currentUserId: this.currentUserId
    });

    // Clear any stale localStorage join data — backend is the only source of truth
    if (this.currentUserId) {
      try {
        localStorage.removeItem(`joined_events_${this.currentUserId}`);
      } catch { /* ignore */ }
    }
  }

  private normalizeRole(role: unknown): string {
    return (role || '').toString().toUpperCase().replace('ROLE_', '').trim();
  }

  loadEvents(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.eventService.getAllEvents().pipe(
      timeout(10000),
      retry({ count: 1, delay: 350 }),
      catchError(() => of([] as HealthEvent[])),
      map((events) => Array.isArray(events) ? events : []),
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (events) => {
        this.events = events;

        if (this.selectedFeedbackEvent?.id) {
          const refreshed = this.events.find(e => e.id === this.selectedFeedbackEvent?.id);
          if (refreshed) this.selectedFeedbackEvent = refreshed;
        }

        if (!this.isAdmin && !this.currentUserId) {
          this.currentUserId = this.tryResolveUserIdFromLoadedEvents();
          if (this.currentUserId) this.flushUserIdResolvers();
        }

        // Normalize participant counts from GET /events (backend now returns all participantIds)
        this.normalizeParticipantCounts(); // also calls applySearch()
        this.rebuildJoinedEventIds();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load events';
      }
    });
  }

  /**
   * Normalizes participant count fields from whatever GET /events returns.
   * GET /events/{id} returns 500, so we work only with the list response.
   * Sets numberOfParticipants and participantCount as the single source of truth.
   */
  private normalizeParticipantCounts(): void {
    this.events = this.events.map(event => {
      let count = 0;
      if (Array.isArray(event.participants) && event.participants.length > 0) {
        count = event.participants.length;
      } else if (Array.isArray(event.participantIds) && event.participantIds.length > 0) {
        count = event.participantIds.length;
      } else if (typeof event.numberOfParticipants === 'number' && event.numberOfParticipants >= 0) {
        count = event.numberOfParticipants;
      } else if (typeof event.participantCount === 'number' && event.participantCount >= 0) {
        count = event.participantCount;
      } else if (typeof (event as any).participantsCount === 'number' && (event as any).participantsCount >= 0) {
        count = (event as any).participantsCount;
      } else if (typeof (event as any).totalParticipants === 'number' && (event as any).totalParticipants >= 0) {
        count = (event as any).totalParticipants;
      }

      return { ...event, numberOfParticipants: count, participantCount: count };
    });

    if (this.selectedFeedbackEvent?.id) {
      const refreshed = this.events.find(e => e.id === this.selectedFeedbackEvent?.id);
      if (refreshed) this.selectedFeedbackEvent = refreshed;
    }

    // Keep filteredEvents in sync after normalization
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
      this.filteredEvents = this.events.filter(e =>
        (e.title || '').toLowerCase().includes(q)
      );
    }
  }


  /**
   * Rebuilds the joinedEventIds set from the loaded events array.
   * Called after events are enriched with participant data.
   * Also persists joined IDs to localStorage so status survives page refresh.
   */
  private rebuildJoinedEventIds(): void {
    if (!this.currentUserId) return;

    const joined = new Set<number>();

    for (const event of this.events) {
      if (!event.id) continue;
      const ids = Array.isArray(event.participantIds) ? event.participantIds.map(Number) : [];
      if (ids.includes(this.currentUserId)) {
        joined.add(event.id);
      } else if (Array.isArray(event.participants) && event.participants.some(p => Number(p?.id) === this.currentUserId)) {
        joined.add(event.id);
      }
    }

    // Source of truth is the backend only — do NOT merge with localStorage
    // to avoid showing stale "joined" status for events the user didn't join.
    this.joinedEventIds = new Set(joined);

    // Persist the accurate state from backend
    this.persistJoinedIds(joined);
  }

  /** localStorage key scoped to the current user */
  private get joinedStorageKey(): string {
    return `joined_events_${this.currentUserId ?? 'anon'}`;
  }

  private persistJoinedIds(ids: Set<number>): void {
    try {
      localStorage.setItem(this.joinedStorageKey, JSON.stringify([...ids]));
    } catch {
      // localStorage not available — ignore
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

  openFeedbackCreateForm(): void {
    if (!this.selectedFeedbackEvent?.id) return;
    this.feedbackMode = 'create';
    this.editingFeedbackId = null;
    this.feedbackForm = this.buildEmptyFeedbackForm(this.selectedFeedbackEvent.id);
  }

  openFeedbackEditModal(feedback: Feedback): void {
    if (!feedback.id) return;

    this.feedbackMode = 'edit';
    this.editingFeedbackId = feedback.id;
    this.feedbackForm = {
      id: feedback.id,
      userName: feedback.userName || this.currentUserName || this.currentUserEmail || '',
      comment: feedback.comment || '',
      rating: feedback.rating || 5,
      createdAt: feedback.createdAt,
      healthEventId: feedback.healthEventId
    };
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

  closeFeedbackModal(): void {
    this.editingFeedbackId = null;
    this.feedbackMode = 'create';
    this.feedbackForm = {
      userName: '',
      comment: '',
      rating: 5
    };
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

    const request$ = this.feedbackMode === 'edit' && this.editingFeedbackId
      ? this.eventService.updateFeedback(this.editingFeedbackId, payload)
      : this.eventService.createFeedback(payload);

    request$.subscribe({
      next: () => {
        this.success = this.feedbackMode === 'edit' ? 'Feedback updated successfully.' : 'Feedback created successfully.';
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
      category: event.category || 'OTHER',
      description: event.description || '',
      eventDate: this.toDateTimeLocalValue(event.eventDate),
      location: event.location || ''
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

    const request$ = this.modalMode === 'add'
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

  isSelectedFeedbackEvent(event: HealthEvent): boolean {
    return this.selectedFeedbackEvent?.id === event.id;
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

    // REFERENCE FIX: Always find the original object in the events array
    const originalEvent = this.events.find(e => e.id === event.id) || event;
    
    this.joiningEventIds.add(originalEvent.id!);
    console.log(`[joinEvent] Adding participant. EventID: ${originalEvent.id}, UserID: ${this.currentUserId}`);

    const previousState = { ...originalEvent };
    this.applyParticipationChange(originalEvent, true);
    const nextJoined = new Set(this.joinedEventIds);
    nextJoined.add(originalEvent.id!);
    this.joinedEventIds = nextJoined;

    this.eventService.addParticipant(originalEvent.id!, this.currentUserId).pipe(
      finalize(() => {
        this.joiningEventIds.delete(originalEvent.id!);
        this.cdr.markForCheck();
      })
    ).subscribe({
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
        Object.assign(originalEvent, previousState);
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

    // Recherche de l'objet original pour éviter les problèmes de référence après le tri
    const originalEvent = this.events.find(e => e.id === event.id) || event;

    if (confirm('Are you sure you want to leave this event?')) {
      console.log(`[leaveEvent] Removing participant. EventID: ${originalEvent.id}, UserID: ${this.currentUserId}`);
      
      const previousState = { ...originalEvent };
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
          Object.assign(originalEvent, previousState);
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

    if (Array.isArray(event.participants)) {
      return event.participants.some((p) => Number(p?.id) === this.currentUserId);
    }

    return false;
  }

  getParticipantsCount(event: HealthEvent): number {
    try {
      // After enrichment, numberOfParticipants and participantCount are set to the
      // real count from the backend. Use them as the primary source of truth.
      if (typeof event.numberOfParticipants === 'number' && event.numberOfParticipants >= 0) {
        return event.numberOfParticipants;
      }
      if (typeof event.participantCount === 'number' && event.participantCount >= 0) {
        return event.participantCount;
      }
      // Fallback to array lengths before enrichment completes
      if (Array.isArray(event.participants)) {
        return event.participants.length;
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

  /**
   * Returns the list of participant objects for an event.
   * Falls back to building minimal objects from participantIds when full objects are unavailable.
   */
  getParticipantsList(event: HealthEvent): Array<{ id?: number; fullName?: string; email?: string }> {
    if (Array.isArray(event.participants) && event.participants.length > 0) {
      return event.participants;
    }
    if (Array.isArray(event.participantIds) && event.participantIds.length > 0) {
      return event.participantIds.map(id => ({ id }));
    }
    return [];
  }

  /**
   * Returns a comma-separated string of participant names for use in tooltips.
   */
  getParticipantNames(event: HealthEvent): string {
    const list = this.getParticipantsList(event);
    if (list.length === 0) return 'No participants';
    return list.map(p => p.fullName || p.email || `User #${p.id}`).join(', ');
  }

  /**
   * Returns the initials of a participant for the avatar badge.
   */
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
    const updatedEvent: HealthEvent = {
      ...event,
      participantIds,
      participants: Array.isArray(event.participants) ? [...event.participants] : event.participants
    };

    if (joined) {
      if (!participantIds.map(Number).includes(participantId)) {
        updatedEvent.participantIds = [...participantIds, participantId];
      }
      if (Array.isArray(updatedEvent.participants)) {
        const alreadyPresent = updatedEvent.participants.some(p => Number(p?.id) === participantId);
        if (!alreadyPresent) {
          updatedEvent.participants = [...updatedEvent.participants, participantSummary];
        }
      }
    } else {
      updatedEvent.participantIds = participantIds.filter(id => Number(id) !== participantId);
      if (Array.isArray(updatedEvent.participants)) {
        updatedEvent.participants = updatedEvent.participants.filter(p => Number(p?.id) !== participantId);
      }
    }

    // Recompute count from the updated arrays (source of truth)
    const newCount = Array.isArray(updatedEvent.participants) && updatedEvent.participants.length > 0
      ? updatedEvent.participants.length
      : Array.isArray(updatedEvent.participantIds)
        ? updatedEvent.participantIds.length
        : Math.max(0, Number(event.numberOfParticipants ?? event.participantCount ?? 0) + (joined ? 1 : -1));

    updatedEvent.numberOfParticipants = newCount;
    updatedEvent.participantCount = newCount;

    if (joined) {
      this.joinedEventIds = new Set([...this.joinedEventIds, event.id!]);
    } else {
      const nextJoinedEventIds = new Set(this.joinedEventIds);
      nextJoinedEventIds.delete(event.id!);
      this.joinedEventIds = nextJoinedEventIds;
    }

    // Persist updated join state to localStorage
    this.persistJoinedIds(this.joinedEventIds);

    this.events = this.events.map(existingEvent =>
      existingEvent.id === event.id ? updatedEvent : existingEvent
    );

    if (this.selectedFeedbackEvent?.id === event.id) {
      this.selectedFeedbackEvent = updatedEvent;
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

  private resolveCurrentUserId(onResolved?: () => void, silent = false): void {
    console.log('[resolveCurrentUserId] Called with silent:', silent, 'hasId:', !!this.currentUserId);
    
    if (this.currentUserId) {
      console.log('[resolveCurrentUserId] Already have userId:', this.currentUserId);
      if (onResolved) {
        onResolved();
      }
      return;
    }

    if (onResolved) {
      this.pendingUserIdResolvers.push(onResolved);
      console.log('[resolveCurrentUserId] Queued resolver callback. Queue length:', this.pendingUserIdResolvers.length);
    }

    if (this.isResolvingUserId) {
      console.log('[resolveCurrentUserId] Already resolving, deferring...');
      return;
    }

    const eventDerivedUserId = this.tryResolveUserIdFromLoadedEvents();
    if (eventDerivedUserId) {
      console.log('[resolveCurrentUserId] Resolved from events:', eventDerivedUserId);
      this.currentUserId = eventDerivedUserId;
      this.error = null;
      this.flushUserIdResolvers();
      return;
    }

    const tokenUserId = this.extractUserIdFromToken(this.authService.tokenValue);
    if (tokenUserId) {
      console.log('[resolveCurrentUserId] Resolved from token:', tokenUserId);
      this.currentUserId = tokenUserId;
      this.error = null;
      this.flushUserIdResolvers();
      return;
    }

    console.log('[resolveCurrentUserId] Attempting to resolve via API...');
    this.isResolvingUserId = true;
    
    // Try direct email lookup first (fastest), then fallback to full users list
    this.resolveUserIdByEmail(onResolved, silent);
  }

  private resolveUserIdByEmail(onResolved?: () => void, silent = false): void {
    if (!this.currentUserEmail) {
      console.log('[resolveUserIdByEmail] No email available, using JWT fallback');
      this.handleJwtFallback(onResolved, silent);
      return;
    }

    console.log('[resolveUserIdByEmail] Attempting direct email lookup:', this.currentUserEmail);
    this.userService.getUserByEmail(this.currentUserEmail).pipe(
      timeout(5000),
      catchError((err) => {
        console.warn('[resolveUserIdByEmail] Email lookup failed:', {
          status: err?.status,
          message: err?.message,
          body: err?.error,
          fullError: err
        });
        return of(null);
      })
    ).subscribe({
      next: (user) => {
        console.log('[resolveUserIdByEmail] Email lookup response:', user, typeof user);
        
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

          console.log('[resolveUserIdByEmail] Successfully resolved userId from email endpoint:', this.currentUserId);
          this.isResolvingUserId = false;

          if (this.currentUserId) {
            this.error = null;
            this.flushUserIdResolvers();
            return;
          }
        }

        // If email lookup didn't return a user or had no ID, use JWT fallback
        console.log('[resolveUserIdByEmail] Email lookup unsuccessful, falling back to JWT');
        this.handleJwtFallback(onResolved, silent);
      }
    });
  }

  private handleJwtFallback(onResolved?: () => void, silent = false): void {
    // Last resort: try JWT token again with deepest extraction
    const tokenUserId = this.extractUserIdFromToken(this.authService.tokenValue);
    if (tokenUserId) {
      console.log('[handleJwtFallback] Resolved userId from JWT token:', tokenUserId);
      this.currentUserId = tokenUserId;
      this.isResolvingUserId = false;
      this.error = null;
      this.flushUserIdResolvers();
      return;
    }

    // Stop here: /auth/users is known to return empty list in this environment.
    this.isResolvingUserId = false;
    this.clearUserIdResolvers();
    if (!silent) {
      this.error = 'Unable to detect current user ID. Please log out and log in again.';
    }
  }

  private resolveUserIdFromUsersList(onResolved?: () => void, silent = false): void {
    console.log('[resolveUserIdFromUsersList] Starting users list resolution. Email:', this.currentUserEmail, 'Name:', this.currentUserName, 'Identity:', this.currentUserIdentity);
    
    this.userService.getAllUsers().pipe(
      timeout(8000)
    ).subscribe({
      next: (users) => {
        console.log('[resolveUserIdFromUsersList] Received users:', users?.length || 0, 'users');
        console.log('[resolveUserIdFromUsersList] Full users list:', JSON.stringify(users, null, 2));
        
        const targetEmail = (this.currentUserEmail || '').toLowerCase().trim();
        const targetUsername = targetEmail.includes('@') ? targetEmail.split('@')[0] : targetEmail;
        const targetFullName = (this.currentUserName || '').toLowerCase().trim();
        const targetIdentity = (this.currentUserIdentity || '').toLowerCase().trim();
        
        console.log('[resolveUserIdFromUsersList] Search criteria:', {
          targetEmail,
          targetUsername,
          targetFullName,
          targetIdentity
        });

        // Log each user's extracted fields for debugging
        if (Array.isArray(users)) {
          users.forEach((u: any, index: number) => {
            const email = (
              u?.email
              ?? u?.user?.email
              ?? u?.profile?.email
              ?? ''
            ).toString().toLowerCase().trim();

            const username = (
              u?.username
              ?? u?.userName
              ?? u?.login
              ?? u?.user?.username
              ?? ''
            ).toString().toLowerCase().trim();

            const fullName = (
              u?.fullName
              ?? u?.user?.fullName
              ?? `${u?.firstName || ''} ${u?.lastName || ''}`
            ).toString().toLowerCase().trim();

            const id = u?.id ?? u?.userId ?? u?.uid ?? u?.data?.id ?? u?.user?.id;

            console.log(`[resolveUserIdFromUsersList] User[${index}]:`, {
              email,
              username,
              fullName,
              id,
              raw: u
            });
          });
        }

        const matched = users.find((u: any) => {
          const email = (
            u?.email
            ?? u?.user?.email
            ?? u?.profile?.email
            ?? ''
          ).toString().toLowerCase().trim();

          const emailLocalPart = email.includes('@') ? email.split('@')[0] : email;

          const username = (
            u?.username
            ?? u?.userName
            ?? u?.login
            ?? u?.user?.username
            ?? ''
          ).toString().toLowerCase().trim();

          const fullName = (
            u?.fullName
            ?? u?.user?.fullName
            ?? `${u?.firstName || ''} ${u?.lastName || ''}`
          ).toString().toLowerCase().trim();

          const isMatch = (
            email === targetEmail
            || emailLocalPart === targetUsername
            || username === targetUsername
            || fullName === targetFullName
            || username === targetIdentity
            || emailLocalPart === targetIdentity
            || fullName === targetIdentity
          );

          if (isMatch) {
            console.log('[resolveUserIdFromUsersList] *** MATCH FOUND ***', { email, username, fullName });
          }

          return isMatch;
        });

        if (matched) {
          console.log('[resolveUserIdFromUsersList] Found matching user:', matched);
        } else {
          console.warn('[resolveUserIdFromUsersList] *** NO MATCHING USER FOUND ***. Searched for:', targetEmail);
        }

        const parsedId = Number(
          (matched as any)?.id
          ?? (matched as any)?.userId
          ?? (matched as any)?.uid
          ?? (matched as any)?.data?.id
          ?? (matched as any)?.user?.id
          ?? (matched as any)?.user?.userId
          ?? (matched as any)?.profile?.id
        );
        this.currentUserId = Number.isFinite(parsedId) && parsedId > 0
          ? parsedId
          : this.extractNumericIdDeep(matched);
        
        console.log('[resolveUserIdFromUsersList] Resolved userId:', this.currentUserId);
        this.isResolvingUserId = false;

        if (!this.currentUserId) {
          this.clearUserIdResolvers();
          if (!silent) {
            this.error = `Unable to detect current user ID. Searched for: ${targetEmail || 'no email'}`;
            console.error('[resolveUserIdFromUsersList] Failed to detect user ID:', this.error);
          }
          return;
        }

        this.error = null;
        this.flushUserIdResolvers();
      },
      error: (err) => {
        this.isResolvingUserId = false;
        this.clearUserIdResolvers();
        if (!silent) {
          this.error = `Unable to detect current user ID. Error: ${err?.message || 'Unknown error'}`;
          console.error('[resolveUserIdFromUsersList] API error:', err);
        }
      }
    });
  }

  private tryResolveUserIdFromLoadedEvents(): number | null {
    if (!this.currentUserEmail) {
      return null;
    }

    const targetEmail = this.currentUserEmail.toLowerCase().trim();
    for (const event of this.events) {
      if (!Array.isArray(event.participants)) continue;

      const matched = event.participants.find((participant) =>
        (participant?.email || '').toLowerCase().trim() === targetEmail
      );
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
    // Now that userId is known, rebuild join status from already-loaded events.
    if (this.events.length > 0) {
      this.normalizeParticipantCounts(); // also calls applySearch()
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
      console.log('[extractUserIdFromToken] No valid token');
      return null;
    }

    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));
      console.log('[extractUserIdFromToken] JWT payload:', decoded);
      const candidate = Number(
        decoded?.id
        ?? decoded?.userId
        ?? decoded?.uid
        ?? decoded?.user_id
        ?? decoded?.userID
        ?? decoded?.nameid
        ?? decoded?.name_id
        ?? decoded?.sub
      );
      
      const result = Number.isFinite(candidate) && candidate > 0 ? candidate : null;
      console.log('[extractUserIdFromToken] Extracted ID:', result);
      return result;
    } catch (err) {
      console.error('[extractUserIdFromToken] Failed to parse JWT:', err);
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
        decoded?.preferred_username
        ?? decoded?.username
        ?? decoded?.name
        ?? decoded?.unique_name
        ?? decoded?.sub
        ?? ''
      ).toString().trim();
      return value || null;
    } catch {
      return null;
    }
  }
}
