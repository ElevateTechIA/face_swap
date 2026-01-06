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
  // Matcher recomendado por next-intl
  // Aplica el middleware a todas las rutas excepto API, _next, _vercel y archivos estáticos
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ],
};
