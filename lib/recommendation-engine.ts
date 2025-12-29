import { Template, UserProfile, RECOMMENDATION_WEIGHTS } from '@/types/template';

/**
 * Motor de recomendación de templates basado en perfil del usuario
 */

export interface TemplateScore {
  template: Template;
  score: number;
  breakdown: {
    exactMatch: number;
    partialMatch: number;
    popularity: number;
    quality: number;
    behavioral: number;
    novelty: number;
  };
}

/**
 * Calcula el score de un template para un usuario específico
 */
export function calculateTemplateScore(
  template: Template,
  userProfile: UserProfile | null
): TemplateScore {
  let score = 0;
  const breakdown = {
    exactMatch: 0,
    partialMatch: 0,
    popularity: 0,
    quality: 0,
    behavioral: 0,
    novelty: 0,
  };

  // Si no hay perfil, solo usar popularidad y calidad
  if (!userProfile) {
    breakdown.popularity = calculatePopularityScore(template);
    breakdown.quality = calculateQualityScore(template);
    score = breakdown.popularity + breakdown.quality;

    return { template, score, breakdown };
  }

  // 1. EXACT MATCH (25 puntos) - Coincidencias exactas en atributos primarios
  breakdown.exactMatch = calculateExactMatchScore(template, userProfile);

  // 2. PARTIAL MATCH (10 puntos) - Coincidencias parciales en atributos secundarios
  breakdown.partialMatch = calculatePartialMatchScore(template, userProfile);

  // 3. POPULARITY (15 puntos) - Score de popularidad del template
  breakdown.popularity = calculatePopularityScore(template);

  // 4. QUALITY (15 puntos) - Score de calidad/rating del template
  breakdown.quality = calculateQualityScore(template);

  // 5. BEHAVIORAL (20 puntos) - Basado en comportamiento pasado del usuario
  breakdown.behavioral = calculateBehavioralScore(template, userProfile);

  // 6. NOVELTY (15 puntos) - Penalizar templates usados recientemente
  breakdown.novelty = calculateNoveltyScore(template, userProfile);

  // Score total (máximo 100 puntos)
  score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { template, score, breakdown };
}

/**
 * Calcula score de coincidencias exactas
 */
function calculateExactMatchScore(template: Template, userProfile: UserProfile): number {
  let score = 0;
  const maxScore = RECOMMENDATION_WEIGHTS.exactMatch;

  // Occasion match (más importante - 40% del peso)
  const occasionMatch = userProfile.preferredOccasions?.some(occ =>
    template.metadata.occasion.includes(occ)
  );
  if (occasionMatch) score += maxScore * 0.4;

  // Mood match (30% del peso)
  const moodMatch = userProfile.preferredMood?.some(mood =>
    template.metadata.mood.includes(mood)
  );
  if (moodMatch) score += maxScore * 0.3;

  // Style match (30% del peso)
  const styleMatch = userProfile.preferredStyle?.some(style =>
    template.metadata.style.includes(style)
  );
  if (styleMatch) score += maxScore * 0.3;

  return score;
}

/**
 * Calcula score de coincidencias parciales
 */
function calculatePartialMatchScore(template: Template, userProfile: UserProfile): number {
  let score = 0;
  const maxScore = RECOMMENDATION_WEIGHTS.partialMatch;

  // Body type match (50% del peso)
  const bodyTypeMatch = userProfile.preferredBodyType?.some(body =>
    template.metadata.bodyType.includes(body)
  );
  if (bodyTypeMatch) score += maxScore * 0.5;

  // Color palette preference (30% del peso)
  // Asumimos que usuarios con mood 'energetic' prefieren 'vibrant', etc.
  if (userProfile.preferredMood?.includes('energetic') &&
      template.metadata.colorPalette.includes('vibrant')) {
    score += maxScore * 0.3;
  } else if (userProfile.preferredMood?.includes('relaxed') &&
             template.metadata.colorPalette.includes('pastel')) {
    score += maxScore * 0.3;
  }

  // Setting preference (20% del peso)
  // Templates outdoor para usuarios que prefieren ocasiones casual
  if (userProfile.preferredOccasions?.includes('casual') &&
      template.metadata.setting.includes('outdoor')) {
    score += maxScore * 0.2;
  }

  return score;
}

/**
 * Calcula score de popularidad
 */
