# Module Community Forum + Subscription

## 📋 Description
Ce module fournit une plateforme complète pour la discussion communautaire et la gestion des abonnements aux fonctionnalités premium de MediCareAI.

## ✨ Fonctionnalités

### Forum
- ✅ Lister tous les posts avec filtrage et recherche
- ✅ Créer/Modifier/Supprimer des posts
- ✅ Ajouter/Modifier/Supprimer des réponses aux posts
- ✅ Système de tags pour les posts
- ✅ Distinction entre contenu gratuit et premium
- ✅ Likes sur les posts et réponses
- ✅ Comptage des vues et réponses

### Abonnement (Subscription)
- ✅ Consulter tous les plans d'abonnement disponibles
- ✅ S'abonner à un plan d'abonnement
- ✅ Renouveler un abonnement actif
- ✅ Annuler un abonnement
- ✅ Voir l'état de l'abonnement actif
- ✅ Authentification requise pour les fonctionnalités

## 🗂️ Structure de Dossiers

\`\`\`
community-forum/
├── components/
│   ├── forum-list/              # Liste des posts
│   │   ├── forum-list.component.ts
│   │   ├── forum-list.component.html
│   │   └── forum-list.component.css
│   ├── forum-detail/            # Détail d'un post + réponses
│   │   ├── forum-detail.component.ts
│   │   ├── forum-detail.component.html
│   │   └── forum-detail.component.css
│   ├── post-editor/             # Créer/Modifier un post
│   │   ├── post-editor.component.ts
│   │   ├── post-editor.component.html
│   │   └── post-editor.component.css
│   └── subscription-plans/      # Plans d'abonnement
│       ├── subscription-plans.component.ts
│       ├── subscription-plans.component.html
│       └── subscription-plans.component.css
├── services/
│   ├── forum-extended.service.ts
│   └── subscription-extended.service.ts
├── models/
│   └── forum-extended.model.ts
├── pages/
│   └── community-forum-shell.component.ts
├── community-forum.routes.ts
└── README.md                    # Ce fichier
\`\`\`

## 🚀 Routes Disponibles

| Route | Composant | Description |
|-------|-----------|-------------|
| `/community-forum` | ForumListComponent | Liste tous les posts |
| `/community-forum/post/:id` | ForumDetailComponent | Affiche un post spécifique |
| `/community-forum/create-post` | PostEditorComponent | Créer un nouveau post |
| `/community-forum/edit-post/:id` | PostEditorComponent | Modifier un post |
| `/community-forum/subscriptions` | SubscriptionPlansComponent | Voir les plans d'abonnement |

## 🔌 API Endpoints

### Posts
- **GET** `/api/forum/posts` - Récupérer tous les posts
- **POST** `/api/forum/posts` - Créer un nouveau post
- **GET** `/api/forum/posts/{id}` - Récupérer un post spécifique
- **PUT** `/api/forum/posts/{id}` - Modifier un post
- **DELETE** `/api/forum/posts/{id}` - Supprimer un post

### Réponses
- **GET** `/api/forum/posts/{postId}/replies` - Récupérer les réponses d'un post
- **POST** `/api/forum/posts/{postId}/replies` - Créer une réponse
- **GET** `/api/forum/replies/{id}` - Récupérer une réponse spécifique
- **PUT** `/api/forum/replies/{id}` - Modifier une réponse
- **DELETE** `/api/forum/replies/{id}` - Supprimer une réponse

### Abonnements
- **GET** `/api/subscription-plans` - Tous les plans d'abonnement
- **GET** `/api/subscriptions/user/{userId}/active` - L'abonnement actif de l'utilisateur
- **POST** `/api/subscriptions` - Créer un nouvel abonnement
- **PUT** `/api/subscriptions/{id}/renew` - Renouveler un abonnement

## 🎨 Design et UX

### Palettes de Couleurs
- **Gradient Principal**: #667eea à #764ba2 (Violet)
- **Accent Vert**: #4CAF50 (Boutons primaires)
- **Accent Rouge**: #ff6b6b (Badge premium)
- **Fond**: #f5f7fa (Gradient clair)

### Composants UI
- **Cards**: Ombrage doux avec transition au survol
- **Boutons**: Dégradé avec effets de transformation
- **Formulaires**: Borders animées au focus
- **Tags**: Badges colorés avec rounded corners
- **Avatars**: Dégradé rond avec initiales

## 📱 Responsive Design
Tous les composants sont entièrement responsifs:
- Mobile-first approach
- Breakpoints: 768px (tablette)
- Grilles adaptables
- Images scalables

## 🔐 Sécurité

### Authentification
- Vérification du userId depuis localStorage
- AuthGuard sur les routes protégées (à implémenter)

### Vérification d'Accès
- Les posts premium nécessitent un abonnement actif
- Les utilisateurs non abonnés ne peuvent pas répondre aux posts premium

## 📦 Dépendances

- **Angular**: ^21.1.0
- **RxJS**: ~7.8.0
- **Angular Forms**: ^21.1.0
- **Angular Router**: ^21.1.0

## 🛠️ Utilisation des Services

### ForumExtendedService
```typescript
// Récupérer tous les posts avec filtrage
this.forumService.getAllPosts({
  category: 'general',
  premiumOnly: false,
  searchTerm: 'santé',
  sortBy: 'newest'
}).subscribe((posts) => {
  // Traiter les posts
});

// Créer un post
this.forumService.createPost({
  title: 'Mon Titre',
  content: 'Mon contenu...',
  tags: ['tag1', 'tag2'],
  premiumOnly: false
}).subscribe((newPost) => {
  // Rediriger vers le post créé
});
```

### SubscriptionExtendedService
```typescript
// Récupérer les plans
this.subscriptionService.getAllPlans().subscribe((plans) => {
  // Afficher les plans
});

// S'abonner
this.subscriptionService.subscribe(userId, planId, true).subscribe((sub) => {
  // Abonnement créé avec succès
});

// Vérifier si l'utilisateur a un abonnement actif
this.subscriptionService.hasActiveSubscription(userId).subscribe((hasActive) => {
  // true ou false
});
```

## 🎯 Améliorations Futures

- [ ] Pagination des posts
- [ ] Système de notifications
- [ ] Modération des posts (admin)
- [ ] Système d'érating/ranking des posts utiles
- [ ] Upload d'images/fichiers
- [ ] Mentions (@user)
- [ ] Système de citations
- [ ] Dark mode
- [ ] Sauvegarde des brouillons

## 🐛 Debugging

Si vous rencontrez des erreurs:
1. Vérifiez que le userId est stocké dans localStorage
2. Vérifiez que l'API répond correctement
3. Ouvrez la console navigateur (F12) pour voir les erreurs
4. Vérifiez les observable subscriptions

## 📞 Support

Pour toute question ou problème avec ce module, consultez la documentation Angular officielle ou la documentation de l'API MediCareAI.
