import { NextRequest, NextResponse } from 'next/server';
import { AI_STYLES } from '@/lib/styles/style-configs';

export const runtime = 'nodejs';

// Lista de templates disponibles para el sistema
const AVAILABLE_TEMPLATES = [
  'Midnight Celebration',
  'The Champagne Toast',
  'Red Velvet Euphoria',
  'City Lights Glam',
  'Confetti Party',
  'Elegant Countdown'
];

// Lista de estilos disponibles para el sistema
const AVAILABLE_STYLES = AI_STYLES.map(s => ({
  id: s.id,
  name: s.name,
  category: s.category,
  description: s.description
}));

export async function POST(request: NextRequest) {
  try {
    const { userPrompt } = await request.json();

    if (!userPrompt || userPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'User prompt is required' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('🎨 Interpreting user prompt with Gemini:', userPrompt);

    // Construir el system prompt para Gemini
    const systemPrompt = `You are an AI assistant specialized in interpreting user descriptions for face swap photo generation.

Available templates:
${AVAILABLE_TEMPLATES.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Available styles (${AVAILABLE_STYLES.length} total):
${AVAILABLE_STYLES.slice(0, 20).map((s, i) => `${i + 1}. ${s.id} (${s.category}) - ${s.description}`).join('\n')}

Your task: Analyze the user's description and return a JSON object with:
1. scenario: A clear description of the scene/setting
2. mood: The atmosphere and feeling (max 4-5 words)
3. lighting: Type of lighting described (max 4-5 words)
4. colors: Array of 3-5 main colors mentioned or implied
5. recommendedTemplates: Array of 3 template titles that best match (from available list)
6. recommendedStyles: Array of 3-5 style IDs that best match (from available list)
7. generatedPrompt: An optimized, detailed prompt for image generation (2-3 sentences)

Be creative but accurate. Match the user's intent with available templates and styles.`;

    // Usar Gemini 2.0 Flash para interpretar
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;

    const payload = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nUser description:\n"${userPrompt}"\n\nProvide the JSON response:`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    };

    console.log('🚀 Calling Gemini API...');
    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      throw new Error('Gemini API error');
    }

    const data = await geminiResponse.json();
    console.log('📡 Gemini response received');

    // Extraer el JSON de la respuesta
    const responseText = data.candidates[0].content.parts[0].text;
    let interpretation;

    try {
      // Intentar parsear directamente como JSON
      interpretation = JSON.parse(responseText);
    } catch (parseError) {
      // Si falla, intentar extraer JSON del texto
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        interpretation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from Gemini response');
      }
    }

    // Validar y sanitizar la respuesta
    const validatedInterpretation = {
      scenario: interpretation.scenario || 'A beautiful scene',
      mood: interpretation.mood || 'elegant, festive',
      lighting: interpretation.lighting || 'natural lighting',
      colors: Array.isArray(interpretation.colors)
        ? interpretation.colors.slice(0, 5)
        : ['gold', 'black', 'white'],
      recommendedTemplates: Array.isArray(interpretation.recommendedTemplates)
        ? interpretation.recommendedTemplates.slice(0, 3)
        : AVAILABLE_TEMPLATES.slice(0, 3),
      recommendedStyles: Array.isArray(interpretation.recommendedStyles)
        ? interpretation.recommendedStyles.slice(0, 5)
        : ['natural', 'glam', 'golden-hour'],
      generatedPrompt: interpretation.generatedPrompt || userPrompt
    };

    console.log('✅ Interpretation completed:', validatedInterpretation);

    return NextResponse.json(validatedInterpretation);

  } catch (error: any) {
    console.error('❌ Error in interpret-prompt:', error.message);
    return NextResponse.json(
      { error: 'Failed to interpret prompt', details: error.message },
      { status: 500 }
    );
  }
}
