import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { SessionExtended, Participant, SharedDocument, Discussion } from '../models/collaboration.model';

/**
 * Interface pour les métriques d'analyse de collaboration
 */
export interface CollaborationMetrics {
  sessionId: number;
  participationRate: number; // 0-100
  engagementScore: number; // 0-100
  expertDistribution: ExpertDistribution;
  documentActivityIndex: number; // 0-100
  discussionDensity: number; // nombre de discussions par jour
  averageResponseTime: number; // en minutes
  collaborationEfficiency: number; // 0-100
  peakActivityHours: string[];
  dominantRoles: RoleDistribution;
}

export interface ExpertDistribution {
  bySpecialty: Map<string, number>;
  diversityIndex: number; // 0-1
  specialtyBalance: number; // 0-100
}

export interface RoleDistribution {
  organizerCount: number;
  editorCount: number;
  viewerCount: number;
  roleBalance: number; // 0-100
}

export interface PerformanceIndicator {
  metric: string;
  value: number;
  target: number;
  variance: number; // -100 to 100
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export interface CollaborationPattern {
  patternName: string;
  confidence: number; // 0-1
  frequency: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CollaborationAnalyticsService {
  private metricsSubject = new BehaviorSubject<Map<number, CollaborationMetrics>>(new Map());
  metrics$ = this.metricsSubject.asObservable();

  private patternsSubject = new BehaviorSubject<CollaborationPattern[]>([]);
  patterns$ = this.patternsSubject.asObservable();

  constructor() {
    console.log('CollaborationAnalyticsService initialized');
  }

  /**
   * Calcule les métriques complètes d'une session de collaboration
   * Logique avancée : statistiques, distribution, efficacité
   */
  calculateSessionMetrics(
    session: SessionExtended,
    documents: SharedDocument[],
    discussions: Discussion[],
    participants: Participant[]
  ): CollaborationMetrics {
    const now = new Date();
    const startDate = new Date(session.startDate || session.createdAt!);
    const endDate = new Date(session.endDate || now);
    const sessionDurationDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // 1. Calcul du taux de participation
    const participationRate = this.calculateParticipationRate(participants, session.maxParticipants);

    // 2. Calcul du score d'engagement
    const engagementScore = this.calculateEngagementScore(
      participants,
      documents,
      discussions,
      sessionDurationDays
    );

    // 3. Distribution d'expertise
    const expertDistribution = this.analyzeExpertDistribution(participants);

    // 4. Index d'activité des documents
    const documentActivityIndex = this.calculateDocumentActivityIndex(documents, sessionDurationDays);

    // 5. Densité de discussion
    const discussionDensity = discussions.length / sessionDurationDays;

    // 6. Temps de réponse moyen
    const averageResponseTime = this.calculateAverageResponseTime(discussions);

    // 7. Efficacité de collaboration
    const collaborationEfficiency = this.calculateCollaborationEfficiency(
      participationRate,
      engagementScore,
      expertDistribution.specialtyBalance,
      documentActivityIndex
    );

    // 8. Heures d'activité de pointe
    const peakActivityHours = this.identifyPeakHours(discussions, documents);

    // 9. Distribution des rôles
    const dominantRoles = this.calculateRoleDistribution(participants);

    return {
      sessionId: session.id!,
      participationRate,
      engagementScore,
      expertDistribution,
      documentActivityIndex,
      discussionDensity: Math.round(discussionDensity * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      collaborationEfficiency,
      peakActivityHours,
      dominantRoles
    };
  }

  /**
   * Analyse les patterns de collaboration complexes
   * Détecte anomalies, tendances et opportunités
   */
  detectCollaborationPatterns(
    sessions: SessionExtended[],
    historicalMetrics: CollaborationMetrics[]
  ): CollaborationPattern[] {
    const patterns: CollaborationPattern[] = [];

    // Pattern 1: Détection de leadership
    const leadershipPattern = this.detectLeadershipPattern(sessions);
    if (leadershipPattern) patterns.push(leadershipPattern);

    // Pattern 2: Détection de silos (faible interaction)
    const siloPattern = this.detectSiloPattern(historicalMetrics);
    if (siloPattern) patterns.push(siloPattern);

    // Pattern 3: Détection de pic de productivité
    const productivityPattern = this.detectProductivitySpike(historicalMetrics);
    if (productivityPattern) patterns.push(productivityPattern);

    // Pattern 4: Détection d'expertise manquante
    const expertiseGapPattern = this.detectExpertiseGap(historicalMetrics);
    if (expertiseGapPattern) patterns.push(expertiseGapPattern);

    // Pattern 5: Détection de déséquilibre de rôles
    const roleImbalancePattern = this.detectRoleImbalance(historicalMetrics);
    if (roleImbalancePattern) patterns.push(roleImbalancePattern);

    this.patternsSubject.next(patterns);
    return patterns;
  }

  /**
   * Prédiction de la performance future basée sur tendances historiques
   */
  predictFuturePerformance(
    currentMetrics: CollaborationMetrics,
    historicalMetrics: CollaborationMetrics[],
    daysAhead: number = 7
  ): PerformanceIndicator[] {
    const indicators: PerformanceIndicator[] = [];

    // Prédiction 1: Engagement
    indicators.push(
      this.predictMetric(
        'Engagement Score',
        currentMetrics.engagementScore,
        historicalMetrics.map(m => m.engagementScore),
        daysAhead,
        100
      )
    );

    // Prédiction 2: Participation
    indicators.push(
      this.predictMetric(
        'Participation Rate',
        currentMetrics.participationRate,
        historicalMetrics.map(m => m.participationRate),
        daysAhead,
        100
      )
    );

    // Prédiction 3: Efficacité
    indicators.push(
      this.predictMetric(
        'Collaboration Efficiency',
        currentMetrics.collaborationEfficiency,
        historicalMetrics.map(m => m.collaborationEfficiency),
        daysAhead,
        100
      )
    );

    return indicators;
  }

  /**
   * Génère un rapport d'analyse détaillé
   */
  generateAnalysisReport(metrics: CollaborationMetrics): string {
    const report = `
═══════════════════════════════════════════════════════════
          RAPPORT D'ANALYSE DE COLLABORATION
═══════════════════════════════════════════════════════════

SESSION ID: ${metrics.sessionId}

📊 INDICATEURS PRINCIPAUX:
  • Taux de Participation: ${metrics.participationRate.toFixed(2)}%
  • Score d'Engagement: ${metrics.engagementScore.toFixed(2)}/100
  • Efficacité de Collaboration: ${metrics.collaborationEfficiency.toFixed(2)}/100
  • Densité de Discussion: ${metrics.discussionDensity.toFixed(2)} discussions/jour

👥 DISTRIBUTION D'EXPERTISE:
  • Indice de Diversité: ${(metrics.expertDistribution.diversityIndex * 100).toFixed(2)}%
  • Équilibre Spécialité: ${metrics.expertDistribution.specialtyBalance.toFixed(2)}%

📄 ACTIVITÉ DOCUMENTAIRE:
  • Index d'Activité: ${metrics.documentActivityIndex.toFixed(2)}/100
  • Temps de Réponse Moyen: ${metrics.averageResponseTime} minutes

👔 DISTRIBUTION DES RÔLES:
  • Organisateurs: ${metrics.dominantRoles.organizerCount}
  • Éditeurs: ${metrics.dominantRoles.editorCount}
  • Visualiseurs: ${metrics.dominantRoles.viewerCount}
  • Équilibre des Rôles: ${metrics.dominantRoles.roleBalance.toFixed(2)}%

🕐 HEURES DE POINTE:
  ${metrics.peakActivityHours.join(', ')}

═══════════════════════════════════════════════════════════
    `;
    return report;
  }

  // ============================================
  // MÉTHODES PRIVÉES (Logique Complexe)
  // ============================================

  private calculateParticipationRate(
    participants: Participant[],
    maxParticipants?: number
  ): number {
    if (!participants || participants.length === 0) return 0;
    const activeParticipants = participants.filter(p => p.joinedAt).length;
    const max = maxParticipants || Math.max(1, participants.length);
    return Math.min(100, (activeParticipants / max) * 100);
  }

  private calculateEngagementScore(
    participants: Participant[],
    documents: SharedDocument[],
    discussions: Discussion[],
    durationDays: number
  ): number {
    // Poids des différents facteurs
    const weights = {
      participation: 0.3,
      documentActivity: 0.3,
      discussionActivity: 0.4
    };

    // Calcul score participation (0-100)
    const participationScore = Math.min(100, (participants.length / 10) * 100);

    // Calcul score activité documentaire (0-100)
    const docsPerDay = durationDays > 0 ? documents.length / durationDays : 0;
    const documentScore = Math.min(100, docsPerDay * 10);

    // Calcul score activité discussion (0-100)
    const discussionsPerDay = durationDays > 0 ? discussions.length / durationDays : 0;
    const discussionScore = Math.min(100, discussionsPerDay * 10);

    // Score pondéré final
    const engagementScore =
      weights.participation * participationScore +
      weights.documentActivity * documentScore +
      weights.discussionActivity * discussionScore;

    return Math.round(engagementScore);
  }

  private analyzeExpertDistribution(participants: Participant[]): ExpertDistribution {
    const specialtyMap = new Map<string, number>();
    const specialties = participants
      .filter(p => p.specialty)
      .map(p => p.specialty!) as string[];

    specialties.forEach(specialty => {
      specialtyMap.set(specialty, (specialtyMap.get(specialty) || 0) + 1);
    });

    // Calcul de l'indice de diversité (Herfindahl-Hirschman Index)
    let hhi = 0;
    const total = specialties.length || 1;
    for (const count of specialtyMap.values()) {
      const percentage = count / total;
      hhi += percentage * percentage;
    }
    const diversityIndex = 1 - hhi; // Normalisé à [0, 1]

    // Calcul de l'équilibre
    const maxSpecialty = Math.max(...Array.from(specialtyMap.values()), 1);
    const specialtyBalance = (1 - maxSpecialty / total) * 100;

    return {
      bySpecialty: specialtyMap,
      diversityIndex: Math.round(diversityIndex * 100) / 100,
      specialtyBalance: Math.round(specialtyBalance)
    };
  }

  private calculateDocumentActivityIndex(
    documents: SharedDocument[],
    durationDays: number
  ): number {
    if (documents.length === 0) return 0;

    const annotationTotal = documents.reduce((sum, doc) => sum + (doc.annotationCount || 0), 0);
    const activityPerDay = documents.length / Math.max(1, durationDays);
    const annotationRate = annotationTotal / Math.max(1, documents.length);

    const index = (activityPerDay * 20) + (annotationRate * 10);
    return Math.min(100, Math.round(index));
  }

  private calculateAverageResponseTime(discussions: Discussion[]): number {
    if (!discussions || discussions.length === 0) return 0;

    let totalTime = 0;
    let countableDiscussions = 0;

    discussions.forEach(discussion => {
      if (discussion.replies && discussion.replies.length > 0) {
        const discussionCreated = new Date(discussion.createdAt!);
        discussion.replies.forEach(reply => {
          const replyCreated = new Date(reply.createdAt!);
          totalTime += (replyCreated.getTime() - discussionCreated.getTime()) / (1000 * 60);
          countableDiscussions++;
        });
      }
    });

    return countableDiscussions > 0 ? totalTime / countableDiscussions : 0;
  }

  private calculateCollaborationEfficiency(
    participationRate: number,
    engagementScore: number,
    specialtyBalance: number,
    documentActivityIndex: number
  ): number {
    // Formule d'efficacité pondérée
    const weights = {
      participation: 0.25,
      engagement: 0.3,
      balance: 0.25,
      activity: 0.2
    };

    const efficiency =
      weights.participation * participationRate +
      weights.engagement * engagementScore +
      weights.balance * specialtyBalance +
      weights.activity * documentActivityIndex;

    return Math.round(efficiency);
  }

  private identifyPeakHours(discussions: Discussion[], documents: SharedDocument[]): string[] {
    const hourCounts = new Map<number, number>();

    // Compter activité par heure pour les discussions
    discussions.forEach(discussion => {
      const dateStr = discussion.createdAt;
      if (dateStr) {
        const date = new Date(dateStr);
        const hour = date.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    });

    // Compter activité par heure pour les documents
    documents.forEach(doc => {
      const dateStr = doc.uploadedAt;
      if (dateStr) {
        const date = new Date(dateStr);
        const hour = date.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      }
    });

    // Trouver les 3 heures de pointe
    const sorted = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${hour}:59`);

    return sorted.length > 0 ? sorted : ['08:00-17:00'];
  }

  private calculateRoleDistribution(participants: Participant[]): RoleDistribution {
    const distribution = {
      organizerCount: participants.filter(p => p.role === 'ORGANIZER').length,
      editorCount: participants.filter(p => p.role === 'EDITOR').length,
      viewerCount: participants.filter(p => p.role === 'VIEWER').length
    };

    const maxCount = Math.max(...Object.values(distribution), 1);
    const total = participants.length || 1;
    const roleBalance = (1 - maxCount / total) * 100;

    return {
      ...distribution,
      roleBalance: Math.round(roleBalance)
    };
  }

  private detectLeadershipPattern(sessions: SessionExtended[]): CollaborationPattern | null {
    const activeOrganizers = sessions.filter(s => s.organizerId).length;
    if (activeOrganizers === 0) return null;

    return {
      patternName: 'Leadership Pattern Detected',
      confidence: Math.min(1, activeOrganizers / sessions.length),
      frequency: activeOrganizers,
      impact: 'HIGH',
      recommendations: [
        'Maintenir la continuité du leadership',
        'Documenter les pratiques de leadership réussies'
      ]
    };
  }

  private detectSiloPattern(metrics: CollaborationMetrics[]): CollaborationPattern | null {
    const lowEngagementCount = metrics.filter(m => m.engagementScore < 40).length;
    if (metrics.length === 0 || lowEngagementCount / metrics.length < 0.3) return null;

    return {
      patternName: 'Silo Detection',
      confidence: lowEngagementCount / metrics.length,
      frequency: lowEngagementCount,
      impact: 'HIGH',
      recommendations: [
        'Renforcer la communication inter-équipes',
        'Organiser des sessions de brainstorming croisées'
      ]
    };
  }

  private detectProductivitySpike(metrics: CollaborationMetrics[]): CollaborationPattern | null {
    if (metrics.length < 2) return null;

    const recent = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];
    const spike = ((recent.collaborationEfficiency - previous.collaborationEfficiency) / 
                   (previous.collaborationEfficiency || 1)) * 100;

    if (Math.abs(spike) < 25) return null;

    return {
      patternName: spike > 0 ? 'Productivity Spike' : 'Productivity Decline',
      confidence: Math.min(1, Math.abs(spike) / 100),
      frequency: 1,
      impact: spike > 0 ? 'HIGH' : 'MEDIUM',
      recommendations: spike > 0 
        ? ['Identifier les facteurs de succès', 'Reproduire cette dynamique']
        : ['Investiguer les causes du déclin', 'Mettre en place des actions correctives']
    };
  }

  private detectExpertiseGap(metrics: CollaborationMetrics[]): CollaborationPattern | null {
    const lowDiversityCount = metrics.filter(m => m.expertDistribution.diversityIndex < 0.4).length;
    if (metrics.length === 0 || lowDiversityCount / metrics.length < 0.5) return null;

    return {
      patternName: 'Expertise Gap',
      confidence: lowDiversityCount / metrics.length,
      frequency: lowDiversityCount,
      impact: 'MEDIUM',
      recommendations: [
        'Recruter des experts dans les domaines manquants',
        'Faciliter le transfert de connaissances'
      ]
    };
  }

  private detectRoleImbalance(metrics: CollaborationMetrics[]): CollaborationPattern | null {
    const imbalancedCount = metrics.filter(m => m.dominantRoles.roleBalance < 30).length;
    if (metrics.length === 0 || imbalancedCount / metrics.length < 0.4) return null;

    return {
      patternName: 'Role Imbalance',
      confidence: imbalancedCount / metrics.length,
      frequency: imbalancedCount,
      impact: 'MEDIUM',
      recommendations: [
        'Rééquilibrer les rôles dans les équipes',
        'Promouvoir la responsabilité partagée'
      ]
    };
  }

  private predictMetric(
    metricName: string,
    current: number,
    history: number[],
    daysAhead: number,
    maxValue: number
  ): PerformanceIndicator {
    if (history.length === 0) {
      return {
        metric: metricName,
        value: current,
        target: maxValue,
        variance: 0,
        trend: 'STABLE'
      };
    }

    // Calcul de la tendance simple (régression linéaire)
    const n = Math.min(history.length, 10);
    const recentHistory = history.slice(-n);
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recentHistory[i];
      sumXY += i * recentHistory[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const predicted = current + slope * daysAhead;
    const clampedPrediction = Math.max(0, Math.min(maxValue, predicted));

    const variance = ((clampedPrediction - current) / current) * 100;
    const trend = slope > 5 ? 'IMPROVING' : slope < -5 ? 'DECLINING' : 'STABLE';

    return {
      metric: metricName,
      value: Math.round(clampedPrediction * 100) / 100,
      target: maxValue,
      variance: Math.round(variance),
      trend
    };
  }
}
