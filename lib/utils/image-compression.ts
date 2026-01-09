/**
 * Comprime una imagen manteniendo calidad aceptable para Face Swap
 * @param dataUrl - Data URL de la imagen (data:image/...)
 * @param maxSizeKB - Tamaño máximo en KB (default: 800KB)
 * @param maxWidth - Ancho máximo en px (default: 1080px)
 * @returns Data URL comprimido
 */
export async function compressImage(
  dataUrl: string,
  maxSizeKB: number = 800,
  maxWidth: number = 1080
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Crear canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear contexto 2D'));
        return;
      }

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Función para comprimir iterativamente hasta alcanzar el tamaño deseado
      const compress = (quality: number): string => {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = (compressed.length * 3) / 4 / 1024; // Aproximación del tamaño en KB

        console.log(`📊 Compresión: quality=${quality.toFixed(2)}, size=${sizeKB.toFixed(0)}KB`);

        // Si es demasiado grande y podemos reducir más, intentar con menor calidad
        if (sizeKB > maxSizeKB && quality > 0.3) {
          return compress(quality - 0.1);
        }

        return compressed;
      };

      // Iniciar compresión con calidad 0.85
      const result = compress(0.85);
      const finalSizeKB = (result.length * 3) / 4 / 1024;

      console.log(`✅ Imagen comprimida: ${width}x${height}, ${finalSizeKB.toFixed(0)}KB`);
      resolve(result);
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = dataUrl;
  });
}

/**
 * Comprime un array de imágenes en paralelo
 * @param dataUrls - Array de data URLs
 * @param maxSizeKB - Tamaño máximo por imagen en KB
 * @returns Array de data URLs comprimidos
 */
export async function compressImages(
  dataUrls: string[],
  maxSizeKB: number = 800
): Promise<string[]> {
  console.log(`🔄 Comprimiendo ${dataUrls.length} imágenes...`);

  const compressed = await Promise.all(
    dataUrls.map(url => compressImage(url, maxSizeKB))
  );

  const totalSizeKB = compressed.reduce((sum, url) => {
    return sum + (url.length * 3) / 4 / 1024;
  }, 0);

  console.log(`✅ ${compressed.length} imágenes comprimidas. Tamaño total: ${totalSizeKB.toFixed(0)}KB`);

  return compressed;
}

/**
 * Valida que el tamaño total del payload no exceda el límite
 * @param imageData - Imagen principal
 * @param variants - Array de variantes
 * @returns true si el tamaño es válido
 */
export function validatePayloadSize(
  imageData: string | null,
  variants: string[]
): { valid: boolean; sizeKB: number; maxKB: number } {
  const maxKB = 4000; // 4MB límite de Vercel (dejamos margen)

  let totalSize = 0;

  if (imageData) {
    totalSize += imageData.length;
  }

  variants.forEach(variant => {
    if (variant && typeof variant === 'string') {
      totalSize += variant.length;
    }
  });

  const sizeKB = (totalSize * 3) / 4 / 1024;

  return {
    valid: sizeKB <= maxKB,
    sizeKB,
    maxKB
  };
}
