/**
 * Template-specific prompts for Face Swap
 *
 * Each template can have a detailed, optimized prompt that describes
 * the exact composition, lighting, and technical requirements for
 * high-quality face swap results.
 */

export const TEMPLATE_PROMPTS: Record<string, string> = {
  'Midnight Celebration': `A vertical 9:16 ultra-realistic New Year / celebration fashion template designed specifically for face swap applications.

A glamorous female subject standing and facing the camera, upper-body portrait framed from mid-torso upward. The subject's face is the primary focal point, clean, centered, evenly lit, and fully unobstructed, with a neutral, soft confident expression suitable for facial landmark detection.

Face & Hair (IMPORTANT):
The face is symmetrical, well-lit, with natural skin texture, no harsh shadows, no motion blur, and no objects crossing facial features.
Hair is long, wavy, and single-tone medium brown, evenly colored from roots to ends (no highlights, no balayage, no color variation). Hair is styled neatly over the shoulders and does not cover the face.

Outfit & Pose:
The woman wears an elegant black sequin evening dress with a deep V neckline.
In one hand, she holds a champagne flute with golden sparkling champagne.
In the other hand, she holds a lit sparkler, positioned away from the face so it does not interfere with facial features.

Background & Atmosphere:
The background features an elegant nighttime celebration scene with soft bokeh city lights, fireworks in the sky, and a large vintage clock suggesting New Year's Eve. Background elements remain softly blurred to keep the face dominant.

Lighting:
Soft, cinematic lighting with warm highlights and balanced exposure on the face. No color cast, no blown highlights, no deep shadows on facial features.

Technical Constraints for Face Swap:
- Vertical 9:16 composition (1080×1920 or higher)
- Face centered horizontally and vertically in the upper-middle frame
- Neutral expression (no extreme smile or mouth open)
- No hats, masks, glasses, hands, hair, or objects crossing the face
- Realistic skin texture, natural proportions
- High facial clarity for accurate landmark detection

Style:
- High-end editorial fashion photography
- Luxury New Year celebration aesthetic
- Cinematic realism
- Clean, polished, DSLR-quality look
- Looks non-AI, professional studio finish

A high-quality face swap where the face from the second image (source) replaces the face of the person in the first image (target). The new face should perfectly integrate into the scene, adopting the exact lighting, shadows, skin tone, and color grading of the first image. It should also maintain the specific features, makeup, and expression of the second image, ensuring a realistic and precise swap.`,

  // Default prompt for other templates
  'default': `A high-quality face swap where the face from the second image (source) replaces the face of the person in the first image (target). The new face should perfectly integrate into the scene, adopting the exact lighting, shadows, skin tone, and color grading of the first image. It should also maintain the specific features, makeup, and expression of the second image, ensuring a realistic and precise swap.`
};

/**
 * Get the appropriate prompt for a given template
 */
export function getTemplatePrompt(templateTitle?: string): string {
  if (!templateTitle) {
    return TEMPLATE_PROMPTS['default'];
  }

  return TEMPLATE_PROMPTS[templateTitle] || TEMPLATE_PROMPTS['default'];
}
