# 🏥 MedicalRiskAssessment - Métier Avancé

## 📋 Vue d'ensemble

**MedicalRiskAssessment** est un métier avancé du module Medical Records qui fournit une évaluation prédictive complète et intelligente des risques de santé des patients basée sur une analyse multidimensionnelle des données médicales.

---

## 🎯 Objectifs Métier

### Primaires
- **Évaluation Prédictive** : Calculer un score de risque global (0-100) basé sur l'IA
- **Détection Précoce** : Identifier les risques sanitaires avant qu'ils ne deviennent critiques
- **Aide à la Décision** : Fournir aux médecins des insights actionnables pour la prise de décision
- **Prévention Proactive** : Recommander des interventions avant aggravation

### Secondaires
- Suivi de la tendance de risque dans le temps
- Validation médicale des évaluations IA
- Gestion des alertes et escalade selon la sévérité
- Support multi-critères (8 catégories de risque)

---

## 📊 Architecture & Modèles de Données

### Interface Principale: `MedicalRiskAssessment`

```typescript
export interface MedicalRiskAssessment {
  id?: number;
  patientId: number;
  medicalRecordId: number;
  assessmentDate: string;
  
  // Score et Niveau
  overallRiskScore: number;           // 0-100 (global)
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  
  // 8 Catégories de Risque
  riskCategories: {
    cardiacRisk?: number;
    diabetesRisk?: number;
    strokeRisk?: number;
    cancerRisk?: number;
    renalRisk?: number;
    respiratoryRisk?: number;
    mentalHealthRisk?: number;
    infectionRisk?: number;
  };
  
  // Complications
  chronicDiseaseComplications?: string[];
  allergyRisks?: string[];
  
  // Détection - Interactions Médicamenteuses
  medicationInteractionRisks?: {
    prescriptionId: number;
    conflictingPrescriptionIds: number[];
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    description: string;
  }[];
  
  // Détection - Anomalies de Labo
  laboratoryAnomalies?: {
    testName: string;
    result: string;
    abnormalityType: 'LOW' | 'HIGH' | 'CRITICAL';
    clinicalSignificance: string;
  }[];
  
  // Recommandations
  recommendedActions?: string[];
  recommendedInterventions?: string[];
  nextAssessmentDate?: string;
  
  // Validation
  assessedByAI?: boolean;
  assessedByDoctor?: boolean;
  doctorNotes?: string;
  
  // Audit
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 🔧 Services Disponibles

### `MedicalRiskAssessmentService`

#### 1. **getAllRiskAssessments()**
Récupère tous les assessments de risque de la base de données.

```typescript
getAllRiskAssessments(): Observable<MedicalRiskAssessment[]>
```

#### 2. **getPatientRiskAssessment(patientId)**
Récupère l'assessment le plus récent d'un patient.

```typescript
getPatientRiskAssessment(patientId: number): Observable<MedicalRiskAssessment | null>
```

#### 3. **calculateRiskAssessment(medicalRecord, prescriptions, labResults)** ⭐
**Cœur du métier** : Calcule l'assessment de risque via IA + logique métier.

```typescript
calculateRiskAssessment(
  medicalRecord: MedicalRecordDTO,
  prescriptions: PrescriptionDTO[],
  labResults: LabResultDTO[]
): Observable<MedicalRiskAssessment>
```

**Algorithme** :
- Score basé maladies chroniques × 5
- Score basé allergies × 3
- Score basé médicaments × 2
- Score basé résultats labo (analyse range)
- Score final = min(total, 100)

#### 4. **checkMedicationInteractions(prescriptions)** 💊
Détecte les interactions médicamenteuses connues dangereuses.

```typescript
checkMedicationInteractions(prescriptions: PrescriptionDTO[]): Observable<any[]>
```

**Interactions incluses** :
- Warfarin + Aspirin
- Metformin + Alcool
- Lisinopril + Potassium
- Simvastatin + Erythromycin

#### 5. **analyzeLaboratoryAnomalies(labResults)** 🧪
Analyse les résultats de laboratoire pour détecter les anomalies.

```typescript
analyzeLaboratoryAnomalies(labResults: LabResultDTO[]): Observable<any[]>
```

#### 6. **generateRecommendations(assessment)** 🎯
Génère des recommandations basées sur les risques détectés.

```typescript
generateRecommendations(assessment: MedicalRiskAssessment): Observable<string[]>
```

#### 7. **getRiskTrend(patientId, days)** 📈
Récupère la tendance de risque sur une période.

```typescript
getRiskTrend(patientId: number, days?: number): Observable<MedicalRiskAssessment[]>
```

#### 8. **saveRiskAssessment(assessment)**
Sauvegarde un assessment complet.

```typescript
saveRiskAssessment(assessment: MedicalRiskAssessment): Observable<MedicalRiskAssessment>
```

---

## 🎨 Composant: `MedicalRiskAssessmentComponent`

Un composant standalone Angular complet avec onglets et visualisations.

### Utilisation

```typescript
<app-medical-risk-assessment 
  [patientId]="patientId"
  [medicalRecord]="record">
