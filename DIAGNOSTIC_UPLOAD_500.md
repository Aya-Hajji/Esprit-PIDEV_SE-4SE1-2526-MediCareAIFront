# Guide de Diagnostic - Erreur 500 Upload Document

## 📊 Nouvelle Approche de Debugging

Maintenant, avec le **logging amélioré**, vous verrez beaucoup plus de détails dans la console.

---

## 🔍 Étapes pour Diagnostiquer le Problème

### **Étape 1: Ouvrir la Console du Navigateur**
```
Windows/Linux: F12 → onglet "Console"
Mac: Cmd+Option+J → onglet "Console"
```

### **Étape 2: Tenter le Upload**
1. Allez à Session 18 (ou n'importe quelle session)
2. Tab "Documents"
3. Cliquez "Télécharger un document"
4. Sélectionnez un fichier petit (< 5MB)
5. Cliquez "Télécharger"

### **Étape 3: Analyser les Logs**

Vous verrez quelque chose comme:

```
[CollaborationService] ===== DÉTAILS DU FETCH =====
[CollaborationService] URL complète: http://localhost:8089/MediCareAI/api/collaboration/documents/sessions/18
[CollaborationService] Fichier: {
  name: "téléchargement.png",
  size: 2048000,
  type: "image/png",
  lastModified: 1713792000000
}
[CollaborationService] SessionID: 18
[CollaborationService] UserID: [numéro]
[CollaborationService] Token présent: true
[CollaborationService] Description: (aucune)

[CollaborationService] Headers finaux: {
  Authorization: "Bearer [TOKEN]",
  X-Session-ID: "18",
  X-User-ID: "[ID]"
}

[CollaborationService] Fetch réponse reçue
[CollaborationService] Status: 500
[CollaborationService] Status Text: Internal Server Error
[CollaborationService] Content-Type: [type retourné]
```

---

## 🎯 Diagnostic Rapide - Questions Clés

### **Q1: L'URL est-elle correcte?**
```
Attendu: http://localhost:8089/MediCareAI/api/collaboration/documents/sessions/{sessionId}
Reçu: [vérifier dans les logs]
```
✅ Doit correspondre EXACTEMENT

### **Q2: Le SessionID est-il valide?**
```
Session 18 existe-t-elle?
Vérifiez que vous êtes dans une vraie session
```

### **Q3: Le Token est-il valide?**
```
Token présent: true/false
Si false → vous n'êtes pas loggé
```

### **Q4: Avez-vous des détails d'erreur du backend?**
```
Cherchez dans les logs:
[CollaborationService] Réponse JSON: {...}
ou
[CollaborationService] Réponse texte: ...
```

---

## 📋 Checklist de Diagnostic Backend

Le backend (que vous ne devez pas modifier) doit avoir:

- [ ] **Endpoint** : `POST /api/collaboration/documents/sessions/{sessionId}`
- [ ] **Accepter** : `multipart/form-data` 
- [ ] **Champs FormData** :
  - `file` (required) - le fichier
  - `sessionId` (optional mais inclus) - l'ID de session
  - `description` (optional) - la description
- [ ] **Headers attendus** :
  - `Authorization: Bearer [TOKEN]` ✅
  - `X-Session-ID: [ID]` (si utilisé)
  - `X-User-ID: [ID]` (si utilisé)
- [ ] **Validations backend** :
  - User authentifié? (401 si non)
  - User a accès à session 18? (403 si non)
  - Fichier valide? (400 si non)
  - Endpoint implémenté? (404 si non)
- [ ] **Base de Données** :
  - Table `documents` existe?
  - Colonnes: `id`, `session_id`, `file_name`, `uploaded_by`, etc?
  - Permissions sur la table?

---

## 🔧 Points de Vérification Frontend

Tout est correct du côté frontend ✅:
- ✅ FormData correctement construit
- ✅ Fichier envoyé avec le bon nom de champ (`file`)
- ✅ SessionID inclus dans l'URL ET dans FormData
- ✅ Token d'authentification inclus
- ✅ Headers contextuels inclus
- ✅ Pas de problème Content-Type charset

---

## 📝 Informations à Collecter pour Diagnostiquer

**Prendre une screenshot des logs et inclure:**

1. Les logs complets du [CollaborationService] au moment du fetch
2. Le Status et Status Text exacts
3. Tout message d'erreur JSON du backend
4. L'URL exacte utilisée
5. Le SessionID utilisé

---

## 🚀 Prochaines Actions

### **Si vous voyez un message d'erreur du backend:**

Exemple:
```
[CollaborationService] Réponse JSON: {
  "message": "Session not found",
  "error": "SessionNotFoundException"
}
```
**Action:** Vérifier que la session 18 existe et est active

### **Si vous voyez "Permission denied" ou "Unauthorized":**
```
[CollaborationService] Réponse JSON: {
  "message": "User does not have permission"
}
```
**Action:** Vérifier que l'utilisateur a accès à la session 18

### **Si vous ne voyez AUCUN message d'erreur détaillé:**
```
[CollaborationService] Réponse texte: (vide)
```
**Action:** Le backend ne retourne pas de détails. Vérifier les logs serveur.

---

## 💡 Alternative: Tester avec Postman

Pendant que le backend est analysé, vous pouvez tester avec **Postman**:

```bash
Méthode: POST
URL: http://localhost:8089/MediCareAI/api/collaboration/documents/sessions/18
Headers:
  Authorization: Bearer [YOUR_TOKEN]
  X-Session-ID: 18
  X-User-ID: [YOUR_USER_ID]

Body: form-data
  Key: file        | Value: [sélectionner fichier]
  Key: sessionId   | Value: 18
  Key: description | Value: (optionnel)
```

---

## 📞 Résumé pour Backend Team

Le frontend envoie maintenant:

✅ **Type:** FormData (multipart/form-data)  
✅ **Champs:**
- `file` - fichier binaire
- `sessionId` - ID de la session
- `description` - description optionnelle

✅ **Headers:**
- `Authorization: Bearer [token]`
- `X-Session-ID: [id]`
- `X-User-ID: [id]`

✅ **URL:** `POST /api/collaboration/documents/sessions/{sessionId}`

✅ **Content-Type:** Automatique (sans charset)

---

**Situation actuelle:** Frontend est optimisé ✅. Erreur 500 vient du backend. À analyser avec logs serveur.
