# Migración de Templates a Firebase

Esta guía explica cómo migrar los templates hardcodeados actuales a Firebase usando el sistema dinámico de templates.

## 🎯 Objetivo

Migrar los 6 templates actuales desde:
- **Código hardcodeado** en `app/page.tsx`
- **Imágenes locales** en `public/templates/`

Hacia:
- **Firestore** (metadata y configuración)
- **Firebase Storage** (imágenes)

## 📋 Pre-requisitos

1. **Firebase Admin SDK configurado**
   - Archivo `firebase-service-account.json` en la raíz del proyecto
   - Variables de entorno configuradas en `.env.local`

2. **Imágenes de templates disponibles**
   - Ubicadas en `public/templates/`
   - Nombres exactos:
     - `Midnight Celebration.jpg`
     - `The Champagne Toast.jpg`
     - `Red Velvet Euphoria.jpg`
     - `City Lights Glam.jpg`
     - `Confetti Party.jpg`
     - `Elegant Countdown.jpg`

3. **Acceso de admin configurado**
   - Email configurado en `ADMIN_EMAILS` en `.env.local`

## 🚀 Paso 1: Ejecutar el Script de Migración

```bash
npx tsx scripts/migrate-templates.ts
```

### ¿Qué hace el script?

Para cada template:

1. **Lee la imagen** desde `public/templates/`
2. **Genera un ID único** en Firestore
3. **Sube la imagen** a Firebase Storage en `templates/{id}.png`
4. **Crea el documento** en Firestore con:
   - Título y descripción
   - URL de la imagen en Storage
   - Prompt específico para Gemini
   - Metadata completa (bodyType, style, mood, occasion, etc.)
   - Configuración (isActive, isPremium, usageCount, etc.)

### Salida esperada:

```
🚀 Iniciando migración de templates a Firebase...

📁 Encontrados 6 archivos de imagen

📤 Procesando: Midnight Celebration
   ✅ Imagen subida: https://storage.googleapis.com/...
   ✅ Documento creado en Firestore: abc123

📤 Procesando: The Champagne Toast
   ✅ Imagen subida: https://storage.googleapis.com/...
   ✅ Documento creado en Firestore: def456

...

📊 Resumen de migración:
   ✅ Exitosos: 6
   ❌ Errores: 0
   📝 Total: 6

🎉 Migración completada! Los templates están ahora en Firebase.
```

## ✅ Paso 2: Verificar la Migración

### En Firebase Console

1. **Firestore Database**
   - Ve a la colección `templates`
   - Deberías ver 6 documentos
   - Verifica que cada uno tenga:
     - `title`, `description`, `imageUrl`
     - `metadata` con todos los campos
     - `isActive: true`
     - `usageCount: 0`

2. **Storage**
   - Ve a la carpeta `templates/`
   - Deberías ver 6 archivos `.png`
   - Verifica que sean públicamente accesibles

### En Admin Panel

1. Accede a `http://localhost:3000/admin`
2. Inicia sesión con tu email de admin
3. Deberías ver los 6 templates
4. Verifica que:
   - Las imágenes se muestren correctamente
   - La metadata esté completa
   - Puedas editar/eliminar templates

### En la App Principal

1. Accede a `http://localhost:3000`
2. Verifica que:
   - Los templates se carguen dinámicamente
   - Las categorías funcionen (Para Ti, Tendencias, Año Nuevo, Fiesta)
   - Las recomendaciones funcionen para usuarios autenticados

## 🔍 Paso 3: Probar el Sistema

### Test 1: Usuario Guest
```
1. Abre la app sin iniciar sesión
2. Ve a la pestaña "Tendencias"
3. Deberías ver los templates ordenados por popularidad
4. Selecciona un template
5. Sube tu foto
6. Genera el face swap (guest trial)
```

### Test 2: Usuario Nuevo (con perfil)
```
1. Inicia sesión por primera vez
2. Sube tu foto y selecciona un template
3. Durante la generación, responde el screener survey
4. El perfil se guarda en Firestore
5. Recarga la app
6. Ve a "Para Ti"
7. Deberías ver templates recomendados según tus preferencias
```