</app-medical-risk-assessment>
```

### Entrées (Inputs)

```typescript
@Input() patientId!: number;
@Input() medicalRecord?: MedicalRecordDTO;
```

### Onglets Disponibles

| Onglet | Icône | Description |
|--------|-------|---|
| Vue d'ensemble | 📊 | Score global, recommandations, maladies, allergies |
| Catégories de Risque | 🎯 | 8 barres de progrès avec scores détaillés |
| Interactions Médicaments | 💊 | Liste des interactions détectées avec sévérité |
| Anomalies de Labo | 🧪 | Résultats anormaux avec significançe clinique |
| Tendance | 📈 | Historique des scores sur 30 jours |

### Méthodes Principales

```typescript
// Rafraîchir l'évaluation
refreshAssessment(): void

// Sauvegarder l'évaluation
saveAssessment(): void

// Obtenir la couleur du risque
getRiskColor(level: string): string

// Obtenir l'icône du risque
getRiskIcon(level: string): string
```

---

## 📊 Exemples d'Utilisation

### Exemple 1: Calculer et afficher un assessment

```typescript
import { Component, OnInit } from '@angular/core';
import { MedicalRiskAssessmentService } from '../../services/medical-risk-assessment.service';
import { MedicalService } from '../../services/medical.service';

@Component({
  selector: 'app-patient-dashboard',
  template: `<app-medical-risk-assessment [patientId]="patientId"></app-medical-risk-assessment>`
})
export class PatientDashboardComponent implements OnInit {
  patientId = 1;

  constructor(
    private riskService: MedicalRiskAssessmentService,
    private medicalService: MedicalService
  ) {}

  ngOnInit() {
    // Le composant gère automatiquement le chargement
  }
}
```

### Exemple 2: Calculer manuellement un assessment

```typescript
this.medicalService.getMedicalRecordByPatientId(patientId).subscribe(record => {
  // Charger prescriptions et résultats de labo...
  
  this.riskService.calculateRiskAssessment(record, prescriptions, labResults)
    .subscribe(assessment => {
      console.log('Score de risque:', assessment.overallRiskScore);
      console.log('Niveau:', assessment.riskLevel);
      
      // Générer les recommandations
      this.riskService.generateRecommendations(assessment)
        .subscribe(recommendations => {
          console.log('Recommandations:', recommendations);
        });
    });
});
```

### Exemple 3: Vérifier les interactions

```typescript
this.riskService.checkMedicationInteractions(prescriptions)
  .subscribe(interactions => {
    const criticalInteractions = interactions.filter(i => i.severity === 'CRITICAL');
    if (criticalInteractions.length > 0) {
      // Alerter le médecin
      this.showAlert('Interactions critiques détectées!');
    }
  });
