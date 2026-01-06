/**
 * Security Headers Configuration
 *
 * Apply these headers via next.config.js or middleware
 */

export const SECURITY_HEADERS = [
  // 1. Content Security Policy (CSP)
  // Prevents XSS attacks by controlling resource sources
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

  // 2. X-Frame-Options - Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },

  // 3. X-Content-Type-Options - Prevent MIME sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },

  // 4. Referrer-Policy - Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },

  // 5. Permissions-Policy - Control browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },

  // 6. X-XSS-Protection (legacy, but doesn't hurt)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },

  // 7. Strict-Transport-Security (HSTS) - Force HTTPS
  // Only enable in production with HTTPS
  ...(process.env.NODE_ENV === 'production' ? [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }] : [])
];

/**
 * Apply security headers to Next.js response
 */
export function applySecurityHeaders(headers: Headers): void {
  SECURITY_HEADERS.forEach(({ key, value }) => {
    headers.set(key, value);
  });
}
