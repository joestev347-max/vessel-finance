// Vercel serverless entry. The whole Express app (API + static SPA) runs as one
// function; vercel.json rewrites every path to it, so the app is single-origin.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
import { createApp } from '../src/server.js';

// On Vercel, the Supabase pooler host can resolve to an unroutable IPv6 address
// first, making the DB connect hang until the function times out. Prefer IPv4.
dns.setDefaultResultOrder('ipv4first');

// The build copies the web build into ./public (see vercel.json buildCommand);
// point the static server at it unless an explicit WEB_DIST is provided.
if (!process.env.WEB_DIST) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  process.env.WEB_DIST = path.join(here, '..', 'public');
}

export default createApp();
