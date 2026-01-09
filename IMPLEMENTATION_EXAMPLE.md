# 🔧 Ejemplo de Implementación de Seguridad

## Integración Paso a Paso

### **1. Modificar `/api/face-swap/process/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';
import { getTemplatePrompt } from '@/lib/template-prompts';
import { getStyleById } from '@/lib/styles/style-configs';

// 🔒 NUEVO: Importar utilidades de seguridad
import { securityCheckFaceSwap, logSecurityEvent } from '@/lib/security/api-middleware';
import { getClientIp } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let faceSwapId: string | null = null;
  let transactionId: string | null = null;
  let userId: string | null = null;
  let isGuestTrial = false;

  try {
    // Obtener body del request
    const body = await request.json();
    const {
      sourceImage,
      targetImage,
      style,
      templateTitle,
      isGuestTrial: requestIsGuest,
      isGroupSwap,
      faceIndex,
      totalFaces
    } = body;

    // Detectar si es guest trial
    const guestHeader = request.headers.get('X-Guest-Trial');
    isGuestTrial = guestHeader === 'true' || requestIsGuest === true;

    // 🔒 NUEVO: Security checks completos
    console.log('🔒 Running security checks...');

    const securityCheck = await securityCheckFaceSwap(
      request,
      {
        sourceImage: isGroupSwap ? undefined : sourceImage,
        targetImage,
        isGroupSwap,
        userImages: isGroupSwap ? body.userImages : undefined
      },
      userId || undefined,
      {
        enableRateLimit: true,
        enableImageValidation: true,
        enableContentModeration: true, // Puedes desactivar temporalmente si es muy lento
      }
    );

    if (!securityCheck.passed) {
      // Log security event
      logSecurityEvent('validation_failed', {
        ip: getClientIp(request),
        userId: userId || 'guest',
        endpoint: '/api/face-swap/process',
        reason: securityCheck.errors.join(', ')
      });

      return securityCheck.response!;
    }

    console.log('✅ Security checks passed');

    // Log group swap info
    if (isGroupSwap) {
      console.log(`👥 GROUP SWAP: Processing face ${faceIndex + 1} of ${totalFaces}`);
    }

    // Verificar autenticación...
    if (!isGuestTrial) {
      userId = await verifyUserAuth(request);
    } else {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const ip = forwardedFor?.split(',')[0] || 'unknown';
      userId = `guest_${ip}_${Date.now()}`;
      console.log('🎁 Processing GUEST TRIAL for:', userId);
    }

    // ... resto del código existente ...

  } catch (error: any) {
    console.error('❌ Error en Face Swap:', error.message);

    // 🔒 NUEVO: Log security event si es sospechoso
    if (error.message.includes('validation') || error.message.includes('moderation')) {
      logSecurityEvent('suspicious_activity', {
        ip: getClientIp(request),
        userId: userId || 'unknown',
        endpoint: '/api/face-swap/process',
        reason: error.message
      });
    }

    // ... resto del manejo de errores ...
  }
}
```

---

### **2. Modificar `MultiFaceUpload.tsx`**

```typescript
import { validateImage } from '@/lib/security/image-validator';
import { toast } from 'sonner';

const handleFileSelect = async (slotId: number, event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error(t('upload.errors.invalidType'));
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast.error(t('upload.errors.tooLarge'));
    return;
  }

  // Read file as data URL
  const reader = new FileReader();
  reader.onload = async (e) => {
    const imageUrl = e.target?.result as string;

    // 🔒 NUEVO: Validación de seguridad
    console.log('🔒 Validating image...');

    const validation = await validateImage(imageUrl, {
      maxSizeBytes: 10 * 1024 * 1024,
      maxWidth: 4096,
      maxHeight: 4096,
      stripExif: true,
      checkAspectRatio: true
    });

    if (!validation.valid) {
      console.error('❌ Image validation failed:', validation.errors);
      toast.error(validation.errors[0]);
      return;
    }

    // Mostrar warnings si hay
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Image warnings:', validation.warnings);
      validation.warnings.forEach(w => toast.warning(w));
    }

    console.log('✅ Image validated');

    // Usar imagen sanitizada (EXIF removido)
    const cleanImage = validation.sanitizedImage || imageUrl;

    setFaceSlots(prev => prev.map(slot =>
      slot.id === slotId
        ? { ...slot, image: cleanImage, file }
        : slot
    ));
  };

  reader.readAsDataURL(file);
};
```

---

### **3. Modificar `page.tsx` (handleImageUpload)**

```typescript
import { validateImage } from '@/lib/security/image-validator';

const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  type: 'source' | 'target'
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  console.log(`📤 Uploading ${type} image:`, file.name, file.size);

  const reader = new FileReader();
  reader.onload = async (event) => {
    const imageData = event.target?.result as string;

    // 🔒 NUEVO: Validación de seguridad
    console.log('🔒 Validating image...');

    const validation = await validateImage(imageData);

    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.errors);
      toast.error(validation.errors[0]);
      return;
    }

    console.log('✅ Image validated');

    // Usar imagen sanitizada
    const cleanImage = validation.sanitizedImage || imageData;

    if (type === 'source') {
      setSourceImg(cleanImage);
    } else {
      setTargetImg(cleanImage);
    }
  };

  reader.readAsDataURL(file);
};
```

---

### **4. Configurar Security Headers en `next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... configuración existente ...

  // 🔒 NUEVO: Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.googletagmanager.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' blob: data: https: http:;
              font-src 'self' data: https://fonts.gstatic.com;
              connect-src 'self' https://generativelanguage.googleapis.com https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com;
              frame-src 'self' https://accounts.google.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim()
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

