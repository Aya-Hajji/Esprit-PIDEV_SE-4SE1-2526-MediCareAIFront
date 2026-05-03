import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>💊 Prescriptions</h1>
        <p>View and manage your active and expired prescriptions</p>
      </div>

      <div class="prescriptions-tabs">
        <button class="tab" [class.active]="activeTab === 'active'" (click)="activeTab = 'active'">
          Active ({{ activePrescriptions.length }})
        </button>
        <button class="tab" [class.active]="activeTab === 'expired'" (click)="activeTab = 'expired'">
          Expired ({{ expiredPrescriptions.length }})
        </button>
      </div>

      <div class="prescriptions-list" *ngIf="activeTab === 'active'">
        <div class="prescription-card" *ngFor="let rx of activePrescriptions">
          <div class="card-header">
            <div class="medicine-info">
              <h3>{{ rx.medicine }}</h3>
              <p class="doctor">Prescribed by {{ rx.doctor }}</p>
            </div>
            <span class="status status-active">Active</span>
          </div>
          
          <div class="prescription-details">
            <div class="detail-group">
              <label>Dosage</label>
              <p>{{ rx.dosage }}</p>
            </div>
            <div class="detail-group">
              <label>Frequency</label>
              <p>{{ rx.frequency }}</p>
            </div>
            <div class="detail-group">
              <label>Prescribed On</label>
              <p>{{ rx.prescribedDate | date:'MMM d, yyyy' }}</p>
            </div>
            <div class="detail-group">
              <label>Refills Left</label>
              <p>{{ rx.refillsLeft }} refills</p>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-primary" *ngIf="rx.refillsLeft > 0">Refill Now</button>
            <button class="btn-secondary">Order from Pharmacy</button>
            <button class="btn-secondary">Download PDF</button>
          </div>
        </div>
      </div>

      <div class="prescriptions-list" *ngIf="activeTab === 'expired'">
        <div class="prescription-card expired" *ngFor="let rx of expiredPrescriptions">
          <div class="card-header">
            <div class="medicine-info">
              <h3>{{ rx.medicine }}</h3>
              <p class="doctor">Prescribed by {{ rx.doctor }}</p>
            </div>
            <span class="status status-expired">Expired</span>
          </div>
          
          <div class="prescription-details">
            <div class="detail-group">
              <label>Dosage</label>
              <p>{{ rx.dosage }}</p>
            </div>
            <div class="detail-group">
              <label>Frequency</label>
              <p>{{ rx.frequency }}</p>
            </div>
            <div class="detail-group">
              <label>Expired On</label>
              <p>{{ rx.expiredDate | date:'MMM d, yyyy' }}</p>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-secondary">Request Renewal</button>
            <button class="btn-secondary">Download PDF</button>
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
    .prescriptions-tabs {
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
    .prescriptions-list {
      display: grid;
      gap: 16px;
    }
    .prescription-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border-left: 4px solid #00a082;
    }
    .prescription-card.expired {
      border-left-color: #ff6b6b;
      opacity: 0.85;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .medicine-info h3 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: #111827;
    }
    .doctor {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    .status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status.status-active {
      background: #d1fae5;
      color: #065f46;
    }
    .status.status-expired {
      background: #fee2e2;
      color: #7f1d1d;
    }
    .prescription-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-group label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 4px;
      display: block;
    }
    .detail-group p {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin: 0;
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
export class PrescriptionsComponent {
  activeTab: 'active' | 'expired' = 'active';

  activePrescriptions = [
    {
      medicine: 'Aspirin 100mg',
      doctor: 'Dr. Ahmed Hassan',
      dosage: '1 tablet',
      frequency: 'Once daily',
      prescribedDate: new Date('2024-04-01'),
      refillsLeft: 2
    },
    {
      medicine: 'Lisinopril 10mg',
      doctor: 'Dr. Ahmed Hassan',
      dosage: '1 tablet',
      frequency: 'Once daily in morning',
      prescribedDate: new Date('2024-03-25'),
      refillsLeft: 1
    }
  ];

  expiredPrescriptions = [
    {
      medicine: 'Metformin 500mg',
      doctor: 'Dr. Fatima Mohamed',
      dosage: '1 tablet',
      frequency: 'Twice daily with meals',
      expiredDate: new Date('2024-03-10')
    }
  ];
}
