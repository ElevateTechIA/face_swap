/**
 * Configuración de estilos de IA para Face Swap
 * Sistema escalable de 50+ estilos organizados por categorías
 */

export interface StyleConfig {
  id: string;
  name: string;
  category: StyleCategory;
  description: string;
  prompt: string;
  color: string; // Tailwind gradient classes
  icon?: string; // Emoji o lucide icon name
  isPremium?: boolean;
  isNew?: boolean;
  tags?: string[];
}

export type StyleCategory =
  | 'realistic'
  | 'artistic'
  | 'cinematic'
  | 'fantasy'
  | 'seasonal'
  | 'effects';

export interface StyleCategoryConfig {
  id: StyleCategory;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
  color: string;
}

// ============================================
// CATEGORÍAS DE ESTILOS
// ============================================

export const STYLE_CATEGORIES: StyleCategoryConfig[] = [
  {
    id: 'realistic',
    name: 'Realistic',
    nameEs: 'Realista',
    description: 'Natural and lifelike styles',
    descriptionEs: 'Estilos naturales y realistas',
    icon: '📸',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'artistic',
    name: 'Artistic',
    nameEs: 'Artístico',
    description: 'Painting and artistic effects',
    descriptionEs: 'Efectos de pintura y artísticos',
    icon: '🎨',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    nameEs: 'Cinematográfico',
    description: 'Movie and film styles',
    descriptionEs: 'Estilos de cine y película',
    icon: '🎬',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    nameEs: 'Fantasía',
    description: 'Anime, cartoon and fantasy',
    descriptionEs: 'Anime, cartoon y fantasía',
    icon: '✨',
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'seasonal',
    name: 'Seasonal',
    nameEs: 'Temporal',
    description: 'Holiday and seasonal themes',
    descriptionEs: 'Temas festivos y temporales',
    icon: '🎉',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'effects',
    name: 'Effects',
    nameEs: 'Efectos',
    description: 'Special visual effects',
    descriptionEs: 'Efectos visuales especiales',
    icon: '⚡',
    color: 'from-indigo-500 to-violet-500',
  },
];

// ============================================
// ESTILOS CONFIGURADOS (50+)
// ============================================

