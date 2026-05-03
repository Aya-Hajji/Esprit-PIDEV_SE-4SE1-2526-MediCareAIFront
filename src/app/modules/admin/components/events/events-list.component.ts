import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthEventService } from '../../../../shared/services/health-event.service';
import { HealthEvent } from '../../../../shared/models/health-event.model';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {
  events: HealthEvent[] = [];
  loading = false;
  error: string | null = null;

  constructor(private eventService: HealthEventService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load events';
        this.loading = false;
      }
    });
  }

  deleteEvent(id: number): void {
    if (confirm('Delete this event?')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => this.loadEvents(),
        error: (error) => console.error('Error deleting event:', error)
      });
    }
  }
}
