import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-insurance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>🛡️ Insurance Information</h1>
        <button class="btn-add">+ Add Policy</button>
      </div>

      <div class="insurance-cards">
        <div class="policy-card" *ngFor="let policy of insurancePolicies">
          <div class="policy-header">
            <div class="provider-logo">{{ policy.providerInitials }}</div>
            <div class="provider-info">
              <h3>{{ policy.provider }}</h3>
              <p class="plan">{{ policy.planName }}</p>
            </div>
          </div>

          <div class="policy-details">
            <div class="detail-item">
              <label>Policy Number</label>
              <p>{{ policy.policyNumber }}</p>
            </div>
            <div class="detail-item">
              <label>Group Number</label>
              <p>{{ policy.groupNumber }}</p>
            </div>
            <div class="detail-item">
              <label>Effective Date</label>
              <p>{{ policy.effectiveDate | date:'MMM d, yyyy' }}</p>
            </div>
            <div class="detail-item">
              <label>Expiry Date</label>
              <p>{{ policy.expiryDate | date:'MMM d, yyyy' }}</p>
            </div>
            <div class="detail-item">
              <label>Coverage Type</label>
              <p>{{ policy.coverageType }}</p>
            </div>
            <div class="detail-item">
              <label>Deductible</label>
              <p>{{ policy.deductible }}</p>
            </div>
          </div>

          <div class="coverage-list">
            <h4>Coverage Includes:</h4>
            <ul>
              <li *ngFor="let coverage of policy.coverage">{{ coverage }}</li>
            </ul>
          </div>

          <div class="policy-actions">
            <button class="btn-primary">Download Card</button>
            <button class="btn-secondary">View Claims</button>
            <button class="btn-secondary">Edit</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1100px;
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
    .btn-add {
      background: #00a082;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .insurance-cards {
      display: grid;
      gap: 24px;
    }
    .policy-card {
      background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
    }
    .policy-header {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
    }
    .provider-logo {
      width: 60px;
      height: 60px;
      background: #00a082;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-weight: 700;
      font-size: 18px;
    }
    .provider-info h3 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: #111827;
    }
    .plan {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    .policy-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      padding: 20px 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-item label {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 6px;
      display: block;
    }
    .detail-item p {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .coverage-list {
      margin-bottom: 24px;
    }
    .coverage-list h4 {
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: #111827;
    }
    .coverage-list ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }
    .coverage-list li {
      padding: 6px 12px;
      background: #e6f9f5;
      border-radius: 6px;
      font-size: 13px;
      color: #065f46;
      font-weight: 500;
    }
    .policy-actions {
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
export class InsuranceComponent {
  insurancePolicies = [
    {
      provider: 'Health Plus Insurance',
      providerInitials: 'HP',
      planName: 'Family Gold Plan',
      policyNumber: 'HP-2024-001234',
      groupNumber: 'EMP-5678',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: new Date('2024-12-31'),
      coverageType: 'Family',
      deductible: '$500 per family',
      coverage: [
        'Hospital stays',
        'Emergency care',
        'Doctor visits',
        'Prescriptions',
        'Preventive care',
        'Lab tests'
      ]
    },
    {
      provider: 'National Health Corp',
      providerInitials: 'NHC',
      planName: 'Individual Standard',
      policyNumber: 'NHC-2024-005678',
      groupNumber: 'N/A',
      effectiveDate: new Date('2023-06-15'),
      expiryDate: new Date('2025-06-14'),
      coverageType: 'Individual',
      deductible: '$250 per individual',
      coverage: [
        'Hospital stays',
        'Doctor visits',
        'Prescriptions',
        'Specialist visits',
        'Annual physical'
      ]
    }
  ];
}
