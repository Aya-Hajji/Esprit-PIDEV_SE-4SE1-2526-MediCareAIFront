import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MeetingService } from '../../services/meeting.service';
import { MeetingExtended } from '../../models/collaboration.model';

@Component({
  selector: 'app-meeting-scheduler',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './meeting-scheduler.component.html',
  styleUrls: ['./meeting-scheduler.component.css']
})
export class MeetingSchedulerComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  editMode = false;
  meetingId: number | null = null;

  statuses = [
    { value: 'SCHEDULED', label: 'Programmée' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'COMPLETED', label: 'Terminée' },
    { value: 'CANCELLED', label: 'Annulée' }
  ];

  venues = [
    { value: 'VIRTUAL', label: 'Virtuelle (Teams/Zoom)' },
    { value: 'OFFLINE', label: 'En présentiel' },
    { value: 'HYBRID', label: 'Hybride' }
  ];

  constructor(
    private fb: FormBuilder,
    private meetingService: MeetingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.checkEditMode();
  }

  initializeForm() {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
      scheduledDate: [today, Validators.required],
      scheduledTime: [currentTime, Validators.required],
      duration: [60, [Validators.required, Validators.min(15), Validators.max(480)]],
      venue: ['VIRTUAL', Validators.required],
      meetingLink: ['', Validators.required],
      status: ['SCHEDULED', Validators.required],
      isRecorded: [false]
    });
  }

  checkEditMode() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.meetingId = +params['id'];
        this.loadMeeting();
      }
    });
  }

  loadMeeting() {
    if (!this.meetingId) return;
    this.isLoading = true;

    this.meetingService.getMeetingById(this.meetingId).subscribe({
      next: (meeting) => {
        this.form.patchValue({
          title: meeting.title,
          description: meeting.description,
          scheduledDate: meeting.scheduledDate,
          scheduledTime: meeting.scheduledTime,
          duration: meeting.duration,
          venue: meeting.venue || 'VIRTUAL',
          meetingLink: meeting.meetingLink,
          status: meeting.status,
          isRecorded: meeting.isRecorded
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading meeting:', error);
        this.errorMessage = 'Erreur lors du chargement de la réunion';
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.form.value;

    const request = this.editMode && this.meetingId
      ? this.meetingService.updateMeeting(this.meetingId, formValue)
      : this.meetingService.createMeeting(formValue);

    request.subscribe({
      next: (meeting) => {
        this.successMessage = this.editMode
          ? 'Réunion mise à jour avec succès'
          : 'Réunion créée avec succès';
        setTimeout(() => {
          this.router.navigate(['/collaboration/dashboard/meetings']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error saving meeting:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'enregistrement de la réunion';
        this.isSubmitting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/collaboration/dashboard/meetings']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
    if (field.errors['min']) return `Minimum ${field.errors['min'].min}`;
    if (field.errors['max']) return `Maximum ${field.errors['max'].max}`;
    if (field.errors['pattern']) return 'Format invalide';
    return 'Erreur de validation';
  }

  getTitleCharCount(): number {
    return this.form.get('title')?.value?.length || 0;
  }

  getDescriptionCharCount(): number {
    return this.form.get('description')?.value?.length || 0;
  }

  getTitlePercentage(): number {
    return Math.min((this.getTitleCharCount() / 150) * 100, 100);
  }

  getDescriptionPercentage(): number {
    return Math.min((this.getDescriptionCharCount() / 2000) * 100, 100);
  }

  getDurationClass(): string {
    const duration = this.form.get('duration')?.value || 0;
    if (duration < 30) return 'duration-warning';
    if (duration > 180) return 'duration-warning';
    return 'duration-good';
  }

  getDurationInfo(): string {
    const duration = this.form.get('duration')?.value || 0;
    if (duration < 30) return '⚠️ Très court - reconnaître plus de temps';
    if (duration > 180) return '⚠️ Très long - considérez une division en deux';
    return '✅ Durée optimale';
  }

  generateMeetingLink(): void {
    const venue = this.form.get('venue')?.value;
    let link = '';

    if (venue === 'VIRTUAL') {
      const baseUrl = 'https://teams.microsoft.com/l/meetup-join/';
      link = baseUrl + this.generateRandomId();
    } else {
      link = 'À définir en présentiel';
    }

    this.form.patchValue({ meetingLink: link });
  }

  private generateRandomId(): string {
    return 'mtg-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}
