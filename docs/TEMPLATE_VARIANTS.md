# Template Variants - Carruseles Automáticos

## ¿Qué son las variantes de templates?

Las variantes de templates son diferentes versiones de un mismo template que rotan automáticamente en un carrusel (similar a la app GLAM). Cada template puede tener hasta 3 variantes que se muestran con una transición suave cada 3 segundos.

## Cómo funciona

1. **Componente TemplateCarousel**: Maneja la rotación automática de imágenes
2. **Auto-rotate**: Cambia automáticamente cada 3 segundos
3. **Indicadores**: Pequeños dots muestran cuál variante está activa
4. **Preload**: Todas las imágenes se precargan para transiciones suaves

## Cómo agregar variantes en Firebase

### Opción 1: Campo `variants` en Firestore (Recomendado)

Al crear o editar un template en el admin panel, agrega un campo `variants`:

```javascript
{
  id: "template-123",
  title: "Midnight Celebration",
  imageUrl: "https://firebasestorage.googleapis.com/.../main.jpg",
  variants: [
    "https://firebasestorage.googleapis.com/.../variant1.jpg",
    "https://firebasestorage.googleapis.com/.../variant2.jpg",
    "https://firebasestorage.googleapis.com/.../variant3.jpg"
  ],
  category: "new-year",
  // ... otros campos
}
```

### Opción 2: Estructura de archivos en Firebase Storage

Organiza tus templates así:

```
templates/
  ├── midnight-celebration/
  │   ├── main.jpg          (Variante 1)
  │   ├── variant-2.jpg     (Variante 2)
  │   └── variant-3.jpg     (Variante 3)
  ├── champagne-toast/
  │   ├── main.jpg
  │   ├── variant-2.jpg
  │   └── variant-3.jpg
```

### Opción 3: Sin variantes

Si un template no tiene variantes definidas:
- Solo se mostrará la imagen principal sin carousel
- No habrá animación ni dots
- Funciona perfectamente como antes

## Mejores prácticas para variantes

### Tipo de variantes recomendadas:

1. **Diferentes ángulos**: Mismo template desde diferentes perspectivas
2. **Diferentes momentos**: Captura diferentes momentos de una escena
3. **Diferentes personas**: Mostrar cómo se ve el template en diferentes rostros
4. **Diferentes iluminaciones**: Versión día/noche/golden hour

### Especificaciones técnicas:

- **Formato**: JPG, PNG o WebP
- **Resolución**: Mínimo 1080x1620px (aspecto 3:4.5)
- **Peso**: Máximo 500KB por imagen (optimizar para web)
- **Cantidad**: 1-3 variantes por template

## Ejemplo de uso en Admin Panel

```typescript
// Al crear/editar un template
const templateData = {
  title: "New Year Party",
  imageUrl: await uploadToFirebase(mainImage),
  variants: [
    await uploadToFirebase(variant1),
    await uploadToFirebase(variant2),
    await uploadToFirebase(variant3)
  ],
  metadata: {
    occasion: ["new-year", "party"],
    // ...
  }
};
```

## Configuración del carrusel

Puedes personalizar el comportamiento en [page.tsx](../app/[locale]/page.tsx):

```typescript
<TemplateCarousel
  images={getTemplateVariants(template)}
  title={template.title}
  interval={3000}  // Cambiar velocidad (ms)
  className="..."
  onClick={() => selectTemplate(template)}
/>
```

## Testing

Para probar el carrusel sin subir a Firebase:

1. Modifica `getTemplateVariants()` para retornar URLs de prueba:

```typescript
const getTemplateVariants = (template: any): string[] => {
  return [
    template.url,
    "/templates/test-variant-1.jpg",
    "/templates/test-variant-2.jpg"
  ];
};
```

2. Coloca las imágenes de prueba en `public/templates/`

## Rendimiento

El carrusel está optimizado para:
- ✅ Preload de todas las variantes
- ✅ Transiciones CSS smooth (no JavaScript)
- ✅ Lazy loading por defecto
- ✅ Pausar cuando no está visible (opcional)

## Troubleshooting

### Las imágenes no rotan
- Verifica que `variants` tenga más de 1 imagen
- Revisa la consola por errores de CORS
- Asegúrate que las URLs sean accesibles

### Transiciones lentas
- Optimiza el peso de las imágenes
- Usa WebP en lugar de PNG
- Considera usar CDN para Firebase Storage

### Imágenes no cargan
- Verifica las reglas de Firebase Storage
- Checa que las URLs sean públicas
- Revisa Content-Security-Policy en next.config.ts
