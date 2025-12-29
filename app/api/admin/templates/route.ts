import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyAdminAuth } from '@/lib/api/auth-middleware';
import { uploadTemplateImage, deleteTemplateImage } from '@/lib/firebase/storage';
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
      prompt,
      metadata,
      isActive = true,
      isPremium = false,
    } = body;

    // Validaciones básicas
    if (!title || !description || !imageData || !prompt || !metadata) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
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

    // Crear el template
    const newTemplate: Omit<Template, 'id'> = {
      title,
      description,
      imageUrl,
      prompt,
      metadata,
      isActive,
      isPremium,
      usageCount: 0,
      averageRating: 0,
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
      createdBy: adminUserId,
    };

    await newTemplateRef.set(newTemplate);

    console.log(`✅ Template creado: ${templateId} - ${title}`);

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
      prompt,
      metadata,
      isActive,
      isPremium,
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
    if (metadata !== undefined) updates.metadata = metadata;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isPremium !== undefined) updates.isPremium = isPremium;

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
