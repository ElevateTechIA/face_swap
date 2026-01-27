import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin';
import { verifyUserAuth } from '@/lib/api/auth-middleware';
import { BrandConfig } from '@/types/brand';

export const runtime = 'nodejs';

/**
 * GET /api/admin/brands
 * Obtiene todas las configuraciones de marca (solo admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const userId = await verifyUserAuth(request);
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userEmail = userDoc.data()?.email;

    if (!adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Obtener todas las configuraciones de marca
    const brandsSnapshot = await db.collection('brandConfigs').get();

    const brands: BrandConfig[] = brandsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        domain: data.domain,
        name: data.name,
        logo: data.logo,
        favicon: data.favicon,
        themeId: data.themeId,
        customColors: data.customColors,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        createdBy: data.createdBy,
      } as BrandConfig;
    });

    return NextResponse.json({ brands });
  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/brands:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuraciones de marca' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/brands
 * Crea una nueva configuración de marca (solo admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const userId = await verifyUserAuth(request);
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userEmail = userDoc.data()?.email;

    if (!adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { domain, name, logoData, favicon, themeId, customColors, isActive } = body;

    // Validar campos requeridos
    if (!domain || !name || !logoData) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, name, logoData' },
        { status: 400 }
      );
    }

    // Verificar que no exista otra configuración con el mismo dominio
    const existingBrand = await db
      .collection('brandConfigs')
      .where('domain', '==', domain)
      .limit(1)
      .get();

    if (!existingBrand.empty) {
      return NextResponse.json(
        { error: 'Brand configuration already exists for this domain' },
        { status: 409 }
      );
    }

    // Subir logo a Firebase Storage
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    const logoBuffer = Buffer.from(logoData.split(',')[1], 'base64');
    const logoFileName = `brands/${domain.replace(/\./g, '-')}-${Date.now()}.png`;
    const logoFile = bucket.file(logoFileName);

    await logoFile.save(logoBuffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          uploadedBy: userId,
          domain: domain,
        }
      }
    });

    await logoFile.makePublic();
    const logoUrl = `https://storage.googleapis.com/${bucket.name}/${logoFileName}`;

    console.log(`✅ Logo uploaded: ${logoUrl}`);

    // Crear nueva configuración
    const newBrand = {
      domain,
      name,
      logo: logoUrl,
      favicon: favicon || null,
      themeId: themeId || null,
      customColors: customColors || null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    const docRef = await db.collection('brandConfigs').add(newBrand);

    return NextResponse.json({
      success: true,
      brandId: docRef.id,
      brand: { id: docRef.id, ...newBrand },
    });
  } catch (error: any) {
    console.error('❌ Error en POST /api/admin/brands:', error);
    return NextResponse.json(
      { error: 'Error al crear configuración de marca' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/brands
 * Actualiza una configuración de marca existente (solo admin)
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const userId = await verifyUserAuth(request);
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userEmail = userDoc.data()?.email;

    if (!adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, domain, name, logoData, favicon, themeId, customColors, isActive } = body;

    // Validar campos requeridos
    if (!id) {
      return NextResponse.json({ error: 'Missing brand ID' }, { status: 400 });
    }

    // Obtener el dominio actual antes de actualizar
    const currentBrandDoc = await db.collection('brandConfigs').doc(id).get();
    const currentDomain = currentBrandDoc.data()?.domain;

    // Actualizar configuración
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (domain !== undefined) updateData.domain = domain;
    if (name !== undefined) updateData.name = name;
    if (favicon !== undefined) updateData.favicon = favicon;
    if (themeId !== undefined) updateData.themeId = themeId;
    if (customColors !== undefined) updateData.customColors = customColors;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Si hay nuevo logo, subirlo a Firebase Storage
    if (logoData) {
      const storage = getAdminStorage();
      const bucket = storage.bucket();

      const logoBuffer = Buffer.from(logoData.split(',')[1], 'base64');
      const logoFileName = `brands/${domain || id}-${Date.now()}.png`;
      const logoFile = bucket.file(logoFileName);

      await logoFile.save(logoBuffer, {
        metadata: {
          contentType: 'image/png',
          metadata: {
            uploadedBy: userId,
            brandId: id,
          }
        }
      });

      await logoFile.makePublic();
      const logoUrl = `https://storage.googleapis.com/${bucket.name}/${logoFileName}`;

      updateData.logo = logoUrl;
      console.log(`✅ Logo updated: ${logoUrl}`);
    }

    await db.collection('brandConfigs').doc(id).update(updateData);

    // Si el dominio cambió, actualizar todos los templates asociados
    if (domain && currentDomain && domain !== currentDomain) {
      console.log(`🔄 Actualizando templates de ${currentDomain} a ${domain}...`);

      const templatesSnapshot = await db
        .collection('templates')
        .where('websiteUrl', '==', currentDomain)
        .get();

      const batch = db.batch();
      let updatedTemplatesCount = 0;

      templatesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          websiteUrl: domain,
          updatedAt: new Date(),
        });
        updatedTemplatesCount++;
      });

      if (updatedTemplatesCount > 0) {
        await batch.commit();
        console.log(`✅ ${updatedTemplatesCount} templates actualizados con el nuevo dominio`);
      }

      return NextResponse.json({
        success: true,
        message: 'Brand configuration updated successfully',
        templatesUpdated: updatedTemplatesCount,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Brand configuration updated successfully',
    });
  } catch (error: any) {
    console.error('❌ Error en PUT /api/admin/brands:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración de marca' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/brands
 * Elimina una configuración de marca (solo admin)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const userId = await verifyUserAuth(request);
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userEmail = userDoc.data()?.email;

    if (!adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing brand ID' }, { status: 400 });
    }

    await db.collection('brandConfigs').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Brand configuration deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error en DELETE /api/admin/brands:', error);
    return NextResponse.json(
      { error: 'Error al eliminar configuración de marca' },
      { status: 500 }
    );
  }
}
