# AI Auto-Fill - Análisis Automático de Templates con Gemini

## Descripción

Esta funcionalidad utiliza **Gemini AI** (Google's Generative AI) para analizar automáticamente las imágenes de templates y llenar todos los campos del formulario de admin sin necesidad de hacerlo manualmente.

## Cómo Funciona

### 1. **Flujo del Usuario**

1. Admin sube una imagen del template
2. Aparece botón "🤖 Analizar" con IA
3. Hace clic en el botón
4. La IA analiza la imagen (tarda ~3-10 segundos)
5. Todos los campos se llenan automáticamente
6. Admin revisa y ajusta si es necesario
7. Guarda el template

### 2. **Arquitectura**

```
TemplateForm.tsx
    ↓ (click "Analizar")
    ↓
POST /api/admin/analyze-template
    ↓
Gemini 2.0 Flash Exp API
    ↓ (image analysis)
    ↓
JSON Response con metadata
    ↓
Populate form fields
```

## Campos que se Llenan Automáticamente

La IA extrae y llena los siguientes campos:

### Campos Básicos:
- **Title** - Título corto y descriptivo (máx 50 caracteres)
- **Description** - Descripción detallada de la escena (máx 150 caracteres)
- **Prompt** - Instrucciones técnicas detalladas para Gemini sobre cómo realizar el face swap, qué mantener y qué reemplazar

### Metadata Arrays:
- **bodyType** - Tipos de cuerpo que se verían bien
  - `athletic`, `slim`, `curvy`, `plus-size`, `average`

- **style** - Estilos que representa la imagen
  - `elegant`, `casual`, `professional`, `party`, `romantic`, `edgy`, `vintage`, `modern`

- **mood** - Estados de ánimo de la imagen
  - `happy`, `confident`, `relaxed`, `energetic`, `mysterious`, `playful`

- **occasion** - Ocasiones apropiadas
  - `new-year`, `birthday`, `wedding`, `casual`, `professional`, `date`, `party`

- **colorPalette** - Paletas de color presentes
  - `warm`, `cool`, `neutral`, `vibrant`, `pastel`

- **setting** - Ambientes
  - `indoor`, `outdoor`, `studio`

### Metadata Single Values:
- **framing** - Tipo de encuadre
  - `close-up`, `medium`, `full-body`, `portrait`

- **lighting** - Tipo de iluminación
  - `natural`, `studio`, `dramatic`, `soft`, `neon`

## Prompt de la IA

El prompt enviado a Gemini está diseñado para extraer información precisa:

```
Analiza esta imagen de template para Face Swap y extrae la siguiente información en formato JSON:

{
  "title": "Un título corto y descriptivo (máx 50 caracteres)",
  "description": "Descripción detallada de la escena (máx 150 caracteres)",
  "bodyType": [...], // Array de tipos de cuerpo que se verían bien
  "style": [...],    // Array de estilos que representa
  "mood": [...],     // Array de moods de la imagen
  // ... etc
}

Analiza cuidadosamente:
- Los colores predominantes
- La iluminación y atmósfera
- El tipo de ropa y estilo
- La ocasión o evento que representa
- El mood general de la imagen
- El tipo de cuerpo que se vería mejor en esta escena
- El encuadre (si es close-up, cuerpo completo, etc)

Responde SOLO con el JSON válido, sin explicaciones adicionales.
```

## Implementación Técnica

### API Endpoint: `/api/admin/analyze-template`

**Archivo**: `app/api/admin/analyze-template/route.ts`

**Request:**
```typescript
POST /api/admin/analyze-template
Headers: {
  Authorization: Bearer <firebase-token>
  Content-Type: application/json
}
Body: {
  imageData: "data:image/jpeg;base64,..." // Base64 image
}
```

**Response:**
```typescript
{
  success: true,
  analysis: {
    title: "Elegant Evening Gown",
    description: "A stunning red evening gown with dramatic lighting",
    bodyType: ["slim", "athletic"],
    style: ["elegant", "romantic"],
    mood: ["confident", "mysterious"],
    occasion: ["wedding", "party", "date"],
    framing: "portrait",
    lighting: "dramatic",
    colorPalette: ["warm", "vibrant"],
    setting: ["studio"]
  }
}
```

### Frontend Integration

**Archivo**: `app/components/TemplateForm.tsx`

**State:**
```typescript
const [aiAnalyzing, setAiAnalyzing] = useState(false);
```

**Function:**
```typescript
const analyzeWithAI = async () => {
  if (!imageData) return;

  setAiAnalyzing(true);
  try {
    const response = await fetch('/api/admin/analyze-template', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    const { analysis } = await response.json();

    // Populate all form fields
    setTitle(analysis.title);
    setDescription(analysis.description);
    setBodyType(analysis.bodyType);
    // ... etc

    alert('✅ Análisis completado!');
  } catch (error) {
    alert('Error al analizar imagen');
  } finally {
    setAiAnalyzing(false);
  }
};
```

**UI Button:**
```tsx
{imageData && (
  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
    <button onClick={analyzeWithAI} disabled={aiAnalyzing}>
      {aiAnalyzing ? 'Analizando...' : '🤖 Analizar'}
    </button>
  </div>
)}
```

## Seguridad

### Autenticación:
- Solo admins autenticados pueden usar este endpoint
- Usa `verifyAdminAuth()` middleware
- Requiere Firebase token válido

### Validación:
- Verifica que `imageData` esté presente
- Verifica que `GEMINI_API_KEY` esté configurada
- Valida que la respuesta sea JSON válido

## Configuración

### Variables de Entorno Requeridas:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### Vercel Configuration:

```json
{
  "functions": {
    "app/api/admin/analyze-template/route.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

## Ventajas

✅ **Ahorra tiempo** - No necesitas llenar manualmente 15+ campos
✅ **Consistencia** - La IA analiza objetivamente siguiendo los mismos criterios
✅ **Precisión** - Gemini 1.5 Flash es muy bueno analizando imágenes
✅ **Editable** - Puedes revisar y ajustar cualquier campo después del análisis
✅ **Rápido** - Análisis completo en ~3-10 segundos

## Limitaciones

⚠️ **No analiza el prompt** - El prompt de Gemini para face swap debe llenarse manualmente
⚠️ **Puede equivocarse** - La IA puede interpretar incorrectamente algunas características
⚠️ **Requiere revisión** - Siempre revisa los campos generados antes de guardar
⚠️ **Costo de API** - Cada análisis consume tokens de Gemini API

## Mejores Prácticas

### Para mejores resultados:

1. **Usa imágenes claras** - Mayor calidad = mejor análisis
2. **Evita imágenes ambiguas** - Templates con estilo/mood claros funcionan mejor
3. **Revisa siempre** - No confíes ciegamente en la IA
4. **Ajusta según necesites** - La IA es un punto de partida, no la palabra final

### Casos donde funciona muy bien:
- Templates con estilos claramente definidos
- Imágenes bien iluminadas
- Ocasiones obvias (vestido de novia → wedding)
- Colores predominantes claros

### Casos donde puede fallar:
- Imágenes muy oscuras o con poca luz
- Estilos híbridos (mezcla de casual + elegant)
- Ocasiones ambiguas
- Body types no claramente visibles

## Troubleshooting

### "Error al analizar imagen"

**Posibles causas:**
- API key de Gemini no configurada
- Imagen demasiado grande (comprime primero)
- Límite de rate limit alcanzado
- Respuesta de IA no es JSON válido

**Solución:**
1. Verifica que `GEMINI_API_KEY` esté en `.env`
2. Intenta con imagen más pequeña
3. Espera unos segundos y vuelve a intentar
4. Revisa logs del servidor para más detalles

### "La IA puso valores incorrectos"

**Solución:**
- Simplemente edita los campos manualmente
- El análisis es un punto de partida, no definitivo
- Reporta casos muy incorrectos para mejorar el prompt

### "Tarda mucho en analizar"

**Posible causa:**
- Imagen muy grande
- API de Gemini lenta en ese momento

**Solución:**
- Usa imágenes de ~1080px de ancho
- Espera hasta 30 segundos (límite configurado)

## Ejemplos de Uso

### Ejemplo 1: Vestido de Noche

**Imagen**: Mujer con vestido rojo elegante

**Análisis AI:**
```json
{
  "title": "Elegant Red Evening Gown",
  "description": "A stunning red evening gown with dramatic lighting and elegant pose",
  "bodyType": ["slim", "athletic", "curvy"],
  "style": ["elegant", "romantic"],
  "mood": ["confident", "mysterious"],
  "occasion": ["wedding", "party", "date"],
  "framing": "portrait",
  "lighting": "dramatic",
  "colorPalette": ["warm", "vibrant"],
  "setting": ["studio"]
}
```

### Ejemplo 2: Casual Street Style

**Imagen**: Persona con jeans y camiseta en la calle

**Análisis AI:**
```json
{
  "title": "Urban Casual Street Style",
  "description": "Relaxed street style with denim and casual top in natural lighting",
  "bodyType": ["slim", "average", "athletic"],
  "style": ["casual", "modern"],
  "mood": ["relaxed", "confident"],
  "occasion": ["casual"],
  "framing": "full-body",
  "lighting": "natural",
  "colorPalette": ["neutral", "cool"],
  "setting": ["outdoor"]
}
```

## Roadmap / Mejoras Futuras

### Posibles mejoras:

1. **Auto-generar prompt de face swap** - Usar IA también para sugerir el prompt de Gemini
2. **Múltiples sugerencias** - Generar 2-3 opciones y dejar que admin elija
3. **Aprendizaje** - Guardar correcciones manuales para mejorar el modelo
4. **Análisis de variantes** - Analizar también las variantes y sugerir títulos
5. **Batch processing** - Analizar múltiples templates a la vez
6. **Preview antes de aplicar** - Mostrar análisis y confirmar antes de llenar campos

## Archivos Relacionados

- [analyze-template/route.ts](../app/api/admin/analyze-template/route.ts) - API endpoint
- [TemplateForm.tsx](../app/components/TemplateForm.tsx) - Integración en formulario
- [vercel.json](../vercel.json) - Configuración de función
- [template.ts](../types/template.ts) - Tipos de TypeScript

## Créditos

- **Modelo**: Gemini 1.5 Flash (Google)
- **Provider**: Google Generative AI API
- **Framework**: Next.js 15 + TypeScript
