# 👥 Subscription Interface - Guide Utilisateur

## 🎯 C'est quoi?

L'interface des abonnements permet aux patients MediCareAI de:
- Voir quels plans premium sont disponibles
- Choisir et acheter un plan d'abonnement
- Gérer leur abonnement actif
- Renouveler ou annuler à tout moment
- Consulter l'historique de leurs abonnements

## 📍 Où y accéder?

### Navigation
```
Menu Principal → Forum de Discussion → Plans d'Abonnement
```

Ou directement: `/community/forums/subscriptions`

## 🌟 Aperçu Visuel

```
┌─────────────────────────────────────────────────────────────┐
│                  💎 Plans d'Abonnement Premium              │
│    Débloquez l'accès complet au contenu exclusif             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🎯 Pas d'abonnement actif                                  │
│  Choisissez un plan ci-dessous pour débloquer les           │
│  fonctionnalités premium et accès au contenu exclusif        │
└─────────────────────────────────────────────────────────────┘

┌────────────────────┬────────────────────┬────────────────────┐
│                    │                    │  ⭐ RECOMMANDÉ    │
│   BASIC            │ PREMIUM MENSUEL   │ PREMIUM ANNUEL     │
│   Gratuit          │ €9,99/mois        │ €99,99/an          │
│   Accès public     │ Contenu premium   │ Accès illimité     │
│                    │                   │ Économie 30%       │
│  [S'ABONNER]      │  [S'ABONNER]      │  [S'ABONNER]      │
└────────────────────┴────────────────────┴────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Après abonnement - SECTION ABONNEMENT ACTIF                │
├─────────────────────────────────────────────────────────────┤
│  ✓ ACTIF                                                     │
│  Premium Annuel                                              │
│                                                              │
│  📅 Date d'expiration: 21/04/2025                           │
│  ⏱️  Jours restants: 365 jours                               │
│  🔄 Auto-renouvellement: ✓ Activé                           │
│                                                              │
│  [🔄 Désactiver] [✓ Renouveler] [✕ Annuler]              │
│  📚 Afficher historique                                     │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Flux Utilisateur Complet

### Scénario 1: Nouvelle Abonnement

```
Étape 1: Consulter les Plans
  └─ Page se charge automatiquement
  └─ Affiche les 3 plans disponibles
  └─ Chaque plan montre prix et fonctionnalités

