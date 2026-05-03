# 🧪 Guide de Test - Interface des Abonnements

## 📋 Checklist de Test Complet

### Phase 1: Démarrage & Navigation ✅
- [ ] Démarrer le serveur: `ng serve --port 4201`
- [ ] Accéder à: `http://localhost:4201/community/forums/subscriptions`
- [ ] Vérifier que la page charge sans erreurs
- [ ] Console JS: Aucune erreur affichée

### Phase 2: Affichage des Plans 📋
- [ ] Les plans s'affichent dans une grille
- [ ] Au minimum 3 plans visibles (Basic, Premium Mensuel, Premium Annuel)
- [ ] Chaque plan affiche:
  - [ ] Nom du plan
  - [ ] Prix
  - [ ] Description
  - [ ] Bouton "S'abonner"
- [ ] Badge "⭐ RECOMMANDÉ" visible sur le plan annuel

### Phase 3: État Sans Abonnement 🔓
**Si l'utilisateur n'a pas d'abonnement:**
- [ ] Message "Pas d'abonnement actif" affiché
- [ ] Bouton "S'abonner" actif sur chaque plan
- [ ] Pas de section "Abonnement actuel"
- [ ] Pas de bouton "Renouveler" ou "Annuler"

### Phase 4: Abonnement ✅
**Tester: Cliquer sur "S'abonner" pour un plan**
- [ ] Confirmation: Un dialog ou alerte s'affiche
- [ ] Console: Log "🎯 subscribeToPlan() called for plan: [nom]"
- [ ] Console: Log "📝 Subscribing to plan ID: [id]"
- [ ] Alerte de succès affichée: "✅ Vous vous êtes abonné à..."
- [ ] Page se met à jour avec l'abonnement actif
- [ ] Section "Abonnement actuel" maintenant visible
- [ ] Bouton "S'abonner" devient "✓ Plan actuel" (désactivé)

### Phase 5: Affichage de l'Abonnement Actif 💎
**Après s'être abonné:**
- [ ] Card avec badge "✓ ACTIF" affiché
- [ ] Affiche le nom du plan
- [ ] Affiche la date d'expiration (format JJ/MM/AAAA)
- [ ] Affiche le nombre de jours restants
- [ ] Affiche l'état auto-renouvellement
- [ ] Les 3 boutons s'affichent:
  - [ ] 🔄 Désactiver auto-renouvellement
  - [ ] ✓ Renouveler maintenant
  - [ ] ✕ Annuler l'abonnement

### Phase 6: Auto-Renouvellement 🔄
**Tester: Cliquer sur "Désactiver auto-renouvellement"**
- [ ] Confirmation dialog: "Êtes-vous sûr..."
- [ ] Console: Log "🔄 toggleAutoRenew() called"
- [ ] Alerte de succès
- [ ] Bouton change en "Activer auto-renouvellement"
- [ ] Texte passe de "✓ Activé" à "✗ Désactivé"

### Phase 7: Renouvellement 🔁
**Tester: Cliquer sur "Renouveler maintenant"**
- [ ] Confirmation dialog: "Êtes-vous sûr de vouloir renouveler..."
- [ ] Console: Log "🔄 renewSubscription() called"
- [ ] Console: Log "📝 Renewing subscription ID: [id]"
- [ ] Alerte de succès: "✅ Abonnement renouvelé avec succès!"
- [ ] Date d'expiration mise à jour
- [ ] Jours restants recalculés

### Phase 8: Historique 📚
**Tester: Cliquer sur "📚 Afficher historique"**
- [ ] Section historique s'affiche
- [ ] Bouton change en "Masquer historique"
- [ ] Console: Log "📚 Loading subscription history..."
- [ ] Historique charge avec spinner
- [ ] Affiche tous les abonnements passés avec:
  - [ ] Date de début
  - [ ] Nom du plan
  - [ ] Statut (ACTIVE, EXPIRED, CANCELLED)

### Phase 9: Annulation ✕
**Tester: Cliquer sur "Annuler l'abonnement"**
- [ ] Dialog de confirmation fort: "Êtes-vous sûr... Cette action ne peut pas être annulée"
- [ ] Si cancel: Rien ne se passe
- [ ] Si confirmer:
  - [ ] Console: Log "❌ cancelSubscription() called"
  - [ ] Alerte: "✅ Votre abonnement a été annulé"
  - [ ] Page retourne à l'état "Pas d'abonnement actif"
  - [ ] Section "Abonnement actuel" disparaît
  - [ ] Boutons "Renouveler" et "Annuler" disparaissent

