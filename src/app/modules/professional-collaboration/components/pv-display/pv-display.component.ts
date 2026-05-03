import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MeetingService } from '../../services/meeting.service';
import { ProcesVerbal } from '../../models/meeting.model';

@Component({
  selector: 'app-pv-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pv-display.component.html',
  styleUrls: ['./pv-display.component.css']
})
export class PVDisplayComponent implements OnInit {
  pv: ProcesVerbal | null = null;
  meetingId: number | null = null;
  
  isLoading = true;
  isEditing = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private meetingService: MeetingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.meetingId = +params['meetingId'];
      console.log('[PVDisplay] Meeting ID:', this.meetingId);

      if (this.meetingId) {
        this.loadPV();
      }
    });
  }

  /**
   * Load PV
   */
  private loadPV() {
    this.meetingService.getPV(this.meetingId!).subscribe({
      next: (pv) => {
        console.log('[PVDisplay] ✅ PV loaded:', pv);
        this.pv = pv;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('[PVDisplay] ❌ Error loading PV:', error);
        this.errorMessage = 'Impossible de charger le Procès-Verbal';
        this.isLoading = false;
      }
    });
  }

  /**
   * Export to PDF
   */
  exportPDF() {
    if (!this.pv?.id) return;

    console.log('[PVDisplay] Exporting to PDF...');
    this.meetingService.exportPVtoPDF(this.pv.id).subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PV_${this.pv?.id}_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        console.log('[PVDisplay] ✅ PDF exported');
        this.successMessage = '✅ PDF téléchargé';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('[PVDisplay] ❌ Error exporting PDF:', error);
        this.errorMessage = 'Erreur lors du téléchargement du PDF';
      }
    });
  }

  /**
   * Send email
   */
  sendEmail() {
    if (!this.pv?.id) return;

    // Get recipient emails from participants
    const recipients = this.pv.content.participants
      .map(p => p.name)
      .filter(Boolean);

    if (recipients.length === 0) {
      this.errorMessage = 'Aucun participant trouvé';
      return;
    }

    this.meetingService.sendPVEmail(this.pv.id, recipients).subscribe({
      next: () => {
        console.log('[PVDisplay] ✅ Email sent');
        this.successMessage = '✅ PV envoyé par email';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('[PVDisplay] ❌ Error sending email:', error);
        this.errorMessage = 'Erreur lors de l\'envoi de l\'email';
      }
    });
  }

  /**
   * Approve PV
   */
  approvePV() {
    if (!this.pv?.id || !this.pv) return;

    this.pv.status = 'approved';

    this.meetingService.updatePV(this.pv.id, { status: 'approved' }).subscribe({
      next: () => {
        console.log('[PVDisplay] ✅ PV approved');
        this.successMessage = '✅ Procès-Verbal approuvé';
        this.pv!.status = 'approved';
      },
      error: (error) => {
        console.error('[PVDisplay] ❌ Error approving PV:', error);
        this.errorMessage = 'Erreur lors de l\'approbation';
      }
    });
  }

  /**
   * Sign PV
   */
  signPV() {
    if (!this.pv?.id) return;

    // Simulate signature (in real app, use digital signature)
    const signature = `Dr. ${new Date().toISOString()}`;

    this.meetingService.signPV(this.pv.id, signature).subscribe({
      next: () => {
        console.log('[PVDisplay] ✅ PV signed');
        this.successMessage = '✅ Procès-Verbal signé';
        this.pv!.status = 'signed';
      },
      error: (error) => {
        console.error('[PVDisplay] ❌ Error signing PV:', error);
        this.errorMessage = 'Erreur lors de la signature';
      }
    });
  }

  /**
   * Go back
   */
  goBack() {
    this.router.navigate(['/collaboration/dashboard']);
  }

  /**
   * Get badge style for status
   */
  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  /**
   * Get priority badge
   */
  getPriorityClass(priority?: string): string {
    return `priority-${priority || 'medium'}`;
  }
}
