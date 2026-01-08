import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/api/auth-middleware';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convertir base64 a formato que Gemini entiende
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Analiza esta imagen de template para Face Swap y extrae la siguiente información en formato JSON:

{
  "title": "Un título corto y descriptivo (máx 50 caracteres)",
  "description": "Descripción detallada de la escena (máx 150 caracteres)",
  "bodyType": ["athletic", "slim", "curvy", "plus-size", "average"], // Array de tipos de cuerpo que se verían bien
  "style": ["elegant", "casual", "professional", "party", "romantic", "edgy", "vintage", "modern"], // Array de estilos que representa
  "mood": ["happy", "confident", "relaxed", "energetic", "mysterious", "playful"], // Array de moods de la imagen
  "occasion": ["new-year", "birthday", "wedding", "casual", "professional", "date", "party"], // Array de ocasiones apropiadas
  "framing": "close-up" | "medium" | "full-body" | "portrait", // Tipo de encuadre
  "lighting": "natural" | "studio" | "dramatic" | "soft" | "neon", // Tipo de iluminación
  "colorPalette": ["warm", "cool", "neutral", "vibrant", "pastel"], // Array de paletas de color presentes
  "setting": ["indoor", "outdoor", "studio"] // Array de ambientes
}

Analiza cuidadosamente:
- Los colores predominantes
- La iluminación y atmósfera
- El tipo de ropa y estilo
- La ocasión o evento que representa
- El mood general de la imagen
- El tipo de cuerpo que se vería mejor en esta escena
- El encuadre (si es close-up, cuerpo completo, etc)

Responde SOLO con el JSON válido, sin explicaciones adicionales.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      },
      prompt
    ]);

    const response = result.response;
    const text = response.text();

    // Limpiar la respuesta y parsear JSON
    let cleanedText = text.trim();

    // Remover markdown code blocks si existen
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Parsear el JSON
    const analysis = JSON.parse(cleanedText);

    console.log('✅ Template analyzed successfully:', analysis.title);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('❌ Error analyzing template:', error.message);

    if (error.message.includes('autorizado') || error.message.includes('autenticado')) {
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

    return NextResponse.json(
      { error: 'Error al analizar la imagen' },
      { status: 500 }
    );
  }
}
