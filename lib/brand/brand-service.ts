import { BrandConfig, DEFAULT_BRAND } from '@/types/brand';

/**
 * Get brand configuration based on NEXT_PUBLIC_BRAND_NAME environment variable.
 * Called server-side to fetch brand config from Firestore.
 */
export async function getBrandConfig(): Promise<BrandConfig> {
  try {
    // Import Firestore admin dynamically to avoid edge runtime issues
    const { getAdminFirestore } = await import('@/lib/firebase/admin');
    const db = getAdminFirestore();

    // Get brand name from environment variable
    const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GLAMOUR';

    console.log(`🔍 Loading brand config: ${brandName} (from env: NEXT_PUBLIC_BRAND_NAME)`);

    // Load all active brands and match case-insensitively
    // (Firestore doesn't support case-insensitive queries)
    const brandSnapshot = await db
      .collection('brandConfigs')
      .where('isActive', '==', true)
      .get();

    const brandDoc = brandSnapshot.docs.find(
      (doc) => doc.data().name?.toLowerCase() === brandName.toLowerCase()
    );

    if (!brandDoc) {
      console.log(`⚠️ Brand "${brandName}" not found in Firestore, creating default with name: ${brandName}`);
      return {
        ...DEFAULT_BRAND,
        name: brandName,
      };
    }

    const brandData = brandDoc.data();

    const brandConfig: BrandConfig = {
      id: brandDoc.id,
      domain: brandData.domain,
      name: brandData.name,
      logo: brandData.logo,
      favicon: brandData.favicon,
      themeId: brandData.themeId,
      customColors: brandData.customColors,
      isActive: brandData.isActive,
      createdAt: brandData.createdAt?.toDate?.() || new Date(),
      updatedAt: brandData.updatedAt?.toDate?.() || new Date(),
      createdBy: brandData.createdBy,
    };

    console.log(`✅ Brand config loaded: ${brandConfig.name}`);
    console.log(`   Domain in Firestore: ${brandConfig.domain}`);
    console.log(`   Logo: ${brandConfig.logo ? 'Yes' : 'No'}`);

    return brandConfig;
  } catch (error) {
    console.error('❌ Error loading brand config:', error);
    const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GLAMOUR';
    return {
      ...DEFAULT_BRAND,
      name: brandName,
    };
  }
}

