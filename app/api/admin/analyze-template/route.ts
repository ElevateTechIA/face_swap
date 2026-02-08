import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/api/auth-middleware';

export const runtime = 'nodejs';

/**
 * POST /api/admin/analyze-template
 * Analiza una imagen de template con Gemini AI y extrae metadata automáticamente
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    await verifyAdminAuth(request);

    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Se requiere imageData' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'Gemini API no configurada' },
        { status: 500 }
      );
    }

    console.log('✅ GEMINI_API_KEY encontrada');
    console.log('📊 Tamaño de imageData:', (imageData.length / 1024).toFixed(2), 'KB');

    // Extraer el tipo MIME de la imagen
    const mimeTypeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    console.log('🖼️ Tipo MIME detectado:', mimeType);

    // Convertir base64 a formato que Gemini entiende
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    console.log('🔄 Enviando imagen a Gemini AI...');

    const prompt = `Analiza esta imagen de template para Face Swap y extrae la siguiente información en formato JSON.

IMPORTANTE: Responde con un OBJETO JSON (no un array), con esta estructura exacta:

{
  "title": "Un título corto y descriptivo (máx 50 caracteres)",
  "description": "Descripción detallada de la escena (máx 150 caracteres)",
  "prompt": "A detailed face swap prompt for Gemini. The prompt will be sent along with two images: the first image is the TEMPLATE (reference scene), the second image is the USER'S FACE to swap in. The prompt must instruct Gemini to recreate the template scene but with the user's face, skin tone, and hairstyle from the second image.",
  "bodyType": ["athletic", "slim", "curvy", "plus-size", "average"],
  "style": ["elegant", "casual", "professional", "party", "romantic", "edgy", "vintage", "modern"],
  "mood": ["happy", "confident", "relaxed", "energetic", "mysterious", "playful"],
  "occasion": ["new-year", "birthday", "wedding", "casual", "professional", "date", "party"],
  "framing": "close-up" | "medium" | "full-body" | "portrait",
  "lighting": "natural" | "studio" | "dramatic" | "soft" | "neon",
  "colorPalette": ["warm", "cool", "neutral", "vibrant", "pastel"],
  "setting": ["indoor", "outdoor", "studio"],
  "slots": [
    { "type": "person" | "woman" | "man" | "girl" | "boy" | "baby" | "pet", "label": "optional descriptive label" }
  ]
}

Analiza cuidadosamente:
- Los colores predominantes y la iluminación
- El tipo de ropa, accesorios y estilo visual
- La pose, expresión y lenguaje corporal
- El ambiente, fondo y contexto de la escena
- La ocasión o evento que representa
- El mood y atmósfera general
- El tipo de cuerpo que se vería mejor en esta escena
- El encuadre (close-up, cuerpo completo, etc)

For the "slots" array, identify ALL distinct subjects in the image:
- Count every distinct person, animal, or baby visible
- For each subject, determine the most specific type: woman, man, girl, boy, baby, or pet
- If gender/age cannot be determined, use "person"
- Include pets (dogs, cats, etc.) as "pet" type
- Order slots left-to-right as they appear in the image
- For a single person template, return an array with ONE slot
- Add a label only for multi-subject templates (e.g., "Dad", "Mom", "Dog")
- Examples:
  - Single woman portrait → [{"type": "woman"}]
  - Man and dog → [{"type": "man"}, {"type": "pet", "label": "Dog"}]
  - Two women → [{"type": "woman"}, {"type": "woman"}]
  - Family → [{"type": "man", "label": "Dad"}, {"type": "woman", "label": "Mom"}, {"type": "boy", "label": "Son"}]

Para el "prompt" de Gemini, genera instrucciones técnicas específicas que:
1. Clarify that the FIRST image is the template/reference scene and the SECOND image is the user's face
2. Describe the scene completely (pose, outfit, background, lighting) WITHOUT hardcoding specific hair color or skin tone
3. Instruct to replace the face AND adapt the hairstyle and skin tone to match the user's (second image)
4. Specify that the user's natural skin tone should blend naturally with the scene's lighting
5. Specify that the user's hairstyle from the second image should replace the template's hairstyle
6. Maintain everything else from the template: pose, outfit, accessories, background, composition, and lighting

Responde SOLO con el objeto JSON (no array), sin explicaciones adicionales.`;

    // Usar API REST de Gemini como en los otros endpoints
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 4096,
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
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    console.log('✅ Respuesta recibida de Gemini AI');

    // Extraer el JSON de la respuesta - filtrar thinking parts (gemini-2.5 incluye thought parts)
    const parts = data.candidates[0].content.parts;
    let responseText = '';
    for (const part of parts) {
      if (part.text && !part.thought) {
        responseText = part.text;
      }
    }
    console.log('📝 Texto de respuesta (primeros 200 chars):', responseText.substring(0, 200));

    let analysis;
    try {
      // Intentar parsear directamente como JSON
      let parsed = JSON.parse(responseText);
      
      // Si la respuesta es un array, tomar el primer elemento
      if (Array.isArray(parsed)) {
        console.log('⚠️ La IA devolvió un array, tomando el primer elemento');
        analysis = parsed[0];
      } else {
        analysis = parsed;
      }
    } catch (parseError) {
      // Si falla, intentar extraer JSON del texto
      let cleanedText = responseText.trim();
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Intentar encontrar un objeto JSON
      const objectMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        let parsed = JSON.parse(objectMatch[0]);
        analysis = Array.isArray(parsed) ? parsed[0] : parsed;
      } else {
        // Intentar encontrar un array JSON
        const arrayMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          let parsed = JSON.parse(arrayMatch[0]);
          analysis = Array.isArray(parsed) ? parsed[0] : parsed;
        } else {
          throw new Error('Failed to parse JSON from Gemini response');
        }
      }
    }

    // Validate and sanitize slots from AI analysis
    const validSlotTypes = ['person', 'woman', 'man', 'girl', 'boy', 'baby', 'pet'];
    if (analysis.slots && Array.isArray(analysis.slots)) {
      analysis.slots = analysis.slots
        .filter((s: any) => s && validSlotTypes.includes(s.type))
        .map((s: any, i: number) => ({
          type: s.type,
          label: s.label || undefined,
          position: i,
        }));
    } else {
      // Default to single person slot
      analysis.slots = [{ type: 'person', position: 0 }];
    }

    console.log('✅ Template analyzed successfully:', analysis.title, `(${analysis.slots.length} slots)`);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('❌ Error analyzing template:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (error.message?.includes('autorizado') || error.message?.includes('autenticado')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    // Si es error de parseo JSON, intentar recuperar
    if (error instanceof SyntaxError) {
      console.error('Error parsing AI response');
      return NextResponse.json(
        { error: 'Error al interpretar la respuesta de la IA' },
        { status: 500 }
      );
    }

    // Retornar más detalles del error en desarrollo
    const errorMessage = error.message || 'Error al analizar la imagen';
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