function calculatePopularityScore(template: Template): number {
  const maxScore = RECOMMENDATION_WEIGHTS.popularity;
  const usageCount = template.usageCount || 0;

  // Normalizar usage count (asumiendo máximo de 1000 usos como referencia)
  const normalized = Math.min(usageCount / 1000, 1);

  return normalized * maxScore;
}

/**
 * Calcula score de calidad
 */
function calculateQualityScore(template: Template): number {
  const maxScore = RECOMMENDATION_WEIGHTS.quality;
  const qualityScore = template.metadata.qualityScore || 50; // Default 50/100

  // Normalizar quality score (0-100 -> 0-maxScore)
  return (qualityScore / 100) * maxScore;
}

/**
 * Calcula score behavioral
 */
function calculateBehavioralScore(template: Template, userProfile: UserProfile): number {
  let score = 0;
  const maxScore = RECOMMENDATION_WEIGHTS.behavioral;

  // Si el usuario ha usado templates similares (misma ocasión)
  const usedSimilarTemplates = userProfile.usedTemplates?.some(used => {
    // Aquí idealmente compararíamos con el template real, pero por ahora
    // solo verificamos si el usuario tiene historial de uso
    return true; // Simplificado
  });

  if (usedSimilarTemplates && userProfile.usedTemplates?.length > 0) {
    // Dar bonus por templates similares a los que ya ha usado
    const usageBonus = Math.min(userProfile.usedTemplates.length / 10, 1);
    score += maxScore * 0.5 * usageBonus;
  }

  // Si el template está en favoritos
  if (userProfile.favoriteTemplates?.includes(template.id)) {
    score += maxScore * 0.5;
  }

  return score;
}

/**
 * Calcula score de novedad (penaliza templates usados recientemente)
 */
function calculateNoveltyScore(template: Template, userProfile: UserProfile): number {
  const maxScore = RECOMMENDATION_WEIGHTS.novelty;

  // Verificar si el usuario ya usó este template
  const recentUse = userProfile.usedTemplates?.find(used =>
    used.templateId === template.id
  );

  if (!recentUse) {
    // Template nunca usado - score completo
    return maxScore;
  }

  // Calcular hace cuánto tiempo lo usó
  const daysSinceUse = (Date.now() - new Date(recentUse.timestamp).getTime()) / (1000 * 60 * 60 * 24);

  // Penalizar menos con el tiempo (recupera score después de 30 días)
  const noveltyFactor = Math.min(daysSinceUse / 30, 1);

  return noveltyFactor * maxScore;
}

/**
 * Recomienda templates ordenados por score
 */
export function recommendTemplates(
  templates: Template[],
  userProfile: UserProfile | null,
  options: {
    limit?: number;
    minScore?: number;
    onlyActive?: boolean;
    excludePremium?: boolean;
  } = {}
): TemplateScore[] {
  const {
    limit,
    minScore = 0,
    onlyActive = true,
    excludePremium = false,
  } = options;

  // Filtrar templates
  let filteredTemplates = templates;

  if (onlyActive) {
    filteredTemplates = filteredTemplates.filter(t => t.isActive);
  }

  if (excludePremium) {
    filteredTemplates = filteredTemplates.filter(t => !t.isPremium);
  }

  // Calcular scores
  const scoredTemplates = filteredTemplates.map(template =>
    calculateTemplateScore(template, userProfile)
  );

  // Filtrar por score mínimo
  const qualified = scoredTemplates.filter(st => st.score >= minScore);

  // Ordenar por score descendente
  const sorted = qualified.sort((a, b) => b.score - a.score);

  // Limitar resultados si se especifica
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Obtiene templates trending (más usados recientemente)
 */
export function getTrendingTemplates(
  templates: Template[],
  options: {
    limit?: number;
    timeWindowDays?: number;
  } = {}
): Template[] {
  const { limit = 10, timeWindowDays = 7 } = options;

  // Por ahora ordenar por usageCount
  // En el futuro, podríamos filtrar por createdAt dentro del timeWindow
  const trending = templates
    .filter(t => t.isActive)
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, limit);

  return trending;
}

/**
 * Obtiene templates por categoría de ocasión
 */
export function getTemplatesByOccasion(
  templates: Template[],
  occasion: string
): Template[] {
  return templates.filter(t =>
    t.isActive && t.metadata.occasion.includes(occasion as any)
  );
}

/**
 * Busca templates por texto
 */
export function searchTemplates(
  templates: Template[],
  query: string
): Template[] {
  const lowerQuery = query.toLowerCase();

  return templates.filter(t =>
    t.isActive && (
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  );
}
