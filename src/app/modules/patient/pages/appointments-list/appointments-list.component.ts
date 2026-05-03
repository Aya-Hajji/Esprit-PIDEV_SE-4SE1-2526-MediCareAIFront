import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>📅 Appointments</h1>
        <button class="btn-schedule">+ Schedule New Appointment</button>
      </div>

      <div class="appointments-tabs">
        <button class="tab" [class.active]="activeTab === 'upcoming'" (click)="activeTab = 'upcoming'">
          Upcoming ({{ upcomingAppointments.length }})
        </button>
        <button class="tab" [class.active]="activeTab === 'past'" (click)="activeTab = 'past'">
          Past ({{ pastAppointments.length }})
        </button>
      </div>

      <div class="appointments-grid" *ngIf="activeTab === 'upcoming'">
        <div class="appointment-card" *ngFor="let apt of upcomingAppointments">
          <div class="card-header">
            <h3>{{ apt.doctor }}</h3>
            <span class="status" [ngClass]="'status-' + apt.status.toLowerCase()">{{ apt.status }}</span>
          </div>
          <p class="specialty">{{ apt.specialty }}</p>
          <div class="appointment-details">
            <div class="detail">📅 {{ apt.date | date:'MMM d, yyyy' }}</div>
            <div class="detail">⏰ {{ apt.time }}</div>
            <div class="detail">📍 {{ apt.type }}</div>
          </div>
          <div class="card-actions">
            <button class="btn-primary">Reschedule</button>
            <button class="btn-secondary">Cancel</button>
            <button class="btn-secondary">Join Video Call</button>
          </div>
        </div>
      </div>

      <div class="appointments-grid" *ngIf="activeTab === 'past'">
        <div class="appointment-card" *ngFor="let apt of pastAppointments">
          <div class="card-header">
            <h3>{{ apt.doctor }}</h3>
            <span class="status status-completed">Completed</span>
          </div>
          <p class="specialty">{{ apt.specialty }}</p>
          <div class="appointment-details">
            <div class="detail">📅 {{ apt.date | date:'MMM d, yyyy' }}</div>
            <div class="detail">⏰ {{ apt.time }}</div>
            <div class="detail">📝 {{ apt.notes }}</div>
          </div>
          <div class="card-actions">
            <button class="btn-secondary">View Summary</button>
            <button class="btn-secondary">Download Report</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      color: #111827;
    }
    .btn-schedule {
      background: #00a082;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-schedule:hover {
      background: #008866;
      transform: translateY(-2px);
    }
    .appointments-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      border-bottom: 2px solid #e5e7eb;
    }
    .tab {
      background: none;
      border: none;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
      margin-bottom: -2px;
    }
    .tab.active {
      color: #00a082;
      border-bottom-color: #00a082;
    }
    .appointments-grid {
      display: grid;
      gap: 16px;
    }
    .appointment-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border-left: 4px solid #00a082;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .card-header h3 {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      color: #111827;
    }
    .status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status.status-confirmed {
      background: #d1fae5;
      color: #065f46;
    }
    .status.status-pending {
      background: #fef3c7;
      color: #78350f;
    }
    .status.status-completed {
      background: #dbeafe;
      color: #1e40af;
    }
    .specialty {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 12px 0;
    }
    .appointment-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail {
      font-size: 14px;
      color: #6b7280;
    }
    .card-actions {
      display: flex;
      gap: 8px;
    }
    .btn-primary, .btn-secondary {
      flex: 1;
      padding: 10px 12px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-primary {
      background: #00a082;
      color: white;
    }
    .btn-primary:hover {
      background: #008866;
    }
    .btn-secondary {
      background: white;
      border: 1px solid #e5e7eb;
      color: #6b7280;
    }
    .btn-secondary:hover {
      background: #f3f4f6;
      color: #00a082;
      border-color: #00a082;
    }
  `]
})
export class AppointmentsListComponent {
  activeTab: 'upcoming' | 'past' = 'upcoming';

  upcomingAppointments = [
    {
      doctor: 'Dr. Ahmed Hassan',
      specialty: 'Cardiologist',
      date: new Date('2024-04-15'),
      time: '10:00 AM',
      type: 'Video Consultation',
      status: 'Confirmed'
    },
    {
      doctor: 'Dr. Fatima Mohamed',
      specialty: 'Dermatologist',
      date: new Date('2024-04-20'),
      time: '2:00 PM',
      type: 'In-Person',
      status: 'Pending'
    }
  ];

  pastAppointments = [
    {
      doctor: 'Dr. Sarah Johnson',
      specialty: 'General Practitioner',
      date: new Date('2024-03-20'),
      time: '11:00 AM',
      type: 'In-Person',
      notes: 'General checkup completed'
    },
    {
      doctor: 'Dr. Ahmed Hassan',
      specialty: 'Cardiologist',
      date: new Date('2024-03-10'),
      time: '3:00 PM',
      type: 'Video Consultation',
      notes: 'Follow-up on blood pressure'
    }
  ];
}
