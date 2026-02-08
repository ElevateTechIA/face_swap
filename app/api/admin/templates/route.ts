import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyAdminAuth } from '@/lib/api/auth-middleware';
import { uploadTemplateImage, deleteTemplateImage, uploadTemplateVariants, deleteTemplateVariants } from '@/lib/firebase/storage';
import { Template } from '@/types/template';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

/**
 * GET /api/admin/templates
 * Lista todos los templates (solo admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    await verifyAdminAuth(request);

    const db = getAdminFirestore();
    const templatesRef = db.collection('templates');

    // Obtener todos los templates ordenados por fecha de creación
    const snapshot = await templatesRef.orderBy('createdAt', 'desc').get();

    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    }));

    return NextResponse.json({ templates });

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/templates:', error.message);

    if (error.message.includes('autorizado') || error.message.includes('autenticado')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Error al obtener templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates
 * Crea un nuevo template (solo admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const adminUserId = await verifyAdminAuth(request);

    const body = await request.json();
    const {
      title,
      description,
      imageData, // Base64 image
      variants, // Array of base64 images (optional, max 3)
      prompt,
      categories = ['trending'], // Default to trending
      metadata,
      isActive = true,
      isPremium = false,
      slots,
      websiteUrl,
      transition,
    } = body;

    // Validaciones básicas
    if (!title || !description || !imageData || !prompt || !metadata) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que categories sea un array y no esté vacío
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos una categoría' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const templatesRef = db.collection('templates');

    // Crear el documento con ID auto-generado
    const newTemplateRef = templatesRef.doc();
    const templateId = newTemplateRef.id;

    // Subir imagen a Storage
    let imageUrl = '';
    try {
      imageUrl = await uploadTemplateImage(imageData, templateId);
    } catch (uploadError: any) {
      console.error('Error uploading template image:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir la imagen del template' },
        { status: 500 }
      );
    }

    // Subir variantes si se proporcionan
    let variantUrls: string[] = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      try {
        // Filtrar solo las variantes que son URLs nuevas (base64)
        const newVariants = variants.filter(v =>
          typeof v === 'string' && v.startsWith('data:')
        );

        if (newVariants.length > 0) {
          variantUrls = await uploadTemplateVariants(newVariants, templateId);
          console.log(`✅ ${variantUrls.length} variantes subidas`);
        }
      } catch (uploadError: any) {
        console.error('Error uploading template variants:', uploadError);
        // No fallar si las variantes no se pueden subir - son opcionales
      }
    }

    // Crear el template
    const newTemplate: any = {
      title,
      description,
      imageUrl,
      prompt,
      categories,
      metadata,
      isActive,
      isPremium,
      usageCount: 0,
      averageRating: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: adminUserId,
    };

    // Save websiteUrl if provided
    if (websiteUrl) {
      newTemplate.websiteUrl = websiteUrl;
    }

    // Save transition if provided
    if (transition) {
      newTemplate.transition = transition;
    }

    // Agregar variantes si existen
    if (variantUrls.length > 0) {
      newTemplate.variants = variantUrls;
    }

    // Add slots if provided
    if (slots && Array.isArray(slots) && slots.length > 0) {
      newTemplate.slots = slots;
      newTemplate.isGroup = slots.length > 1;
      newTemplate.faceCount = slots.length;
      newTemplate.maxFaces = slots.length;
      console.log(`📋 Slots saved: ${slots.length} slots`, JSON.stringify(slots));
    }

    await newTemplateRef.set(newTemplate);

    console.log(`✅ Template creado: ${templateId} - ${title} (slots: ${slots?.length || 0})`);

    return NextResponse.json({
      success: true,
      templateId,
      message: 'Template creado exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/admin/templates:', error.message);

    if (error.message.includes('autorizado') || error.message.includes('autenticado')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Error al crear template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/templates
 * Actualiza un template existente (solo admin)
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    await verifyAdminAuth(request);

    const body = await request.json();
    const {
      templateId,
      title,
      description,
      imageData, // Optional - solo si se actualiza la imagen
      variants, // Optional - array of base64 images or URLs
      prompt,
      categories,
      metadata,
      isActive,
      isPremium,
      slots,
      websiteUrl,
      transition,
    } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Se requiere templateId' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const templateRef = db.collection('templates').doc(templateId);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    const updates: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Actualizar solo los campos proporcionados
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (prompt !== undefined) updates.prompt = prompt;
    if (categories !== undefined) {
      // Validar que categories sea un array y no esté vacío
      if (!Array.isArray(categories) || categories.length === 0) {
        return NextResponse.json(
          { error: 'Debe seleccionar al menos una categoría' },
          { status: 400 }
        );
      }
      updates.categories = categories;
    }
    if (metadata !== undefined) updates.metadata = metadata;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isPremium !== undefined) updates.isPremium = isPremium;
    if (websiteUrl !== undefined) updates.websiteUrl = websiteUrl || null;
    if (transition !== undefined) updates.transition = transition;
    if (slots !== undefined) {
      updates.slots = slots;
      if (Array.isArray(slots) && slots.length > 0) {
        updates.isGroup = slots.length > 1;
        updates.faceCount = slots.length;
        updates.maxFaces = slots.length;
      }
    }

    // Si se proporciona nueva imagen, subirla
    if (imageData) {
      try {
        const imageUrl = await uploadTemplateImage(imageData, templateId);
        updates.imageUrl = imageUrl;
      } catch (uploadError: any) {
        console.error('Error uploading template image:', uploadError);
        return NextResponse.json(
          { error: 'Error al subir la nueva imagen' },
          { status: 500 }
        );
      }
    }

    // Si se proporcionan variantes, procesarlas
    if (variants !== undefined) {
      try {
        // Separar variantes nuevas (base64) de existentes (URLs)
        const newVariants = variants.filter((v: string) =>
          typeof v === 'string' && v.startsWith('data:')
        );
        const existingVariants = variants.filter((v: string) =>
          typeof v === 'string' && v.startsWith('http')
        );

        let variantUrls = [...existingVariants];

        // Subir nuevas variantes si hay
        if (newVariants.length > 0) {
          const uploadedUrls = await uploadTemplateVariants(newVariants, templateId);
          variantUrls.push(...uploadedUrls);
          console.log(`✅ ${uploadedUrls.length} nuevas variantes subidas`);
        }

        // Actualizar el campo variants
        updates.variants = variantUrls.length > 0 ? variantUrls : [];

      } catch (uploadError: any) {
        console.error('Error uploading template variants:', uploadError);
        // No fallar si las variantes no se pueden subir - son opcionales
      }
    }

    await templateRef.update(updates);

    console.log(`✅ Template actualizado: ${templateId}`);

    return NextResponse.json({
      success: true,
      message: 'Template actualizado exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error en PUT /api/admin/templates:', error.message);

    if (error.message.includes('autorizado') || error.message.includes('autenticado')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Error al actualizar template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates
 * Elimina un template (solo admin)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    await verifyAdminAuth(request);

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Se requiere templateId' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const templateRef = db.collection('templates').doc(templateId);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar imagen de Storage
    await deleteTemplateImage(templateId);

    // Eliminar documento de Firestore
    await templateRef.delete();

    console.log(`✅ Template eliminado: ${templateId}`);

    return NextResponse.json({
      success: true,
      message: 'Template eliminado exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error en DELETE /api/admin/templates:', error.message);

    if (error.message.includes('autorizado') || error.message.includes('autenticado')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Error al eliminar template' },
      { status: 500 }
    );
  }
}
