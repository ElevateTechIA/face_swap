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

    const prompt = `Analiza esta imagen de template para Face Swap y extrae la siguiente información en formato JSON:

{
  "title": "Un título corto y descriptivo (máx 50 caracteres)",
  "description": "Descripción detallada de la escena (máx 150 caracteres)",
  "prompt": "Un prompt detallado para Gemini que describa cómo hacer el face swap manteniendo la iluminación, pose, ropa y ambiente de la imagen original. Debe instruir claramente sobre qué mantener de la imagen template y qué reemplazar (solo el rostro).",
  "bodyType": ["athletic", "slim", "curvy", "plus-size", "average"],
  "style": ["elegant", "casual", "professional", "party", "romantic", "edgy", "vintage", "modern"],
  "mood": ["happy", "confident", "relaxed", "energetic", "mysterious", "playful"],
  "occasion": ["new-year", "birthday", "wedding", "casual", "professional", "date", "party"],
  "framing": "close-up" | "medium" | "full-body" | "portrait",
  "lighting": "natural" | "studio" | "dramatic" | "soft" | "neon",
  "colorPalette": ["warm", "cool", "neutral", "vibrant", "pastel"],
  "setting": ["indoor", "outdoor", "studio"]
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

Para el "prompt" de Gemini, genera instrucciones técnicas específicas que:
1. Describan la escena completa (pose, ropa, fondo, iluminación)
2. Indiquen claramente que solo se reemplaza el rostro
3. Especifiquen cómo mantener la iluminación y sombras naturales
4. Mencionen qué elementos NO deben cambiar (pelo, ropa, cuerpo, fondo)

Responde SOLO con el JSON válido, sin explicaciones adicionales.`;

    // Usar API REST de Gemini como en los otros endpoints
    // Usando gemini-2.0-flash-exp que tiene capacidades de visión y funciona correctamente
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

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
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    console.log('✅ Respuesta recibida de Gemini AI');

    // Extraer el JSON de la respuesta
    const responseText = data.candidates[0].content.parts[0].text;
    console.log('📝 Texto de respuesta (primeros 200 chars):', responseText.substring(0, 200));

    let analysis;
    try {
      // Intentar parsear directamente como JSON
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      // Si falla, intentar extraer JSON del texto
      let cleanedText = responseText.trim();
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON from Gemini response');
      }
    }

    console.log('✅ Template analyzed successfully:', analysis.title);

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
