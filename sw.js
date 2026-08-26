/* DataCruise Arcade — offline support.
 *
 * Strategy:
 *   · code (HTML/JS/CSS)  → network-first, so a deploy is picked up immediately;
 *                           falls back to cache when there is no connection.
 *   · media (svg/png/audio/fonts) → cache-first with a quiet background refresh.
 *   · /api/* and /g/*     → never cached. Licence checks, AI scenes and short
 *                           links must always hit the network.
 *
 * Cloudflare stamps .js/.css with max-age=14400, so code is fetched with
 * cache:'reload' to bypass the HTTP cache — otherwise a fresh deploy can be
 * masked by a stale edge/browser copy.
 *
 * BUMP CACHE_VERSION ON EVERY DEPLOY THAT TOUCHES JS/CSS/HTML.
 */
const CACHE_VERSION = 'arcade-v1';

/* Small enough to fetch up front — the hub shell only. Game files and the
   2MB of preview art are cached as they are actually used, so a first visit
   costs no more data than it does today. */
const SHELL = [
  '/',
  '/shared/hub.css',
  '/shared/unlock.js',
  '/shared/share.js',
  '/shared/arcade-nav.js',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/apple-touch-icon.svg',
  '/404.html'
];

const isCode  = p => /\.(?:js|css)$/i.test(p);
const isMedia = p => /\.(?:svg|png|jpg|jpeg|webp|gif|ico|woff2?|mp3|ogg|wav)$/i.test(p);
const bypass  = p => p.startsWith('/api/') || p.startsWith('/g/');

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    /* One bad URL must not fail the whole install. */
    await Promise.all(SHELL.map(u =>
      cache.add(new Request(u, { cache: 'reload' })).catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Cloudflare beacon, Gumroad, etc.
  if (bypass(url.pathname)) return;                  // licence, AI scenes, short links

  const navigation = req.mode === 'navigate';

  if (navigation || isCode(url.pathname)) {
    event.respondWith(networkFirst(req, navigation));
  } else if (isMedia(url.pathname)) {
    event.respondWith(cacheFirst(req));
  }
});

async function networkFirst(req, navigation) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    /* cache:'reload' defeats Cloudflare's 4-hour stamp on js/css. */
    const fresh = await fetch(navigation ? req : new Request(req, { cache: 'reload' }));
    if (fresh && fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    if (navigation) {
      /* Deep-linked to a game we have never opened, with no connection. */
      return (await cache.match('/')) || (await cache.match('/404.html')) ||
        new Response('<h1>Offline</h1><p>Open the Arcade once while online, then it works without a connection.</p>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  const hit = await cache.match(req);
  if (hit) {
    /* Refresh quietly for next time; never block the game on it. */
    fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); }).catch(() => {});
    return hit;
  }
  const fresh = await fetch(req);
  if (fresh && fresh.ok) cache.put(req, fresh.clone());
  return fresh;
}
