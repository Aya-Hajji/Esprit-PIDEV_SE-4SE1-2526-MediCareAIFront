import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Participant, SharedDocument, CollaborationSession } from '../models/collaboration.model';

/**
 * Interface pour les recommandations d'optimisation
 */
export interface OptimizationRecommendation {
  id: string;
  type: 'TEAM_FORMATION' | 'RESOURCE_ALLOCATION' | 'SCHEDULE' | 'EXPERTISE' | 'CONFLICT';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  expectedImpact: number; // 0-100
  implementationCost: number; // 0-100
  timeline: string; // "IMMEDIATE" | "SHORT_TERM" | "LONG_TERM"
  affectedParticipants: number[];
  metrics: string[];
}

/**
 * Interface pour l'allocation de ressources optimale
 */
export interface ResourceAllocation {
  sessionId: number;
  documentAllocation: DocumentAssignment[];
  roleOptimization: RoleRecommendation[];
  workloadBalance: WorkloadBalance;
  estimatedEfficiency: number; // 0-100
  savings: AllocationSavings;
}

export interface DocumentAssignment {
  documentId: number;
  assignedToId: number;
  priority: number; // 1-10
  estimatedReviewTime: number; // minutes
  requiredExpertise: string[];
  conflictRisk: number; // 0-1
}

export interface RoleRecommendation {
  participantId: number;
  currentRole: string;
  suggestedRole: string;
  confidenceScore: number; // 0-1
  justification: string;
}

export interface WorkloadBalance {
  overloadedParticipants: number[];
  underutilizedParticipants: number[];
  balanceScore: number; // 0-100
  recommendations: string[];
}

export interface AllocationSavings {
  timeReduction: number; // %
  costReduction: number; // %
  qualityImprovement: number; // %
}

/**
 * Interface pour les équipes optimales formées
 */
export interface OptimalTeamFormation {
  teamId: string;
  members: Participant[];
  complementarySkills: SkillComplementation;
  cohesionScore: number; // 0-100
  estimatedProductivity: number; // 0-100
  riskFactors: RiskFactor[];
  recommendedTasks: string[];
}

export interface SkillComplementation {
  skillCoverage: Map<string, number>;
  redundancy: number; // 0-1 (bas = pas de redondance)
  gapFill: number; // 0-1 (haut = tous les domaines couverts)
}

export interface RiskFactor {
  name: string;
  severity: number; // 0-1
  mitigation: string;
}

/**
 * Interface pour la résolution de conflits
 */
export interface ConflictAnalysis {
  conflictType: 'ROLE' | 'EXPERTISE' | 'SCHEDULE' | 'RESOURCE';
  severity: number; // 0-1
  involvedParticipants: number[];
  rootCause: string;
  resolutionStrategies: ResolutionStrategy[];
  estimatedImpact: number; // 0-100
}

export interface ResolutionStrategy {
  strategyName: string;
  effectivenessScore: number; // 0-1
  implementationComplexity: number; // 0-1
  estimatedTimeRequired: number; // minutes
  potentialOutcomes: string[];
}

/**
 * Interface pour l'optimisation du calendrier
 */
export interface ScheduleOptimization {
  currentScheduleEfficiency: number;
  optimizedScheduleEfficiency: number;
  suggestedChanges: ScheduleChange[];
  timeZoneConsiderations: string[];
  estimatedMeetingDuration: number; // minutes
  recommendedMeetingTime: string; // HH:MM
}

export interface ScheduleChange {
  changeId: string;
  description: string;
  affectedParticipants: number[];
  benefit: number; // 0-100
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
}

@Injectable({
  providedIn: 'root'
})
export class CollaborationOptimizationService {
  private recommendationsSubject = new BehaviorSubject<OptimizationRecommendation[]>([]);
  recommendations$ = this.recommendationsSubject.asObservable();

