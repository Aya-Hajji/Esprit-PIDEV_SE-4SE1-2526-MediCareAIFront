import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface InvitationToken {
  token: string;
  sessionId: number;
  meetingId?: number;
  email: string;
  role: 'EDITOR' | 'VIEWER';
  createdAt: Date;
  expiresAt: Date;
  accepted: boolean;
  meetingLink?: string; // Teams or other meeting link
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private readonly STORAGE_KEY = 'collaboration_invitations';
  private readonly TOKEN_EXPIRY_HOURS = 24; // Tokens expire after 24 hours
  
  private invitationsSubject = new BehaviorSubject<InvitationToken[]>([]);
  invitations$ = this.invitationsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Génère un token unique sans dépendre d'une bibliothèque externe
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Génère un token d'invitation unique
   */
  generateInvitationToken(
    sessionId: number,
    email: string,
    role: 'EDITOR' | 'VIEWER',
    meetingId?: number,
    meetingLink?: string
  ): InvitationToken {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    const invitation: InvitationToken = {
      token: this.generateUUID(),
      sessionId,
      meetingId,
      email,
      role,
      createdAt: now,
      expiresAt,
      accepted: false,
      meetingLink
    };

    // Ajouter à la liste
    const current = this.invitationsSubject.value;
    this.invitationsSubject.next([...current, invitation]);

    // Sauvegarder dans localStorage
    this.saveToStorage();

    console.log('[InvitationService] Token généré:', invitation);
    return invitation;
  }

  /**
   * Génère l'URL complète de partage
   */
  generateInvitationLink(token: string): string {
    const baseUrl = window.location.origin;
    // Routes are nested under /collaboration/dashboard/ in the main routing
    return `${baseUrl}/collaboration/dashboard/accept-invite/${token}`;
  }

  /**
   * Valide et accepte un token d'invitation
   */
  acceptInvitationToken(token: string): InvitationToken | null {
    console.log('[InvitationService] Tentative d\'acceptation du token:', token);

    const invitations = this.invitationsSubject.value;
    const invitation = invitations.find(inv => inv.token === token);

    if (!invitation) {
      console.error('[InvitationService] Token non trouvé');
      return null;
    }

    // Vérifier l'expiration
    const now = new Date();
    if (now > invitation.expiresAt) {
      console.error('[InvitationService] Token expiré');
      return null;
    }

    // Marquer comme accepté
    invitation.accepted = true;
    this.invitationsSubject.next([...invitations]);
    this.saveToStorage();

    console.log('[InvitationService] Token accepté:', invitation);
    return invitation;
  }

  /**
   * Récupère les détails d'une invitation par token
   */
  getInvitationByToken(token: string): InvitationToken | null {
    const invitations = this.invitationsSubject.value;
    const invitation = invitations.find(inv => inv.token === token);

    if (!invitation) {
      return null;
    }

    // Vérifier l'expiration
    const now = new Date();
    if (now > invitation.expiresAt) {
      console.warn('[InvitationService] Token expiré:', token);
      return null;
    }

    return invitation;
  }

  /**
   * Récupère toutes les invitations pour une session
   */
  getInvitationsBySessionId(sessionId: number): InvitationToken[] {
    return this.invitationsSubject.value.filter(inv => inv.sessionId === sessionId);
  }

  /**
   * Nettoie les tokens expirés
   */
  cleanupExpiredTokens(): void {
    const now = new Date();
    const current = this.invitationsSubject.value;
    const filtered = current.filter(inv => now <= inv.expiresAt);

    if (filtered.length < current.length) {
      console.log('[InvitationService] Nettoyage des tokens expirés');
      this.invitationsSubject.next(filtered);
      this.saveToStorage();
    }
  }

  /**
   * Sauvegarde les invitations dans localStorage
   */
  private saveToStorage(): void {
    try {
      const invitations = this.invitationsSubject.value;
      // Convertir les Date en strings pour le stockage JSON
      const serialized = invitations.map(inv => ({
        ...inv,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString()
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
      console.log('[InvitationService] Invitations sauvegardées dans localStorage');
    } catch (error) {
      console.error('[InvitationService] Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Charge les invitations depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Reconvertir les strings en Date
        const invitations = parsed.map((inv: any) => ({
          ...inv,
          createdAt: new Date(inv.createdAt),
          expiresAt: new Date(inv.expiresAt)
        }));
        this.invitationsSubject.next(invitations);
        console.log('[InvitationService] Invitations chargées depuis localStorage');
      }
    } catch (error) {
      console.error('[InvitationService] Erreur lors du chargement:', error);
    }
  }
}
