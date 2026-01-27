import { BrandConfig, DEFAULT_BRAND } from '@/types/brand';

/**
 * Get brand configuration based on domain
 * This function will be called on the server side to fetch brand config from Firestore
 */
export async function getBrandConfigByDomain(domain: string): Promise<BrandConfig> {
  try {
    // Import Firestore admin dynamically to avoid edge runtime issues
    const { getAdminFirestore } = await import('@/lib/firebase/admin');
    const db = getAdminFirestore();

    // Normalize domain (remove www., protocol, trailing slash)
    const normalizedDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/$/, '')
      .toLowerCase();

    console.log(`🔍 Looking up brand config for domain: ${normalizedDomain}`);

    // Query Firestore for brand config matching this domain
    const brandSnapshot = await db
      .collection('brandConfigs')
      .where('domain', '==', normalizedDomain)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (brandSnapshot.empty) {
      console.log(`⚠️ No brand config found for ${normalizedDomain}, using default`);
      return DEFAULT_BRAND;
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
    return brandConfig;
  } catch (error) {
    console.error('❌ Error loading brand config:', error);
    return DEFAULT_BRAND;
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
