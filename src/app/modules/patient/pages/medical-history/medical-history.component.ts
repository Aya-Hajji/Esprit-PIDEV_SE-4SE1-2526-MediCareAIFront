import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-medical-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>📊 Medical History</h1>
        <p>Complete record of your medical visits and conditions</p>
      </div>
      <div class="timeline">
        <div class="timeline-item" *ngFor="let item of medicalHistory">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="visit-header">
              <h3>{{ item.type }}</h3>
              <span class="visit-date">{{ item.date | date:'MMM d, yyyy' }}</span>
            </div>
            <p class="doctor-name">Dr. {{ item.doctor }}</p>
            <p class="diagnosis">{{ item.diagnosis }}</p>
            <div class="notes" *ngIf="item.notes">
              <strong>Notes:</strong> {{ item.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 32px;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #111827;
    }
    .page-header p {
      font-size: 16px;
      color: #6b7280;
      margin: 0;
    }
    .timeline {
      position: relative;
      padding-left: 40px;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }
    .timeline-item {
      position: relative;
      margin-bottom: 24px;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .timeline-marker {
      position: absolute;
      left: -32px;
      top: 20px;
      width: 16px;
      height: 16px;
      background: #00a082;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 2px #00a082;
    }
    .visit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .timeline-content h3 {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      color: #111827;
    }
    .visit-date {
      font-size: 13px;
      color: #6b7280;
      font-weight: 600;
    }
    .doctor-name {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 8px 0;
    }
    .diagnosis {
      font-size: 14px;
      color: #111827;
      margin: 0 0 8px 0;
    }
    .notes {
      font-size: 13px;
      padding: 12px;
      background: #f3f4f6;
      border-radius: 6px;
      margin: 8px 0 0 0;
      color: #6b7280;
    }
  `]
})
export class MedicalHistoryComponent {
  medicalHistory = [
    {
      type: 'General Checkup',
      date: new Date('2024-03-20'),
      doctor: 'Ahmed Hassan',
      diagnosis: 'All vitals normal, blood pressure slightly elevated',
      notes: 'Continue current medication, schedule follow-up in 3 months'
    },
    {
      type: 'Cardiology Consultation',
      date: new Date('2024-02-15'),
      doctor: 'Sarah Johnson',
      diagnosis: 'Mild hypertension, no structural abnormalities detected',
      notes: 'EKG normal, recommend regular exercise and diet monitoring'
    },
    {
      type: 'Lab Tests',
      date: new Date('2024-01-30'),
      doctor: 'Fatima Mohamed',
      diagnosis: 'Blood glucose slightly elevated, cholesterol within normal range',
      notes: 'Consider dietary adjustments, retest in 6 weeks'
    }
  ];
}
