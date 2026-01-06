/**
 * Content Moderation
 *
 * Uses Gemini Vision API to detect inappropriate content:
 * - NSFW content
 * - Violence
 * - Minors (require age verification)
 * - Deepfake abuse prevention
 */

export interface ModerationResult {
  safe: boolean;
  flags: string[];
  confidence: number;
  reason?: string;
}

export interface ModerationConfig {
  checkNSFW: boolean;
  checkViolence: boolean;
  checkMinors: boolean;
  strictMode: boolean;
}

const DEFAULT_CONFIG: ModerationConfig = {
  checkNSFW: true,
  checkViolence: true,
  checkMinors: true,
  strictMode: false
};

/**
 * Moderate image content using Gemini Vision
 */
export async function moderateImage(
  imageData: string,
  config: Partial<ModerationConfig> = {}
): Promise<ModerationResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const flags: string[] = [];

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY not set - skipping content moderation');
      return { safe: true, flags: [], confidence: 0 };
    }

    // Extract base64 from data URL
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';

    const prompt = `Analyze this image for content safety. Respond with a JSON object containing:
{
  "nsfw": boolean,
  "violence": boolean,
  "containsMinors": boolean,
  "appropriateForFaceSwap": boolean,
  "concerns": string[] (list of specific concerns if any),
  "confidence": number (0-100)
}

Guidelines:
- nsfw: true if image contains nudity, sexually explicit content, or suggestive poses
- violence: true if image shows weapons, blood, or violent acts
- containsMinors: true if person appears to be under 18 years old
- appropriateForFaceSwap: false if image could be used for malicious deepfakes
- concerns: detailed list of any safety issues found
- confidence: your confidence level in this assessment (0-100)`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent moderation
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.error('❌ Gemini moderation API error:', response.status);
      // Fail open (allow) rather than fail closed to avoid blocking legitimate users
      return { safe: true, flags: [], confidence: 0 };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      console.error('❌ No moderation result from Gemini');
      return { safe: true, flags: [], confidence: 0 };
    }

    const analysis = JSON.parse(resultText);

    // Check flags based on config
    if (fullConfig.checkNSFW && analysis.nsfw) {
      flags.push('NSFW content detected');
    }

    if (fullConfig.checkViolence && analysis.violence) {
      flags.push('Violent content detected');
    }

    if (fullConfig.checkMinors && analysis.containsMinors) {
      flags.push('Image appears to contain a minor');
    }

    if (!analysis.appropriateForFaceSwap) {
      flags.push('Image not appropriate for face swap');
    }

    // Add specific concerns
    if (analysis.concerns && analysis.concerns.length > 0) {
      flags.push(...analysis.concerns);
    }

    const safe = flags.length === 0;

    console.log(`🛡️ Content moderation: ${safe ? 'PASS' : 'FLAGGED'} (${flags.length} flags, ${analysis.confidence}% confidence)`);

    return {
      safe,
      flags,
      confidence: analysis.confidence || 0,
      reason: flags.length > 0 ? flags.join('; ') : undefined
    };

  } catch (error: any) {
    console.error('❌ Content moderation error:', error.message);
    // Fail open - allow the request but log the error
    return {
      safe: true,
      flags: ['Moderation error - manual review needed'],
      confidence: 0,
      reason: `Moderation failed: ${error.message}`
    };
  }
}

/**
 * Moderate multiple images (for group photos)
 */
export async function moderateImages(
  images: string[],
  config?: Partial<ModerationConfig>
): Promise<{
  allSafe: boolean;
  results: ModerationResult[];
  flaggedIndices: number[];
}> {
  const results = await Promise.all(
    images.map(img => moderateImage(img, config))
  );

  const flaggedIndices = results
    .map((r, i) => r.safe ? -1 : i)
    .filter(i => i !== -1);

  return {
    allSafe: flaggedIndices.length === 0,
    results,
    flaggedIndices
  };
}

/**
 * Log moderation result to database for audit trail
 */
export async function logModerationResult(
  userId: string,
  imageId: string,
  result: ModerationResult
): Promise<void> {
  try {
    // In production, log to Firestore or monitoring service
    console.log(`📊 Moderation logged: user=${userId}, image=${imageId}, safe=${result.safe}, flags=${result.flags.join(', ')}`);

    // TODO: Implement actual logging to Firestore
    // const db = getAdminFirestore();
    // await db.collection('moderationLogs').add({
    //   userId,
    //   imageId,
    //   safe: result.safe,
    //   flags: result.flags,
    //   confidence: result.confidence,
    //   timestamp: FieldValue.serverTimestamp()
    // });

  } catch (error) {
    console.error('Failed to log moderation result:', error);
  }
}
