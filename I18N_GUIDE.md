# Guía de Internacionalización (i18n)

## 🎉 ¡Sistema i18n Implementado!

El sistema de internacionalización está completamente configurado y funcionando con **español** e **inglés**.

## 📁 Estructura del Proyecto

```
app/
  [locale]/                    ← Todas las páginas ahora están aquí
    layout.tsx                 ← Layout con NextIntlClientProvider
    page.tsx                   ← Página principal
    admin/
    credits/
    history/
    transactions/
  api/                         ← API routes (sin locale)
  auth/                        ← Providers compartidos
  components/                  ← Componentes compartidos
    LanguageSwitcher.tsx      ← Selector de idioma
    LoginGateModal.tsx        ← ✅ Ya internacionalizado
  layout.tsx                   ← Root layout
  providers.tsx
  globals.css

messages/
  es.json                      ← Traducciones en español
  en.json                      ← Traducciones en inglés

i18n.ts                        ← Configuración i18n
middleware.ts                  ← Middleware para detección de idioma
next.config.ts                 ← Configurado con next-intl plugin
```

## 🌍 Idiomas Configurados

- **Español (es)** - Idioma por defecto
- **English (en)**

## ✅ Lo que YA está Hecho

1. ✅ **next-intl** instalado y configurado
2. ✅ **Middleware** para detección automática de idioma del navegador
3. ✅ **Estructura [locale]** implementada en app router
4. ✅ **Archivos de traducción** (es.json, en.json) con traducciones completas
5. ✅ **LanguageSwitcher** component creado y agregado al header
6. ✅ **LoginGateModal** completamente internacionalizado (ejemplo)
7. ✅ Servidor corriendo exitosamente

## 🚀 Cómo Usar

### 1. Acceder a la aplicación

El middleware automáticamente:
- Detecta el idioma del navegador
- Redirige a `/es` o `/en` según corresponda
- Permite cambiar manualmente con el botón de idioma

**URLs:**
- Español: `http://localhost:3000/es`
- English: `http://localhost:3000/en`

### 2. Usar traducciones en componentes

#### Ejemplo básico:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common'); // 'common' es la sección en el JSON

  return (
    <div>
      <h1>{t('appName')}</h1>
      <button>{t('save')}</button>
    </div>
  );
}
```

#### Con variables:

```tsx
const t = useTranslations('credits');

// En es.json: "balance": "Tienes {credits} créditos"
<p>{t('balance', { credits: 100 })}</p>
// → "Tienes 100 créditos"
```

#### Con rich text (HTML dentro del texto):

```tsx
const t = useTranslations('loginGate');

// En es.json: "signInNowAndGet": "Inicia sesión {now} y obtén:"
{t.rich('signInNowAndGet', {
  now: (chunks) => <span className="font-bold">{chunks}</span>
})}
```

#### Múltiples namespaces:

```tsx
export function MyComponent() {
  const t = useTranslations('common');
  const tAuth = useTranslations('auth');

  return (
    <div>
      <h1>{t('appName')}</h1>
      <button>{tAuth('signIn')}</button>
    </div>
  );
}
```

## 📝 Cómo Migrar Componentes Existentes

### Paso 1: Identificar textos hardcodeados

Busca todos los strings en español/inglés:
```tsx
// ❌ Antes
<button>Comprar Créditos</button>
```

### Paso 2: Agregar al archivo de traducción

En `messages/es.json`:
```json
{
  "common": {
    "buyCredits": "Comprar Créditos"
  }
}
```

En `messages/en.json`:
```json
{
  "common": {
    "buyCredits": "Buy Credits"
  }
}
```

### Paso 3: Usar en el componente

```tsx
// ✅ Después
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');

  return <button>{t('buyCredits')}</button>;
}
```

## 🎯 Componentes Prioritarios para Migrar

1. **app/[locale]/page.tsx** (Página principal)
   - Categorías de templates
   - Textos de encuesta inicial
   - Botones y etiquetas

2. **app/components/InsufficientCreditsModal.tsx**
   - Ya tiene traducciones en `credits.*`

3. **app/components/CreditsDisplay.tsx**
   - Usar `credits.balance`

4. **app/components/ScreenerSurvey.tsx**
   - Ya tiene traducciones en `survey.screener.*`

5. **app/[locale]/admin/page.tsx**
   - Ya tiene traducciones en `admin.*`

6. **app/[locale]/credits/page.tsx**
   - Ya tiene traducciones en `credits.*`

## 🔧 Configuración Avanzada

### Cambiar idioma programáticamente:

```tsx
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

