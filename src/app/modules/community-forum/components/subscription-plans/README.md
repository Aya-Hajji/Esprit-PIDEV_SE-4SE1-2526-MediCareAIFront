# 💎 Subscription Plans Component - Documentation

## 📌 Vue d'ensemble

Le composant `SubscriptionPlansEnhancedComponent` gère l'interface complète de gestion des abonnements premium dans MediCareAI. Il permet aux utilisateurs de:

- 📋 Parcourir les plans d'abonnement disponibles
- ✅ S'abonner à un plan
- 🔄 Renouveler leur abonnement
- ✕ Annuler leur abonnement
- 📚 Voir l'historique de leurs abonnements
- ⚙️ Gérer les paramètres d'auto-renouvellement

## 🏗️ Architecture

### Structure des fichiers
```
subscription-plans/
├── subscription-plans-enhanced.component.ts       # Logique principale
├── subscription-plans-enhanced.component.html     # Template UI
├── subscription-plans-enhanced.component.css      # Styles
├── subscription-plans.component.ts                # Composant original (hérité)
├── subscription-plans.component.html              # Template original (hérité)
├── subscription-plans.component.css               # Styles originaux (hérité)
├── index.ts                                       # Exports
└── TEST_GUIDE.md                                  # Guide de test
```

### Dépendances
```typescript
// Modules Angular
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// RxJS
import { Subject, takeUntil, timeout } from 'rxjs';

// Services
import { SubscriptionExtendedService } from '../../services/subscription-extended.service';

// Modèles
import { SubscriptionPlan, SubscriptionExtended } from '../../../../shared/models/subscription.model';
```

## 🎯 Fonctionnalités Principales

### 1. Chargement des Plans
```typescript
loadPlans(): Observable<SubscriptionPlan[]>
```
- Récupère tous les plans d'abonnement disponibles
- Gère les erreurs avec message utilisateur
- Logs avec émojis: `📋 Loading...` → `✅ Plans loaded`

### 2. Abonnement
```typescript
subscribeToPlan(plan: SubscriptionPlan): void
```
**Flux:**
1. Vérifie token auth existant
2. Vérifie plan valide (ID présent)
3. Appelle API `/subscriptions` POST
4. Met à jour l'état local
5. Affiche alerte de succès/erreur
6. Trigger changement détection

**Paramètres API:**
```json
{
  "planId": 1,
  "autoRenew": true
}
```

### 3. Renouvellement
```typescript
renewSubscription(): void
```
**Flux:**
1. Vérifie qu'il y a un abonnement actif
2. Demande confirmation à l'utilisateur
3. Appelle API PUT `/subscriptions/{id}/renew`
4. Met à jour les dates d'expiration
5. Affiche alerte de succès

### 4. Annulation
```typescript
cancelSubscription(): void
```
**Flux:**
1. Vérifie qu'il y a un abonnement actif
2. Demande double confirmation
3. Appelle API DELETE `/subscriptions/{id}`
4. Retourne à l'état "pas d'abonnement"
5. Rafraîchit l'affichage

### 5. Auto-Renouvellement
```typescript
toggleAutoRenew(): void
```
- Bascule le paramètre auto-renew
- Appelle API PATCH `/subscriptions/{id}/auto-renew`
- Met à jour l'UI avec le nouvel état
- Affiche confirmation

### 6. Historique
```typescript
toggleHistory(): void
loadSubscriptionHistory(): Observable<SubscriptionExtended[]>
```
- Affiche/masque la section historique
- Lazy-loads l'historique au premier clic
- Affiche liste formatée avec dates et statuts

## 📊 État du Composant

### Propriétés Principales
```typescript
// Données
plans: SubscriptionPlan[] = [];                    // Plans disponibles
subscriptionHistory: SubscriptionExtended[] = [];  // Historique
currentSubscription: SubscriptionExtended | null;  // Abonnement actuel

// États UI
loading = true;                                    // Chargement plans
subscribing = false;                               // Traitement subscribe
loadingHistory = false;                            // Chargement historique
error: string | null = null;                       // Message erreur

// États utilisateur
userHasSubscription = false;                       // A-t-il un abo actif?
autoRenewEnabled = false;                          // Auto-renew activé?
showHistory = false;                               // Historique visible?
```

