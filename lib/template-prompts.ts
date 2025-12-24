/**
 * Template-specific prompts for Face Swap
 *
 * Each template can have a detailed, optimized prompt that describes
 * the exact composition, lighting, and technical requirements for
 * high-quality face swap results.
 */

export const TEMPLATE_PROMPTS: Record<string, string> = {
  'Midnight Celebration': `Based on the first image, the scene shows a glamorous woman wearing an elegant black sequin evening dress with a deep V-neckline. She holds a champagne flute with golden sparkling champagne in one hand and a lit sparkler in the other. The background features an elegant nighttime New Year's Eve celebration with soft bokeh city lights, fireworks in the sky, and a vintage clock. The lighting is soft, cinematic with warm golden highlights.

The face of the woman in this scene is replaced with the face from the second image (the user's photo). Preserve exactly: skin tone, all facial features (eyes, nose, mouth, bone structure), any makeup, eyebrows, freckles, moles, piercings, facial hair, or glasses present in the second image.

The warm golden light from the sparkler and the soft ambient celebration lighting must illuminate the new face, creating realistic highlights on the cheekbones and nose, and natural shadows under the chin and around the facial contours. The face must blend seamlessly at the hairline, jawline, and neck, matching the head position and angle of the original. Everything else - the long wavy brown hair, the black sequin dress, the champagne glass, the sparkler, hands, body, and entire background - remains completely unchanged.`,

  'The Champagne Toast': `Based on the first image, the scene shows an elegant person in sophisticated New Year's attire raising a champagne glass in a celebratory toast. The setting features warm, luxurious lighting with golden bokeh effects suggesting an upscale celebration venue. The atmosphere is festive and refined.

The face in this scene is replaced with the face from the second image (the user's photo). Maintain exactly: skin tone, facial structure, eyes, nose, mouth, any makeup, eyebrows, beauty marks, piercings, facial hair, or eyewear from the second image.

The warm golden ambient lighting from the celebration venue must illuminate the new face naturally, casting soft shadows that match the scene's lighting direction. Highlights should appear on prominent facial features while maintaining natural skin texture. The face integrates seamlessly at all edges. Everything else in the first image - hair, clothing, the champagne glass, hands, body posture, and background - stays exactly as it was.`,

  'Red Velvet Euphoria': `Based on the first image, the scene features a person in luxurious red velvet attire against an opulent backdrop suggesting celebration and elegance. The lighting is rich and warm, creating a glamorous, high-fashion aesthetic with deep red tones dominating the color palette.

The face in this glamorous scene is replaced with the face from the second image (the user's photo). Keep intact: exact skin tone, all facial features including eyes, nose, mouth, facial structure, any makeup application, eyebrows, moles, piercings, facial hair, or glasses present in the second image.

The warm, luxurious red-toned lighting of the scene must illuminate the new face, creating depth through highlights and shadows that match the environment. The lighting should enhance the facial features naturally while maintaining realistic skin texture. Seamless blending at hairline, jaw, and neck is essential. All other elements from the first image - hair, red velvet clothing, accessories, body, hands, and background - remain completely unaltered.`,

  'City Lights Glam': `Based on the first image, the scene shows a glamorous figure against a backdrop of blurred city lights at night, creating a sophisticated urban atmosphere. The lighting features cool-toned bokeh effects from the cityscape, mixed with strategic portrait lighting that creates an editorial fashion photography look.

The face in this urban glamour scene is replaced with the face from the second image (the user's photo). Preserve exactly: skin tone, facial features (eyes, nose, mouth, bone structure), makeup, eyebrows, any freckles, moles, piercings, facial hair, or glasses from the second image.

The cool-toned city lights and portrait lighting must illuminate the new face, creating highlights that emphasize the facial contours and natural shadows that add dimension. The lighting should feel cinematic and match the urban night environment. Perfect blending at all facial boundaries is required. Everything else in the first image - hairstyle, clothing, accessories, body posture, hands, and the entire city lights background - stays exactly unchanged.`,

  'Confetti Party': `Based on the first image, the scene captures a joyful person celebrating in a shower of colorful confetti. The setting is energetic and festive with dynamic lighting that catches the falling confetti particles. The atmosphere is playful and celebratory with vibrant colors and movement.

The face in this festive scene is replaced with the face from the second image (the user's photo). Maintain exactly: skin tone, all facial characteristics including eyes, nose, mouth, facial structure, any makeup, eyebrows, beauty marks, piercings, facial hair, or eyewear from the second image.

The dynamic party lighting, reflecting off the confetti, must illuminate the new face creating natural highlights and playful light variations. The lighting should capture the energetic mood while maintaining realistic shadows and skin texture. The face must blend seamlessly into the scene. All other elements from the first image - hair, party attire, confetti, hands, body, background, and any props - remain completely unchanged.`,

  'Elegant Countdown': `Based on the first image, the scene shows a sophisticated person in an elegant setting prepared for the midnight countdown. The atmosphere suggests refined celebration with subtle, tasteful decorations and sophisticated lighting. The mood is anticipatory and classy.

The face in this elegant scene is replaced with the face from the second image (the user's photo). Preserve exactly: skin tone, facial features (eyes, nose, mouth, structure), any makeup application, eyebrows, moles, freckles, piercings, facial hair, or glasses present in the second image.

The refined, elegant lighting of the countdown setting must illuminate the new face with balanced, flattering light that creates natural dimension through subtle highlights and shadows. The skin should maintain realistic texture while looking polished. Seamless integration at all facial edges is critical. Everything else from the first image - hairstyle, elegant clothing, any accessories, body, hands, and the sophisticated background - stays exactly as in the original.`,

  // Default prompt for other templates
  'default': `Based on the first image, the scene shows a person in a specific setting with particular lighting and atmosphere. The face of the person in this scene is replaced with the face from the second image (the user's photo). Preserve exactly: skin tone, all facial features including eyes, nose, mouth, facial structure, any makeup, eyebrows, moles, freckles, piercings, facial hair, or glasses from the second image. The lighting from the first image's environment must illuminate the new face naturally, creating realistic highlights and shadows that integrate the face seamlessly. Everything else in the first image - hair, clothing, body, hands, accessories, and background - remains completely unchanged. This is a face swap, not image generation.`
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
