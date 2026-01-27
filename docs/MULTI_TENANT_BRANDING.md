# Multi-Tenant Branding System

Este sistema permite deployar la misma aplicación en múltiples dominios, cada uno con su propia marca (nombre, logo) y templates específicos.

## Cómo Funciona

### 1. Configuración de Marca por Dominio

Cada dominio tiene una configuración de marca almacenada en Firebase en la colección `brandConfigs`:

```typescript
{
  id: string;
  domain: string;              // ej: "glamour-ai.com"
  name: string;                // ej: "Glamour AI"
  logo: string;                // URL de Firebase Storage
  favicon?: string;            // Opcional
  themeId?: string;            // Opcional: 'glamour', 'ocean', 'pink-boxer'
  customColors?: {             // Opcional: colores personalizados
    primary?: string;
    secondary?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}
```

### 2. Carga Automática Basada en Dominio

Cuando un usuario visita la app:
1. El layout de Next.js detecta el dominio desde `headers().get('host')`
2. Se busca la configuración de marca en Firestore que coincida con ese dominio
3. La configuración se pasa al `BrandProvider` context
4. Todos los componentes pueden acceder a la marca con `useBrand()`

### 3. Templates Filtrados por Website

Los templates pueden ser:
- **Compartidos**: No tienen `websiteUrl` definido → aparecen en todos los sitios
- **Específicos**: Tienen `websiteUrl` definido → solo aparecen en ese sitio

```typescript
{
  ...template,
  websiteUrl: "glamour-ai.com"  // Solo visible en glamour-ai.com
}
```

## Configuración Inicial

### 1. Crear Configuración de Marca

Ejecuta el script de seed:

```bash
npx tsx scripts/seed-brand-configs.ts
```

O crea manualmente en Firestore:

```typescript
// Colección: brandConfigs
{
  domain: "myapp.com",
  name: "My App",
  logo: "https://firebasestorage.googleapis.com/.../logo.png",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### 2. Subir Logo a Firebase Storage

1. Ve a Firebase Console → Storage
2. Sube tu logo (ej: `logos/myapp-logo.png`)
3. Obtén la URL pública
4. Úsala en el campo `logo` de la configuración

### 3. Crear Templates Específicos

En el admin panel, al crear/editar un template:

1. **Para template compartido**: Deja el campo "Website URL" vacío
2. **Para template específico**: Ingresa el dominio (ej: `myapp.com`)

## Deployment Multi-Sitio

### Opción 1: Múltiples Dominios en Vercel

1. Deploy la app en Vercel
2. Agrega múltiples dominios en Settings → Domains
3. Cada dominio mostrará contenido diferente basado en su configuración

### Opción 2: Múltiples Proyectos

1. Deploy la misma app en diferentes proyectos de Vercel
2. Asigna dominios distintos a cada proyecto
3. Usa el mismo Firebase (misma base de datos)

### Variables de Entorno

Todas las configuraciones se cargan desde Firebase, por lo que las variables de entorno son las mismas:

```env
# Firebase (compartido entre todos los sitios)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Admin
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...
ADMIN_EMAILS=admin@example.com
```

## API de Administración

### Endpoints Disponibles

```typescript
// Listar todas las configuraciones de marca
GET /api/admin/brands

// Crear nueva configuración de marca
POST /api/admin/brands
Body: {
  domain: string;
  name: string;
  logo: string;
  favicon?: string;
  themeId?: string;
  isActive?: boolean;
}

// Actualizar configuración de marca
PUT /api/admin/brands
Body: {
  id: string;
  domain?: string;
  name?: string;
  logo?: string;
  favicon?: string;
  themeId?: string;
  isActive?: boolean;
}

// Eliminar configuración de marca
DELETE /api/admin/brands?id={brandId}
```

## Uso en Componentes

```typescript
import { useBrand } from '@/app/contexts/BrandContext';

function MyComponent() {
  const { brand } = useBrand();

  return (
    <div>
      <img src={brand.logo} alt={brand.name} />
      <h1>{brand.name}</h1>
      <p>Domain: {brand.domain}</p>
    </div>
  );
}
```

## Ejemplos de Uso

### Ejemplo 1: Dos Marcas Diferentes

**Marca 1: Glamour AI**
```typescript
{
  domain: "glamour-ai.com",
  name: "GLAMOUR",
  logo: "https://storage.googleapis.com/.../glamour-logo.png",
  themeId: "glamour"
}
```

**Marca 2: FaceSwap Pro**
```typescript
{
  domain: "faceswap-pro.com",
  name: "FaceSwap Pro",
  logo: "https://storage.googleapis.com/.../faceswap-logo.png",
  themeId: "ocean"
}
```

### Ejemplo 2: Templates Compartidos vs Específicos

**Template Compartido** (aparece en ambos sitios):
```typescript
{
  title: "Casual Photo",
  websiteUrl: null,  // o undefined
  ...
}
```

**Template Específico** (solo en Glamour AI):
```typescript
{
  title: "Glamour Edition",
  websiteUrl: "glamour-ai.com",
  ...
}
```

## Testing Local

Para probar diferentes dominios localmente:

1. Edita tu archivo `/etc/hosts`:
```
127.0.0.1 site1.local
127.0.0.1 site2.local
```

2. Accede a `http://site1.local:3000` y `http://site2.local:3000`

3. Crea configuraciones en Firestore para `site1.local` y `site2.local`

## Troubleshooting

### El logo no se muestra
- Verifica que la URL del logo sea pública en Firebase Storage
- Revisa las reglas de seguridad de Storage

### Templates no filtran correctamente
- Verifica que `websiteUrl` coincida exactamente con el `domain` (sin www, sin https)
- Revisa la consola del navegador para logs de filtrado

### Aparece marca por defecto
- Verifica que exista una configuración en `brandConfigs` para ese dominio
- Asegúrate que `isActive: true`
- Revisa los logs del servidor

## Seguridad

- Solo usuarios admin pueden crear/modificar configuraciones de marca
- Las configuraciones se validan en el backend
- Los logos deben estar en Firebase Storage con permisos adecuados

## Best Practices

1. **Nomenclatura de dominios**: Usa siempre minúsculas, sin www, sin protocolo
2. **Logos**: Sube logos en formato PNG con fondo transparente (recomendado: 512x512px)
3. **Templates compartidos**: Mantén los templates generales sin `websiteUrl` para reutilizarlos
4. **Testing**: Prueba cada configuración en localhost antes de deployar
5. **Backup**: Mantén respaldo de las configuraciones en un archivo JSON

## Roadmap Futuro

- [ ] Panel admin para gestionar configuraciones de marca visualmente
- [ ] Soporte para colores personalizados por marca
- [ ] Temas completamente personalizables
- [ ] Analytics separados por marca
- [ ] Subdominios automáticos
