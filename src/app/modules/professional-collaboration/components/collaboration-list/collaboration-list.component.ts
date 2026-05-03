import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollaborationService } from '../../services/collaboration.service';
import { SessionExtended, CollaborationFilter } from '../../models/collaboration.model';
import { getUserIdFromStorage } from '../../../../shared/utils/user-id-helper';

@Component({
  selector: 'app-collaboration-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collaboration-list.component.html',
  styleUrls: ['./collaboration-list.component.css']
})
export class CollaborationListComponent implements OnInit {

  sessions: SessionExtended[] = [];
  filteredSessions: SessionExtended[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  statusFilter = '';
  sortBy = 'recent';

  userId: number | null = getUserIdFromStorage();

  constructor(
    private collaborationService: CollaborationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSessions();
  }

  loadSessions() {
    this.isLoading = true;
    this.errorMessage = '';

    const filter: CollaborationFilter = {
      searchTerm: this.searchTerm || undefined,
      status: this.statusFilter as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | undefined,
      sortBy: this.sortBy as 'newest' | 'recently_modified' | 'oldest'
    };

    this.collaborationService.getAllSessions(filter).subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.errorMessage = 'Erreur lors du chargement des sessions';
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let result = [...this.sessions];

    // Filtre recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(session =>
        session.title.toLowerCase().includes(term) ||
        session.caseNumber?.toLowerCase().includes(term) ||
        session.description?.toLowerCase().includes(term)
      );
    }

    // Filtre statut
    if (this.statusFilter) {
      result = result.filter(session => session.status === this.statusFilter);
    }

    // Tri
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'recent':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'participants':
          return (b.participants?.length || 0) - (a.participants?.length || 0);
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    this.filteredSessions = result;
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

  viewSession(id: number | undefined) {
    if (id) this.router.navigate(['/collaboration/dashboard', id]);
  }

  editSession(id: number | undefined, event: Event) {
    event.stopPropagation();
    if (id) this.router.navigate(['/collaboration/dashboard/edit', id]);
  }

  createNewSession() {
    this.router.navigate(['/collaboration/dashboard/create']);
  }

  deleteSession(id: number | undefined, event: Event) {
    event.stopPropagation();
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return;

    this.collaborationService.deleteSession(id).subscribe({
      next: () => {
        this.successMessage = 'Session supprimée avec succès';
        this.loadSessions();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error deleting session:', error);
        this.errorMessage = 'Erreur lors de la suppression';
      }
    });
  }

  getStatusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'COMPLETED': return 'status-completed';
      case 'ARCHIVED': return 'status-archived';
      default: return 'status-pending';
    }
  }

  getRoleDisplay(role: string | undefined): string {
    const roleMap: { [key: string]: string } = {
      'ORGANIZER': 'Organisateur',
      'EDITOR': 'Éditeur',
      'VIEWER': 'Observateur'
    };
    return roleMap[role || ''] || role || 'Inconnu';
  }

  isOrganizer(session: SessionExtended): boolean {
    return session.organizerId === this.userId || session.isOwner === true;
  }

  canEdit(session: SessionExtended): boolean {
    return this.isOrganizer(session);
  }

  canDelete(session: SessionExtended): boolean {
    return this.isOrganizer(session);
  }
}
