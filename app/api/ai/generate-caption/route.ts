import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/api/auth-middleware';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    await verifyUserAuth(request);

    const body = await request.json();
    const { image, style } = body;

    if (!image) {
      return NextResponse.json({ error: 'image es requerida' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = `Genera un pie de foto creativo y corto para Instagram basado en este resultado de face swap con estilo ${style || 'natural'}. Responde en español con un tono influencer.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;

    const parts: any[] = [
      { text: prompt },
      { inlineData: { mimeType: "image/png", data: image.split(',')[1] } }
    ];

    const payload = {
      contents: [{ parts }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Gemini API error');
    }

    const data = await response.json();
    const caption = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!caption) {
      return NextResponse.json({
        caption: "Viviendo mi mejor versión ✨📸 #GlamAI #NewMe"
      });
    }

    return NextResponse.json({ caption });

  } catch (error: any) {
    console.error('❌ Error en AI generate-caption:', error.message);

    if (error.message.includes('autenticado') || error.message.includes('Token')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Error generando caption' },
      { status: 500 }
    );
  }
}
