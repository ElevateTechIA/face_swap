/**
 * Template-specific prompts for Face Swap
 *
 * Each template can have a detailed, optimized prompt that describes
 * the exact composition, lighting, and technical requirements for
 * high-quality face swap results.
 */

export const TEMPLATE_PROMPTS: Record<string, string> = {
  'Midnight Celebration': `FACE SWAP ONLY - NOT image generation. Use image 1 as exact base. Preserve its EXACT: framing, composition, zoom level, crop, camera angle, visible area. Replace ONLY facial features (eyes, nose, mouth, facial skin) with face from image 2. DO NOT modify: hairstyle, clothing, body, hands, background, zoom, crop. DO NOT recompose or reframe. Output = image 1 with face replaced. Transfer face characteristics from image 2.`,

  'The Champagne Toast': `FACE SWAP ONLY - NOT image generation. Use image 1 as exact base. Preserve its EXACT: framing, composition, zoom level, crop, camera angle. Replace ONLY facial features (eyes, nose, mouth, facial skin) with face from image 2. DO NOT modify: hairstyle, champagne glass, elegant attire, body, hands, background, bokeh lighting, zoom, crop. DO NOT recompose. Output = image 1 with face replaced.`,

  'Red Velvet Euphoria': `FACE SWAP ONLY - NOT image generation. Use image 1 as exact base. Preserve its EXACT: framing, composition, zoom level, crop, camera angle. Replace ONLY facial features (eyes, nose, mouth, facial skin) with face from image 2. DO NOT modify: hairstyle, red velvet clothing, body, hands, background, lighting, zoom, crop. DO NOT recompose. Output = image 1 with face replaced.`,

  'City Lights Glam': `FACE SWAP ONLY - NOT image generation. Use image 1 as exact base. Preserve its EXACT: framing, composition, zoom level, crop, camera angle. Replace ONLY facial features (eyes, nose, mouth, facial skin) with face from image 2. DO NOT modify: hairstyle, clothing, body, hands, city lights background, bokeh, zoom, crop. DO NOT recompose. Output = image 1 with face replaced.`,

  'Confetti Party': `FACE SWAP ONLY - NOT image generation. Use image 1 as exact base. Preserve its EXACT: framing, composition, zoom level, crop, camera angle. Replace ONLY facial features (eyes, nose, mouth, facial skin) with face from image 2. DO NOT modify: hairstyle, party attire, body, hands, confetti, background, zoom, crop. DO NOT recompose. Output = image 1 with face replaced.`,

  'Elegant Countdown': `FACE SWAP ONLY - NOT image generation. Use image 1 as exact base. Preserve its EXACT: framing, composition, zoom level, crop, camera angle. Replace ONLY facial features (eyes, nose, mouth, facial skin) with face from image 2. DO NOT modify: hairstyle, elegant clothing, body, hands, background, lighting, zoom, crop. DO NOT recompose. Output = image 1 with face replaced.`,

  // Default prompt for other templates
  'default': `FACE SWAP ONLY - NOT image generation. Use image 1 as exact base template. Preserve its EXACT: framing, composition, zoom level, crop, camera angle, visible area. Replace ONLY the facial features (eyes, nose, mouth, facial skin) with those from image 2. CRITICAL: DO NOT change hairstyle, clothing, body, hands, background, zoom level, crop, camera angle. DO NOT recompose, reframe, or generate new scene. Output must be image 1 with ONLY face replaced. Transfer skin tone and facial characteristics from image 2.`
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
