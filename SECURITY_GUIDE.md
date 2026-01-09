# 🔒 Guía de Seguridad - Face Swap App

## Resumen Ejecutivo

Esta guía detalla las medidas de seguridad implementadas y pendientes para proteger la aplicación de Face Swap contra:
- ✅ Ataques XSS (Cross-Site Scripting)
- ✅ CSRF (Cross-Site Request Forgery)
- ✅ Clickjacking
- ✅ Injection attacks
- ✅ Rate limiting abuse
- ✅ Contenido inapropiado
- ✅ Image bombs
- ✅ Data breaches

---

## 📦 Componentes de Seguridad Implementados

### 1. **Validación de Imágenes** (`lib/security/image-validator.ts`)

**Funcionalidad:**
- ✅ Validación de tipo MIME
- ✅ Límites de tamaño (10MB)
- ✅ Límites de dimensiones (4096x4096px)
- ✅ Detección de aspect ratios sospechosos
- ✅ Eliminación de metadata EXIF (GPS, cámara, etc.)
- ✅ Soporte para validación batch (fotos grupales)

**Uso:**
```typescript
import { validateImage } from '@/lib/security/image-validator';

const result = await validateImage(imageDataUrl);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
  toast.error(result.errors[0]);
  return;
}

// Usar la imagen sanitizada (sin EXIF)
const cleanImage = result.sanitizedImage;
```

**Integrar en:**
- ✅ `MultiFaceUpload.tsx` - Validar antes de agregar a la lista
- ✅ `page.tsx` - Validar en `handleImageUpload()`
- ✅ API `/api/face-swap/process` - Validar server-side

---

### 2. **Rate Limiting** (`lib/security/rate-limiter.ts`)

**Límites Configurados:**
- **Face Swap:** 10 por hora por IP
- **Guest Trial:** 1 por IP (permanente)
- **Image Upload:** 20 por 10 minutos
- **API General:** 100 por minuto
- **Login:** 5 intentos por 15 minutos

**Uso:**
```typescript
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

const { allowed, result } = await withRateLimit(
  request,
  RATE_LIMITS.FACE_SWAP,
  userId
);

if (!allowed) {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Remaining': String(result.remaining)
      }
    }
  );
}
```

**⚠️ PRODUCCIÓN:**
```bash
# Usar Redis para rate limiting distribuido
npm install @upstash/redis @upstash/ratelimit

# Configurar en .env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

### 3. **Moderación de Contenido** (`lib/security/content-moderator.ts`)

**Detecta:**
- ✅ NSFW content
- ✅ Violencia
- ✅ Menores de edad
- ✅ Contenido inapropiado para face swap

**Uso:**
```typescript
import { moderateImage } from '@/lib/security/content-moderator';

const result = await moderateImage(imageDataUrl);

if (!result.safe) {
  console.error('Content flags:', result.flags);
  toast.error('Image contains inappropriate content');
  return;
}
```

**Integrar en:**
- ✅ API `/api/face-swap/process` - Moderar antes de procesar
- ✅ Upload handlers - Moderar en cliente y servidor

---

### 4. **Security Headers** (`lib/security/headers.ts`)

**Headers Aplicados:**
- ✅ Content-Security-Policy (CSP)
- ✅ X-Frame-Options (anti-clickjacking)
- ✅ X-Content-Type-Options (anti-MIME sniffing)
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ Strict-Transport-Security (HSTS)

**Integración en `next.config.js`:**
```javascript
const { SECURITY_HEADERS } = require('./lib/security/headers');

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS
      }
    ];
  }
};
```

---

### 5. **API Security Middleware** (`lib/security/api-middleware.ts`)

**Funcionalidad Completa:**
- ✅ Rate limiting automático
- ✅ Validación de imágenes
- ✅ Moderación de contenido
- ✅ Logging de eventos de seguridad

**Uso en API Route:**
```typescript
import { securityCheckFaceSwap } from '@/lib/security/api-middleware';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 🔒 Security check completo
  const securityCheck = await securityCheckFaceSwap(
    request,
    body,
    userId,
    {
      enableRateLimit: true,
      enableImageValidation: true,
      enableContentModeration: true
    }
  );

  if (!securityCheck.passed) {
    return securityCheck.response!;
  }

  // Continuar con el procesamiento...
}
```

---

## 🚀 Plan de Implementación

### **Fase 1: Básico (Inmediato)**

1. **Integrar Rate Limiting**
   ```typescript
   // En /api/face-swap/process/route.ts
   import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

   const { allowed } = await withRateLimit(request, RATE_LIMITS.FACE_SWAP, userId);
   if (!allowed) {
     return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
   }
   ```

2. **Validar Imágenes Client-Side**
   ```typescript
   // En MultiFaceUpload.tsx y page.tsx
   import { validateImage } from '@/lib/security/image-validator';

   const validation = await validateImage(imageData);
   if (!validation.valid) {
     toast.error(validation.errors[0]);
     return;
   }
   ```

3. **Aplicar Security Headers**
   ```javascript
   // En next.config.js
   const { SECURITY_HEADERS } = require('./lib/security/headers');
   // Agregar a la configuración
   ```

### **Fase 2: Avanzado (1-2 semanas)**

4. **Moderación de Contenido**
   ```typescript
   // En /api/face-swap/process/route.ts
   import { moderateImage } from '@/lib/security/content-moderator';

   const moderation = await moderateImage(sourceImage);
   if (!moderation.safe) {
     return NextResponse.json(
       { error: 'Inappropriate content detected' },
       { status: 400 }
     );
   }
   ```

5. **Usar API Middleware Completo**
   ```typescript
   // Reemplazar checks individuales con:
   import { securityCheckFaceSwap } from '@/lib/security/api-middleware';

   const check = await securityCheckFaceSwap(request, body, userId);
   if (!check.passed) return check.response!;
   ```

### **Fase 3: Producción (Antes de Launch)**

6. **Redis Rate Limiting**
   - Migrar de in-memory a Redis/Upstash
   - Distribuir rate limits entre servidores

7. **Monitoring & Logging**
   - Integrar Sentry para errores
   - Configurar CloudWatch/DataDog para métricas
   - Dashboard de seguridad

8. **Compliance**
   - Política de privacidad
   - Términos de servicio
   - GDPR compliance
   - Auto-delete de imágenes después de N días

---

## ⚠️ Vulnerabilidades Conocidas a Resolver

### **1. API Keys Expuestas**

**Riesgo:** `GEMINI_API_KEY` podría ser extraída del cliente

**Solución:**
```typescript
// ❌ MAL - No exponer keys al cliente
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// ✅ BIEN - Solo en servidor
const apiKey = process.env.GEMINI_API_KEY; // Sin NEXT_PUBLIC_
```

**Verificar:**
```bash
# Buscar keys expuestas
grep -r "NEXT_PUBLIC.*KEY" .env*
grep -r "NEXT_PUBLIC.*SECRET" .env*
```

---

### **2. CSRF Protection**

**Riesgo:** Requests no verifican origen

**Solución:**
```typescript
// En middleware o API routes
function verifyCsrfToken(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];

  if (origin && !allowedOrigins.includes(origin)) {
    return false;
  }

  return true;
}
```

---

### **3. Input Sanitization**

**Riesgo:** Inputs de usuario no sanitizados

**Solución:**
```bash
npm install dompurify isomorphic-dompurify
```

```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