Étape 2: Choisir un Plan
  └─ Utilisateur lit les plans
  └─ Clique sur "S'abonner" pour le plan choisi
  └─ Exemple: Clique [S'ABONNER] sur "Premium Annuel"

Étape 3: Confirmation
  └─ "✅ Vous vous êtes abonné à Premium Annuel!"
  └─ "Votre abonnement est maintenant actif"

Étape 4: Affichage Abonnement Actif
  └─ Page se met à jour
  └─ Affiche la nouvelle section "Abonnement actuel"
  └─ Montre date d'expiration, jours restants, etc.
```

### Scénario 2: Gestion Auto-Renouvellement

```
Étape 1: Voir État Actuel
  └─ Section "Abonnement actif" visible
  └─ "Auto-renouvellement: ✓ Activé"

Étape 2: Désactiver Auto-Renew
  └─ Clique [🔄 Désactiver auto-renouvellement]
  └─ "✅ Auto-renouvellement désactivé!"

Étape 3: Vérifier Changement
  └─ "Auto-renouvellement: ✗ Désactivé"
  └─ Bouton change en [🔄 Activer auto-renouvellement]

Étape 4: Réactiver (optionnel)
  └─ Clique sur [🔄 Activer auto-renouvellement]
  └─ "✅ Auto-renouvellement activé!"
  └─ Revient à "✓ Activé"
```

### Scénario 3: Renouvellement Avant Expiration

```
Étape 1: Vérifier Jours Restants
  └─ Section "Abonnement actif" affiche
  └─ "Jours restants: 15 jours"

Étape 2: Renouveler Manuellement
  └─ Clique [✓ Renouveler maintenant]
  └─ "Êtes-vous sûr de vouloir renouveler votre abonnement?"

Étape 3: Confirmer
  └─ Clique "OK" dans la dialog
  └─ "✅ Abonnement renouvelé avec succès!"

Étape 4: Vérifier Mise à Jour
  └─ Date d'expiration mise à jour
  └─ Jours restants recalculés (ex: 365 pour Premium Annuel)
```

### Scénario 4: Consulter Historique

```
Étape 1: Cliquer sur Historique
  └─ Section "Abonnement actif" visible
  └─ Clique [📚 Afficher historique]
  └─ Section historique se déploie

Étape 2: Voir Historique
  └─ Tableau avec tous les abonnements passés
  └─ Affiche: Date | Plan | Statut (ACTIVE/EXPIRED/CANCELLED)
  └─ Exemple:
     - 21/04/2023 | Premium Annuel | EXPIRED
     - 21/04/2022 | Premium Mensuel | EXPIRED
     - 01/01/2022 | Basic | CANCELLED

Étape 3: Fermer Historique
  └─ Clique [📚 Masquer historique]
  └─ Historique se replie
```

### Scénario 5: Annulation d'Abonnement

```
Étape 1: Commencer Annulation
  └─ Section "Abonnement actif" visible
  └─ Clique [✕ Annuler l'abonnement]

Étape 2: Premier Avertissement
  └─ Dialog: "Êtes-vous sûr de vouloir annuler?"
  └─ Boutons: [Annuler] [OK]

Étape 3: Double Confirmation
  └─ Dialog: "Cette action ne peut pas être annulée"
  └─ Clique [OK] pour confirmer

Étape 4: Annulation Effective
  └─ "✅ Votre abonnement a été annulé"
  └─ Page se met à jour
  └─ Section "Abonnement actif" disparaît
  └─ Revient à "Pas d'abonnement actif"

Étape 5: Accès Limité
  └─ Tous les plans affichent [S'ABONNER]
  └─ Pas d'accès premium jusqu'à nouveau abonnement
```

## 🛒 Plans Disponibles

### Basic (Gratuit)
```
€0 / mois
✓ Accès au forum public
✓ Réception de réponses
✓ Profil utilisateur
```

### Premium Mensuel
```
€9,99 / mois
✓ Accès à tout le contenu premium
✓ Réponses prioritaires des professionnels
✓ Statistiques de santé avancées
✓ Support prioritaire
✓ Sans publicités
```

### Premium Annuel ⭐ RECOMMANDÉ
```
€99,99 / an (Économie 30% vs mensuel)
✓ Accès illimité au contenu premium
✓ Consultation vidéo avec professionnels
✓ Analyse complète de la santé
✓ Support 24/7
✓ Accès à des webinaires exclusifs
```

## ⚙️ Gestion du Compte

### Informations Affichées
```
Abonnement Actif
├─ Badge de statut (✓ ACTIF)
├─ Nom du plan
├─ Date d'expiration
├─ Jours restants
└─ État auto-renouvellement
```

### Actions Disponibles
```
Avec un abonnement actif:
├─ 🔄 Basculer auto-renouvellement
├─ ✓ Renouveler maintenant
├─ ✕ Annuler l'abonnement
└─ 📚 Voir historique

Sans abonnement:
└─ S'abonner à un plan (visible sur chaque plan)
```

## ⚠️ Messages Importants

### Succès
```
✅ Vous vous êtes abonné à [Plan]!
✅ Votre abonnement est maintenant actif.
✅ Auto-renouvellement activé/désactivé!
✅ Abonnement renouvelé avec succès!
✅ Votre abonnement a été annulé.
```

### Erreurs
```
❌ Veuillez vous connecter d'abord
❌ Erreur lors du chargement des plans
❌ Erreur lors de l'abonnement: [détail]
❌ Erreur lors du renouvellement: [détail]
❌ Erreur lors de l'annulation: [détail]
```

### Confirmations
```
?  Êtes-vous sûr de vouloir renouveler votre abonnement?
?  Êtes-vous sûr de vouloir annuler votre abonnement?
   Cette action ne peut pas être annulée.
?  Êtes-vous sûr de vouloir activer/désactiver
   l'auto-renouvellement?
```

## 🌍 Accessibilité

### Responsive Design
```
🖥️  Desktop (1920x1080)
  └─ Grille 3 colonnes pour les plans
  └─ Tous les détails visibles

💻 Tablet (768x1024)
  └─ Grille 2 colonnes pour les plans
  └─ Sections empilées verticalement

📱 Mobile (375x667)
  └─ Grille 1 colonne (plans empilés)
  └─ Boutons full-width
  └─ Texte agrandi pour lisibilité
```

### Claviers/Lecteurs
```
✓ Tous les boutons accessibles au clavier (Tab)
✓ Labels explicites pour champ de saisie
✓ Couleurs + icônes (pas couleur seule)
✓ Contraste suffisant pour handicap visuel
```

## 💳 Questions Fréquentes (FAQ)

### Q: Puis-je changer de plan?
```
R: Oui! Annulez votre plan actuel, puis
   abonnez-vous à un nouveau plan.
```

### Q: Puis-je récupérer mon argent?
```
R: Oui! Contactez notre support dans les 7 jours
   pour remboursement complet.
```

### Q: Que se passe-t-il si je n'ai plus accès?
```
R: Contactez le support - votre abonnement
   peut être restauré rapidement.
```

### Q: Puis-je voir ma facture?
```
R: Oui, consultez votre historique puis
   contactez le support pour la facture.
```

### Q: Que se passe-t-il si mon auto-renew échoue?
```
R: Nous vous enverrons un email pour
   mettre à jour votre méthode de paiement.
```

## 📞 Besoin d'Aide?

### Support
```
Email: support@medicarai.com
Chat: Support chat en bas à droite
Phone: +33 1 XX XX XX XX
```

### Problèmes Courants

**Les plans ne s'affichent pas**
```
→ Vérifiez connexion internet
→ Rafraîchissez la page (F5)
→ Videz cache navigateur
→ Contactez support
```

**Je ne peux pas m'abonner**
```
→ Vérifiez connecté (voir login)
→ Vérifiez method paiement valide
→ Essayez autre plan
→ Contactez support
```

**Mon abonnement disparu?**
```
→ Vérifiez l'historique
→ Vérifiez pas annulé accidentellement
→ Contactez support immédiatement
```

## 🔒 Sécurité

### Données Protégées
```
✓ Chiffrement SSL pour tous les paiements
✓ Aucun stockage direct carte credit
✓ Conforme RGPD
✓ Sauvegardes automatiques
```

### Confidentialité
```
✓ Données non partagées avec tiers
✓ Accès restreint aux administrateurs
✓ Logs de sécurité pour audit
```

---

**Version**: 1.0  
**Dernière mise à jour**: Avril 2024  
**Support**: support@medicarai.com
