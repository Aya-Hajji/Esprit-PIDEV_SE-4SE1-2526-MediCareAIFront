/**
 * GUIDE DE DÉBOGAGE - Module Community Forum
 * Pour identifier pourquoi vous ne pouvez pas créer une discussion
 */

// ============================================
// ÉTAPE 1: Vérifier le Token dans la Console
// ============================================

// Ouvrez la console du navigateur (F12) et tapez:
localStorage.getItem('authToken');
// Résultat attendu: Un token JWT (chaîne longue)
// Si NULL ou undefined: Le token n'a pas été sauvegardé après le login

localStorage.getItem('userId');
// Résultat attendu: Un nombre (ex: 123)
// Si NULL ou undefined: L'userId n'a pas été sauvegardé


// ============================================
// ÉTAPE 2: Vérifier les Logs du Service
// ============================================

// Ouvrez la console et regardez les logs de ForumExtendedService:
// Cherchez des messages comme:
// "Getting auth headers. Token exists: true"
// "Sending POST request to: http://localhost:8089/MediCareAI/api/forum/posts"
// "Creating post. UserId: 123"

// Si vous voyez "Token exists: false" → Le token n'est pas stocké
// Si vous voyez "Error" → Il y a un problème d'API


// ============================================
// ÉTAPE 3: Vérifier les Requêtes Réseau
// ============================================

// 1. Ouvrez les DevTools (F12)
// 2. Allez à l'onglet "Network"
// 3. Essayez de créer une discussion
// 4. Vous verrez une requête POST vers "/api/forum/posts"
// 5. Cliquez dessus et vérifiez:

/*
   - Status: Doit être 200-201 (succès) ou 401 (non authentifié)
   - Headers → Authorization: Doit contenir "Bearer [TOKEN]"
   - Response: Contient le message d'erreur si STATUS = 401
*/

// Si vous voyez "401 Unauthorized":
// → Le serveur ne reconnaît pas le token
// → Le token est expiré
// → Le token est invalide


// ============================================
// ÉTAPE 4: Solution Si Le Token Est Manquant
// ============================================

// Si localStorage.getItem('authToken') retourne NULL:

// 1. Vérifiez que vous êtes CONNECTÉ
//    - Allez à la page de login
//    - Entrez vos identifiants
//    - Un message de succès doit s'afficher

// 2. Vérifiez que le AuthService stocke bien le token
//    - Ouvrez la console après login
//    - Tapez: localStorage.getItem('authToken')
//    - Doit retourner un token JWT

// 3. Si le token n'est toujours pas stocké:
//    - Vérifiez que votre endpoint de login retourne un token
//    - Vérifiez que le nom de la clé est "authToken" (pas "token" ou autre)


// ============================================
// ÉTAPE 5: Vérifier que l'API est Accessible
// ============================================

// Ouvrez la console et testez manuellement:

fetch('http://localhost:8089/MediCareAI/api/forum/posts', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.log('Error:', err));

// Résultat attendu: Une liste de posts (peut être vide [])
// Résultat problématique: Erreur 401, 403, 404, 500


// ============================================
// ÉTAPE 6: Patterns de Débogage Communs
// ============================================

/*
PROBLÈME 1: "Vous devez être connecté pour créer une discussion"
→ localStorage.getItem('userId') est NULL
→ SOLUTION: Assurez-vous d'être connecté, puis rechargez la page

PROBLÈME 2: "Erreur lors de la création: 401 Unauthorized"
→ Le token n'est pas valide ou a expiré
→ SOLUTION: Se reconnecter, puis réessayer

PROBLÈME 3: "Erreur lors de la création: 403 Forbidden"
→ Vous n'avez pas les permissions pour créer un post
→ SOLUTION: Vérifiez votre rôle d'utilisateur (PATIENT, DOCTOR, etc)

PROBLÈME 4: "Erreur lors de la création: 404 Not Found"
→ L'endpoint API n'existe pas
→ SOLUTION: Vérifiez que l'endpoint est correct dans environment.ts

PROBLÈME 5: "Erreur lors de la création: timeout"
→ Le serveur est trop lent ou ne répond pas
→ SOLUTION: Vérifiez que le serveur Spring Boot tourne bien
*/


// ============================================
// ÉTAPE 7: Commandes de Test Rapide
// ============================================

// Copier-coller dans la console pour tester rapidement:

// Test 1: Vérifier le token
console.log('Token:', localStorage.getItem('authToken'));

// Test 2: Vérifier l'userId
console.log('UserId:', localStorage.getItem('userId'));

// Test 3: Vérifier l'environnement
console.log('API URL:', 'http://localhost:8089/MediCareAI/');

// Test 4: Tester la connection API avec le token
const token = localStorage.getItem('authToken');
const userId = localStorage.getItem('userId');

if (!token) {
  console.error('❌ Token manquant! Connectez-vous d\'abord');
} else if (!userId) {
  console.error('❌ UserId manquant! Connectez-vous d\'abord');
} else {
  console.log('✓ Token et UserId présents');
  console.log('Token:', token.substring(0, 20) + '...');
  console.log('UserId:', userId);
}


// ============================================
// POINTS CLÉS À RETENIR
// ============================================

/*
1. LE TOKEN EST ESSENTIEL
   - Vous DEVEZ être connecté pour créer un post
   - Le token est envoyé automatiquement par l'intercepteur HTTP
   - Si le token est absent, l'API retournera 401

2. L'ENDPOINT DOIT EXISTER
   - Vérifiez que votre backend implémente POST /api/forum/posts
   - Assurez-vous que l'endpoint est protégé par une authentification

3. LE BACKEND DOIT VALIDER LE TOKEN
   - Spring Security doit vérifier le JWT token
   - Si le token est invalide, le backend rejettera la requête

4. LES HEADERS DOIVENT ÊTRE CORRECTS
   - Authorization: Bearer [TOKEN]
   - Content-Type: application/json
   - L'intercepteur HTTP ajoute cela automatiquement
*/


// ============================================
// FICHIERS À VÉRIFIER
// ============================================

/*
1. src/app/services/auth.service.ts
   - Vérifiez que setToken() stocke bien le token dans 'authToken'
   - Vérifiez que tokenValue retourne le token correct

2. src/app/services/auth.interceptor.ts
   - Vérifiez que l'intercepteur ajoute le header Authorization
   - Vérifiez que c'est configuré dans AppModule via HTTP_INTERCEPTORS

3. src/app/app-module.ts
   - Vérifiez que AuthInterceptor est configuré
   - Vérifiez que HTTP_INTERCEPTORS est fourni

4. src/environments/environment.ts
   - Vérifiez que apiUrl pointe vers le bon endpoint
   - Vérifiez qu'il se termine par / (slash)

5. src/app/modules/community-forum/services/forum-extended.service.ts
   - Vérifie que getAuthHeaders() utilise le bon token
   - Vérifie que createPost() utilise getAuthHeaders()
*/

export {};