---

### **4. File Upload Vulnerabilities**

**Riesgos:**
- ✅ Path traversal (resuelto - no se permiten uploads directos)
- ⚠️ Falta validación de magic numbers (file signature)
- ⚠️ Falta límite de concurrent uploads

**Mejoras:**
```typescript
// Validar magic numbers (file signature)
function validateFileSignature(base64: string): boolean {
  const data = atob(base64.split(',')[1]);
  const signature = data.slice(0, 4);

  // JPEG: FF D8 FF
  if (signature.startsWith('\xFF\xD8\xFF')) return true;

  // PNG: 89 50 4E 47
  if (signature.startsWith('\x89PNG')) return true;

  return false;
}
```

---

## 🔐 Mejores Prácticas

### **Secrets Management**

```bash
# .env.local (NUNCA commitear)
GEMINI_API_KEY=xxxxx
FIREBASE_PRIVATE_KEY=xxxxx

# .env.example (Safe to commit)
GEMINI_API_KEY=your_key_here
FIREBASE_PRIVATE_KEY=your_key_here
```

### **Database Security**

```typescript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Face swaps - only owner can access
    match /faceSwaps/{swapId} {
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
      allow write: if request.auth != null;
    }

    // Templates - read only
    match /templates/{templateId} {
      allow read: if true;
      allow write: if false; // Only via Admin SDK
    }
  }
}
```

### **Monitoring & Alerts**

```typescript
// Integrar Sentry
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive data
    if (event.request?.data) {
      delete event.request.data.sourceImage;
      delete event.request.data.targetImage;
    }
    return event;
  }
});
```

---

## 📊 Métricas de Seguridad

### **KPIs a Monitorear:**

1. **Rate Limit Violations**
   - Meta: < 1% de requests
   - Alert si > 5%

2. **Failed Validations**
   - Image validation failures
   - Content moderation blocks

3. **API Response Times**
   - p50: < 2s
   - p95: < 5s
   - p99: < 10s

4. **Error Rates**
   - Target: < 0.1%
   - Alert si > 1%

---

## 🚨 Incident Response Plan

1. **Detección:**
   - Monitoring alerts
   - User reports
   - Automated scans

2. **Respuesta:**
   - Aislar el issue
   - Rate limit agresivo si es abuse
   - Block IPs maliciosos

3. **Mitigación:**
   - Deploy fix
   - Comunicar a usuarios si aplica
   - Post-mortem

4. **Prevención:**
   - Actualizar security checks
   - Add new test cases
   - Documentar lecciones

---

## ✅ Security Checklist

### Pre-Launch:
- [ ] Rate limiting implementado en todos los endpoints
- [ ] Security headers configurados
- [ ] Image validation client + server
- [ ] Content moderation activa
- [ ] HTTPS enforcement
- [ ] Environment variables seguras
- [ ] Firestore rules configuradas
- [ ] Monitoring setup (Sentry/DataDog)
- [ ] Privacy policy publicada
- [ ] Terms of service publicados
- [ ] GDPR compliance verificado
- [ ] Penetration testing completado
- [ ] Dependency audit (`npm audit`)

### Post-Launch:
- [ ] Monitor logs diariamente
- [ ] Review security metrics semanalmente
- [ ] Update dependencies mensualmente
- [ ] Security audit trimestral
- [ ] Compliance review anual

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Firebase Security](https://firebase.google.com/docs/rules)
- [Web Security Guidelines](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**Última actualización:** 2026-01-05
