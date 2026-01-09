/**
 * Utilidades para generar y manejar códigos QR
 */

import html2canvas from 'html2canvas';

/**
 * Obtiene la URL de la aplicación para el código QR
 */
export function getShareUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Descarga el código QR como imagen PNG
 */
export async function downloadQRCode(
  qrRef: React.RefObject<HTMLDivElement | null>,
  filename: string = 'glam-qr-code.png'
): Promise<void> {
  try {
    if (!qrRef.current) {
      console.error('QR reference no disponible');
      return;
    }

    // Convertir el elemento a canvas
    const canvas = await html2canvas(qrRef.current, {
      backgroundColor: '#ffffff',
      scale: 2, // Mayor resolución
    });

    // Convertir canvas a blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Error generando blob del QR');
        return;
      }

      // Crear link de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL temporal
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/png');
  } catch (error) {
    console.error('Error descargando QR:', error);
    throw error;
  }
}

/**
 * Convierte el QR a base64 para compartir
 */
export async function qrToBase64(qrRef: React.RefObject<HTMLDivElement | null>): Promise<string | null> {
  try {
    if (!qrRef.current) {
      return null;
    }

    const canvas = await html2canvas(qrRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error convirtiendo QR a base64:', error);
    return null;
  }
}
