/**
 * Public Gallery Types
 *
 * Schema for public gallery where users can optionally share their face swaps
 */

export interface PublicGalleryItem {
  // Identification
  id: string;                    // Gallery item ID
  faceSwapId: string;           // Reference to original face swap
  userId: string;               // Creator user ID (anonymized in display)

  // Content
  imageUrl: string;             // Public image URL
  thumbnailUrl?: string;        // Optimized thumbnail
  templateTitle?: string;       // Template used
  style?: string;               // Style applied

  // Metadata
  displayName?: string;         // Optional display name (default: "Anonymous")
  caption?: string;             // Optional user caption

  // Engagement
  likes: number;                // Like count
  views: number;                // View count
  likedBy: string[];            // Array of user IDs who liked (for dedup)

  // Status
  isPublic: boolean;            // Currently public (can be toggled off)
  isModerated: boolean;         // Passed content moderation
  isFeatured?: boolean;         // Featured by admin

  // Timestamps
  publishedAt: Date;            // When made public
  createdAt: Date;              // Original face swap creation
  updatedAt: Date;              // Last modification
}

export interface GalleryFilters {
  sortBy: 'recent' | 'trending' | 'popular' | 'featured';
  timeRange?: 'today' | 'week' | 'month' | 'all';
  style?: string;               // Filter by style
  templateTitle?: string;       // Filter by template
  limit?: number;               // Results per page
  offset?: number;              // Pagination offset
}

export interface GalleryStats {
  totalItems: number;
  totalLikes: number;
  totalViews: number;
  topTemplate?: string;
  topStyle?: string;
}

/**
 * User's gallery settings
 */
export interface UserGallerySettings {
  userId: string;

  // Privacy
  allowPublicSharing: boolean;  // Master toggle
  defaultToPublic: boolean;     // Auto-publish new swaps

  // Display preferences
  displayName?: string;         // Public display name
  showStats: boolean;           // Show view/like counts on own items

  // Notifications
  notifyOnLike: boolean;
  notifyOnFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trending calculation
 * Score = (likes × 2) + views + (recency_bonus)
 */
export function calculateTrendingScore(item: PublicGalleryItem): number {
  const hoursSincePublished = (Date.now() - item.publishedAt.getTime()) / (1000 * 60 * 60);

  // Recency bonus: decreases exponentially
  // New items (< 24h) get bonus, older items penalized
  const recencyBonus = Math.max(0, 100 - hoursSincePublished * 2);

  return (item.likes * 2) + item.views + recencyBonus;
}
