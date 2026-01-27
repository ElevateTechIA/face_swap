// Template metadata types for dynamic template management

export type Category = 'trending' | 'editorial' | 'new-year' | 'cinematic' | 'party' | 'birthday' | 'casual' | 'professional' | 'date' | 'wedding' | 'graduation' | 'vacation';
export type BodyType = 'athletic' | 'slim' | 'curvy' | 'plus-size' | 'average';
export type StyleTag = 'elegant' | 'casual' | 'professional' | 'party' | 'romantic' | 'edgy' | 'vintage' | 'modern';
export type Mood = 'happy' | 'confident' | 'relaxed' | 'energetic' | 'mysterious' | 'playful';
export type Occasion = 'new-year' | 'birthday' | 'wedding' | 'casual' | 'professional' | 'date' | 'party';
export type Framing = 'close-up' | 'medium' | 'full-body' | 'portrait';
export type Lighting = 'natural' | 'studio' | 'dramatic' | 'soft' | 'neon';
export type ColorPalette = 'warm' | 'cool' | 'neutral' | 'vibrant' | 'pastel';
export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip' | 'blur' | 'rotate';

export interface TemplateMetadata {
  // Physical attributes
  bodyType: BodyType[];
  skinTone?: ('light' | 'medium' | 'dark')[];
  hairLength?: ('short' | 'medium' | 'long')[];

  // Style & aesthetics
  style: StyleTag[];
  mood: Mood[];
  colorPalette: ColorPalette[];

  // Context
  occasion: Occasion[];
  setting: ('indoor' | 'outdoor' | 'studio')[];
  framing: Framing;
  lighting: Lighting;

  // Popularity & quality
  popularityScore?: number; // 0-100, updated based on usage
  qualityScore?: number; // 0-100, based on user ratings

  // Metadata
  tags?: string[];
  ageRange?: ('18-25' | '26-35' | '36-45' | '46+')[];
  gender?: ('male' | 'female' | 'neutral')[];
}

export interface Template {
  // Core identification
  id: string;
  title: string;
  description: string;

  // Assets
  imageUrl: string; // Firebase Storage URL
  thumbnailUrl?: string; // Optional optimized thumbnail
  variants?: string[]; // Array of variant image URLs for carousel (max 3)
  transition?: TransitionType; // Transition effect for carousel (default: 'fade')

  // AI generation
  prompt: string; // Template-specific Gemini prompt

  // Categorization
  categories: Category[]; // Categories where this template appears (e.g., ['trending', 'party', 'new-year'])

  // Multi-tenant support
  websiteUrl?: string; // Optional: Filter templates by website domain (e.g., "glamour-ai.com")

  // Group photo support
  faceCount?: number; // Number of people in template (1 for solo, 2+ for group)
  isGroup?: boolean; // True if template supports multiple faces
  maxFaces?: number; // Maximum faces supported (default: faceCount)

  // Metadata for recommendations
  metadata: TemplateMetadata;

  // Status & management
  isActive: boolean;
  isPremium?: boolean;

  // Analytics
  usageCount: number;
  averageRating?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin user ID
}

// User profile for personalization
export interface UserProfile {
  userId: string;

  // Screener survey answers
  preferredBodyType?: BodyType[];
  preferredOccasions?: Occasion[];
  preferredMood?: Mood[];
  preferredStyle?: StyleTag[];

  // Behavioral data
  viewedTemplates: string[]; // Template IDs
  usedTemplates: { templateId: string; timestamp: Date }[];
  favoriteTemplates?: string[];

  // Answered screener questions tracking
  answeredQuestions?: string[]; // Question IDs already answered

  // Demographics (optional)
  ageRange?: string;
  gender?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Screener Question Translation
export interface QuestionTranslation {
  label: string; // Texto de la pregunta
  options: { [key: string]: string }; // { "athletic": "Atlético", "slim": "Delgado" }
}

// Screener Question (dynamic from database - COMPLETAMENTE DINÁMICO)
export interface ScreenerQuestion {
  id: string;
  isActive: boolean;
  order: number; // For sorting questions
  multiSelect: boolean;
  category?: 'preferences' | 'style' | 'occasions' | 'mood'; // Optional categorization

  // Option keys (language-neutral identifiers)
  optionKeys: string[]; // e.g., ['athletic', 'slim', 'curvy']

  // Translations for all supported languages
  translations: {
    es: QuestionTranslation; // Español
    en: QuestionTranslation; // English
  };

  // Metadata for targeting
  targetGender?: ('male' | 'female' | 'neutral')[];
  minUsageCount?: number; // Show only after N face swaps

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin user ID
}

// Recommendation scoring weights
export const RECOMMENDATION_WEIGHTS = {
  exactMatch: 25,        // Exact match on primary attributes
  partialMatch: 10,      // Partial match on secondary attributes
  popularity: 15,        // Template popularity score
  quality: 15,           // Template quality/rating
  behavioral: 20,        // Based on user's past behavior
  novelty: 15,           // Penalize recently used templates
};