export const AI_STYLES: StyleConfig[] = [
  // ========== REALISTIC ==========
  {
    id: 'natural',
    name: 'Natural',
    category: 'realistic',
    description: 'Clean and natural look',
    prompt: 'natural lighting, soft skin, realistic photography, professional portrait',
    color: 'from-green-400 to-emerald-600',
    icon: '🌿',
  },
  {
    id: 'professional',
    name: 'Professional',
    category: 'realistic',
    description: 'Business and corporate style',
    prompt: 'professional studio lighting, sharp details, corporate headshot, business portrait',
    color: 'from-blue-600 to-cyan-600',
    icon: '💼',
  },
  {
    id: 'soft-beauty',
    name: 'Soft Beauty',
    category: 'realistic',
    description: 'Soft and elegant',
    prompt: 'soft diffused lighting, beauty photography, elegant portrait, smooth skin',
    color: 'from-pink-400 to-rose-400',
    icon: '🌸',
  },
  {
    id: 'hd-portrait',
    name: 'HD Portrait',
    category: 'realistic',
    description: 'Ultra high definition',
    prompt: 'ultra high definition, 8K resolution, crisp details, professional photography',
    color: 'from-slate-500 to-gray-600',
    icon: '📷',
  },
  {
    id: 'magazine',
    name: 'Magazine',
    category: 'realistic',
    description: 'Editorial magazine style',
    prompt: 'editorial photography, magazine cover quality, fashion portrait, professional lighting',
    color: 'from-purple-500 to-pink-500',
    icon: '📖',
  },

  // ========== ARTISTIC ==========
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    category: 'artistic',
    description: 'Classic oil painting style',
    prompt: 'oil painting style, classical art, painterly brushstrokes, renaissance portrait',
    color: 'from-amber-600 to-orange-700',
    icon: '🖼️',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    category: 'artistic',
    description: 'Soft watercolor effect',
    prompt: 'watercolor painting, soft colors, artistic portrait, flowing paint effects',
    color: 'from-blue-300 to-cyan-400',
    icon: '💧',
  },
  {
    id: 'sketch',
    name: 'Sketch',
    category: 'artistic',
    description: 'Pencil sketch drawing',
    prompt: 'pencil sketch, hand-drawn portrait, artistic drawing, charcoal effect',
    color: 'from-gray-400 to-slate-500',
    icon: '✏️',
  },
  {
    id: 'digital-art',
    name: 'Digital Art',
    category: 'artistic',
    description: 'Modern digital artwork',
    prompt: 'digital art, modern illustration, vibrant colors, stylized portrait',
    color: 'from-fuchsia-500 to-purple-600',
    icon: '🎨',
  },
  {
    id: 'pop-art',
    name: 'Pop Art',
    category: 'artistic',
    description: 'Bold pop art style',
    prompt: 'pop art style, bold colors, Andy Warhol inspired, graphic portrait',
    color: 'from-red-500 to-yellow-500',
    icon: '🎭',
  },
  {
    id: 'impressionist',
    name: 'Impressionist',
    category: 'artistic',
    description: 'Impressionist painting',
    prompt: 'impressionist painting, Monet style, soft brushstrokes, artistic lighting',
    color: 'from-indigo-400 to-purple-500',
    icon: '🌅',
  },

  // ========== CINEMATIC ==========
  {
    id: 'film-noir',
    name: 'Film Noir',
    category: 'cinematic',
    description: 'Classic black and white',
    prompt: 'film noir style, high contrast black and white, dramatic shadows, 1940s cinema',
    color: 'from-gray-600 to-black',
    icon: '🎞️',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'cinematic',
    description: 'Warm sunset lighting',
    prompt: 'golden hour lighting, warm sunset glow, cinematic portrait, soft backlight',
    color: 'from-yellow-500 to-orange-600',
    icon: '🌅',
  },
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    category: 'cinematic',
    description: 'Retro film aesthetic',
    prompt: 'vintage film grain, 1970s photography, retro colors, analog camera aesthetic',
    color: 'from-amber-500 to-red-600',
    icon: '📹',
  },
  {
    id: 'moody-dark',
    name: 'Moody Dark',
    category: 'cinematic',
    description: 'Dark and dramatic',
    prompt: 'moody dark lighting, dramatic shadows, cinematic dark portrait, low key lighting',
    color: 'from-slate-700 to-black',
    icon: '🌙',
  },
  {
    id: 'blue-hour',
    name: 'Blue Hour',
    category: 'cinematic',
    description: 'Cool blue tones',
    prompt: 'blue hour lighting, cool tones, twilight ambiance, cinematic blue portrait',
    color: 'from-blue-600 to-indigo-700',
    icon: '🌃',
  },
  {
    id: 'blockbuster',
    name: 'Blockbuster',
    category: 'cinematic',
    description: 'Hollywood movie style',
    prompt: 'Hollywood blockbuster style, epic lighting, movie poster quality, dramatic portrait',
    color: 'from-red-600 to-orange-700',
    icon: '🎥',
  },

  // ========== FANTASY ==========
  {
    id: 'anime',
    name: 'Anime',
    category: 'fantasy',
    description: 'Japanese anime style',
    prompt: 'anime style, manga art, Japanese animation, detailed anime portrait',
    color: 'from-pink-400 to-fuchsia-600',
    icon: '🎌',
  },
  {
    id: 'cartoon',
    name: 'Cartoon',
    category: 'fantasy',
    description: 'Animated cartoon style',
    prompt: 'cartoon style, animated character, Pixar style, 3D cartoon portrait',
    color: 'from-orange-400 to-red-500',
    icon: '🎪',
  },
  {
    id: 'comic-book',
    name: 'Comic Book',
    category: 'fantasy',
    description: 'Comic book hero style',
    prompt: 'comic book style, superhero art, bold outlines, halftone dots effect',
    color: 'from-blue-500 to-purple-600',
    icon: '💥',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    category: 'fantasy',
    description: 'Futuristic neon style',
    prompt: 'cyberpunk style, neon lights, futuristic cityscape, sci-fi portrait',
    color: 'from-cyan-500 to-fuchsia-600',
    icon: '🤖',
  },
  {
    id: 'fantasy-hero',
    name: 'Fantasy Hero',
    category: 'fantasy',
    description: 'Epic fantasy character',
    prompt: 'fantasy hero, epic fantasy art, magical portrait, RPG character style',
    color: 'from-purple-600 to-indigo-700',
    icon: '⚔️',
  },
  {
    id: 'ethereal',
    name: 'Ethereal',
    category: 'fantasy',
    description: 'Dreamy and magical',
    prompt: 'ethereal lighting, dreamy atmosphere, magical glow, fairy tale portrait',
    color: 'from-blue-300 to-purple-400',
    icon: '✨',
  },

  // ========== SEASONAL ==========
  {
    id: 'new-year-glam',
    name: 'New Year Glam',
    category: 'seasonal',
    description: 'Glamorous New Year style',
    prompt: 'glamorous New Year celebration, party lights, festive atmosphere, elegant portrait',
    color: 'from-yellow-400 to-pink-600',
    icon: '🎊',
    isNew: true,
  },
  {
    id: 'summer-vibes',
    name: 'Summer Vibes',
    category: 'seasonal',
    description: 'Bright summer aesthetic',
    prompt: 'bright summer lighting, beach vibes, tropical colors, sunny portrait',
    color: 'from-yellow-400 to-orange-500',
    icon: '☀️',
  },
  {
    id: 'autumn-colors',
    name: 'Autumn Colors',
    category: 'seasonal',
    description: 'Warm autumn tones',
    prompt: 'autumn colors, warm fall tones, golden leaves, cozy portrait',
    color: 'from-orange-500 to-red-600',
    icon: '🍂',
  },
  {
    id: 'winter-magic',
    name: 'Winter Magic',
    category: 'seasonal',
    description: 'Snowy winter scene',
    prompt: 'winter wonderland, snow effects, cold tones, magical winter portrait',
    color: 'from-blue-400 to-cyan-500',
    icon: '❄️',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    category: 'seasonal',
    description: 'Spooky Halloween style',
    prompt: 'Halloween theme, spooky atmosphere, orange and black, mysterious portrait',
    color: 'from-orange-600 to-black',
    icon: '🎃',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    category: 'seasonal',
    description: 'Festive Christmas look',
    prompt: 'Christmas festive, holiday lights, red and green tones, cozy winter portrait',
    color: 'from-red-500 to-green-600',
    icon: '🎄',
  },

  // ========== EFFECTS ==========
  {
    id: 'fire',
    name: 'Fire',
    category: 'effects',
    description: 'Fiery effect overlay',
    prompt: 'fire effects, flames overlay, intense heat glow, dramatic fire portrait',
    color: 'from-red-600 to-orange-700',
    icon: '🔥',
    isPremium: true,
  },
  {
    id: 'neon',
    name: 'Neon',
    category: 'effects',
    description: 'Neon light effect',
    prompt: 'neon lights, glowing edges, vibrant neon colors, electric portrait',
    color: 'from-pink-500 to-cyan-500',
    icon: '💡',
  },
  {
    id: 'glitch',
    name: 'Glitch',
    category: 'effects',
    description: 'Digital glitch effect',
    prompt: 'glitch art, digital distortion, RGB split, cybernetic glitch portrait',
    color: 'from-red-500 to-blue-600',
    icon: '📺',
  },
  {
    id: 'holographic',
    name: 'Holographic',
    category: 'effects',
    description: 'Hologram effect',
    prompt: 'holographic effect, iridescent colors, futuristic hologram, rainbow shimmer',
    color: 'from-purple-400 to-pink-500',
    icon: '🌈',
    isPremium: true,
  },
  {
    id: 'lightning',
    name: 'Lightning',
    category: 'effects',
    description: 'Electric lightning effect',
    prompt: 'lightning effects, electric energy, storm power, dramatic lightning portrait',
    color: 'from-blue-400 to-purple-600',
    icon: '⚡',
  },
  {
    id: 'smoke',
    name: 'Smoke',
    category: 'effects',
    description: 'Mysterious smoke effect',
    prompt: 'smoke effects, mysterious atmosphere, fog overlay, ethereal smoke portrait',
    color: 'from-gray-500 to-slate-700',
    icon: '💨',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    category: 'effects',
    description: 'Cosmic galaxy effect',
    prompt: 'galaxy effects, cosmic stars, space nebula, celestial portrait',
    color: 'from-purple-600 to-blue-800',
    icon: '🌌',
    isPremium: true,
  },
  {
    id: 'vintage-glam',
    name: 'Vintage Glam',
    category: 'cinematic',
    description: 'Classic Hollywood glamour',
    prompt: 'vintage Hollywood glamour, classic 1950s style, elegant lighting, timeless beauty',
    color: 'from-rose-500 to-pink-600',
    icon: '💄',
  },
  {
    id: '90s-retro',
    name: '90s Retro',
    category: 'cinematic',
    description: 'Nostalgic 90s aesthetic',
    prompt: '90s aesthetic, retro colors, nostalgic vibe, vintage 1990s photography',
    color: 'from-yellow-400 to-orange-500',
    icon: '📼',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtener estilos por categoría
 */
export function getStylesByCategory(category: StyleCategory): StyleConfig[] {
  return AI_STYLES.filter(style => style.category === category);
}

/**
 * Obtener estilo por ID
 */
export function getStyleById(id: string): StyleConfig | undefined {
  return AI_STYLES.find(style => style.id === id);
}

/**
 * Obtener todos los estilos premium
 */
export function getPremiumStyles(): StyleConfig[] {
  return AI_STYLES.filter(style => style.isPremium);
}

/**
 * Obtener estilos nuevos
 */
export function getNewStyles(): StyleConfig[] {
  return AI_STYLES.filter(style => style.isNew);
}

/**
 * Buscar estilos por término
 */
export function searchStyles(query: string): StyleConfig[] {
  const lowerQuery = query.toLowerCase();
  return AI_STYLES.filter(style =>
    style.name.toLowerCase().includes(lowerQuery) ||
    style.description.toLowerCase().includes(lowerQuery) ||
    style.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
