// Brand configuration types for multi-tenant support

export interface BrandConfig {
  // Core identification
  id: string;

  // Domain configuration
  domain: string; // e.g., "glamour-ai.com", "faceswap-pro.com"

  // Branding assets
  name: string; // App name (e.g., "Glamour AI", "FaceSwap Pro")
  logo: string; // Logo URL from Firebase Storage
  favicon?: string; // Optional favicon URL

  // Theme & styling
  themeId?: string; // Optional theme override
  customColors?: {
    primary?: string;
    secondary?: string;
  };

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin user ID
}

// Default brand configuration (fallback) - reads from env variable
export const DEFAULT_BRAND: BrandConfig = {
  id: 'default',
  domain: 'localhost',
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'GLAMOUR',
  logo: '/logo.png',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
