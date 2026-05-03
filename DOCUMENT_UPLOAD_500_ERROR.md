# Error 500 en Document Upload - Diagnóstico y Soluciones

## ❌ Problema Reportado

**Error:** `Http failure response: 500 OK`  
**Ruta:** `POST http://localhost:8089/MediCareAI/api/collaboration/documents/sessions/18`  
**Fichero:** `téléchargement.png`  
**Session ID:** 18

---

## 📊 Información del Lado del Cliente

### Frontend está correcto ✅
- ✅ FormData construido correctamente
- ✅ Fichero adjuntado con clave `file`
- ✅ Authorization header presente (`Bearer ${token}`)
- ✅ NO se establece Content-Type manualmente (correcto para FormData)
- ✅ Descripción enviada correctamente (si se proporciona)

### Detalles capturados en logs:
```
sessionId: 18
fileName: téléchargement.png
fileSize: [número de bytes]
fileType: image/png (o el tipo del fichero)
URL enviada: http://localhost:8089/MediCareAI/api/collaboration/documents/sessions/18
```

---

## 🔍 Posibles Causas del Error 500 del Backend

### 1. **Problema con el manejo de FormData en el backend**
   - El backend podría no estar configurado para procesar `multipart/form-data`
   - Falta de dependencias como Apache Commons FileUpload
   - Configuración incorrecta de parseo de multipart

### 2. **Validación fallida de datos**
   ```java
   // Posibles validaciones que podrían fallar:
   if (!isValidFileType(file.getContentType())) { // ❌ Podría fallar con image/png
       throw new InvalidFileTypeException();
   }
   ```

### 3. **Problemas de permisos/autorización en BD**
   - El usuario (identificado por token) no tiene permisos para crear documentos
   - La sesión ID 18 no existe o no pertenece al usuario
   - El usuario no es miembro de la sesión

### 4. **Almacenamiento de ficheros**
   - Directorio de almacenamiento no existe
   - Permisos insuficientes para escribir archivos
   - Disco lleno
   - Ruta configurada incorrectamente

### 5. **Problemas de base de datos**
   - Conexión a BD fallida
   - Tabla `documents` no existe o estructura incorrecta
   - Restricciones de integridad referencial (FK a session_id)
   - Deadlock en la BD

### 6. **Validación del nombre de fichero**
   - El nombre "téléchargement.png" contiene caracteres especiales
   - Backend rechaza nombres no ASCII
   - Existe restricción de caracteres permitidos

---

## 🛠️ Soluciones para el Lado del Frontend

### Mejoras implementadas ✅

#### 1. Validación en Cliente ANTES de enviar
```typescript
// Validar tamaño (max 50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;
if (file.size > MAX_FILE_SIZE) {
  this.errorMessage = 'El fichero dépasse la taille maximale de 50MB';
  return;
}

// Validar tipo de fichero
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 
  'application/pdf', 
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
if (!ALLOWED_TYPES.includes(file.type)) {
  this.errorMessage = `Type de fichier non autorisé: ${file.type}`;
  return;
}
```

#### 2. Logging mejorado de detalles de fichero
```typescript
console.log('[CollaborationService] Preparing upload with details:', {
  sessionId,
  fileName: file.name,
  fileSize: file.size,
  fileType: file.type,
  hasDescription: !!description,
  descriptionLength: description?.length || 0
});
```

#### 3. Mejor manejo de errores HTTP
```typescript
if (error?.status === 500) {
  errorMsg = 'Erreur serveur (500). Le backend a rencontré un problème.';
} else if (error?.status === 400) {
  errorMsg = 'Requête invalide: ' + (error?.error?.message || '...');
} else if (error?.status === 403) {
  errorMsg = 'Vous n\'avez pas la permission de télécharger dans cette session.';
}
```

---

## 🔧 Checklist para el Backend

Para resolver el error 500, el equipo de backend debe verificar:

- [ ] **Endpoint existe:** POST `/api/collaboration/documents/sessions/{sessionId}`
- [ ] **Formato multipart/form-data:** Backend acepta FormData con campos:
  - [ ] `file` (required) - El fichero
  - [ ] `description` (optional) - La descripción
