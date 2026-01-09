/**
 * Utilidades para compartir en redes sociales
 */

/**
 * Detecta si el navegador soporta Web Share API
 */
export function hasWebShareAPI(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Obtiene la URL base de la aplicación
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Genera URL para compartir en Instagram
 * Nota: Instagram no tiene URL scheme directo, usamos Web Share API
 */
export function getInstagramShareUrl(url: string, caption: string): string {
  // Instagram no tiene URL directa, retornamos la URL para Web Share API
  return url;
}

/**
 * Genera URL para compartir en WhatsApp
 */
export function getWhatsAppShareUrl(url: string, caption: string): string {
  const text = encodeURIComponent(`${caption}\n\n${url}`);
  return `https://wa.me/?text=${text}`;
}

/**
 * Genera URL para compartir en Facebook
 */
export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/**
 * Genera URL para compartir en Twitter/X
 */
export function getTwitterShareUrl(url: string, caption: string): string {
  const text = encodeURIComponent(caption);
  const urlEncoded = encodeURIComponent(url);
  return `https://twitter.com/intent/tweet?text=${text}&url=${urlEncoded}&hashtags=GLAMOUR,FaceSwapAI`;
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Intentar usar Clipboard API moderna
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback para navegadores antiguos
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    return successful;
  } catch (error) {
    console.error('Error copiando al portapapeles:', error);
    return false;
  }
}

/**
 * Comparte usando Web Share API nativa
 */
export async function shareViaWebAPI(data: {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}): Promise<boolean> {
  try {
    if (!hasWebShareAPI()) {
      return false;
    }

    await navigator.share(data);
    return true;
  } catch (error: any) {
    // El usuario canceló o hubo un error
    if (error.name === 'AbortError') {
      // Usuario canceló, no es un error real
      return false;
    }
    console.error('Error compartiendo:', error);
    return false;
  }
}

/**
 * Convierte una imagen base64 a File para compartir
 */
export async function base64ToFile(
  base64: string,
  filename: string = 'face-swap.png'
): Promise<File | null> {
  try {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], filename, { type: 'image/png' });
  } catch (error) {
    console.error('Error convirtiendo base64 a File:', error);
    return null;
  }
}

/**
 * Trackea eventos de compartición en analytics
 */
export function trackShare(platform: string, type: 'app' | 'image'): void {
  try {
    // Si tienes Firebase Analytics u otra herramienta, agrégala aquí
    console.log(`Share tracked: ${platform} - ${type}`);

    // Ejemplo con Firebase Analytics (descomentar si lo usas):
    // import { getAnalytics, logEvent } from 'firebase/analytics';
    // const analytics = getAnalytics();
    // logEvent(analytics, 'share', {
    //   content_type: type,
    //   method: platform,
    // });
  } catch (error) {
    console.error('Error tracking share:', error);
  }
}
