import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * GET /api/ping
 * Ultra-lightweight ping endpoint for basic uptime monitoring
 *
 * This endpoint runs on Edge runtime for maximum performance
 * Use /api/health for detailed health checks
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}
