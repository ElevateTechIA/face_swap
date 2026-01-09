# 📋 Sistema Dinámico de Screener Survey

## 🎯 Descripción

Sistema de encuestas dinámicas que aparecen durante la generación de Face Swaps para recopilar preferencias del usuario. Las preguntas se gestionan desde un panel de administración y se adaptan automáticamente según las respuestas previas del usuario.

## ✨ Características

- ✅ Preguntas completamente dinámicas (creadas desde admin)
- ✅ Tracking automático de preguntas respondidas por usuario
- ✅ Muestra 3 preguntas aleatorias no respondidas cada vez
- ✅ Multi-idioma (i18n con next-intl)
- ✅ Soporte para usuarios autenticados y guests
- ✅ Actualización automática de preferencias para recomendaciones

## 📁 Estructura

```
/types/template.ts
  - ScreenerQuestion (interface)
  - UserProfile (con answeredQuestions[])

/app/api/screener-questions/route.ts
  - GET: Obtener preguntas no respondidas
  - POST: Crear nueva pregunta (admin)

/app/api/user/screener-answers/route.ts
  - POST: Guardar respuestas del usuario

/app/components/DynamicScreenerSurvey.tsx
  - Componente del survey dinámico

/app/[locale]/admin/screener-questions/page.tsx
  - Panel de administración

/scripts/seed-screener-questions.ts
  - Script para crear preguntas iniciales
```

## 🚀 Instalación y Configuración

### 1. Crear Preguntas Iniciales

Ejecuta el script de seed para poblar las 4 preguntas base:

```bash
npx tsx scripts/seed-screener-questions.ts
```

Esto creará en Firestore (colección `screenerQuestions`):
- bodyType
- occasions
- mood
- stylePreference

### 2. Configurar Traducciones

Las traducciones ya están configuradas en:
- `messages/es.json` → `survey.screener.questions.{questionKey}`
- `messages/en.json` → `survey.screener.questions.{questionKey}`

Estructura de traducción:
```json
{
  "survey": {
    "screener": {
      "questions": {
        "bodyType": {
          "label": "¿Qué tipo de cuerpo prefieres?",
          "options": {
            "slim": "Delgado",
            "athletic": "Atlético"
          }
        }
      }
    }
  }
}
```

### 3. Verificar Integración

El componente ya está integrado en `app/[locale]/page.tsx`:

```typescript
{showScreenerSurvey && (
  <DynamicScreenerSurvey
    onComplete={handleScreenerComplete}
    isGuest={isGuestMode}
  />
)}
```

## 🎨 Uso del Panel de Admin

### Acceder al Panel

```
https://tu-app.com/es/admin/screener-questions
```

### Crear Nueva Pregunta

1. Click en "Nueva Pregunta"
2. Completar campos:
   - **Translation Key**: `survey.screener.questions.newQuestion`
   - **Opciones**: `option1, option2, option3` (separadas por coma)
   - **Categoría**: preferences | style | occasions | mood
   - **Tipo**: Multi-select o Single-select

3. Agregar traducciones en `messages/es.json`:
```json
{
  "survey": {
    "screener": {
      "questions": {
        "newQuestion": {
          "label": "Tu pregunta aquí",
          "options": {
            "option1": "Opción 1",
            "option2": "Opción 2"
          }
        }
      }
    }
  }
}
```

## 🔄 Flujo del Sistema

### Para Usuarios Autenticados

1. Usuario inicia Face Swap
2. Si no tiene perfil completo → `showScreenerSurvey = true`
3. Se cargan 3 preguntas no respondidas desde `/api/screener-questions?limit=3`
4. Usuario responde las preguntas
5. Respuestas se guardan en `/api/user/screener-answers`
6. Se actualiza `userProfile.answeredQuestions[]`
7. Se actualiza `userProfile.preferred*` para recomendaciones
8. Survey se cierra y continúa el Face Swap

### Para Usuarios Guest

1. Usuario inicia Face Swap (guest trial)
2. Se muestran 3 preguntas aleatorias
3. Respuestas se guardan en `localStorage`
4. No se envían al servidor
5. Survey se cierra y continúa el Face Swap

## 📊 Base de Datos

### Colección: `screenerQuestions`

