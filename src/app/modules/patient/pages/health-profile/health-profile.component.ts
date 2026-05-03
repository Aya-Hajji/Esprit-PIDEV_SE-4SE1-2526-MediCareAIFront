import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-health-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>👤 Health Profile</h1>
        <p>Manage your personal health information</p>
      </div>
      <div class="content-section">
        <div class="card">
          <h3>Personal Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Full Name</label>
              <p>John Doe</p>
            </div>
            <div class="info-item">
              <label>Date of Birth</label>
              <p>January 15, 1990</p>
            </div>
            <div class="info-item">
              <label>Blood Type</label>
              <p>O+</p>
            </div>
            <div class="info-item">
              <label>Gender</label>
              <p>Male</p>
            </div>
            <div class="info-item">
              <label>Height</label>
              <p>180 cm</p>
            </div>
            <div class="info-item">
              <label>Weight</label>
              <p>75 kg</p>
            </div>
          </div>
          <button class="btn-primary">Edit Profile</button>
        </div>

        <div class="card">
          <h3>Medical Conditions</h3>
          <ul class="conditions-list">
            <li>Type 2 Diabetes</li>
            <li>Hypertension</li>
            <li>Allergies: Penicillin</li>
          </ul>
          <button class="btn-secondary">Add Condition</button>
        </div>

        <div class="card">
          <h3>Emergency Contact</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Contact Name</label>
              <p>Jane Doe</p>
            </div>
            <div class="info-item">
              <label>Relationship</label>
              <p>Spouse</p>
            </div>
            <div class="info-item">
              <label>Phone</label>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>
          <button class="btn-secondary">Edit</button>
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
    .content-section {
      display: grid;
      gap: 24px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .card h3 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 16px 0;
      color: #111827;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .info-item label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }
    .info-item p {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 4px 0 0 0;
    }
    .conditions-list {
      list-style: none;
      padding: 0;
      margin: 0 0 16px 0;
    }
    .conditions-list li {
      padding: 8px 12px;
      background: #f3f4f6;
      border-radius: 6px;
      margin-bottom: 8px;
      color: #111827;
    }
    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 8px;
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
export class HealthProfileComponent {}