### Phase 10: Gestion des Erreurs 🚨
**Tester intentionnellement des scénarios d'erreur:**

#### Cas 1: Pas de token
- [ ] Dans DevTools, supprimez `authToken` de localStorage
- [ ] Essayez de vous abonner
- [ ] Alerte: "Veuillez vous connecter d'abord"

#### Cas 2: Erreur serveur (simulation)
- [ ] Arrêtez le backend
- [ ] Essayez de charger les plans
- [ ] Message d'erreur: "Erreur lors du chargement des plans"
- [ ] Console: ❌ Error log avec détails

#### Cas 3: 401 Unauthorized
- [ ] Token expiré/invalide
- [ ] Error message: "Erreur lors de l'abonnement: [message backend]"

#### Cas 4: 403 Forbidden
- [ ] Cas d'autorisation refusée
- [ ] Error message: "Erreur lors de l'annulation: [message backend]"

### Phase 11: Interface Responsive 📱
**Tester sur différentes résolutions:**
- [ ] Desktop (1920x1080): Layout normal
- [ ] Tablet (768x1024): Plans en 2 colonnes
- [ ] Mobile (375x667): Plans en 1 colonne, empilés

### Phase 12: Performance ⚡
**Vérifier dans DevTools:**
- [ ] Temps de chargement < 2 secondes
- [ ] Pas de memory leaks (détruire component et revenir)
- [ ] Requêtes API complétées correctement
- [ ] Console sans errors/warnings (sauf tsconfig.json)

### Phase 13: Logs Console 📝
**Vérifier les logs dans la console:**
```
Logs attendus au chargement:
🚀 SubscriptionPlansEnhancedComponent Init
📋 Loading subscription plans...
✅ Plans loaded successfully: X plans
👤 Loading user subscription...
✅ User subscription loaded: [status]

Après action (ex: subscribe):
🎯 subscribeToPlan() called for plan: [name]
📝 Subscribing to plan ID: [id]
📝 [payload]
✅ Subscription successful: [subscription]
```

## 🐛 Debugging

### Problèmes Courants:

1. **Plans ne s'affichent pas**
   - [ ] Vérifier URL API: `http://localhost:8089/MediCareAI/api/subscription-plans`
   - [ ] Vérifier token auth valide
   - [ ] Vérifier backend répond

2. **Bouton "S'abonner" ne répond pas**
   - [ ] Vérifier console pour erreurs
   - [ ] Vérifier network tab (XHR requests)
   - [ ] Vérifier token dans Authorization header

3. **Spinner infini**
   - [ ] Vérifier timeout de 10s n'a pas expiré
   - [ ] Vérifier backend répond
   - [ ] Vérifier ChangeDetectorRef.detectChanges() appelé

4. **Erreur 401**
   - [ ] Token expiré - re-login
   - [ ] localStorage vide - re-login

5. **Erreur 500**
   - [ ] Vérifier backend logs
   - [ ] Vérifier structure des paramètres
   - [ ] Vérifier userId extrait correctement du JWT

## ✅ Critères de Succès

- [ ] Tous les tests ci-dessus passent
- [ ] Pas d'erreurs TypeScript/compilation
- [ ] Pas d'erreurs console JS
- [ ] Interface responsive fonctionne
- [ ] Tous les chemins d'erreur gérés
- [ ] Logs pertinents affichés
- [ ] Performance acceptable

## 📊 Rapport de Test

```
Date: ____________
Testeur: ____________
Durée: ____________

Sections testées:    ✅ / ❌ / ⏭️ (Skip)
Phase 1: ___________
Phase 2: ___________
Phase 3: ___________
...

Bugs trouvés:
- [Issue 1]: Description, Actions à reproduire, Impact
- [Issue 2]: ...

Recommandations:
- Point 1
- Point 2

Statut global: 🟢 PASS / 🟡 PARTIAL / 🔴 FAIL
```

## 🔗 Ressources

- URL locale: `http://localhost:4201/community/forums/subscriptions`
- Composant: `src/app/modules/community-forum/components/subscription-plans/`
- Service: `src/app/modules/community-forum/services/subscription-extended.service.ts`
- Modèle: `src/app/shared/models/subscription.model.ts`
- Routes: `src/app/modules/community-forum/community-forum.routes.ts`
