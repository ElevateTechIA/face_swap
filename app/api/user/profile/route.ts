import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

/**
 * GET /api/user/profile
 * Obtiene el perfil del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyUserAuth(request);

    const db = getAdminFirestore();
    const profileRef = db.collection('userProfiles').doc(userId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json({
        profile: null,
        message: 'Perfil no encontrado',
      });
    }

    const profile = {
      ...profileDoc.data(),
      createdAt: profileDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: profileDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
    };

    return NextResponse.json({ profile });

  } catch (error: any) {
    console.error('❌ Error en GET /api/user/profile:', error.message);

    if (error.message.includes('autenticado')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/profile
 * Crea o actualiza el perfil del usuario con respuestas del screener survey
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyUserAuth(request);
    const body = await request.json();

    const {
      preferredBodyType,
      preferredOccasions,
      preferredMood,
      preferredStyle,
    } = body;

    // Validaciones básicas
    if (!preferredBodyType && !preferredOccasions && !preferredMood && !preferredStyle) {
      return NextResponse.json(
        { error: 'Se requiere al menos una preferencia' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const profileRef = db.collection('userProfiles').doc(userId);
    const profileDoc = await profileRef.get();

    const now = FieldValue.serverTimestamp();

    if (profileDoc.exists) {
      // Actualizar perfil existente
      const updates: any = {
        updatedAt: now,
      };

      if (preferredBodyType) updates.preferredBodyType = preferredBodyType;
      if (preferredOccasions) updates.preferredOccasions = preferredOccasions;
      if (preferredMood) updates.preferredMood = preferredMood;
      if (preferredStyle) updates.preferredStyle = preferredStyle;

      await profileRef.update(updates);

      console.log(`✅ Perfil actualizado para usuario: ${userId}`);

      return NextResponse.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
      });

    } else {
      // Crear nuevo perfil
      const newProfile = {
        userId,
        preferredBodyType: preferredBodyType || [],
        preferredOccasions: preferredOccasions || [],
        preferredMood: preferredMood || [],
        preferredStyle: preferredStyle || [],
        viewedTemplates: [],
        usedTemplates: [],
        favoriteTemplates: [],
        createdAt: now,
        updatedAt: now,
      };

      await profileRef.set(newProfile);

      console.log(`✅ Perfil creado para usuario: ${userId}`);

      return NextResponse.json({
        success: true,
        message: 'Perfil creado exitosamente',
        isFirstTime: true,
      });
    }

  } catch (error: any) {
    console.error('❌ Error en POST /api/user/profile:', error.message);

    if (error.message.includes('autenticado')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error al guardar perfil' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Actualiza campos específicos del perfil (usado para tracking behavioral)
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyUserAuth(request);
    const body = await request.json();

    const {
      viewedTemplateId,
      usedTemplateId,
      favoriteTemplateId,
      action, // 'add' or 'remove'
    } = body;

    const db = getAdminFirestore();
    const profileRef = db.collection('userProfiles').doc(userId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json(
        { error: 'Perfil no encontrado. Crea el perfil primero.' },
        { status: 404 }
      );
    }

    const updates: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Track viewed template
    if (viewedTemplateId) {
      const viewedTemplates = profileDoc.data()?.viewedTemplates || [];
      if (!viewedTemplates.includes(viewedTemplateId)) {
        updates.viewedTemplates = FieldValue.arrayUnion(viewedTemplateId);
      }
    }

    // Track used template
    if (usedTemplateId) {
      updates.usedTemplates = FieldValue.arrayUnion({
        templateId: usedTemplateId,
        timestamp: new Date().toISOString(),
      });
    }

    // Track favorite template
    if (favoriteTemplateId) {
      if (action === 'add') {
        updates.favoriteTemplates = FieldValue.arrayUnion(favoriteTemplateId);
      } else if (action === 'remove') {
        updates.favoriteTemplates = FieldValue.arrayRemove(favoriteTemplateId);
      }
    }

    await profileRef.update(updates);

    console.log(`✅ Perfil actualizado (behavioral tracking) para usuario: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error en PATCH /api/user/profile:', error.message);

    if (error.message.includes('autenticado')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