function MyComponent() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <button onClick={() => changeLanguage('en')}>
      Switch to English
    </button>
  );
}
```

### Agregar un nuevo idioma:

1. **Actualizar `i18n.ts`**:
```ts
export const locales = ['es', 'en', 'fr'] as const; // Agregar 'fr'
```

2. **Crear `messages/fr.json`** con todas las traducciones

3. **Actualizar middleware.ts** (opcional, ya está configurado dinámicamente)

4. **Actualizar LanguageSwitcher.tsx**:
```tsx
const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }, // Nuevo
];
```

## 📊 Estructura de messages/es.json

```json
{
  "common": {
    "appName": "GLAMOUR",
    "loading": "Cargando...",
    "cancel": "Cancelar",
    // ... botones y acciones comunes
  },
  "auth": {
    "signInWithGoogle": "Iniciar con Google",
    "signingIn": "Iniciando...",
    // ... autenticación
  },
  "credits": {
    "balance": "Tienes {credits} créditos",
    "insufficient": "Sin Créditos",
    // ... créditos y compras
  },
  "loginGate": {
    "title": "¡Tu Face Swap",
    "titleHighlight": "Está Listo!",
    // ... login gate modal
  },
  "templates": {
    "categories": {
      "all": "Todos",
      "trending": "Tendencias",
      // ... categorías
    }
  },
  "survey": {
    "initial": {
      // ... encuesta inicial
    },
    "screener": {
      // ... screener survey
    }
  },
  "faceSwap": {
    // ... proceso de face swap
  },
  "admin": {
    // ... panel de administración
  },
  "history": {
    // ... historial
  }
}
```

## 🐛 Troubleshooting

### Error: "useTranslations must be used inside NextIntlClientProvider"

**Solución**: Asegúrate de que el componente esté dentro de `app/[locale]` y que sea un client component (`'use client'`).

### Textos no cambian al cambiar idioma

**Solución**: Verifica que:
1. El componente esté usando `useTranslations`
2. La traducción exista en ambos `es.json` y `en.json`
3. El componente sea `'use client'` si usa hooks

### Navegación pierde el locale

**Solución**: Usa el hook de navegación de next-intl:
```tsx
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

function MyComponent() {
  const locale = useLocale();
  const router = useRouter();

  // Incluir locale en la navegación
  router.push(`/${locale}/admin`);
}
```

## 📚 Recursos

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [React Intl Formatting](https://formatjs.io/docs/react-intl/)

## ✨ Beneficios Implementados

1. ✅ **Detección automática** del idioma del navegador
2. ✅ **Cambio de idioma** sin recargar la página
3. ✅ **SEO-friendly** con URLs diferentes por idioma (`/es`, `/en`)
4. ✅ **Fácil de mantener** con archivos JSON centralizados
5. ✅ **Escalable** - agregar nuevos idiomas es simple
6. ✅ **Type-safe** con TypeScript
7. ✅ **Performance** optimizado con next-intl

## 🎯 Próximos Pasos Recomendados

1. **Migrar page.tsx principal** - Es el archivo más grande y complejo
2. **Migrar componentes de créditos** - InsufficientCreditsModal, etc.
3. **Migrar screener survey** - Ya tiene las traducciones listas
4. **Migrar admin panel** - Ya tiene las traducciones listas
5. **Actualizar navegación** - Asegurar que todos los links incluyan locale
6. **Agregar más idiomas** - Portugués, Francés, etc.

---

**¡El sistema está listo para usar!** 🚀

Puedes empezar a migrar componentes uno por uno siguiendo los ejemplos de [LoginGateModal.tsx](app/components/LoginGateModal.tsx).