### Test 3: Filtros por Ocasión
```
1. Ve a la pestaña "Año Nuevo"
2. Deberías ver solo templates con occasion: 'new-year'
3. Ve a la pestaña "Fiesta"
4. Deberías ver templates con occasion: 'party'
```

### Test 4: Admin Panel
```
1. Accede a /admin
2. Crea un nuevo template con metadata personalizada
3. Marca como activo
4. Verifica que aparezca en la app principal
5. Edita el template (cambiar título, metadata, etc.)
6. Desactiva el template
7. Verifica que ya no aparezca en la app
```

## 📊 Estructura de Datos

### Firestore - Collection: `templates`

```typescript
{
  id: "abc123" (auto-generado),
  title: "Midnight Celebration",
  description: "Celebra el Año Nuevo con estilo...",
  imageUrl: "https://storage.googleapis.com/...",
  prompt: "Perform a precise face swap...",
  metadata: {
    bodyType: ["slim", "athletic", "average"],
    style: ["elegant", "party", "modern"],
    mood: ["happy", "confident", "energetic"],
    occasion: ["new-year", "party"],
    setting: ["indoor"],
    framing: "portrait",
    lighting: "dramatic",
    colorPalette: ["warm", "vibrant"],
    qualityScore: 90,
    tags: ["año nuevo", "fiesta", "elegante"]
  },
  isActive: true,
  isPremium: false,
  usageCount: 0,
  averageRating: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "migration-script"
}
```

### Firestore - Collection: `userProfiles`

```typescript
{
  userId: "user123",
  preferredBodyType: ["athletic", "slim"],
  preferredOccasions: ["new-year", "party"],
  preferredMood: ["happy", "energetic"],
  preferredStyle: ["modern", "party"],
  viewedTemplates: [],
  usedTemplates: [
    {
      templateId: "abc123",
      timestamp: "2025-01-15T..."
    }
  ],
  favoriteTemplates: [],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔧 Troubleshooting

### Error: "Directorio de templates no encontrado"
**Solución:** Verifica que existe la carpeta `public/templates/` con las imágenes.

### Error: "firebase-service-account.json not found"
**Solución:** Asegúrate de tener el archivo de service account en la raíz del proyecto.

### Error: "Permission denied to upload to Storage"
**Solución:** Verifica que el service account tenga permisos de Storage Admin.

### Templates no aparecen en la app
**Solución:**
1. Verifica en Firestore que `isActive: true`
2. Recarga la app (Ctrl+R)
3. Revisa la consola del navegador para errores
4. Verifica que las imágenes en Storage sean públicas

### Recomendaciones no funcionan
**Solución:**
1. Verifica que el usuario tenga perfil en `userProfiles`
2. Responde el screener survey durante un face swap
3. Revisa los logs en la consola del servidor

## 📝 Notas Importantes

1. **No elimines el código hardcodeado todavía**
   - El sistema usa fallback automático
   - Si Firebase falla, usa los templates hardcodeados
   - Esto asegura zero downtime

2. **Metadata es crucial**
   - Las recomendaciones dependen de metadata precisa
   - Revisa y ajusta según sea necesario desde el Admin Panel

3. **Prompts personalizados**
   - Cada template tiene su propio prompt optimizado
   - Puedes editarlos desde el Admin Panel

4. **Quality Score**
   - Empieza en valores asignados (85-95)
   - Puede actualizarse manualmente basándose en feedback

## 🎉 Próximos Pasos

Una vez completada la migración:

1. **Monitorear uso**
   - Los `usageCount` se incrementan automáticamente
   - Revisa cuáles son más populares

2. **Añadir más templates**
   - Usa el Admin Panel
   - Asigna metadata apropiada
   - Prueba con diferentes usuarios

3. **Optimizar recomendaciones**
   - Ajusta los pesos en `RECOMMENDATION_WEIGHTS`
   - Analiza qué templates tienen mejor engagement

4. **Crear templates premium**
   - Marca `isPremium: true`
   - Implementa lógica de pago (si aplica)

5. **A/B Testing**
   - Prueba diferentes prompts
   - Compara quality scores
   - Optimiza conversión