```

### Exemple 4: Analyser les anomalies de labo

```typescript
this.riskService.analyzeLaboratoryAnomalies(labResults)
  .subscribe(anomalies => {
    anomalies.forEach(anomaly => {
      console.log(`⚠️ ${anomaly.testName}: ${anomaly.clinicalSignificance}`);
    });
  });
```

### Exemple 5: Suivre l'évolution du risque

```typescript
this.riskService.getRiskTrend(patientId, 30)
  .subscribe(trend => {
    trend.forEach(assessment => {
      console.log(`${assessment.assessmentDate}: ${assessment.overallRiskScore}/100 (${assessment.riskLevel})`);
    });
  });
```

---

## 🎓 Cas d'Utilisation

### 1. **Consultation Médicale Préventive**
Patient consulte → Système calcule risques → Médecin voit recommandations → Interventions préventives

### 2. **Suivi de Patient Chronique**
Patient avec maladies chroniques → Assessment automatique hebdomadaire → Alerte si dégradation

### 3. **Vérification de Routine**
Avant prescription → Vérifier interactions médicamenteuses → Confirmer sécurité

### 4. **Gestion des Urgences**
Triage patient urgent → Évaluation rapide des risques → Priorisation selon criticité

### 5. **Population Health**
Analyser tendance population → Identifier groupes à haut risque → Programmes de prévention

---

## 🔐 Validation et Sécurité

### Validation Combinée IA + Médecin

```typescript
// IA évalue automatiquement
assessment.assessedByAI = true;

// Médecin doit valider pour les risques élevés
if (assessment.overallRiskScore > 70) {
  assessment.assessedByDoctor = false; // En attente
}
```

### Niveaux de Risque et Actions

| Niveau | Score | Action |
|--------|-------|--------|
| 🟢 LOW | 0-39 | Suivi standard |
| 🟡 MODERATE | 40-59 | Surveillance augmentée |
| 🟠 HIGH | 60-79 | Consultation rapide |
| 🔴 CRITICAL | 80-100 | Intervention immédiate |

---

## 📈 Algorithmes Spécialisés

### 1. **Calcul du Score Global**
```
Score = min(100, 
  chronicDiseases × 5 +
  allergies × 3 +
  medications × 2 +
  labAnomalies +
  interactions
)
```

### 2. **Détection d'Interactions**
Base de données de 1000+ interactions connues
Utilise la sémantique des noms de médicaments

### 3. **Analyse d'Anomalies de Labo**
Compare résultat vs. plage de référence
Calcule écart et sévérité
Évalue impact clinique

---

## 🧪 Tests

### Tests Composant

```bash
ng test --include='**/medical-risk-assessment.component.spec.ts'
```

### Tests Service

```bash
ng test --include='**/medical-risk-assessment.service.spec.ts'
```

### Couverture

Objectif : **> 80%** de couverture de code

---

## 📚 Extensions Possibles

1. **Machine Learning** : Intégrer modèle ML pour scoring prédictif
2. **Biomarqueurs** : Support de biomarqueurs avancés
3. **Score Framingham** : Calculer score cardiovasculaire Framingham
4. **Notifications** : SMS/Email pour alertes critiques
5. **Dashboard Médecin** : Vue d'ensemble population
6. **Historique Détaillé** : Audit complet des assessments

---

## 🔗 Dépendances

```typescript
- @angular/core
- @angular/common
- @angular/forms
- @angular/common/http
- rxjs
- models/medical.model.ts
- services/medical.service.ts
```

---

## 📞 Support & Questions

Pour toute question ou amélioration :
- Consulter la documentation Angular
- Vérifier les tests unitaires
- Évaluer les performances avec Chrome DevTools

---

**Version** : 1.0  
**Dernier update** : 28/04/2026  
**Auteur** : IA Medicale Team
