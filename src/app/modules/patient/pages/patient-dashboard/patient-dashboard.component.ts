import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  userRole: string = '';
  userName: string = '';
  userEmail: string = '';

  upcomingAppointments = [
    { id: 1, doctor: 'Dr. Ahmed Hassan', specialty: 'Cardiologist', date: '2024-04-15', time: '10:00 AM', status: 'Confirmed' },
    { id: 2, doctor: 'Dr. Fatima Mohamed', specialty: 'Dermatologist', date: '2024-04-20', time: '2:00 PM', status: 'Pending' }
  ];

  recentPrescriptions = [
    { id: 1, medicine: 'Aspirin 100mg', doctor: 'Dr. Ahmed Hassan', date: '2024-04-01', status: 'Active', refillsLeft: 2 },
    { id: 2, medicine: 'Lisinopril 10mg', doctor: 'Dr. Ahmed Hassan', date: '2024-03-25', status: 'Active', refillsLeft: 1 },
    { id: 3, medicine: 'Metformin 500mg', doctor: 'Dr. Fatima Mohamed', date: '2024-03-10', status: 'Expired', refillsLeft: 0 }
  ];

  healthMetrics = [
    { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'Normal', icon: '❤️' },
    { label: 'Heart Rate', value: '72', unit: 'bpm', status: 'Normal', icon: '💓' },
    { label: 'Weight', value: '75', unit: 'kg', status: 'Normal', icon: '⚖️' },
    { label: 'Last Lab Test', value: '14 days ago', unit: '', status: 'Recent', icon: '🧪' }
  ];

  messageCount = 3;
  unreadMessages = 2;

  ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    const user = this.authService.currentUserValue as { firstName?: string; lastName?: string; email?: string; role?: string } | null;
    if (user) {
      this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Patient';
      this.userEmail = user.email || '';
      this.userRole = user.role || 'PATIENT';
    }
  }

  navigateTo(route: string) {
    this.router.navigate(['/patient', route]);
  }

  scheduleAppointment() {
    this.router.navigate(['/appointments/create']);
  }

  refillPrescription(prescriptionId: number) {
    console.log('Refilling prescription:', prescriptionId);
    // Logic to initiate prescription refill
  }

  viewMessages() {
    this.navigateTo('messages');
  }

  goToPharmacy() {
    this.router.navigate(['/pharmacy/dashboard']);
  }
}