## 🔄 Cycle de Vie

```
OnInit:
  ├─ loadPlans()
  └─ loadUserSubscription()

Actions utilisateur:
  ├─ subscribeToPlan()
  │  └─ API POST → Update state → updateUI()
  ├─ renewSubscription()
  │  └─ Confirmation → API PUT → Update state → updateUI()
  ├─ cancelSubscription()
  │  └─ Confirmation → API DELETE → Clear state → updateUI()
  ├─ toggleAutoRenew()
  │  └─ API PATCH → Toggle state → updateUI()
  └─ toggleHistory()
     └─ loadSubscriptionHistory() [first time only]

OnDestroy:
  └─ Cleanup RxJS subscriptions via destroy$
```

## 🛡️ Gestion des Erreurs

### Types d'erreurs gérées

| Code | Message Utilisateur | Cause |
|------|---------------------|-------|
| 401 | "Veuillez vous connecter" | Token expiré/manquant |
| 403 | "Non autorisé" | Permissions insuffisantes |
| 404 | "Ressource non trouvée" | Plan/abonnement inexistant |
| 500 | "Erreur serveur" | Erreur backend |
| Timeout | "Requête expirée" | Serveur ne répond pas |

### Erreurs affichées
```typescript
// Affichage alerte jaune au-dessus des plans
<div class="error-alert">
  <span class="error-icon">⚠️</span>
  <p>{{ error }}</p>
</div>

// Alertes JavaScript
alert('✅ Succès');
alert('❌ Erreur: ' + message);
```

## 🔐 Sécurité & Auth

### Token Management
- Token récupéré depuis `localStorage.getItem('authToken')`
- Inclus dans header: `Authorization: Bearer {token}`
- Appliqué automatiquement par l'intercepteur

### Vérifications
```typescript
// Avant subscribe
if (!token) {
  alert('Veuillez vous connecter d\'abord');
  return;
}

if (!plan.id) {
  console.error('Plan has no ID');
  return;
}
```

## 📱 Design Responsif

### Breakpoints CSS
```css
/* Desktop: 1200px+ */
.plans-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Tablet: 768px - 1199px */
@media (max-width: 768px) {
  .subscription-details {
    grid-template-columns: 1fr; /* 1 colonne au lieu de 3 */
  }
  
  .plans-grid {
    grid-template-columns: 1fr; /* 1 plan par ligne */
  }
}

/* Mobile: < 768px */
@media (max-width: 480px) {
  .header-content h1 {
    font-size: 1.8rem; /* Réduit de 2.5rem */
  }
}
```

## 🎨 Palette de Couleurs

| Élément | Couleur | Code |
|---------|---------|------|
| Principal | Violet | #667eea |
| Secondaire | Violet foncé | #764ba2 |
| Succès | Vert | #4CAF50 |
| Danger | Rouge | #f44336 |
| Warning | Orange | #ff9800 |
| Info | Bleu | #2196F3 |

## 📝 Logs Console

### Format emoji
```
🚀 = Démarrage
✅ = Succès
❌ = Erreur
⚠️  = Avertissement
📋 = Données
📝 = Détails
🔄 = Renouvellement/Boucle
👤 = Utilisateur
🎯 = Cible/Action
🔐 = Sécurité/Auth
📚 = Historique
🛑 = Destruction
```

### Exemples
```javascript
🚀 SubscriptionPlansEnhancedComponent Init
📋 Loading subscription plans...
✅ Plans loaded successfully: 3 plans
👤 Loading user subscription...
✅ User subscription loaded: ACTIVE
🎯 subscribeToPlan() called for plan: Premium Annuel
📝 Subscribing to plan ID: 2
✅ Subscription successful: {...}
```

## 🧪 Test Guide Complet

