import { BrandConfig, DEFAULT_BRAND } from '@/types/brand';

/**
 * Get brand configuration based on environment variable
 * This function will be called on the server side to fetch brand config from Firestore
 *
 * Uses NEXT_PUBLIC_BRAND_NAME environment variable to determine which brand to load
 */
export async function getBrandConfigByDomain(domain: string): Promise<BrandConfig> {
  try {
    // Import Firestore admin dynamically to avoid edge runtime issues
    const { getAdminFirestore } = await import('@/lib/firebase/admin');
    const db = getAdminFirestore();

    // Get brand name from environment variable
    const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GLAMOUR';

    console.log(`🔍 Loading brand config: ${brandName} (from env: NEXT_PUBLIC_BRAND_NAME)`);

    // Load brand by name
    const brandSnapshot = await db
      .collection('brandConfigs')
      .where('name', '==', brandName)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (brandSnapshot.empty) {
      console.log(`⚠️ Brand "${brandName}" not found in Firestore, creating default with name: ${brandName}`);
      // Return a default brand with the requested name from env
      return {
        ...DEFAULT_BRAND,
        name: brandName,
      };
    }

    const brandDoc = brandSnapshot.docs[0];
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

/**
 * Get current domain from request headers
 */
export function getDomainFromRequest(headers: Headers): string {
  const host = headers.get('host') || 'localhost';
  return host;
}

/**
 * Client-side hook to get brand config
 */
export function useBrandConfig(): BrandConfig {
  // This will be populated by the BrandProvider context
  // For now, return default
  return DEFAULT_BRAND;
}
