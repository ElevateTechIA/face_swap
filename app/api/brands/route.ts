import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdminFirestore();

    const snapshot = await db
      .collection('brandConfigs')
      .where('isActive', '==', true)
      .get();

    const brands = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        logo: data.logo,
        domain: data.domain,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error loading brands:', error);
    return NextResponse.json({ brands: [] }, { status: 500 });
  }
}