Voir [TEST_GUIDE.md](./TEST_GUIDE.md) pour:
- Checklist de test détaillée
- Cas de test pour chaque fonctionnalité
- Tests d'erreur et edge cases
- Tests responsiveness
- Instructions debugging

## 🚀 Utilisation

### Import
```typescript
import { SubscriptionPlansEnhancedComponent } from './components/subscription-plans/subscription-plans-enhanced.component';

// Ou
import { SubscriptionPlansEnhancedComponent } from './components/subscription-plans';
```

### Dans une route
```typescript
{
  path: 'subscriptions',
  component: SubscriptionPlansEnhancedComponent,
  canActivate: [AuthGuard],
  data: { title: 'Plans d\'abonnement' }
}
```

### Intégration existante
```typescript
// community-forum.routes.ts
import { SubscriptionPlansEnhancedComponent } from './components/subscription-plans/subscription-plans-enhanced.component';

children: [
  {
    path: 'subscriptions',
    component: SubscriptionPlansEnhancedComponent,
    data: { title: 'Plans d\'abonnement' }
  }
]
```

### Navigation
```typescript
// Depuis autre composant
constructor(private router: Router) {}

goToSubscriptions() {
  this.router.navigate(['/community/forums/subscriptions']);
}
```

## 📊 Modèles de Données

### SubscriptionPlan
```typescript
interface SubscriptionPlan {
  id?: number;
  name: string;              // "Premium Annuel"
  price?: number;            // 99.99
  durationDays?: number;     // 365
  description?: string;      // Description plan
  features?: string[];       // ["Feature 1", "Feature 2"]
  status?: string;           // "ACTIVE"
}
```

### SubscriptionExtended
```typescript
interface SubscriptionExtended {
  id?: number;
  userId?: number;
  planId: number;
  planName: string;          // "Premium Annuel"
  startDate: string;         // "2024-04-21"
  endDate: string;           // "2025-04-21"
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenew?: boolean;
  planPrice?: number;
  planDescription?: string;
  daysRemaining?: number;    // Calculé par component
}
```

### API Endpoints

| Méthode | Endpoint | Params | Auth |
|---------|----------|--------|------|
| GET | `/api/subscription-plans` | - | Non |
| GET | `/api/subscriptions/active` | - | Bearer token |
| GET | `/api/subscriptions/history` | - | Bearer token |
| POST | `/api/subscriptions` | planId, autoRenew | Bearer token |
| PUT | `/api/subscriptions/{id}/renew` | - | Bearer token |
| PATCH | `/api/subscriptions/{id}/auto-renew` | autoRenew | Bearer token |
| DELETE | `/api/subscriptions/{id}` | - | Bearer token |

## ⚠️ Limitations Connues

1. **Pas de pagination** - Si > 100 plans, tous chargés d'un coup
2. **Pas de cache** - API appelée à chaque chargement
3. **Pas de paiement intégré** - Suppose backend gère les paiements
4. **Pas de VAT** - Prix fixes, pas de calcul TVA
5. **Timezone** - Dates stockées en UTC, pas de localisation

## 🔄 Changelog

### v1.0 - Initial Release
- ✅ Affichage plans
- ✅ Abonnement
- ✅ Renouvellement
- ✅ Annulation
- ✅ Auto-renew toggle
- ✅ Historique
- ✅ Gestion erreurs complète
- ✅ Design responsif
- ✅ Logs détaillés

## 📞 Support

Pour les problèmes:
1. Consulter [TEST_GUIDE.md](./TEST_GUIDE.md) - Section Debugging
2. Vérifier backend répond: `http://localhost:8089/MediCareAI/api/subscription-plans`
3. Vérifier token auth valide dans localStorage
4. Vérifier console pour les logs détaillés

## 🔗 Fichiers Connexes

- `subscription-extended.service.ts` - Service API
- `subscription.model.ts` - Interfaces TypeScript
- `community-forum.routes.ts` - Configuration routes
- `dashboard-shell.component.ts` - Composant parent/shell
