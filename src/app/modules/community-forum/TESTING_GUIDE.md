# Guide de Test - Module Forum & Subscription

## 📋 Vue d'ensemble des Fonctionnalités

### ✅ Fonctionnalités Implémentées et Testées

#### 1. Forum - CRUD Posts
- **Création de posts** ✓
  - Route: `/community/forums/create-post`
  - Formulaire avec titre, contenu, catégorie, tags
  - Option premium (premiumOnly)
  - Validation: titre (5-150 chars), contenu (20-5000 chars)

- **Lecture de posts** ✓
  - Route: `/community/forums/dashboard` - Affiche liste
  - Route: `/community/forums/post/:id` - Affiche détails
  - Bouton "Lire →" déclenche navigation vers détails
  - Affichage des statistiques: vues, réponses, j'aime

- **Modification de posts** ✓
  - Route: `/community/forums/edit-post/:id`
  - Charge le post existant dans le formulaire
  - Bouton "✏️ Modifier" sur la page détail
  - Sauvegarde les modifications

- **Suppression de posts** ✓
  - Bouton "🗑️ Supprimer" sur la page détail
  - Confirmation avant suppression
  - Redirige vers dashboard après suppression

#### 2. Forum - Tags & Filtrage
- **Tags** ✓
  - Ajout de tags lors de la création/édition
  - Affichage de tags sur les cards
  - Filtrage par tags
  - Autocomplete avec suggestions

- **Filtrage** ✓
  - Par catégorie (Santé Générale, Nutrition, Exercice, Mental, Questions Médicales)
  - Par premium/gratuit
  - Recherche par texte (titre et contenu)
  - Tri: Récents, Populaires, Plus répondus

#### 3. Forum - Réponses (Replies)
- **Ajouter une réponse** ✓
  - Formulaire textarea dans la page détail
  - Bouton "Publier la réponse"
  - Vérification d'authentification

- **Supprimer une réponse** ✓
  - Bouton "🗑️" sur chaque réponse
  - Confirmation avant suppression

- **Liker une réponse** ✓
  - Bouton "❤️" sur chaque réponse
  - Compte les likes

- **Accès premium** ✓
  - Si post est premium et utilisateur n'a pas d'abonnement
  - Affiche message "Contenu Premium"
  - Bouton pour voir plans d'abonnement

#### 4. Subscription - Gestion des Plans
- **Consulter les plans** ✓
  - Route: `/community/forums/subscriptions`
  - Affiche 3 plans: Basic, Premium Mensuel, Premium Annuel
  - Affiche prix, durée, description, features

- **S'abonner à un plan** ✓
  - Bouton "S'abonner maintenant" sur chaque plan
  - Crée une subscription
  - Affiche plan actuel après abonnement

- **Renouveler l'abonnement** ✓
  - Bouton "Renouveler l'abonnement" pour plan actif
  - Prolonge la date d'expiration
  - Affiche message de succès

- **Annuler l'abonnement** ✓
  - Bouton "Annuler" pour plan actif
  - Confirmation avant annulation
  - Rend accès premium non disponible

- **Vérifier l'état actif** ✓
  - Affiche jours restants d'abonnement
  - Badge "✓ ABONNEMENT ACTIF" si actif
  - Vérification au chargement du composant

---

## 🧪 Scénarios de Test

### Test 1: Flux Forum Complet
**Étapes:**
1. Aller à `/community/forums/dashboard`
2. Cliquer "Créer une Discussion"
3. Remplir le formulaire:
   - Titre: "Ma première question"
   - Contenu: Texte de plus de 20 caractères
   - Catégorie: "Nutrition"
   - Ajouter tags: "Fitness", "Santé"
4. Cliquer "Publier"
5. **Résultat attendu**: Redirection vers la page détail du nouveau post

### Test 2: Navigation et Bouton "Lire"
**Étapes:**
1. Sur le dashboard, voir la liste des posts
2. Cliquer le bouton "Lire →" d'un post
3. **Résultat attendu**: Navigation vers `/community/forums/post/:id`

### Test 3: Modifier un Post
**Étapes:**
1. Sur la page détail d'un post, cliquer "✏️ Modifier"
2. Changer le titre
3. Cliquer "Publier"
4. **Résultat attendu**: Retour à la détail avec modifications

### Test 4: Supprimer un Post
**Étapes:**
1. Sur la page détail, cliquer "🗑️ Supprimer"
2. Confirmer la suppression
3. **Résultat attendu**: Redirection au dashboard, post n'apparaît plus

### Test 5: Ajouter une Réponse
**Étapes:**
1. Sur la page détail d'un post gratuit
2. Remplir textarea "Ajouter une réponse"
3. Cliquer "Publier la réponse"
4. **Résultat attendu**: Réponse apparaît dans la liste des réponses

### Test 6: Supprimer une Réponse
**Étapes:**
1. Sur la page détail, sur une réponse, cliquer "🗑️"
2. Confirmer la suppression
3. **Résultat attendu**: Réponse disparaît de la liste

