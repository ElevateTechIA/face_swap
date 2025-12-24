/**
 * Template-specific prompts for Face Swap
 *
 * Each template can have a detailed, optimized prompt that describes
 * the exact composition, lighting, and technical requirements for
 * high-quality face swap results.
 */

export const TEMPLATE_PROMPTS: Record<string, string> = {
  'Midnight Celebration': `Perform a precise face swap operation:

1. Extract the face from the SECOND image (the user's selfie)
2. Replace the face in the FIRST image (the template) with this extracted face
3. The swapped face must:
   - Match the exact head position, angle and pose of the original face in the first image
   - Adopt the lighting, shadows, and color temperature from the first image's environment
   - Maintain the facial features, eyes, nose, mouth, and bone structure from the second image
   - Blend seamlessly at the edges (hairline, jawline, neck)
   - Preserve the same expression and head tilt as the original face in the first image
   - Keep natural skin texture and realistic details
4. Everything else in the first image (hair, body, clothing, background, accessories) must remain completely unchanged
5. The result should look like a professional, undetectable face replacement

Important: This is a FACE SWAP, not image generation. Only the face region should be replaced. The hair, body, hands, clothing, champagne glass, sparkler, and entire background from the first image must stay exactly the same.`,

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
