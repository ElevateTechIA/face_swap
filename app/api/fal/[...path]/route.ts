/**
 * fal.ai Proxy Route
 *
 * Routes all /api/fal/* requests to fal.ai using the server-side FAL_KEY.
 * This keeps the API key secure and never exposes it to the browser.
 *
 * The @fal-ai/client SDK on the client side automatically points to this proxy.
 * Usage: configure the client with `proxyUrl: '/api/fal'`
 */
import { route } from '@fal-ai/server-proxy/nextjs';

export const { GET, POST } = route;
