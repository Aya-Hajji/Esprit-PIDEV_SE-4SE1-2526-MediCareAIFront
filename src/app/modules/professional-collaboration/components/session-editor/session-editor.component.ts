import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollaborationService } from '../../services/collaboration.service';
import { AuthService } from '../../../../services/auth.service';
import { SessionExtended } from '../../models/collaboration.model';

@Component({
  selector: 'app-session-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './session-editor.component.html',
  styleUrls: ['./session-editor.component.css']
})
export class SessionEditorComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  editMode = false;
  sessionId: number | null = null;
  currentUserId: number | null = null;

  categories = [
    { value: 'SURGERY', label: 'Chirurgie' },
    { value: 'CARDIOLOGY', label: 'Cardiologie' },
    { value: 'NEUROLOGY', label: 'Neurologie' },
    { value: 'ONCOLOGY', label: 'Oncologie' },
    { value: 'RADIOLOGY', label: 'Radiologie' },
    { value: 'PEDIATRICS', label: 'Pédiatrie' },
    { value: 'OTHER', label: 'Autre' }
  ];

  statuses = [
    { value: 'PENDING', label: 'En attente' },
    { value: 'ACTIVE', label: 'Actif' },
    { value: 'COMPLETED', label: 'Terminé' },
    { value: 'ARCHIVED', label: 'Archivé' }
  ];

  constructor(
    private fb: FormBuilder,
    private collaborationService: CollaborationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Récupérer l'ID utilisateur au démarrage
    this.currentUserId = this.authService.getCurrentUserId();
    console.log('✅ SessionEditorComponent initialized with userId:', this.currentUserId);
  }

  ngOnInit() {
    this.initializeForm();
    this.checkEditMode();
    
    // Debug: Afficher les données de localStorage
    console.log('🔍 localStorage content:');
    console.log('  - authToken:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
    console.log('  - authUser:', localStorage.getItem('authUser'));
    console.log('  - userId:', localStorage.getItem('userId'));
    
    // Debug: Afficher l'ID utilisateur
    if (!this.currentUserId || this.currentUserId <= 0) {
      console.error('❌ NO VALID USER ID!');
      this.errorMessage = 'Erreur: Votre ID utilisateur n\'est pas disponible. Veuillez vous reconnecter.';
    } else {
      console.log('✅ Valid user ID available:', this.currentUserId);
    }
  }

  initializeForm() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
      caseNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9\-]+$/)]],
      category: ['OTHER', Validators.required],
      status: ['PENDING', Validators.required],
      maxParticipants: [10, [Validators.required, Validators.min(2), Validators.max(100)]]
    });
  }

  checkEditMode() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.sessionId = +params['id'];
        this.loadSession();
      }
    });
  }

  loadSession() {
    if (!this.sessionId) return;
    this.isLoading = true;

    this.collaborationService.getSessionById(this.sessionId).subscribe({
      next: (session) => {
        this.form.patchValue({
          title: session.title,
          description: session.description,
          caseNumber: session.caseNumber,
          status: session.status,
          maxParticipants: session.maxParticipants
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading session:', error);
        this.errorMessage = 'Erreur lors du chargement de la session';
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement';
      return;
    }

    // Récupérer l'ID utilisateur fraîchement
    const creatorId = this.authService.getCurrentUserId();
    console.log('📝 Form submission - Retrieved creatorId:', creatorId);
    console.log('📝 Current stored userId:', this.currentUserId);

    if (!creatorId || creatorId <= 0) {
      console.error('❌ SUBMISSION BLOCKED: Invalid creatorId=', creatorId);
      this.errorMessage = 'Erreur: Votre ID utilisateur n\'est pas disponible. Veuillez vous reconnecter.';
      console.error('📋 Current localStorage values:');
      console.error('  - userId:', localStorage.getItem('userId'));
      console.error('  - authUser:', localStorage.getItem('authUser'));
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.form.value;
    console.log('📤 Sending request with creatorId:', creatorId);

    const request = this.editMode && this.sessionId
      ? this.collaborationService.updateSession(this.sessionId, formValue)
      : this.collaborationService.createSession(formValue, creatorId);

    request.subscribe({
      next: (session: any) => {
        this.successMessage = this.editMode
          ? 'Session mise à jour avec succès'
          : 'Session créée avec succès';
        this.isSubmitting = false;
        setTimeout(() => {
          this.router.navigate(['/collaboration/dashboard']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Error saving session:', error);
        this.isSubmitting = false;
        
        // Meilleure gestion des erreurs
        if (error.status === 400 && error.error?.message?.includes('creatorId')) {
          this.errorMessage = 'Erreur: L\'ID du créateur est invalide. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Erreur de validation. Veuillez vérifier les données.';
        } else if (error.status === 401) {
          this.errorMessage = 'Erreur: Vous n\'êtes pas authentifié. Veuillez vous reconnecter.';
        } else if (error.status === 403) {
          this.errorMessage = 'Erreur: Vous n\'avez pas les permissions nécessaires.';
        } else {
          this.errorMessage = error.error?.message || error.message || 'Erreur lors de l\'enregistrement de la session';
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/collaboration/dashboard']);
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
}
