import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DocumentAnnotation } from '../models/collaboration.model';

@Injectable({
  providedIn: 'root'
})
export class AnnotationStorageService {
  private readonly STORAGE_KEY = 'collaboration_annotations';
  
  private annotationsSubject = new BehaviorSubject<DocumentAnnotation[]>([]);
  annotations$ = this.annotationsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Récupère les annotations d'un document
   */
  getDocumentAnnotations(documentId: number): DocumentAnnotation[] {
    const annotations = this.annotationsSubject.value;
    return annotations.filter(a => a.documentId === documentId);
  }

  /**
   * Crée une nouvelle annotation
   */
  createAnnotation(
    documentId: number,
    content: string,
    type: 'COMMENT' | 'HIGHLIGHT' | 'ARROW' = 'COMMENT',
    color: string = '#FFD700',
    pageNumber: number = 1,
    x: number = 0,
    y: number = 0,
    userId?: number,
    userName?: string
  ): DocumentAnnotation {
    const now = new Date();
    const annotation: DocumentAnnotation = {
      id: Math.floor(Math.random() * 1000000),
      documentId,
      content,
      type,
      color,
      pageNumber,
      x,
      y,
      userId,
      userName: userName || 'Vous',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const current = this.annotationsSubject.value;
    this.annotationsSubject.next([...current, annotation]);
    this.saveToStorage();

    console.log('[AnnotationStorage] ✅ Annotation créée:', annotation);
    return annotation;
  }

  /**
   * Supprime une annotation
   */
  deleteAnnotation(annotationId: number): void {
    const annotations = this.annotationsSubject.value;
    const filtered = annotations.filter(a => a.id !== annotationId);

    if (filtered.length < annotations.length) {
      this.annotationsSubject.next(filtered);
      this.saveToStorage();
      console.log('[AnnotationStorage] ✅ Annotation supprimée:', annotationId);
    }
  }

  /**
   * Sauvegarde les annotations dans localStorage
   */
  private saveToStorage(): void {
    try {
      const annotations = this.annotationsSubject.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(annotations));
      console.log('[AnnotationStorage] 💾 Annotations sauvegardées');
    } catch (error) {
      console.error('[AnnotationStorage] ❌ Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Charge les annotations depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const annotations = JSON.parse(stored);
        this.annotationsSubject.next(annotations);
        console.log('[AnnotationStorage] 📖 Annotations chargées:', annotations.length);
      }
    } catch (error) {
      console.error('[AnnotationStorage] ❌ Erreur lors du chargement:', error);
    }
  }

  /**
   * Nettoie toutes les annotations
   */
  clearAll(): void {
    this.annotationsSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[AnnotationStorage] 🗑️ Toutes les annotations supprimées');
  }
}
