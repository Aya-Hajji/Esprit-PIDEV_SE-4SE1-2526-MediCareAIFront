import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Discussion, DiscussionReply } from '../models/collaboration.model';

@Injectable({
  providedIn: 'root'
})
export class DiscussionStorageService {
  private readonly STORAGE_KEY = 'collaboration_discussions';
  
  private discussionsSubject = new BehaviorSubject<Discussion[]>([]);
  discussions$ = this.discussionsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Génère un UUID unique
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Récupère les discussions d'une session
   */
  getSessionDiscussions(sessionId: number): Discussion[] {
    const discussions = this.discussionsSubject.value;
    return discussions.filter(d => d.sessionId === sessionId);
  }

  /**
   * Crée une nouvelle discussion
   */
  createDiscussion(sessionId: number, title: string, content: string, createdBy?: number, createdByName?: string): Discussion {
    const now = new Date();
    const discussion: Discussion = {
      id: Math.floor(Math.random() * 1000000),
      sessionId,
      title,
      content,
      createdBy,
      createdByName: createdByName || 'Utilisateur',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      replies: [],
      replyCount: 0,
      isEditable: true
    };

    const current = this.discussionsSubject.value;
    this.discussionsSubject.next([...current, discussion]);
    this.saveToStorage();

    console.log('[DiscussionStorage] ✅ Discussion créée:', discussion);
    return discussion;
  }

  /**
   * Ajoute une réponse à une discussion
   */
  addReply(discussionId: number, content: string, createdBy?: number, createdByName?: string): DiscussionReply {
    const discussions = this.discussionsSubject.value;
    const discussion = discussions.find(d => d.id === discussionId);

    if (!discussion) {
      console.error('[DiscussionStorage] Discussion non trouvée:', discussionId);
      throw new Error('Discussion not found');
    }

    const now = new Date();
    const reply: DiscussionReply = {
      id: Math.floor(Math.random() * 1000000),
      discussionId,
      content,
      createdBy,
      createdByName: createdByName || 'Utilisateur',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isEditable: true
    };

    if (!discussion.replies) {
      discussion.replies = [];
    }
    discussion.replies.push(reply);
    discussion.replyCount = (discussion.replyCount || 0) + 1;

    this.discussionsSubject.next([...discussions]);
    this.saveToStorage();

    console.log('[DiscussionStorage] ✅ Réponse ajoutée:', reply);
    return reply;
  }

  /**
   * Supprime une discussion
   */
  deleteDiscussion(discussionId: number): void {
    const discussions = this.discussionsSubject.value;
    const filtered = discussions.filter(d => d.id !== discussionId);

    if (filtered.length < discussions.length) {
      this.discussionsSubject.next(filtered);
      this.saveToStorage();
      console.log('[DiscussionStorage] ✅ Discussion supprimée:', discussionId);
    }
  }

  /**
   * Supprime une réponse
   */
  deleteReply(discussionId: number, replyId: number): void {
    const discussions = this.discussionsSubject.value;
    const discussion = discussions.find(d => d.id === discussionId);

    if (discussion && discussion.replies) {
      discussion.replies = discussion.replies.filter(r => r.id !== replyId);
      discussion.replyCount = (discussion.replyCount || 1) - 1;
      this.discussionsSubject.next([...discussions]);
      this.saveToStorage();
      console.log('[DiscussionStorage] ✅ Réponse supprimée:', replyId);
    }
  }

  /**
   * Sauvegarde les discussions dans localStorage
   */
  private saveToStorage(): void {
    try {
      const discussions = this.discussionsSubject.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(discussions));
      console.log('[DiscussionStorage] 💾 Discussions sauvegardées');
    } catch (error) {
      console.error('[DiscussionStorage] ❌ Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Charge les discussions depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const discussions = JSON.parse(stored);
        this.discussionsSubject.next(discussions);
        console.log('[DiscussionStorage] 📖 Discussions chargées:', discussions.length);
      }
    } catch (error) {
      console.error('[DiscussionStorage] ❌ Erreur lors du chargement:', error);
    }
  }

  /**
   * Exporte les discussions au format JSON
   */
  exportDiscussions(): string {
    return JSON.stringify(this.discussionsSubject.value, null, 2);
  }

  /**
   * Nettoie toutes les discussions
   */
  clearAll(): void {
    this.discussionsSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[DiscussionStorage] 🗑️ Toutes les discussions supprimées');
  }
}