```typescript
{
  id: string,
  questionKey: string,              // "survey.screener.questions.bodyType"
  isActive: boolean,                // Si la pregunta está activa
  order: number,                    // Orden de prioridad
  multiSelect: boolean,             // Permite múltiples respuestas
  category: string,                 // "preferences" | "style" | "occasions" | "mood"
  options: string[],                // ["slim", "athletic", "curvy"]
  targetGender?: string[],          // Opcional: ["male", "female"]
  minUsageCount?: number,           // Opcional: Mostrar después de N usos
  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

### Colección: `userProfiles`

```typescript
{
  userId: string,
  answeredQuestions: string[],      // IDs de preguntas ya respondidas
  preferredBodyType: string[],      // Actualizado desde respuestas
  preferredOccasions: string[],
  preferredMood: string[],
  preferredStyle: string[],
  viewedTemplates: string[],
  usedTemplates: array,
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Sistema de Recomendaciones

Las respuestas del screener alimentan el motor de recomendaciones:

1. **Respuestas → Preferencias**: Las respuestas se mapean a campos del perfil
   - `bodyType` → `preferredBodyType[]`
   - `occasions` → `preferredOccasions[]`
   - etc.

2. **Preferencias → Templates**: El recommendation engine usa estas preferencias para:
   - Ordenar templates por relevancia
   - Filtrar templates en el modo "For You"
   - Personalizar sugerencias

3. **Mejora Continua**: Cada nueva pregunta respondida refina las recomendaciones

## 🔧 API Endpoints

### `GET /api/screener-questions`

Obtiene preguntas activas no respondidas por el usuario.

**Query Params:**
- `limit`: Número de preguntas (default: 3)
- `includeAnswered`: Incluir respondidas (solo admin)

**Response:**
```json
{
  "questions": [...],
  "totalAvailable": 10,
  "answeredCount": 4,
  "hasMore": true
}
```

### `POST /api/screener-questions`

Crea una nueva pregunta (requiere autenticación).

**Body:**
```json
{
  "questionKey": "survey.screener.questions.newQuestion",
  "multiSelect": true,
  "category": "preferences",
  "options": ["option1", "option2"]
}
```

### `POST /api/user/screener-answers`

Guarda las respuestas del usuario (requiere autenticación).

**Body:**
```json
{
  "answers": {
    "survey.screener.questions.bodyType": ["athletic", "slim"],
    "survey.screener.questions.mood": ["happy", "confident"]
  }
}
```

## 💡 Mejores Prácticas

### Crear Preguntas Efectivas

1. **Título Claro**: Usa translation keys descriptivas
2. **Opciones Concretas**: 3-8 opciones por pregunta
3. **Categorías Relevantes**: Agrupa preguntas similares
4. **Multi-select**: Usa para preferencias, single para demográficos

### Gestionar Traducciones

1. Siempre agrega traducciones en ES e EN
2. Usa keys consistentes: `survey.screener.questions.{key}`
3. Mantén opciones cortas y claras

### Optimizar Performance

1. Limita preguntas activas a lo necesario
2. Usa `order` para priorizar preguntas importantes
3. Desactiva preguntas obsoletas en lugar de eliminarlas

## 🐛 Debugging

### Ver Preguntas en Consola

```javascript
// En el navegador
fetch('/api/screener-questions?limit=10')
  .then(r => r.json())
  .then(console.log)
```

### Verificar Respuestas Guardadas

```javascript
// Verificar localStorage (guest)
JSON.parse(localStorage.getItem('guestScreenerAnswers'))

// Verificar Firestore (authenticated)
// Ir a Firebase Console → userProfiles → {userId} → answeredQuestions
```

### Resetear Preguntas para Testing

```javascript
// Guest
localStorage.removeItem('guestScreenerAnswers')

// Authenticated: eliminar campo answeredQuestions del userProfile en Firestore
```

## 📈 Métricas Sugeridas

Considera trackear:
- Tasa de completación del survey
- Preguntas más/menos respondidas
- Tiempo promedio de respuesta
- Correlación respuestas → uso de templates

## 🚀 Próximos Pasos

Ideas para expandir el sistema:

1. **A/B Testing**: Probar diferentes versiones de preguntas
2. **Conditional Logic**: Mostrar preguntas basadas en respuestas previas
3. **Analytics Dashboard**: Ver estadísticas de respuestas
4. **Question Pools**: Diferentes sets de preguntas por segmento
5. **Gamification**: Rewards por completar surveys

---

## 📞 Soporte

Si encuentras problemas:
1. Verifica logs del servidor
2. Revisa Firebase Console para datos
3. Confirma traducciones en messages/*.json
4. Verifica permisos de Firestore
