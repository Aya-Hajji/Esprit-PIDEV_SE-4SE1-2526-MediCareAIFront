import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-health-records',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>📁 Health Records</h1>
        <button class="btn-upload">+ Upload Document</button>
      </div>

      <div class="records-list">
        <div class="record-card" *ngFor="let record of healthRecords">
          <div class="record-header">
            <div class="record-icon">{{ getIcon(record.type) }}</div>
            <div class="record-info">
              <h3>{{ record.title }}</h3>
              <p class="record-type">{{ record.type }}</p>
            </div>
          </div>
          <div class="record-details">
            <span class="date">{{ record.date | date:'MMM d, yyyy' }}</span>
            <span class="size">{{ record.size }}</span>
          </div>
          <div class="record-actions">
            <button class="btn-action">Download</button>
            <button class="btn-action">Share</button>
            <button class="btn-action">Delete</button>
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
    .btn-upload {
      background: #00a082;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .records-list {
      display: grid;
      gap: 16px;
    }
    .record-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 20px;
      align-items: center;
    }
    .record-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .record-icon {
      font-size: 32px;
      line-height: 1;
    }
    .record-info h3 {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: #111827;
    }
    .record-type {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .record-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: right;
    }
    .date, .size {
      font-size: 13px;
      color: #6b7280;
    }
    .record-actions {
      display: flex;
      gap: 8px;
    }
    .btn-action {
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: #6b7280;
      white-space: nowrap;
    }
    .btn-action:hover {
      background: #f3f4f6;
      color: #00a082;
      border-color: #00a082;
    }
  `]
})
export class HealthRecordsComponent {
  healthRecords = [
    {
      title: 'Blood Test Results',
      type: 'Lab Report',
      date: new Date('2024-04-01'),
      size: '1.2 MB'
    },
    {
      title: 'Chest X-Ray',
      type: 'Imaging',
      date: new Date('2024-03-25'),
      size: '5.4 MB'
    },
    {
      title: 'EKG Report',
      type: 'Cardiology',
      date: new Date('2024-03-20'),
      size: '0.8 MB'
    },
    {
      title: 'Vaccination Certificate',
      type: 'Immunization',
      date: new Date('2024-01-15'),
      size: '0.5 MB'
    }
  ];

  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'Lab Report': '🧪',
      'Imaging': '🖼️',
      'Cardiology': '❤️',
      'Immunization': '💉'
    };
    return icons[type] || '📄';
  }
}
