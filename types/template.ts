// Template metadata types for dynamic template management

export type BodyType = 'athletic' | 'slim' | 'curvy' | 'plus-size' | 'average';
export type StyleTag = 'elegant' | 'casual' | 'professional' | 'party' | 'romantic' | 'edgy' | 'vintage' | 'modern';
export type Mood = 'happy' | 'confident' | 'relaxed' | 'energetic' | 'mysterious' | 'playful';
export type Occasion = 'new-year' | 'birthday' | 'wedding' | 'casual' | 'professional' | 'date' | 'party';
export type Framing = 'close-up' | 'medium' | 'full-body' | 'portrait';
export type Lighting = 'natural' | 'studio' | 'dramatic' | 'soft' | 'neon';
export type ColorPalette = 'warm' | 'cool' | 'neutral' | 'vibrant' | 'pastel';

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

  // AI generation
  prompt: string; // Template-specific Gemini prompt

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

  // Demographics (optional)
  ageRange?: string;
  gender?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Screener survey structure
export interface ScreenerQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    icon?: string; // Lucide icon name
  }[];
  multiSelect: boolean;
}

export const SCREENER_QUESTIONS: ScreenerQuestion[] = [
  {
    id: 'bodyType',
    question: '¿Qué tipo de cuerpo prefieres ver en las fotos?',
    multiSelect: true,
    options: [
      { value: 'athletic', label: 'Atlético', icon: 'Dumbbell' },
      { value: 'slim', label: 'Delgado', icon: 'User' },
      { value: 'curvy', label: 'Curvilíneo', icon: 'Heart' },
      { value: 'plus-size', label: 'Grande', icon: 'Users' },
      { value: 'average', label: 'Promedio', icon: 'UserCircle' },
    ],
  },
  {
    id: 'occasions',
    question: '¿Para qué ocasiones quieres crear Face Swaps?',
    multiSelect: true,
    options: [
      { value: 'new-year', label: 'Año Nuevo', icon: 'Sparkles' },
      { value: 'birthday', label: 'Cumpleaños', icon: 'Cake' },
      { value: 'wedding', label: 'Boda', icon: 'Heart' },
      { value: 'casual', label: 'Casual', icon: 'Coffee' },
      { value: 'professional', label: 'Profesional', icon: 'Briefcase' },
      { value: 'date', label: 'Cita', icon: 'Wine' },
      { value: 'party', label: 'Fiesta', icon: 'Music' },
    ],
  },
  {
    id: 'mood',
    question: '¿Qué tipo de vibe buscas?',
    multiSelect: true,
    options: [
      { value: 'happy', label: 'Feliz', icon: 'Smile' },
      { value: 'confident', label: 'Confiado', icon: 'Zap' },
      { value: 'relaxed', label: 'Relajado', icon: 'Coffee' },
      { value: 'energetic', label: 'Energético', icon: 'Bolt' },
      { value: 'mysterious', label: 'Misterioso', icon: 'Eye' },
      { value: 'playful', label: 'Juguetón', icon: 'PartyPopper' },
    ],
  },
  {
    id: 'stylePreference',
    question: '¿Qué estilo te gusta más?',
    multiSelect: true,
    options: [
      { value: 'elegant', label: 'Elegante', icon: 'Crown' },
      { value: 'casual', label: 'Casual', icon: 'Shirt' },
      { value: 'professional', label: 'Profesional', icon: 'Briefcase' },
      { value: 'party', label: 'Fiesta', icon: 'Music' },
      { value: 'romantic', label: 'Romántico', icon: 'Heart' },
      { value: 'edgy', label: 'Atrevido', icon: 'Flame' },
      { value: 'vintage', label: 'Vintage', icon: 'Camera' },
      { value: 'modern', label: 'Moderno', icon: 'Sparkles' },
    ],
  },
];

// Recommendation scoring weights
export const RECOMMENDATION_WEIGHTS = {
  exactMatch: 25,        // Exact match on primary attributes
  partialMatch: 10,      // Partial match on secondary attributes
  popularity: 15,        // Template popularity score
  quality: 15,           // Template quality/rating
  behavioral: 20,        // Based on user's past behavior
  novelty: 15,           // Penalize recently used templates
};