- [ ] **Autenticación:** Token Bearer validado correctamente
- [ ] **Autorización:** Usuario es miembro de la sesión
- [ ] **Validación de sesión:** Session ID 18 existe y está activa
- [ ] **Almacenamiento:** Directorio de almacenamiento accesible y tiene permisos de escritura
- [ ] **BD:** Tabla `documents` existe con estructura correcta:
  ```sql
  CREATE TABLE documents (
    id BIGINT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by BIGINT,
    uploaded_at TIMESTAMP,
    description TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );
  ```
- [ ] **Logs del servidor:** Revisar logs en `/MediCareAI/` para más detalles
- [ ] **Manejo de nombres UTF-8:** Backend maneja correctamente "téléchargement.png"
- [ ] **Límite de ficheros:** Política de máximo tamaño de fichero (50MB recomendado)

---

## 📋 Cómo Diagnosticar

### Paso 1: Capturar logs completos
En la consola del navegador, verá logs como:
```
[CollaborationService] Preparing upload with details: {
  sessionId: 18,
  fileName: "téléchargement.png",
  fileSize: 2048000,
  fileType: "image/png",
  hasDescription: false
}
[CollaborationService] Upload URL: http://localhost:8089/MediCareAI/api/collaboration/documents/sessions/18
```

### Paso 2: Revisar logs del backend
En `tomcat/logs/` o similar, buscar:
```
ERROR - POST /MediCareAI/api/collaboration/documents/sessions/18
java.lang.NullPointerException: ...
java.io.IOException: ...
org.springframework.web.multipart.MultipartException: ...
```

### Paso 3: Usar herramienta como Postman
```bash
# Test manual del endpoint
POST http://localhost:8089/MediCareAI/api/collaboration/documents/sessions/18
Authorization: Bearer [tu_token]
Content-Type: multipart/form-data

file: [fichero]
description: [opcional]
```

---

## 💡 Recomendaciones

### Frontend
- ✅ **HECHO:** Validación de ficheros antes de enviar
- ✅ **HECHO:** Logging detallado de detalles de fichero
- ✅ **HECHO:** Mejor manejo de errores HTTP con mensajes específicos
- 📌 **TODO:** Mostrar barra de progreso durante upload
- 📌 **TODO:** Permitir cancelación de upload en progreso

### Backend
- ⚠️ **CRÍTICO:** Verificar que el endpoint está correctamente implementado
- ⚠️ **CRÍTICO:** Revisar logs para encontrar la causa exacta del error 500
- 📌 **IMPORTANTE:** Validar que el usuario tiene permisos en la sesión
- 📌 **IMPORTANTE:** Agregar manejo de excepciones con mensajes descriptivos
- 📌 **IMPORTANTE:** Retornar errores 400 (no 500) para validaciones fallidas

---

## 🧪 Prueba de Validación

Ahora el frontend validará estos casos ANTES de enviar al servidor:

```javascript
// ❌ Será rechazado por el cliente
- Fichero > 50MB → Mensaje: "Fichero demasiado grande"
- Tipo no permitido (ej: .exe) → Mensaje: "Tipo no autorizado"
- Fichero vacío → Mensaje: "Selecciona un fichero"
- Sin sesión válida → Mensaje: "Sesión inválida"

// ✅ Será enviado al servidor
- PNG 2MB → Será enviado ✓
- PDF 10MB → Será enviado ✓
- DOCX 5MB → Será enviado ✓
```

---

## 📞 Próximos Pasos

1. **Ejecutar el test en Postman** para confirmar que es un problema del backend
2. **Revisar logs del servidor** para encontrar la excepción exacta
3. **Verificar la conexión a BD** - ¿La tabla `documents` existe?
4. **Confirmar permisos** - ¿El usuario tiene permiso en la sesión 18?
5. **Probar con un fichero pequeño** - ¿Es un problema de tamaño?
6. **Probar con un nombre ASCII** - ¿Es un problema de caracteres UTF-8?

---

**Última actualización:** Abril 2026  
**Versión:** 1.0
