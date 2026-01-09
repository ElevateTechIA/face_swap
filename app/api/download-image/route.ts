import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL es requerida' }, { status: 400 });
    }

    // Fetch la imagen desde Firebase Storage
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error('Error descargando imagen desde storage');
    }

    // Obtener el blob de la imagen
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Retornar la imagen con headers correctos
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': blob.type || 'image/png',
        'Content-Disposition': 'attachment; filename="face-swap.png"',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error: any) {
    console.error('❌ Error en GET /api/download-image:', error.message);
    return NextResponse.json(
      { error: 'Error descargando imagen' },
      { status: 500 }
    );
  }
}
