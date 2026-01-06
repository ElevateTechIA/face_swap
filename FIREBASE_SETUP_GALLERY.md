# 🔥 Firebase Setup - Galería Pública

## 📋 Pasos a Seguir en Firebase Console

### 1. **Configurar Reglas de Seguridad de Firestore**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Firestore Database**
4. Haz click en la pestaña **Reglas (Rules)**
5. Copia y pega el contenido del archivo `firestore.rules` que está en la raíz del proyecto
6. Haz click en **Publicar (Publish)**

**IMPORTANTE:** Las reglas actuales permiten:
- ✅ **Lectura pública** de `publicGallery` (cualquiera puede ver la galería)
- ❌ **Escritura solo por servidor** (usuarios no pueden modificar directamente)
- ✅ Protección de datos sensibles (usuarios solo ven sus propios datos en otras colecciones)

### 2. **Verificar Colección `publicGallery`**

La colección `publicGallery` se creará **automáticamente** cuando un usuario publique su primera imagen. No necesitas crearla manualmente.

**Estructura de un documento en `publicGallery`:**
```javascript
{
  faceSwapId: "abc123",              // ID del face swap original
  userId: "user123",                  // ID del usuario (no expuesto en API pública)
  imageUrl: "https://...",            // URL de la imagen
  thumbnailUrl: "https://...",        // URL del thumbnail (opcional)
  displayName: "Anonymous",           // Nombre público del usuario
  caption: "Mi creación increíble",   // Caption opcional
  templateTitle: "Midnight Celebration", // Template usado
  style: "natural",                   // Estilo aplicado
  likes: 5,                           // Contador de likes
  views: 120,                         // Contador de vistas
  likedBy: ["anon_123", "user_456"],  // Array de IDs que dieron like
  isPublic: true,                     // Visibilidad
  isModerated: true,                  // Moderación manual
  isFeatured: false,                  // Destacado
  createdAt: Timestamp,               // Fecha de creación
  publishedAt: Timestamp,             // Fecha de publicación
  updatedAt: Timestamp                // Última actualización
}
```

### 3. **NO Necesitas Crear Índices Compuestos**

Nuestra implementación usa **filtrado y ordenamiento del lado del servidor** (en memoria), por lo que NO necesitas crear índices compuestos en Firestore. Esto simplifica la configuración.

Si Firestore te pide crear índices, **ignora ese mensaje** - nuestra app no los necesita.

### 4. **Configurar Storage (Opcional - Ya debería estar)**

Las imágenes se almacenan en Firebase Storage. Verifica que tengas las reglas de Storage configuradas:

1. Ve a **Storage** en Firebase Console
2. Haz click en la pestaña **Rules**
3. Asegúrate de tener algo como esto:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /face-swaps/{userId}/{allPaths=**} {
      allow read: if true;  // Público para todos
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Probar la Configuración

### Test 1: Publicar una Imagen
1. Crea un face swap en la app
2. En Step 5, activa el toggle "Public"
3. Agrega un caption opcional
4. Click en "Publish Now"
5. Ve a Firebase Console → Firestore → `publicGallery`
6. Deberías ver un nuevo documento

### Test 2: Ver la Galería
1. Navega a `/gallery` en tu app
2. Deberías ver la imagen publicada
3. Prueba los filtros: Recent, Trending, Popular, Featured

### Test 3: Sistema de Likes
1. Dale like a una imagen (corazón vacío → lleno)
2. Recarga la página
3. El like debería persistir
4. Intenta dar like de nuevo (debería quitar el like)

## ⚠️ Sobre los Errores de IndexedDB

Los errores que ves en consola:
```
Uncaught (in promise) Error: IndexedDB init error
```

**NO son de Firebase ni de tu app**. Son causados por:
- Extensiones de Chrome (AdBlock, etc.)
- Problemas de almacenamiento local del navegador
- Cache corrupto de Chrome

**Solución:**
1. Prueba en modo incógnito
2. O limpia el cache de Chrome
3. O desactiva extensiones temporalmente

Estos errores **NO afectan** la funcionalidad de la app.

## 📊 Monitoreo

Para ver la actividad de la galería:

1. **Firestore Console:**
   - Ve a `publicGallery` collection
   - Observa los documentos creados
   - Verifica los likes incrementándose

2. **Logs de Vercel:**
   - Ve a tu proyecto en Vercel
   - Navega a la pestaña "Logs"
   - Busca logs como:
     - `"🎨 GET /api/gallery/public - Request received"`
     - `"📊 Gallery query returned X items"`
     - `"👍 User X liked gallery item Y"`

## 🎯 Checklist de Configuración

- [ ] Reglas de Firestore publicadas
- [ ] Reglas de Storage configuradas
- [ ] Primera imagen publicada exitosamente
- [ ] Galería pública funcionando en `/gallery`
- [ ] Sistema de likes funcionando
- [ ] Filtros (Recent, Trending, etc.) funcionando

## 🚀 Próximos Pasos Opcionales

1. **Moderación Manual:**
   - Marca imágenes como `isFeatured: true` para destacarlas
   - Cambia `isModerated: false` para ocultar contenido inapropiado

2. **Analytics:**
   - Implementa contadores de vistas
   - Trackea qué templates son más populares

3. **Mejorar displayName:**
   - Actualmente dice "Anonymous" para todos
   - Puedes agregar campo `displayName` a user profiles

Si tienes algún problema, revisa los logs en Vercel Console.