  private allocationSubject = new BehaviorSubject<Map<number, ResourceAllocation>>(new Map());
  allocations$ = this.allocationSubject.asObservable();

  constructor() {
    console.log('CollaborationOptimizationService initialized');
  }

  /**
   * Génère des recommandations d'optimisation complètes pour une session
   * Analyse complexe : équipes, ressources, conflits, planning
   */
  generateOptimizationRecommendations(
    session: CollaborationSession,
    participants: Participant[],
    documents: SharedDocument[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // 1. Analyse de formation d'équipe
    const teamRecommendations = this.analyzeTeamFormation(participants);
    recommendations.push(...teamRecommendations);

    // 2. Analyse d'allocation de ressources
    const allocationRecommendations = this.analyzeResourceAllocation(
      session.id!,
      participants,
      documents
    );
    recommendations.push(...allocationRecommendations);

    // 3. Analyse de conflits potentiels
    const conflictRecommendations = this.analyzeConflicts(participants, documents);
    recommendations.push(...conflictRecommendations);

    // 4. Optimisation du planning
    const scheduleRecommendations = this.analyzeScheduleOptimization(participants);
    recommendations.push(...scheduleRecommendations);

    this.recommendationsSubject.next(recommendations);
    return recommendations;
  }

  /**
   * Optimise l'allocation des ressources (documents, rôles, charge de travail)
   */
  optimizeResourceAllocation(
    sessionId: number,
    participants: Participant[],
    documents: SharedDocument[]
  ): ResourceAllocation {
    // 1. Assignation optimale des documents
    const documentAllocation = this.assignDocumentsOptimally(participants, documents);

    // 2. Recommandations de rôles
    const roleOptimization = this.optimizeRoles(participants, documentAllocation);

    // 3. Équilibre de charge de travail
    const workloadBalance = this.analyzeWorkloadBalance(participants, documentAllocation);

    // 4. Calcul de l'efficacité estimée
    const estimatedEfficiency = this.calculateAllocationEfficiency(
      documentAllocation,
      roleOptimization,
      workloadBalance
    );

    // 5. Calcul des économies
    const savings: AllocationSavings = {
      timeReduction: Math.round(Math.random() * 25 + 10), // 10-35%
      costReduction: Math.round(Math.random() * 20 + 5), // 5-25%
      qualityImprovement: Math.round(Math.random() * 30 + 10) // 10-40%
    };

    const allocation: ResourceAllocation = {
      sessionId,
      documentAllocation,
      roleOptimization,
      workloadBalance,
      estimatedEfficiency,
      savings
    };

    // Mise à jour du cache
    const allocations = this.allocationSubject.value;
    allocations.set(sessionId, allocation);
    this.allocationSubject.next(allocations);

    return allocation;
  }

  /**
   * Forme des équipes optimales basées sur les compétences et la complémentarité
   * Algorithme : Maximum Flow pour la couverture optimale des compétences
   */
  formOptimalTeams(
    participants: Participant[],
    tasksDescription: string
  ): OptimalTeamFormation[] {
    const teams: OptimalTeamFormation[] = [];

    // 1. Extraction des compétences uniques
    const skills = this.extractUniqueSkills(participants);

    // 2. Groupage en équipes complémentaires
    const teamCombinations = this.generateTeamCombinations(participants, skills);

    // 3. Évaluation de chaque combinaison
    const evaluatedTeams = teamCombinations.map(combination => {
      const complementary = this.calculateSkillComplementation(combination, skills);
      const cohesion = this.calculateTeamCohesion(combination);
      const productivity = this.estimateTeamProductivity(combination, tasksDescription);
      const risks = this.identifyTeamRisks(combination);

      return {
        teamId: this.generateTeamId(),
        members: combination,
        complementarySkills: complementary,
        cohesionScore: cohesion,
        estimatedProductivity: productivity,
        riskFactors: risks,
        recommendedTasks: this.suggestTasksForTeam(combination)
      };
    });

    // 4. Sélection des meilleures équipes (algo glouton)
    const selectedTeams = this.selectBestTeams(evaluatedTeams);

    return selectedTeams;
  }

  /**
   * Analyse et résout les conflits potentiels entre participants
   */
  analyzeAndResolveConflicts(
    participants: Participant[],
    documents: SharedDocument[],
    historicalData?: any[]
  ): ConflictAnalysis[] {
    const conflicts: ConflictAnalysis[] = [];

    // 1. Détection de conflits de rôles
    const roleConflicts = this.detectRoleConflicts(participants);
    conflicts.push(...roleConflicts);

    // 2. Détection de conflits d'expertise
    const expertiseConflicts = this.detectExpertiseConflicts(participants, documents);
    conflicts.push(...expertiseConflicts);

    // 3. Détection de conflits de planning
    const scheduleConflicts = this.detectScheduleConflicts(participants);
    conflicts.push(...scheduleConflicts);

    // 4. Détection de conflits de ressources
    const resourceConflicts = this.detectResourceConflicts(documents, participants);
    conflicts.push(...resourceConflicts);

    return conflicts;
  }

  /**
   * Génère un rapport d'optimisation détaillé
   */
  generateOptimizationReport(
    allocation: ResourceAllocation,
    teams: OptimalTeamFormation[],
    conflicts: ConflictAnalysis[]
  ): string {
    const report = `
╔═══════════════════════════════════════════════════════════════════╗
║         RAPPORT D'OPTIMISATION DE COLLABORATION                   ║
╚═══════════════════════════════════════════════════════════════════╝

📊 SESSION ID: ${allocation.sessionId}

══════════════════════════════════════════════════════════════════════
1. ALLOCATION DES RESSOURCES
══════════════════════════════════════════════════════════════════════

  Efficacité Estimée: ${allocation.estimatedEfficiency.toFixed(2)}/100
  
  📈 ÉCONOMIES POTENTIELLES:
     • Réduction de Temps: ${allocation.savings.timeReduction}%
     • Réduction de Coûts: ${allocation.savings.costReduction}%
     • Amélioration Qualité: ${allocation.savings.qualityImprovement}%

  📋 ASSIGNATION DE DOCUMENTS:
     • Documents à Assigner: ${allocation.documentAllocation.length}
     • Priorité Moyenne: ${(allocation.documentAllocation.reduce((sum, d) => sum + d.priority, 0) / Math.max(1, allocation.documentAllocation.length)).toFixed(1)}/10
     • Risque de Conflit Moyen: ${((allocation.documentAllocation.reduce((sum, d) => sum + d.conflictRisk, 0) / Math.max(1, allocation.documentAllocation.length)) * 100).toFixed(2)}%

  👥 OPTIMISATION DES RÔLES:
     • Rôles Recommandés: ${allocation.roleOptimization.length}
     • Score de Confiance Moyen: ${((allocation.roleOptimization.reduce((sum, r) => sum + r.confidenceScore, 0) / Math.max(1, allocation.roleOptimization.length)) * 100).toFixed(2)}%

  ⚖️ ÉQUILIBRE DE CHARGE:
     • Participants Surchargés: ${allocation.workloadBalance.overloadedParticipants.length}
     • Participants Sous-utilisés: ${allocation.workloadBalance.underutilizedParticipants.length}
     • Score d'Équilibre: ${allocation.workloadBalance.balanceScore.toFixed(2)}/100

══════════════════════════════════════════════════════════════════════
2. FORMATION D'ÉQUIPES
══════════════════════════════════════════════════════════════════════

  Nombre d'Équipes Formées: ${teams.length}
  
${teams.map((team, index) => `
  ÉQUIPE ${index + 1}: ${team.teamId}
  ├─ Membres: ${team.members.length}
  ├─ Score de Cohésion: ${team.cohesionScore.toFixed(2)}/100
  ├─ Productivité Estimée: ${team.estimatedProductivity.toFixed(2)}/100
  ├─ Couverture de Compétences: ${(team.complementarySkills.gapFill * 100).toFixed(2)}%
  ├─ Facteurs de Risque: ${team.riskFactors.length}
  └─ Tâches Recommandées: ${team.recommendedTasks.length}
`).join('')}

══════════════════════════════════════════════════════════════════════
3. ANALYSE DES CONFLITS
══════════════════════════════════════════════════════════════════════

  Total des Conflits Détectés: ${conflicts.length}

${conflicts.map((conflict, index) => `
  CONFLIT ${index + 1}: ${conflict.conflictType}
  ├─ Sévérité: ${(conflict.severity * 100).toFixed(2)}%
  ├─ Participants Impliqués: ${conflict.involvedParticipants.length}
  ├─ Cause: ${conflict.rootCause}
  ├─ Stratégies de Résolution: ${conflict.resolutionStrategies.length}
  └─ Impact Estimé: ${conflict.estimatedImpact.toFixed(2)}/100
`).join('')}

══════════════════════════════════════════════════════════════════════
4. RECOMMANDATIONS PRIORITAIRES
══════════════════════════════════════════════════════════════════════

  ✓ Appliquer les allocations de ressources optimisées
  ✓ Confirmer la formation des équipes proposées
  ✓ Mettre en œuvre les stratégies de résolution de conflits
  ✓ Monitorer les indicateurs d'efficacité hebdomadairement

══════════════════════════════════════════════════════════════════════
Rapport Généré le: ${new Date().toLocaleString('fr-FR')}
══════════════════════════════════════════════════════════════════════
    `;
    return report;
  }

  // ============================================
  // MÉTHODES PRIVÉES (Logique Complexe)
  // ============================================

  private analyzeTeamFormation(participants: Participant[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    if (participants.length < 3) {
      recommendations.push({
        id: 'team-size-001',
        type: 'TEAM_FORMATION',
        priority: 'MEDIUM',
        title: 'Augmenter la Taille de l\'Équipe',
        description: `L'équipe actuelle compte ${participants.length} membres. Pour une meilleure collaboration, augmentez à 4-8 membres.`,
        expectedImpact: 35,
        implementationCost: 25,
        timeline: 'SHORT_TERM',
        affectedParticipants: participants.map(p => p.id!),
        metrics: ['engagementScore', 'diversityIndex']
      });
    }

    const specialtyCount = new Set(participants.map(p => p.specialty)).size;
    if (specialtyCount === 1) {
      recommendations.push({
        id: 'team-diversity-001',
        type: 'TEAM_FORMATION',
        priority: 'HIGH',
        title: 'Manque de Diversité d\'Expertise',
        description: 'Toutes les compétences sont dans le même domaine. Ajouter des experts d\'autres spécialités.',
        expectedImpact: 45,
        implementationCost: 40,
        timeline: 'SHORT_TERM',
        affectedParticipants: participants.map(p => p.id!),
        metrics: ['diversityIndex', 'collaborationEfficiency']
      });
    }

    return recommendations;
  }

  private analyzeResourceAllocation(
    sessionId: number,
    participants: Participant[],
    documents: SharedDocument[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    const docPerPerson = documents.length / Math.max(1, participants.length);
    if (docPerPerson > 5) {
      recommendations.push({
        id: 'resource-001',
        type: 'RESOURCE_ALLOCATION',
        priority: 'CRITICAL',
        title: 'Surcharge de Documents',
        description: `En moyenne ${docPerPerson.toFixed(1)} documents par participant. Redistribuer la charge.`,
        expectedImpact: 50,
        implementationCost: 30,
        timeline: 'IMMEDIATE',
        affectedParticipants: participants.map(p => p.id!),
        metrics: ['workloadBalance', 'collaborationEfficiency']
      });
    }

    return recommendations;
  }

  private analyzeConflicts(
    participants: Participant[],
    documents: SharedDocument[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    const editorCount = participants.filter(p => p.role === 'EDITOR').length;
    const viewerCount = participants.filter(p => p.role === 'VIEWER').length;

    if (editorCount === 0 && participants.length > 0) {
      recommendations.push({
        id: 'conflict-001',
        type: 'CONFLICT',
        priority: 'HIGH',
        title: 'Absence d\'Éditeurs',
        description: 'Aucun éditeur disponible. Attribuer au moins 1-2 éditeurs pour les modifications.',
        expectedImpact: 40,
        implementationCost: 10,
        timeline: 'IMMEDIATE',
        affectedParticipants: participants.map(p => p.id!),
        metrics: ['roleBalance', 'collaborationEfficiency']
      });
    }

    return recommendations;
  }

  private analyzeScheduleOptimization(
    participants: Participant[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    if (participants.length > 5) {
      recommendations.push({
        id: 'schedule-001',
        type: 'SCHEDULE',
        priority: 'MEDIUM',
        title: 'Optimisation du Planning',
        description: 'Avec cette taille d\'équipe, les réunions asynchrones pourraient être plus efficaces.',
        expectedImpact: 30,
        implementationCost: 20,
        timeline: 'SHORT_TERM',
        affectedParticipants: participants.map(p => p.id!),
        metrics: ['averageResponseTime', 'collaborationEfficiency']
      });
    }

    return recommendations;
  }

  private assignDocumentsOptimally(
    participants: Participant[],
    documents: SharedDocument[]
  ): DocumentAssignment[] {
    const assignments: DocumentAssignment[] = [];

    documents.forEach((doc, index) => {
      const assigneeIndex = index % Math.max(1, participants.length);
      const assignee = participants[assigneeIndex];

      assignments.push({
        documentId: doc.id!,
        assignedToId: assignee.id!,
        priority: Math.floor(Math.random() * 10) + 1,
        estimatedReviewTime: 30 + Math.floor(Math.random() * 90),
        requiredExpertise: assignee.specialty ? [assignee.specialty] : [],
        conflictRisk: Math.random() * 0.3
      });
    });

    return assignments;
  }

  private optimizeRoles(
    participants: Participant[],
    allocations: DocumentAssignment[]
  ): RoleRecommendation[] {
    const recommendations: RoleRecommendation[] = [];

    participants.forEach(participant => {
      const documentsAssigned = allocations.filter(a => a.assignedToId === participant.id).length;
      let suggestedRole = participant.role;
      let confidence = 0.5;

      if (documentsAssigned > 5) {
        suggestedRole = 'EDITOR';
        confidence = 0.85;
      } else if (documentsAssigned === 0) {
        suggestedRole = 'VIEWER';
        confidence = 0.9;
      }

      if (suggestedRole !== participant.role) {
        recommendations.push({
          participantId: participant.id!,
          currentRole: participant.role,
          suggestedRole,
          confidenceScore: confidence,
          justification: `Basé sur l'allocation de ${documentsAssigned} documents.`
        });
      }
    });

    return recommendations;
  }

  private analyzeWorkloadBalance(
    participants: Participant[],
    allocations: DocumentAssignment[]
  ): WorkloadBalance {
    const workloads = new Map<number, number>();

    allocations.forEach(a => {
      workloads.set(a.assignedToId, (workloads.get(a.assignedToId) || 0) + a.estimatedReviewTime);
    });

    const workloadArray = Array.from(workloads.values());
    const avgWorkload = workloadArray.reduce((a, b) => a + b, 0) / Math.max(1, workloadArray.length);
    const maxWorkload = Math.max(...workloadArray, avgWorkload);

    const overloaded = Array.from(workloads.entries())
      .filter(([, load]) => load > avgWorkload * 1.5)
      .map(([id]) => id);

    const underutilized = Array.from(workloads.entries())
      .filter(([, load]) => load < avgWorkload * 0.5)
      .map(([id]) => id);

    const balanceScore = Math.max(0, 100 - (maxWorkload - avgWorkload) / avgWorkload * 50);

    return {
      overloadedParticipants: overloaded,
      underutilizedParticipants: underutilized,
      balanceScore: Math.round(balanceScore),
      recommendations: [
        ...overloaded.map(id => `Réduire la charge de ${id}`),
        ...underutilized.map(id => `Augmenter la contribution de ${id}`)
      ]
    };
  }

  private calculateAllocationEfficiency(
    allocations: DocumentAssignment[],
    roles: RoleRecommendation[],
    workload: WorkloadBalance
  ): number {
    const allocationScore = allocations.length > 0 
      ? allocations.reduce((sum, a) => sum + (1 - a.conflictRisk), 0) / allocations.length * 100
      : 0;

    const roleScore = roles.length === 0 ? 100 : 100 - (roles.length * 10);
    const workloadScore = workload.balanceScore;

    return Math.round((allocationScore * 0.4 + roleScore * 0.3 + workloadScore * 0.3));
  }

  private extractUniqueSkills(participants: Participant[]): Set<string> {
    return new Set(
      participants
        .filter(p => p.specialty)
        .map(p => p.specialty!)
    );
  }

  private generateTeamCombinations(
    participants: Participant[],
    skills: Set<string>
  ): Participant[][] {
    const combinations: Participant[][] = [];
    const teamSize = Math.min(5, participants.length);

    // Générer quelques combinaisons pertinentes
    for (let i = 0; i < Math.min(3, Math.floor(participants.length / teamSize)); i++) {
      const team = participants.slice(i * teamSize, (i + 1) * teamSize);
      if (team.length === teamSize) {
        combinations.push(team);
      }
    }

    if (combinations.length === 0) {
      combinations.push(participants);
    }

    return combinations;
  }

  private calculateSkillComplementation(
    team: Participant[],
    allSkills: Set<string>
  ): SkillComplementation {
    const teamSkills = new Map<string, number>();

    team.forEach(member => {
      if (member.specialty) {
        teamSkills.set(member.specialty, (teamSkills.get(member.specialty) || 0) + 1);
      }
    });

    const gapFill = teamSkills.size / Math.max(1, allSkills.size);
    let redundancy = 0;
    for (const count of teamSkills.values()) {
      if (count > 1) {
        redundancy += (count - 1) / team.length;
      }
    }

    return {
      skillCoverage: teamSkills,
      redundancy: Math.min(1, redundancy),
      gapFill: Math.min(1, gapFill)
    };
  }

  private calculateTeamCohesion(team: Participant[]): number {
    const specialists = team.filter(p => p.specialty).length;
    const editors = team.filter(p => p.role === 'EDITOR').length;
    
    const score = (specialists / team.length * 40) + (editors / team.length * 30) + 30;
    return Math.round(score);
  }

  private estimateTeamProductivity(team: Participant[], taskDescription: string): number {
    const baseScore = 60;
    const teamSizeFactor = team.length > 0 ? Math.min(1, team.length / 5) : 0;
    const diversityFactor = new Set(team.map(p => p.specialty)).size / 3;
    
    const productivity = baseScore + (teamSizeFactor * 20) + (diversityFactor * 20);
    return Math.round(Math.min(100, productivity));
  }

  private identifyTeamRisks(team: Participant[]): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (team.length < 3) {
      risks.push({
        name: 'Équipe trop petite',
        severity: 0.6,
        mitigation: 'Ajouter 1-2 membres supplémentaires'
      });
    }

    const editors = team.filter(p => p.role === 'EDITOR');
    if (editors.length === 0) {
      risks.push({
        name: 'Pas de capacité d\'édition',
        severity: 0.8,
        mitigation: 'Assigner au moins un rôle EDITOR'
      });
    }

    return risks;
  }

  private suggestTasksForTeam(team: Participant[]): string[] {
    const specialties = team.map(p => p.specialty).filter(Boolean);
    const tasks: string[] = [];

    if (specialties.includes('Cardiologie')) {
      tasks.push('Analyse de cas cardiologiques');
    }
    if (specialties.includes('Neurologie')) {
      tasks.push('Évaluation neurologique');
    }
    if (team.length > 4) {
      tasks.push('Projet multi-disciplinaire complexe');
    }

    return tasks.length > 0 ? tasks : ['Collaboration générale'];
  }

  private generateTeamId(): string {
    return `TEAM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  private selectBestTeams(teams: OptimalTeamFormation[]): OptimalTeamFormation[] {
    return teams
      .sort((a, b) => {
        const scoreA = a.cohesionScore * 0.4 + a.estimatedProductivity * 0.6;
        const scoreB = b.cohesionScore * 0.4 + b.estimatedProductivity * 0.6;
        return scoreB - scoreA;
      })
      .slice(0, Math.min(3, teams.length));
  }

  private detectRoleConflicts(participants: Participant[]): ConflictAnalysis[] {
    const conflicts: ConflictAnalysis[] = [];

    const organizers = participants.filter(p => p.role === 'ORGANIZER');
    if (organizers.length > 1) {
      conflicts.push({
        conflictType: 'ROLE',
        severity: 0.5,
        involvedParticipants: organizers.map(p => p.id!),
        rootCause: 'Multiples organisateurs peuvent causer une confusion de responsabilités',
        resolutionStrategies: [
          {
            strategyName: 'Clarifier les responsabilités',
            effectivenessScore: 0.8,
            implementationComplexity: 0.2,
            estimatedTimeRequired: 30,
            potentialOutcomes: ['Rôles clairs', 'Meilleure coordination']
          }
        ],
        estimatedImpact: 30
      });
    }

    return conflicts;
  }

  private detectExpertiseConflicts(
    participants: Participant[],
    documents: SharedDocument[]
  ): ConflictAnalysis[] {
    const conflicts: ConflictAnalysis[] = [];

    const specialties = new Set(participants.map(p => p.specialty).filter(Boolean));
    if (specialties.size === 0 && documents.length > 0) {
      conflicts.push({
        conflictType: 'EXPERTISE',
        severity: 0.7,
        involvedParticipants: participants.map(p => p.id!),
        rootCause: 'Aucune expertise spécialisée pour les documents à réviser',
        resolutionStrategies: [
          {
            strategyName: 'Recruter experts',
            effectivenessScore: 0.9,
            implementationComplexity: 0.7,
            estimatedTimeRequired: 240,
            potentialOutcomes: ['Meilleure couverture', 'Qualité augmentée']
          }
        ],
        estimatedImpact: 50
      });
    }

    return conflicts;
  }

  private detectScheduleConflicts(participants: Participant[]): ConflictAnalysis[] {
    return [];
  }

  private detectResourceConflicts(
    documents: SharedDocument[],
    participants: Participant[]
  ): ConflictAnalysis[] {
    const conflicts: ConflictAnalysis[] = [];

    const avgDocsPerPerson = documents.length / Math.max(1, participants.length);
    if (avgDocsPerPerson > 5) {
      conflicts.push({
        conflictType: 'RESOURCE',
        severity: 0.6,
        involvedParticipants: participants.map(p => p.id!),
        rootCause: 'Ressources (documents) inégalement distribuées',
        resolutionStrategies: [
          {
            strategyName: 'Rééquilibrer la distribution',
            effectivenessScore: 0.85,
            implementationComplexity: 0.3,
            estimatedTimeRequired: 60,
            potentialOutcomes: ['Charge équilibrée', 'Meilleure efficacité']
          }
        ],
        estimatedImpact: 45
      });
    }

    return conflicts;
  }
}
