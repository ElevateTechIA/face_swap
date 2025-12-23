import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const db = getAdminFirestore();

    // Obtener todos los paquetes activos
    const packagesSnapshot = await db
      .collection('creditPackages')
      .where('active', '==', true)
      .orderBy('priceUSD', 'asc')
      .get();

    const packages = packagesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        packageId: doc.id,
        name: data.name,
        credits: data.credits,
        priceUSD: data.priceUSD,
        stripePriceId: data.stripePriceId,
        stripeProductId: data.stripeProductId,
        description: data.description,
        popular: data.popular || false,
      };
    });

    console.log(`📦 Paquetes disponibles: ${packages.length}`);

    return NextResponse.json({ packages });
  } catch (error: any) {
    console.error('❌ Error en GET /api/credits/packages:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener paquetes de créditos' },
      { status: 500 }
    );
  }
}