### Test 7: Like/Unlike Post
**Étapes:**
1. Sur la page détail, cliquer "❤️ J'aime"
2. **Résultat attendu**: Bouton change à "❤️ Vous aimez"
3. Cliquer à nouveau
4. **Résultat attendu**: Revient à "❤️ J'aime"

### Test 8: Subscription Plan
**Étapes:**
1. Cliquer sur "★ Accès Premium" ou aller à `/community/forums/subscriptions`
2. Voir l'état actuel d'abonnement
3. Cliquer "S'abonner maintenant" sur un plan
4. **Résultat attendu**: Plan devient actif avec badge

### Test 9: Contenu Premium Restreint
**Étapes:**
1. Sans abonnement actif, accéder à un post premium
2. **Résultat attendu**: Message "Contenu Premium" affiché
3. Bouton "Voir les plans d'abonnement" disponible
4. S'abonner à un plan
5. Actualiser la page
6. **Résultat attendu**: Accès au post et réponses granted

### Test 10: Filtrage et Recherche
**Étapes:**
1. Sur le dashboard, chercher "diagnostic"
2. **Résultat attendu**: Posts contenant ce terme apparaissent
3. Filtrer par "Nutrition"
4. **Résultat attendu**: Seuls posts de cette catégorie affichés
5. Trier par "Populaires"
6. **Résultat attendu**: Posts triés par nombre de likes

---

## 🔧 Points d'Intégration Backend Requis

### Endpoints Forum
```
POST   /api/forum/posts              - Créer post
GET    /api/forum/posts              - Lister posts (avec filtres)
GET    /api/forum/posts/:id          - Détail post
PUT    /api/forum/posts/:id          - Modifier post
DELETE /api/forum/posts/:id          - Supprimer post
POST   /api/forum/posts/:id/like     - Liker post
POST   /api/forum/posts/:id/unlike   - Retirer like
GET    /api/forum/posts/:id/replies  - Lister réponses
POST   /api/forum/posts/:id/replies  - Ajouter réponse
DELETE /api/forum/replies/:id        - Supprimer réponse
POST   /api/forum/replies/:id/like   - Liker réponse
```

### Endpoints Subscription
```
GET    /api/subscription-plans            - Lister tous les plans
GET    /api/subscriptions/active          - Abonnement actif de l'utilisateur
POST   /api/subscriptions                 - Créer abonnement
PUT    /api/subscriptions/:id/renew       - Renouveler
DELETE /api/subscriptions/:id             - Annuler
GET    /api/subscriptions/has-active      - Vérifier si actif
GET    /api/subscriptions/history         - Historique
```

---

## 📊 Modèles de Données

### Post
```typescript
{
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  category?: string;
  premiumOnly?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  replyCount?: number;
  likerCount?: number;
  isLiked?: boolean;
}
```

### Reply
```typescript
{
  id: number;
  content: string;
  postId: number;
  authorId: number;
  authorName: string;
  createdAt: string;
  likeCount?: number;
  isLiked?: boolean;
}
```

### SubscriptionPlan
```typescript
{
  id: number;
  name: string;              // 'Premium Mensuel', 'Premium Annuel', etc.
  price: number;             // Prix en dollars
  durationDays: number;      // 30, 365, etc.
  description?: string;
}
```

### Subscription
```typescript
{
  id: number;
  userId: number;
  planId: number;
  planName?: string;
  startDate: string;         // ISO date
  endDate: string;           // ISO date
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  activeNow?: boolean;
}
```

---

## 🐛 Dépannage

### Le bouton "Lire" ne fonctionne pas
- **Solution**: ✓ Corrigé - Le bouton a maintenant le gestionnaire `(click)="$event.stopPropagation(); viewPost(post.id)"`
- Vérifier la console pour les erreurs de navigation

### Les réponses ne s'affichent pas
- Vérifier que l'utilisateur a l'accès (pas premium restreint)
- Vérifier le backend retourne les réponses
- Vérifier ForumDetailComponent charge les réponses au init

### L'abonnement ne se sauvegarde pas
- Vérifier le token JWT dans localStorage
- Vérifier l'endpoint POST `/api/subscriptions` fonctionne
- Vérifier le backend associe l'abonnement à l'utilisateur JWT

### Les tags ne s'affichent pas
- Vérifier que `post.tags` n'est pas undefined/null
- Vérifier le pipe `slice: 0:3` limite correctement

---

## 📱 Tests de Responsive
- ✓ Desktop (>1024px)
- ✓ Tablet (768px-1024px)  
- ✓ Mobile (<768px)
- Sidebar se cache et un menu toggle apparaît

---

## ✨ Prochaines Améliorations Possibles
1. Pagination pour liste des posts
2. Infinite scroll
3. Notifications en temps réel pour nouvelles réponses
4. Édition des réponses
5. Système de modération (admin)
6. Export posts PDF
7. Partage sur réseaux sociaux
8. Système de badges/réputations
9. Recherche avancée avec facettes
10. Analytics du forum (admin)
