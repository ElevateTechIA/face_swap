import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // Lista de idiomas soportados
  locales,

  // Idioma por defecto
  defaultLocale,

  // Detección automática del idioma del navegador
  localeDetection: true,

  // Prefijo en la URL (siempre mostrar /es o /en)
  localePrefix: 'always',
});

export const config = {
  // Aplicar el middleware a todas las rutas excepto:
  // - API routes
  // - _next (archivos estáticos de Next.js)
  // - Archivos estáticos (imágenes, fuentes, etc.)
  matcher: ['/', '/(es|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
