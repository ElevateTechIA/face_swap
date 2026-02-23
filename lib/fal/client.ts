/**
 * fal.ai Server-Side Client
 *
 * Use this import in server-side API routes that call fal.ai directly.
 * Never import this in client components — use the proxy pattern instead.
 *
 * Client components should use:
 *   import * as fal from '@fal-ai/client';
 *   fal.config({ proxyUrl: '/api/fal' });
 */
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY,
});

export { fal };