---

### **5. Agregar Variables de Entorno**

```bash
# .env.local

# Security Settings
ENABLE_RATE_LIMITING=true
ENABLE_CONTENT_MODERATION=true
ENABLE_IMAGE_VALIDATION=true

# Rate Limiting (opcional - para Redis)
# UPSTASH_REDIS_REST_URL=https://...
# UPSTASH_REDIS_REST_TOKEN=...

# Monitoring (opcional)
# SENTRY_DSN=https://...
```

---

### **6. Testing de Seguridad**

```typescript
// scripts/test-security.ts

import { validateImage } from '../lib/security/image-validator';
import { moderateImage } from '../lib/security/content-moderator';
import { checkRateLimit, RATE_LIMITS } from '../lib/security/rate-limiter';

async function testSecurity() {
  console.log('🧪 Testing security features...\n');

  // 1. Test image validation
  console.log('1️⃣ Testing image validation...');

  // Test valid image
  const validImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'; // Truncated
  const validResult = await validateImage(validImage);
  console.log('   Valid image:', validResult.valid ? '✅ PASS' : '❌ FAIL');

  // Test oversized image
  const largeImage = 'data:image/jpeg;base64,' + 'A'.repeat(20 * 1024 * 1024);
  const largeResult = await validateImage(largeImage);
  console.log('   Large image rejected:', !largeResult.valid ? '✅ PASS' : '❌ FAIL');

  // 2. Test rate limiting
  console.log('\n2️⃣ Testing rate limiting...');

  const testId = 'test-user-123';
  for (let i = 0; i < 12; i++) {
    const result = await checkRateLimit(testId, RATE_LIMITS.FACE_SWAP);
    if (i < 10) {
      console.log(`   Request ${i + 1}/10: ${result.allowed ? '✅ Allowed' : '❌ Blocked'}`);
    } else {
      console.log(`   Request ${i + 1} (over limit): ${!result.allowed ? '✅ Blocked' : '❌ SHOULD BE BLOCKED'}`);
    }
  }

  // 3. Test content moderation
  console.log('\n3️⃣ Testing content moderation...');
  console.log('   (Requires GEMINI_API_KEY and real image)');

  console.log('\n✅ Security tests completed!\n');
}

testSecurity().catch(console.error);
```

**Ejecutar:**
```bash
npx tsx scripts/test-security.ts
```

---

## 🚀 Deployment Checklist

Antes de deployar a producción:

```bash
# 1. Verificar secrets
[ ] GEMINI_API_KEY configurada
[ ] FIREBASE keys configuradas
[ ] No hay NEXT_PUBLIC_ en variables sensibles

# 2. Security headers
[ ] next.config.js actualizado
[ ] Headers verificados con securityheaders.com

# 3. Dependencies
npm audit
npm audit fix

# 4. Environment
[ ] .env.local tiene todas las keys
[ ] .env.example está actualizado
[ ] .gitignore incluye .env.local

# 5. Rate limiting
[ ] Configurado para producción
[ ] Redis/Upstash setup (opcional pero recomendado)

# 6. Monitoring
[ ] Sentry configurado (opcional)
[ ] Error tracking activo
[ ] Logs configurados

# 7. Testing
[ ] Security tests pasan
[ ] Manual penetration test
[ ] Load testing

# 8. Documentation
[ ] SECURITY_GUIDE.md revisado
[ ] Privacy policy publicada
[ ] Terms of service publicados
```

---

## 📊 Monitoreo Post-Deploy

```typescript
// lib/monitoring/security-metrics.ts

export async function trackSecurityMetric(
  metric: 'rate_limit_hit' | 'validation_failed' | 'moderation_blocked',
  metadata?: Record<string, any>
) {
  console.log(`📊 Security Metric: ${metric}`, metadata);

  // En producción: enviar a Analytics/Sentry
  // analytics.track(metric, metadata);
}
```

**Uso:**
```typescript
import { trackSecurityMetric } from '@/lib/monitoring/security-metrics';

// Cuando se bloquea por rate limit
trackSecurityMetric('rate_limit_hit', {
  endpoint: '/api/face-swap/process',
  userId: userId || 'guest',
  ip: clientIp
});
```

---

## 🎯 Prioridades de Implementación

### **Alta Prioridad (Esta Semana):**
1. ✅ Rate limiting básico
2. ✅ Image validation client-side
3. ✅ Security headers

### **Media Prioridad (Próximas 2 Semanas):**
4. ⏳ Content moderation
5. ⏳ Server-side validation
6. ⏳ Monitoring setup

### **Baja Prioridad (Antes de Launch):**
7. ⏳ Redis rate limiting
8. ⏳ Advanced monitoring
9. ⏳ Penetration testing

---

**¿Preguntas? Revisa `SECURITY_GUIDE.md` para más detalles.**
