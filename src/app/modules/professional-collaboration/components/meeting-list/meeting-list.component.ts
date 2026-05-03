import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../../services/meeting.service';
import { MeetingExtended, MeetingFilter } from '../../models/collaboration.model';
import { getUserIdFromStorage } from '../../../../shared/utils/user-id-helper';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-list.component.html',
  styleUrls: ['./meeting-list.component.css']
})
export class MeetingListComponent implements OnInit {

  meetings: MeetingExtended[] = [];
  filteredMeetings: MeetingExtended[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  statusFilter = '';
  sortBy = 'upcoming';

  userId: number | null = getUserIdFromStorage();

  constructor(
    private meetingService: MeetingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadMeetings();
  }

  loadMeetings() {
    this.isLoading = true;
    this.errorMessage = '';

    const filter: MeetingFilter = {
      searchTerm: this.searchTerm || undefined,
      status: this.statusFilter as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | undefined,
      sortBy: this.sortBy as 'upcoming' | 'recent' | 'oldest'
    };

    this.meetingService.getAllMeetings(filter).subscribe({
      next: (meetings) => {
        this.meetings = meetings;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading meetings:', error);
        this.errorMessage = 'Erreur lors du chargement des réunions';
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let result = [...this.meetings];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(meeting =>
        meeting.title.toLowerCase().includes(term) ||
        meeting.description?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.statusFilter) {
      result = result.filter(meeting => meeting.status === this.statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'upcoming':
          return new Date(a.scheduledDate + ' ' + a.scheduledTime).getTime() -
                 new Date(b.scheduledDate + ' ' + b.scheduledTime).getTime();
        case 'participants':
          return (b.participantCount || 0) - (a.participantCount || 0);
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    this.filteredMeetings = result;
  }

  onSearch() {
    this.applyFilters();
  }

  onStatusChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  viewMeeting(id: number | undefined) {
    if (id) this.router.navigate(['/collaboration/dashboard/meeting', id]);
  }

  editMeeting(id: number | undefined, event: Event) {
    event.stopPropagation();
    if (id) this.router.navigate(['/collaboration/dashboard/meeting/edit', id]);
  }

  createNewMeeting() {
    this.router.navigate(['/collaboration/dashboard/meeting/create']);
  }

  deleteMeeting(id: number | undefined, event: Event) {
    event.stopPropagation();
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) return;

    this.meetingService.deleteMeeting(id).subscribe({
      next: () => {
        this.successMessage = 'Réunion supprimée avec succès';
        this.loadMeetings();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error deleting meeting:', error);
        this.errorMessage = 'Erreur lors de la suppression';
      }
    });
  }

  getStatusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'SCHEDULED': return 'status-scheduled';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  getStatusDisplay(status: string | undefined): string {
    switch (status) {
      case 'SCHEDULED': return 'Programmée';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminée';
      case 'CANCELLED': return 'Annulée';
      default: return 'Inconnu';
    }
  }

  getTimeDisplay(meeting: MeetingExtended): string {
    if (meeting.isOngoing) {
      return '🔴 EN DIRECT';
    }
    if (meeting.isUpcoming) {
      return this.getTimeUntil(meeting.scheduledDate, meeting.scheduledTime);
    }
    return '✓ Terminée';
  }

  getTimeUntil(date: string, time: string): string {
    const meetingTime = new Date(date + ' ' + time).getTime();
    const now = new Date().getTime();
    const diff = meetingTime - now;

    if (diff < 0) return 'Passée';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  }

  isOrganizer(meeting: MeetingExtended): boolean {
    return meeting.organizerId === this.userId;
  }

  canEdit(meeting: MeetingExtended): boolean {
    return this.isOrganizer(meeting);
  }

  canDelete(meeting: MeetingExtended): boolean {
    return this.isOrganizer(meeting);
  }

  canJoin(meeting: MeetingExtended): boolean {
    return (meeting.isUpcoming === true || meeting.isOngoing === true) && !!meeting.meetingLink;
  }

  joinMeeting(meeting: MeetingExtended, event: Event) {
    event.stopPropagation();
    if (meeting.meetingLink && this.canJoin(meeting)) {
      window.open(meeting.meetingLink, '_blank');
    }
  }
}
