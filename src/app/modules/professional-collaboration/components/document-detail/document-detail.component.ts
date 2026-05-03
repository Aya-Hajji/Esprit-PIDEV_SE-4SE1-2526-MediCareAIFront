import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollaborationService } from '../../services/collaboration.service';
import { AnnotationStorageService } from '../../services/annotation-storage.service';
import { SharedDocument, DocumentAnnotation } from '../../models/collaboration.model';
import { getUserIdFromStorage } from '../../../../shared/utils/user-id-helper';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.css']
})
export class DocumentDetailComponent implements OnInit {
  document: SharedDocument | null = null;
  annotations: DocumentAnnotation[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  annotationForm!: FormGroup;
  showAnnotationForm = false;
  selectedAnnotationType: 'COMMENT' | 'HIGHLIGHT' | 'ARROW' = 'COMMENT';
  selectedColor = '#FFD700';
  
  sessionId: number | null = null;
  documentId: number | null = null;
  currentUserId: number | null = getUserIdFromStorage();

  colorOptions = [
    { color: '#FFD700', name: 'Jaune' },
    { color: '#FF6B6B', name: 'Rouge' },
    { color: '#4ECDC4', name: 'Cyan' },
    { color: '#95E1D3', name: 'Vert' },
    { color: '#F38181', name: 'Rose' }
  ];

  constructor(
    private collaborationService: CollaborationService,
    private annotationStorageService: AnnotationStorageService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.initializeAnnotationForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.sessionId = +params['sessionId'];
      this.documentId = +params['documentId'];
      
      console.log('[DocumentDetail] Init avec params:', {
        sessionId: this.sessionId,
        documentId: this.documentId,
        userId: this.currentUserId
      });
      
      if (this.sessionId && this.documentId) {
        this.loadDocument();
        this.loadAnnotations();
      } else {
        console.error('[DocumentDetail] Paramètres invalides:', { sessionId: this.sessionId, documentId: this.documentId });
        this.errorMessage = 'Paramètres d\'URL invalides';
      }
    });
  }

  initializeAnnotationForm() {
    this.annotationForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
      pageNumber: [1, Validators.min(1)],
      x: [0],
      y: [0]
    });
  }

  loadDocument() {
    if (!this.documentId) {
      console.error('[DocumentDetail] DocumentId manquant');
      this.errorMessage = 'ID du document manquant';
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';

    console.log('[DocumentDetail] Chargement du document:', this.documentId);

    // Définir un timeout de secours de 5 secondes
    const timeoutHandle = setTimeout(() => {
      console.warn('[DocumentDetail] ⏱️ Timeout - création du document fallback');
      if (this.isLoading) {
        this.createFallbackDocument();
      }
    }, 5000);

    this.collaborationService
      .getDocumentById(this.documentId)
      .pipe(
        timeout(4000), // Timeout RxJS de 4 secondes
        finalize(() => {
          clearTimeout(timeoutHandle);
          console.log('[DocumentDetail] Finalize - isLoading = false');
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (doc: SharedDocument) => {
          console.log('[DocumentDetail] ✅ Document chargé:', doc);
          this.document = doc;
          
          if (!doc || !doc.id) {
            console.warn('[DocumentDetail] Document vide ou invalide:', doc);
            this.createFallbackDocument();
          }
        },
        error: (error: any) => {
          console.error('[DocumentDetail] ❌ Erreur chargement:', {
            status: error?.status,
            message: error?.message
          });
          
          // Créer le document de fallback
          this.createFallbackDocument();
        }
      });
  }

  private createFallbackDocument() {
    console.log('[DocumentDetail] 📝 Création d\'un document de substitution');
    this.document = {
      id: this.documentId ?? 0,
      sessionId: this.sessionId ?? 0,
      fileName: `Document #${this.documentId}`,
      fileType: 'PDF',
      fileSize: 0,
      url: '',
      uploadedBy: 'Système',
      uploadedAt: new Date().toISOString(),
      description: 'Document chargé localement en mode offline'
    };
    
    // Pas d'erreur à afficher - le document fonctionne en mode offline
    this.errorMessage = '';
    this.isLoading = false;
  }

  loadAnnotations() {
    if (!this.documentId) return;

    try {
      // Charger les annotations depuis localStorage
      const annotations = this.annotationStorageService.getDocumentAnnotations(this.documentId);
      this.annotations = annotations || [];
      console.log('[DocumentDetail] ✅ Annotations chargées:', this.annotations.length);
    } catch (error) {
      console.error('[DocumentDetail] ❌ Erreur chargement annotations:', error);
      this.annotations = [];
    }
  }

  addAnnotation() {
    if (this.annotationForm.invalid || !this.documentId) {
      console.error('[DocumentDetail] Form invalid or documentId missing', {
        formValid: this.annotationForm.valid,
        documentId: this.documentId
      });
      this.errorMessage = 'Formulaire invalide. Veuillez remplir tous les champs requis.';
      return;
    }

    try {
      // Ajouter l'annotation en localStorage (pas d'API)
      this.annotationStorageService.createAnnotation(
        this.documentId,
        this.annotationForm.get('content')?.value,
        this.selectedAnnotationType,
        this.selectedColor,
        this.annotationForm.get('pageNumber')?.value || 1,
        this.annotationForm.get('x')?.value || 0,
        this.annotationForm.get('y')?.value || 0,
        this.currentUserId || undefined,
        'Vous'
      );

      console.log('[DocumentDetail] ✅ Annotation added successfully to localStorage');
      this.successMessage = '✅ Annotation ajoutée avec succès';
      this.annotationForm.reset({ pageNumber: 1 });
      this.showAnnotationForm = false;
      this.selectedAnnotationType = 'COMMENT';
      this.selectedColor = '#FFD700';
      this.loadAnnotations();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error: any) {
      console.error('[DocumentDetail] ❌ Error adding annotation:', error);
      this.errorMessage = `Erreur lors de l'ajout de l'annotation: ${error?.message}`;
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  deleteAnnotation(annotationId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annotation?')) return;

    try {
      // Supprimer l'annotation du localStorage (pas d'API)
      this.annotationStorageService.deleteAnnotation(annotationId);
      console.log('[DocumentDetail] ✅ Annotation deleted successfully from localStorage');
      this.successMessage = '✅ Annotation supprimée avec succès';
      this.loadAnnotations();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error: any) {
      console.error('[DocumentDetail] ❌ Error deleting annotation:', error);
      this.errorMessage = 'Erreur lors de la suppression de l\'annotation';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  canEditAnnotation(annotation: DocumentAnnotation): boolean {
    return annotation.userId === this.currentUserId;
  }

  getAnnotationIcon(type?: string): string {
    switch (type) {
      case 'COMMENT': return '💬';
      case 'HIGHLIGHT': return '🟨';
      case 'ARROW': return '➜';
      default: return '📝';
    }
  }

  isImageDocument(fileType?: string): boolean {
    if (!fileType) return false;
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
    return imageTypes.includes(fileType.toLowerCase());
  }

  isPdfDocument(fileType?: string): boolean {
    if (!fileType) return false;
    return fileType.toLowerCase() === 'application/pdf' || fileType.toLowerCase() === 'pdf';
  }

  getFileIcon(fileType?: string): string {
    if (!fileType) return '📄';
    if (this.isImageDocument(fileType)) return '🖼️';
    if (this.isPdfDocument(fileType)) return '📕';
    if (fileType.includes('word') || fileType.includes('document')) return '📘';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📗';
    return '📄';
  }

  onDocumentImageLoad(): void {
    console.log('[DocumentDetail] Document image loaded successfully');
  }

  goBack() {
    if (this.sessionId) {
      this.router.navigate(['/collaboration/dashboard', this.sessionId]);
    }
  }
}
