import { getAdminStorage } from './admin';

/**
 * Sube una imagen de Face Swap a Firebase Storage
 * @param imageData - Data URI de la imagen en formato base64 (data:image/png;base64,...)
 * @param userId - ID del usuario
 * @param faceSwapId - ID del face swap
 * @returns URL pública de la imagen subida
 */
export async function uploadFaceSwapImage(
  imageData: string,
  userId: string,
  faceSwapId: string
): Promise<string> {
  try {
    // Extraer el base64 del data URI
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Obtener el bucket de Storage
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    // Definir la ruta del archivo
    const filePath = `faceSwaps/${userId}/${faceSwapId}.png`;
    const file = bucket.file(filePath);

    // Subir el archivo
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          faceSwapId,
          userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Hacer el archivo público
    await file.makePublic();

    // Obtener la URL pública
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    console.log(`✅ Imagen subida a Storage: ${publicUrl}`);
    return publicUrl;

  } catch (error: any) {
    console.error('❌ Error subiendo imagen a Storage:', error.message);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
}

/**
 * Elimina una imagen de Face Swap de Firebase Storage
 * @param userId - ID del usuario
 * @param faceSwapId - ID del face swap
 */
export async function deleteFaceSwapImage(
  userId: string,
  faceSwapId: string
): Promise<void> {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const filePath = `faceSwaps/${userId}/${faceSwapId}.png`;

    await bucket.file(filePath).delete();

    console.log(`✅ Imagen eliminada de Storage: ${filePath}`);
  } catch (error: any) {
    console.error('❌ Error eliminando imagen de Storage:', error.message);
    throw new Error(`Error al eliminar imagen: ${error.message}`);
  }
}

/**
 * Sube una imagen de template a Firebase Storage
 * @param imageData - Data URI de la imagen en formato base64 o File
 * @param templateId - ID del template
 * @returns URL pública de la imagen subida
 */
export async function uploadTemplateImage(
  imageData: string | Buffer,
  templateId: string
): Promise<string> {
  try {
    let buffer: Buffer;

    // Si es un data URI, extraer el base64
    if (typeof imageData === 'string') {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = imageData;
    }

    // Obtener el bucket de Storage
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    // Definir la ruta del archivo
    const filePath = `templates/${templateId}.png`;
    const file = bucket.file(filePath);

    // Subir el archivo
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          templateId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Hacer el archivo público
    await file.makePublic();

    // Obtener la URL pública
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    console.log(`✅ Template image uploaded to Storage: ${publicUrl}`);
    return publicUrl;

  } catch (error: any) {
    console.error('❌ Error uploading template image to Storage:', error.message);
    throw new Error(`Error al subir imagen de template: ${error.message}`);
  }
}

/**
 * Sube variantes de un template a Firebase Storage
 * @param variants - Array de data URIs o buffers (máximo 3)
 * @param templateId - ID del template
 * @returns Array de URLs públicas de las variantes subidas
 */
export async function uploadTemplateVariants(
  variants: (string | Buffer)[],
  templateId: string
): Promise<string[]> {
  const urls: string[] = [];

  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    // Subir cada variante
    for (let i = 0; i < Math.min(variants.length, 3); i++) {
      const variantData = variants[i];
      if (!variantData) continue;

      let buffer: Buffer;

      // Si es un data URI, extraer el base64
      if (typeof variantData === 'string') {
        const base64Data = variantData.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = variantData;
      }

      // Definir la ruta del archivo
      const filePath = `templates/${templateId}-variant-${i + 1}.png`;
      const file = bucket.file(filePath);

      // Subir el archivo
      await file.save(buffer, {
        metadata: {
          contentType: 'image/png',
          metadata: {
            templateId,
            variantIndex: i + 1,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Hacer el archivo público
      await file.makePublic();

      // Obtener la URL pública
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      urls.push(publicUrl);

      console.log(`✅ Template variant ${i + 1} uploaded: ${publicUrl}`);
    }

    return urls;

  } catch (error: any) {
    console.error('❌ Error uploading template variants:', error.message);
    throw new Error(`Error al subir variantes de template: ${error.message}`);
  }
}

/**
 * Elimina una imagen de template de Firebase Storage
 * @param templateId - ID del template
 */
export async function deleteTemplateImage(templateId: string): Promise<void> {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const filePath = `templates/${templateId}.png`;

    await bucket.file(filePath).delete();

    console.log(`✅ Template image deleted from Storage: ${filePath}`);
  } catch (error: any) {
    console.error('❌ Error deleting template image from Storage:', error.message);
    // Don't throw - deletion is optional
  }
}

/**
 * Elimina las variantes de un template de Firebase Storage
 * @param templateId - ID del template
 */
export async function deleteTemplateVariants(templateId: string): Promise<void> {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    // Intentar eliminar hasta 3 variantes
    for (let i = 1; i <= 3; i++) {
      const filePath = `templates/${templateId}-variant-${i}.png`;
      try {
        await bucket.file(filePath).delete();
        console.log(`✅ Template variant ${i} deleted: ${filePath}`);
      } catch (error) {
        // Ignorar si no existe
      }
    }

  } catch (error: any) {
    console.error('❌ Error deleting template variants:', error.message);
    // Don't throw - deletion is optional
  }
}
