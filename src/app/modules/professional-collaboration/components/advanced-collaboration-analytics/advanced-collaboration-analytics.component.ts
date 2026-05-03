import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollaborationAnalyticsService, CollaborationMetrics } from '../../services/collaboration-analytics.service';
import { 
  CollaborationOptimizationService, 
  OptimizationRecommendation,
  ResourceAllocation,
  OptimalTeamFormation,
  ConflictAnalysis 
} from '../../services/collaboration-optimization.service';
import { SessionExtended, Participant, SharedDocument, Discussion } from '../../models/collaboration.model';

/**
 * Composant d'Exemple: Utilisation des Services Métier Avancés
 * Démontre comment utiliser CollaborationAnalyticsService 
 * et CollaborationOptimizationService dans une application réelle
 */
@Component({
  selector: 'app-advanced-collaboration-analytics',
  template: `
    <div class="analytics-dashboard">
      <h1>Dashboard d'Analyse et Optimisation de Collaboration</h1>
      
      <!-- Boutons d'action -->
      <div class="action-buttons">
        <button (click)="analyzeSession()">Analyser la Session</button>
        <button (click)="optimizeResources()">Optimiser les Ressources</button>
        <button (click)="formTeams()">Former des Équipes</button>
        <button (click)="predictFuture()">Prédire les Performances</button>
        <button (click)="detectConflicts()">Analyser les Conflits</button>
      </div>

      <!-- Affichage des Résultats -->
      <div class="results-container">
        
        <!-- Section Métriques -->
        <section class="metrics-section" *ngIf="currentMetrics">
          <h2>📊 Métriques de Collaboration</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <h3>Taux de Participation</h3>
              <p class="value">{{ currentMetrics!.participationRate.toFixed(2) }}%</p>
            </div>
            <div class="metric-card">
              <h3>Score d'Engagement</h3>
              <p class="value">{{ currentMetrics!.engagementScore }}/100</p>
            </div>
            <div class="metric-card">
              <h3>Efficacité</h3>
              <p class="value">{{ currentMetrics!.collaborationEfficiency }}/100</p>
            </div>
            <div class="metric-card">
              <h3>Densité Discussion</h3>
              <p class="value">{{ currentMetrics!.discussionDensity.toFixed(2) }}/jour</p>
            </div>
            <div class="metric-card">
              <h3>Temps de Réponse</h3>
              <p class="value">{{ currentMetrics!.averageResponseTime }} min</p>
            </div>
            <div class="metric-card">
              <h3>Diversité d'Expertise</h3>
              <p class="value">{{ (currentMetrics!.expertDistribution.diversityIndex * 100).toFixed(0) }}%</p>
            </div>
          </div>
          <div class="report-section">
            <button (click)="showReport()">Voir le Rapport Détaillé</button>
            <pre *ngIf="showDetailedReport">{{ analyticsReport }}</pre>
          </div>
        </section>

        <!-- Section Recommandations -->
        <section class="recommendations-section" *ngIf="recommendations.length > 0">
          <h2>💡 Recommandations d'Optimisation</h2>
          <div class="recommendations-list">
            <div *ngFor="let rec of recommendations" 
                 class="recommendation-card"
                 [ngClass]="'priority-' + rec.priority.toLowerCase()">
              <div class="header">
                <h3>{{ rec.title }}</h3>
                <span class="priority-badge">{{ rec.priority }}</span>
              </div>
              <p>{{ rec.description }}</p>
              <div class="details">
                <span>Impact: {{ rec.expectedImpact }}/100</span>
                <span>Effort: {{ rec.implementationCost }}/100</span>
                <span>Timeline: {{ rec.timeline }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Section Allocation des Ressources -->
        <section class="allocation-section" *ngIf="resourceAllocation">
          <h2>📦 Allocation Optimale des Ressources</h2>
          <div class="allocation-summary">
            <div class="stat">
              <h4>Efficacité Estimée</h4>
              <p>{{ resourceAllocation!.estimatedEfficiency }}/100</p>
            </div>
            <div class="stat">
              <h4>Réduction Temps</h4>
              <p>{{ resourceAllocation!.savings.timeReduction }}%</p>
            </div>
            <div class="stat">
              <h4>Réduction Coûts</h4>
              <p>{{ resourceAllocation!.savings.costReduction }}%</p>
            </div>
            <div class="stat">
              <h4>Amélioration Qualité</h4>
              <p>{{ resourceAllocation!.savings.qualityImprovement }}%</p>
            </div>
          </div>
          <div class="workload-balance">
            <h3>Équilibre de Charge</h3>
            <p>Score: {{ resourceAllocation!.workloadBalance.balanceScore }}/100</p>
            <p *ngIf="resourceAllocation!.workloadBalance.overloadedParticipants.length > 0">
              ⚠️ Participants surchargés: {{ resourceAllocation!.workloadBalance.overloadedParticipants.length }}
            </p>
            <p *ngIf="resourceAllocation!.workloadBalance.underutilizedParticipants.length > 0">
              ℹ️ Participants sous-utilisés: {{ resourceAllocation!.workloadBalance.underutilizedParticipants.length }}
            </p>
          </div>
        </section>

        <!-- Section Équipes Optimales -->
        <section class="teams-section" *ngIf="optimalTeams.length > 0">
          <h2>👥 Équipes Optimales Formées</h2>
          <div class="teams-list">
            <div *ngFor="let team of optimalTeams; let i = index" class="team-card">
              <div class="team-header">
                <h3>Équipe {{ i + 1 }}: {{ team.teamId }}</h3>
              </div>
              <div class="team-metrics">
                <div class="metric">
                  <span>Cohésion:</span>
                  <strong>{{ team.cohesionScore }}/100</strong>
                </div>
                <div class="metric">
                  <span>Productivité:</span>
                  <strong>{{ team.estimatedProductivity }}/100</strong>
                </div>
                <div class="metric">
                  <span>Couverture Expertise:</span>
                  <strong>{{ (team.complementarySkills.gapFill * 100).toFixed(0) }}%</strong>
                </div>
              </div>
              <div class="team-risks" *ngIf="team.riskFactors.length > 0">
                <h4>Facteurs de Risque:</h4>
                <ul>
                  <li *ngFor="let risk of team.riskFactors">
                    <strong>{{ risk.name }}</strong> ({{ (risk.severity * 100).toFixed(0) }}%)
                    <br>
                    <em>→ {{ risk.mitigation }}</em>
                  </li>
                </ul>
              </div>
              <div class="team-tasks" *ngIf="team.recommendedTasks.length > 0">
                <h4>Tâches Recommandées:</h4>
                <ul>
                  <li *ngFor="let task of team.recommendedTasks">{{ task }}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Section Analyse des Conflits -->
        <section class="conflicts-section" *ngIf="conflicts.length > 0">
          <h2>⚡ Analyse des Conflits</h2>
          <div class="conflicts-list">
            <div *ngFor="let conflict of conflicts" 
                 class="conflict-card"
                 [ngClass]="'severity-' + Math.round(conflict.severity * 10)">
              <div class="conflict-header">
                <h3>{{ conflict.conflictType }}</h3>
                <span class="severity">{{ (conflict.severity * 100).toFixed(0) }}% de sévérité</span>
              </div>
              <p class="cause">
                <strong>Cause:</strong> {{ conflict.rootCause }}
              </p>
              <div class="strategies">
                <h4>Stratégies de Résolution:</h4>
                <div *ngFor="let strategy of conflict.resolutionStrategies" class="strategy">
                  <p>
                    <strong>{{ strategy.strategyName }}</strong>
                    <br>
                    Efficacité: {{ (strategy.effectivenessScore * 100).toFixed(0) }}% | 
                    Temps: {{ strategy.estimatedTimeRequired }} min
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section Prédictions -->
        <section class="predictions-section" *ngIf="predictions.length > 0">
          <h2>🔮 Prédictions de Performance (7 jours)</h2>
          <div class="predictions-grid">
            <div *ngFor="let prediction of predictions" class="prediction-card">
              <h3>{{ prediction.metric }}</h3>
              <p class="value">{{ prediction.value.toFixed(2) }}/{{ prediction.target }}</p>
              <p class="variance" [ngClass]="prediction.variance > 0 ? 'positive' : 'negative'">
                {{ prediction.variance > 0 ? '+' : '' }}{{ prediction.variance }}%
              </p>
              <p class="trend" [ngClass]="prediction.trend.toLowerCase()">
                {{ prediction.trend }}
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
  imports: [CommonModule],
  styles: [`
    .analytics-dashboard {
      padding: 20px;
      background: #f5f5f5;
    }

    h1 {
      color: #333;
      margin-bottom: 20px;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    button {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    button:hover {
      background: #0056b3;
    }

    section {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h2 {
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }

    .metric-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .metric-card h3 {
      font-size: 14px;
      margin: 0 0 10px 0;
      opacity: 0.9;
    }

    .metric-card .value {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }

    .recommendations-list {
      display: grid;
      gap: 15px;
    }

    .recommendation-card {
      border-left: 4px solid #ffc107;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
    }

    .recommendation-card.priority-critical {
      border-left-color: #dc3545;
      background: #fff3f3;
    }

    .recommendation-card.priority-high {
      border-left-color: #fd7e14;
      background: #fff8f3;
    }

    .recommendation-card.priority-medium {
      border-left-color: #ffc107;
    }

    .recommendation-card.priority-low {
      border-left-color: #28a745;
    }

    .recommendation-card .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .recommendation-card h3 {
      margin: 0;
      color: #333;
    }

    .priority-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      background: #e9ecef;
      color: #333;
    }

    .details {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #666;
      margin-top: 10px;
    }

    .allocation-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .stat h4 {
      margin: 0 0 10px 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .stat p {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }

    .teams-list {
      display: grid;
      gap: 15px;
    }

    .team-card {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 15px;
      background: #f9f9f9;
    }

    .team-header {
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .team-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin: 10px 0;
      padding: 10px;
      background: white;
      border-radius: 4px;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .conflicts-list {
      display: grid;
      gap: 15px;
    }

    .conflict-card {
      border-left: 4px solid #dc3545;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
    }

    .predictions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .prediction-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .prediction-card .value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }

    .prediction-card .variance.positive {
      color: #90EE90;
    }

    .prediction-card .variance.negative {
      color: #FFB6C1;
    }

    .trend {
      font-weight: bold;
      margin-top: 10px;
    }

    .trend.improving {
      color: #90EE90;
    }

    .trend.declining {
      color: #FFB6C1;
    }

    .trend.stable {
      color: #FFD700;
    }

    .report-section {
      margin-top: 15px;
    }

    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      color: #333;
      max-height: 400px;
      overflow-y: auto;
    }
  `]
})
export class AdvancedCollaborationAnalyticsComponent implements OnInit {

  // Données
  currentMetrics: CollaborationMetrics | null = null;
  recommendations: OptimizationRecommendation[] = [];
  resourceAllocation: ResourceAllocation | null = null;
  optimalTeams: OptimalTeamFormation[] = [];
  conflicts: ConflictAnalysis[] = [];
  predictions: any[] = [];

  // État UI
  showDetailedReport = false;
  analyticsReport = '';
  Math = Math;

  // Données de test
  private testSession: SessionExtended = {
    id: 1,
    title: 'Case Review - Patient #12345',
    description: 'Complex cardiology case',
    status: 'ACTIVE',
    organizerId: 1,
    organizerName: 'Dr. Smith',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 10
  };

  private testParticipants: Participant[] = [
    { id: 1, name: 'Dr. Smith', role: 'ORGANIZER', specialty: 'Cardiology', joinedAt: new Date().toISOString() },
    { id: 2, name: 'Dr. Johnson', role: 'EDITOR', specialty: 'Cardiology', joinedAt: new Date().toISOString() },
    { id: 3, name: 'Dr. Williams', role: 'EDITOR', specialty: 'Radiology', joinedAt: new Date().toISOString() },
    { id: 4, name: 'Dr. Brown', role: 'VIEWER', specialty: 'Pathology', joinedAt: new Date().toISOString() },
    { id: 5, name: 'Dr. Davis', role: 'VIEWER', specialty: 'Cardiology', joinedAt: new Date().toISOString() }
  ];

  private testDocuments: SharedDocument[] = [
    { id: 1, sessionId: 1, fileName: 'ECG_Report.pdf', fileType: 'pdf', annotationCount: 5, uploadedAt: new Date().toISOString() },
    { id: 2, sessionId: 1, fileName: 'CT_Scan.dcm', fileType: 'dicom', annotationCount: 3, uploadedAt: new Date().toISOString() },
    { id: 3, sessionId: 1, fileName: 'Lab_Results.xlsx', fileType: 'excel', annotationCount: 2, uploadedAt: new Date().toISOString() }
  ];

  private testDiscussions: Discussion[] = [
    { 
      id: 1, 
      sessionId: 1, 
      title: 'Initial Assessment', 
      content: 'Patient shows signs of...',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      replies: [
        { 
          id: 1, 
          discussionId: 1, 
          content: 'Agree, recommend...', 
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() 
        }
      ]
    }
  ];

  constructor(
    private analyticsService: CollaborationAnalyticsService,
    private optimizationService: CollaborationOptimizationService
  ) {}

  ngOnInit() {
    console.log('AdvancedCollaborationAnalyticsComponent initialized');
    console.log('Test session:', this.testSession);
    console.log('Test participants:', this.testParticipants);
    // Auto-load initial data for testing
    this.analyzeSession();
  }

  // ========================================
  // Actions Utilisateur
  // ========================================

  analyzeSession() {
    console.log('Analyzing session...');
    
    this.currentMetrics = this.analyticsService.calculateSessionMetrics(
      this.testSession,
      this.testDocuments,
      this.testDiscussions,
      this.testParticipants
    );

    console.log('Session metrics calculated:', this.currentMetrics);
  }

  optimizeResources() {
    console.log('Optimizing resources...');
    
    this.resourceAllocation = this.optimizationService.optimizeResourceAllocation(
      this.testSession.id!,
      this.testParticipants,
      this.testDocuments
    );

    console.log('Resource allocation optimized:', this.resourceAllocation);
  }

  formTeams() {
    console.log('Forming optimal teams...');
    
    this.optimalTeams = this.optimizationService.formOptimalTeams(
      this.testParticipants,
      this.testSession.description!
    );

    console.log('Optimal teams formed:', this.optimalTeams);
  }

  predictFuture() {
    console.log('Predicting future performance...');
    
    if (!this.currentMetrics) {
      this.analyzeSession();
    }

    // Créer un historique de test
    const historicalMetrics = [
      { ...this.currentMetrics!, collaborationEfficiency: 70 } as CollaborationMetrics,
      { ...this.currentMetrics!, collaborationEfficiency: 72 } as CollaborationMetrics,
      { ...this.currentMetrics!, collaborationEfficiency: 75 } as CollaborationMetrics
    ];

    this.predictions = this.analyticsService.predictFuturePerformance(
      this.currentMetrics!,
      historicalMetrics,
      7
    );

    console.log('Predictions generated:', this.predictions);
  }

  detectConflicts() {
    console.log('Detecting conflicts...');
    
    this.conflicts = this.optimizationService.analyzeAndResolveConflicts(
      this.testParticipants,
      this.testDocuments
    );

    console.log('Conflicts analyzed:', this.conflicts);
  }

  showReport() {
    if (!this.currentMetrics) {
      this.analyzeSession();
    }
    
    this.analyticsReport = this.analyticsService.generateAnalysisReport(this.currentMetrics!);
    this.showDetailedReport = !this.showDetailedReport;
  }
}
