# Image Compression - Solución al Error 413

## Problema

Cuando intentas subir templates con variantes en el panel de admin, recibes el error:
```
PUT /api/admin/templates 413 (Content Too Large)
```

Este error ocurre porque:
- Vercel tiene un límite de **4.5MB** para el payload de requests
- Las imágenes en base64 pesan ~33% más que el binario original
- Al subir imagen principal + 3 variantes, fácilmente se supera el límite

## Solución Implementada

### 1. **Compresión automática de imágenes en el cliente**

Todas las imágenes se comprimen automáticamente antes de enviarlas al servidor:

- **Imagen principal**: Máximo 800KB
- **Variantes**: Máximo 600KB cada una
- **Límite total del payload**: 4MB

#### Características de la compresión:

✅ **Redimensionamiento inteligente**
- Si la imagen es mayor a 1080px de ancho, se redimensiona manteniendo aspect ratio
- Calidad optimizada para Face Swap (85% inicial, ajustable)

✅ **Compresión iterativa**
- Si la imagen excede el tamaño máximo, reduce calidad automáticamente
- Se detiene cuando alcanza el tamaño deseado o calidad mínima (30%)

✅ **Formato optimizado**
- Convierte a JPEG para mejor compresión
- Mantiene calidad visual aceptable

### 2. **Validación de tamaño**

Antes de enviar al servidor, valida que el payload no exceda 4MB:

```typescript
const validation = validatePayloadSize(imageData, variants);
if (!validation.valid) {
  alert(`Error: El tamaño total (${validation.sizeKB}KB) excede el límite`);
}
```

### 3. **Indicador de progreso**

El formulario muestra en tiempo real:
- "Comprimiendo imagen principal..."
- "Comprimiendo 3 variantes..."
- "Subiendo al servidor..."

### 4. **Configuración de Vercel**

El archivo `vercel.json` configura:
- `maxDuration: 60` segundos para procesar
- `memory: 1024` MB para funciones serverless

## Uso

### Para usuarios del panel de admin:

1. **Sube imágenes normalmente** - La compresión es automática
2. **Espera el indicador** - Verás el progreso de compresión
3. **Revisa la consola** - Para ver detalles técnicos

### Logs en consola:

```
🔄 Comprimiendo imagen principal...
📊 Compresión: quality=0.85, size=650KB
✅ Imagen comprimida: 1080x1620, 645KB

🔄 Comprimiendo 3 variantes...
📊 Compresión: quality=0.85, size=480KB
📊 Compresión: quality=0.75, size=520KB
📊 Compresión: quality=0.85, size=495KB
✅ 3 imágenes comprimidas. Tamaño total: 1495KB

📦 Payload size: 2140KB / 4000KB
```

## Funciones Disponibles

### `compressImage(dataUrl, maxSizeKB, maxWidth)`

Comprime una sola imagen.

**Parámetros:**
- `dataUrl`: Data URL de la imagen (data:image/...)
- `maxSizeKB`: Tamaño máximo en KB (default: 800)
- `maxWidth`: Ancho máximo en px (default: 1080)

**Retorna:** Data URL comprimido

### `compressImages(dataUrls, maxSizeKB)`

Comprime múltiples imágenes en paralelo.

**Parámetros:**
- `dataUrls`: Array de data URLs
- `maxSizeKB`: Tamaño máximo por imagen

**Retorna:** Array de data URLs comprimidos

### `validatePayloadSize(imageData, variants)`

Valida que el tamaño total no exceda el límite.

**Retorna:**
```typescript
{
  valid: boolean,
  sizeKB: number,
  maxKB: number
}
```

## Mejores Prácticas

### ✅ Recomendaciones:

1. **Usa imágenes de buena calidad** (no pixeladas)
   - La compresión es más eficiente con imágenes nítidas

2. **Evita subir imágenes enormes**
   - Ideal: 1080-1920px de ancho
   - Se redimensionarán automáticamente si son más grandes

3. **Variantes similares**
   - Usa variantes del mismo template (diferentes ángulos)
   - No uses imágenes completamente diferentes

4. **Máximo 3 variantes**
   - Límite técnico y de UX
   - El carousel rota entre ellas cada 3 segundos

### ❌ Evita:

1. **No subas PNG grandes** - Se convertirán a JPEG de todos modos
2. **No subas imágenes con texto importante** - La compresión puede afectarlo
3. **No uses screenshots** - Mejor usa las imágenes originales

## Troubleshooting

### "Error: El tamaño total excede el límite"

**Causa:** Demasiadas variantes o imágenes muy pesadas

**Solución:**
1. Reduce el número de variantes (ej. 2 en lugar de 3)
2. Usa imágenes más pequeñas de origen
3. Pre-comprime las imágenes antes de subirlas

### "La imagen se ve pixelada después de comprimir"

**Causa:** La imagen original era muy grande y se redujo mucho

**Solución:**
1. Usa una imagen de tamaño apropiado desde el inicio (1080-1920px)
2. Aumenta `maxSizeKB` si tu internet lo permite

### "La compresión tarda mucho"

**Causa:** Navegador lento o imágenes muy grandes

**Solución:**
1. Cierra otras pestañas del navegador
2. Usa imágenes de tamaño razonable
3. Espera pacientemente - la compresión es más rápida que volver a subir

## Configuración Avanzada

Si necesitas ajustar los límites, edita `lib/utils/image-compression.ts`:

```typescript
// Reducir calidad para menor tamaño
const result = compress(0.70); // en lugar de 0.85

// Aumentar límite de ancho
let maxWidth = 1920; // en lugar de 1080

// Ajustar calidad mínima
if (quality > 0.20) // en lugar de 0.30
```

## Archivos Relacionados

- [image-compression.ts](../lib/utils/image-compression.ts) - Funciones de compresión
- [TemplateForm.tsx](../app/components/TemplateForm.tsx) - Integración en el formulario
- [vercel.json](../vercel.json) - Configuración de límites
- [route.ts](../app/api/admin/templates/route.ts) - API que recibe las imágenes

## Métricas

### Antes de la compresión:
- Imagen principal: ~2-4MB
- Variante 1: ~2MB
- Variante 2: ~2MB
- Variante 3: ~2MB
- **Total: ~8-10MB** ❌ Error 413

### Después de la compresión:
- Imagen principal: ~800KB
- Variante 1: ~600KB
- Variante 2: ~600KB
- Variante 3: ~600KB
- **Total: ~2.6MB** ✅ Éxito
