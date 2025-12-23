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
