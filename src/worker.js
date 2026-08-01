/* ============================================================
   DataCruise Arcade — Worker entry point
   ------------------------------------------------------------
   Two concerns:

   1. POST /api/validate-license  — verifies the submitted key
      against Gumroad's /v2/licenses/verify. Each buyer gets a
      UNIQUE licence key from Gumroad; we check that key against
      the Arcade's product_id. Optional owner-override for support.
   2. Everything else — delegated to the ASSETS binding, which
      serves the static site (index.html, /games/<slug>/..., etc.)

   Configuration via env vars set in the Cloudflare dashboard
   (Workers & Pages → datacruise-arcade → Settings → Variables
   and Secrets):

   GUMROAD_PRODUCT_ID   — Optional override. Plain text. The Arcade
                          product's base64-looking product_id from
                          Gumroad. Baked in as DEFAULT_PRODUCT_ID
                          below (Gumroad exposes it publicly on the
                          product page, so it's not a secret). Set
                          this env var only if you migrate the
                          Arcade to a different Gumroad product.
                          Gumroad REQUIRES product_id — the older
                          product_permalink field is rejected for
                          licence-keyed products.

   GUMROAD_MAX_USES     — Optional. Number. If set, blocks a key
                          once it has been activated on more than
                          this many devices (Gumroad returns a
                          usage count with each verify call).
                          Omit to leave activations open.

   UNLOCK_CODE          — Optional. Secret (encrypted). A PRIVATE
                          owner-override code — matches case- and
                          whitespace-insensitively. Keep it secret;
                          it's for support edge cases (buyer lost
                          their key, Gumroad is down, etc.). Never
                          include it in Gumroad's welcome content.
============================================================ */

// Gumroad exposes this on the product page, so it isn't a secret. Baking it
// in means the unlock works with zero env-var setup. Override with a Cloudflare
// env var GUMROAD_PRODUCT_ID if the Arcade ever migrates to a new product.
const DEFAULT_PRODUCT_ID = '1TPpVG8FPlhhg1_ylRjoGA==';   // datacruise.gumroad.com/l/wxahk

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
}

/**
 * Normalise a code for comparison: lowercase, trim, collapse any
 * run of whitespace to a single space. Only used for the optional
 * owner-override — Gumroad keys go through verbatim (Gumroad's
 * own compare is exact).
 */
function normaliseCode(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

async function handleValidateLicense(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      },
    });
  }
  if (request.method !== 'POST') {
    return json(405, { valid: false, error: 'Method not allowed.' });
  }

  // 1. Parse the request body
  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return json(400, { valid: false, error: 'Invalid request body.' });
  }
  const key = String((payload && payload.license_key) || '').trim();
  if (!key) {
    return json(200, { valid: false, error: 'Please enter your unlock key.' });
  }

  // 2. Owner-override — silent fallback for support cases. Only fires when
  //    UNLOCK_CODE is set AND matches. Never advertise this to buyers.
  if (env.UNLOCK_CODE && normaliseCode(key) === normaliseCode(env.UNLOCK_CODE)) {
    return json(200, { valid: true, source: 'owner' });
  }

  // 3. Gumroad licence verify. Uses the baked-in product_id by default.
  const productId = env.GUMROAD_PRODUCT_ID || DEFAULT_PRODUCT_ID;

  const form = new URLSearchParams();
  form.set('product_id', productId);
  form.set('license_key', key);
  form.set('increment_uses_count', 'true');

  let data = {};
  try {
    const r = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    data = await r.json().catch(() => ({}));
  } catch (_) {
    return json(200, {
      valid: false,
      error: 'Could not reach the licence server — please try again.',
    });
  }

  if (!data || !data.success) {
    return json(200, {
      valid: false,
      error: 'That code doesn’t match. Check the email from your purchase.',
    });
  }
  const p = data.purchase || {};
  if (p.refunded || p.chargebacked || p.disputed) {
    return json(200, {
      valid: false,
      error: 'This purchase is no longer active.',
    });
  }
  const maxUses = parseInt(env.GUMROAD_MAX_USES || '0', 10);
  if (maxUses > 0 && typeof data.uses === 'number' && data.uses > maxUses) {
    return json(200, {
      valid: false,
      error: 'This code has already been used on too many devices.',
    });
  }
  return json(200, { valid: true, uses: data.uses || 1 });
}

/* ============================================================
   AI result-card scenes  —  GET /api/scene?slug=<game>
   ------------------------------------------------------------
   Generates ONE dreamy, kids'-storybook illustration per game
   with Workers AI (Flux), then caches it at the edge so it is
   generated at most once per game (prompts are fixed, so the
   cache key is just the slug). No user photos are ever involved
   — these are themed art scenes only. The result card composites
   the image as its hero backdrop; if this endpoint is missing
   (e.g. local dev) the card falls back to a flat gradient.
============================================================ */
const SCENE_PROMPTS = {
  'mountain-climb':
    'A cheerful cartoon ladybug triumphantly planting a tiny flag on a sunny golden mountain summit, warm orange sky, soft rounded shapes, storybook children\'s book illustration, flat vector, no text',
  'block-city':
    'A cute cartoon ladybug standing proudly atop a colorful skyline of stacked toy building blocks arranged like a bar chart, bright orange sky, playful children\'s book illustration, flat vector, no text',
  'bubble-catcher':
    'A happy cartoon ladybug floating among big translucent soap bubbles of different sizes, warm orange background, whimsical children\'s book illustration, flat vector, no text',
  'dashboard-drop':
    'A cheerful cartoon ladybug beside a neat wall of little glowing chart screens forming a dashboard, orange tones, playful children\'s book illustration, flat vector, no text',
  'pie-spinner':
    'A joyful cartoon ladybug spinning a big colorful pie-chart wheel, bright orange background, storybook children\'s book illustration, flat vector, no text',
  'decision-lab':
    'A curious cartoon ladybug scientist in a friendly bright laboratory with charts and beakers, orange tones, cheerful children\'s book illustration, flat vector, no text',
  'derive-jargon':
    'A friendly cartoon bee with a round brown face and a yellow-and-black striped body and small translucent wings, discovering a glowing floating word, dreamy purple background, whimsical children\'s book illustration, flat vector, no text',
  'data-crossword':
    'A friendly cartoon bee with a round brown face and a yellow-and-black striped body, small translucent wings, hovering beside a big glowing crossword grid, dreamy purple background, cheerful children\'s book illustration, flat vector, no text',
  'data-hunt':
    'A glowing treasure chest full of colorful gems on a wooden shelf with a friendly cartoon bee with a round brown face and a yellow-and-black striped body and small translucent wings, dreamy purple tones, storybook children\'s book illustration, flat vector, no text',
  'scrub-mess':
    'A cheerful tidy-up scene of sparkling clean data blocks with a friendly cartoon bee with a round brown face and a yellow-and-black striped body and small translucent wings and a little bin, dreamy purple background, children\'s book illustration, flat vector, no text',
  'sentence-builder':
    'A whimsical bridge built from glowing word blocks crossing a gentle river, a friendly cartoon bee with a round brown face and a yellow-and-black striped body and small translucent wings, dreamy purple sky, children\'s book illustration, flat vector, no text',
};

async function handleScene(request, env, ctx) {
  const url = new URL(request.url);
  const slug = String(url.searchParams.get('slug') || '').toLowerCase();
  const prompt = SCENE_PROMPTS[slug];
  if (!prompt) return json(400, { error: 'Unknown or missing slug.' });
  if (!env.AI) return json(503, { error: 'AI is not configured.' });

  // Edge cache keyed by slug + a per-slug version. Bump a slug's number in
  // SCENE_VERSION to force ONE scene to regenerate after its prompt changes
  // (leaves the other cached scenes untouched).
  const SCENE_VERSION = {
    'data-crossword': 2,
    'derive-jargon': 2,
    'data-hunt': 2,
    'scrub-mess': 2,
    'sentence-builder': 2,
  };
  const version = 'v' + (SCENE_VERSION[slug] || 1);
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/scene?slug=${slug}&${version}`, {
    method: 'GET',
  });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Flux-schnell returns { image: <base64 jpeg> }. Workers AI occasionally
  // rejects a request under transient load ("8001: Invalid input"); a retry
  // clears it, so try a few times before giving up (the client still has a
  // gradient fallback if all attempts fail).
  let bytes, lastErr;
  for (let attempt = 0; attempt < 3 && !bytes; attempt++) {
    try {
      const out = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt,
        steps: 6,
      });
      if (!out || !out.image) throw new Error('No image returned.');
      const bin = atob(out.image);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      bytes = arr;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!bytes) {
    return json(502, { error: 'Scene generation failed.', detail: String(lastErr && lastErr.message || lastErr) });
  }

  const resp = new Response(bytes, {
    headers: {
      'content-type': 'image/jpeg',
      // long-lived: identical per slug, safe to cache hard
      'cache-control': 'public, max-age=31536000, immutable',
      'access-control-allow-origin': '*',
    },
  });
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

/* ============================================================
   Short share links  —  GET /api/short?slug=<game|hub>
   ------------------------------------------------------------
   Returns a short URL for the game (or hub) so shared links are
   tidy — especially in a WhatsApp message. Shortens via is.gd
   server-side (no key, no CORS worries) and caches the result at
   the edge (short links are stable, so at most one call per slug).
   The short link 301-redirects to the game page, whose og:image is
   the hero card — so WhatsApp/Facebook still show the picture.
   Falls back to the full URL if the shortener is unavailable.
============================================================ */
async function handleShort(request, env, ctx) {
  const url = new URL(request.url);
  const slug = String(url.searchParams.get('slug') || 'hub').toLowerCase();

  let dest, shortPath;
  if (slug === 'hub' || slug === '') { dest = '/'; shortPath = url.origin + '/'; }
  else if (SCENE_PROMPTS[slug]) { dest = '/games/' + slug + '/'; shortPath = url.origin + '/g/' + slug; }
  else return json(400, { error: 'Unknown slug.' });
  const full = url.origin + dest;

  const cache = caches.default;
  const cacheKey = new Request(url.origin + '/api/short?slug=' + slug + '&v2', { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Default short link = the on-domain /g/<slug> path (reliable, redirects to
  // the game so the og:image still previews). If a TINYURL_TOKEN secret is set,
  // upgrade to a real tinyurl.com/xxxx link.
  let short = shortPath;
  if (env.TINYURL_TOKEN) {
    try {
      const r = await fetch('https://api.tinyurl.com/create', {
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + env.TINYURL_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ url: shortPath }),
      });
      const j = await r.json();
      if (j && j.data && j.data.tiny_url) short = j.data.tiny_url;
    } catch (_) { /* keep the /g/ path */ }
  }

  const body = JSON.stringify({ short: short, full: full });
  const resp = new Response(body, {
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=86400',
    },
  });
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

// Canonical host — everything served from the old `*.workers.dev` URL is
// permanently redirected here so bookmarks/links keep working after the
// migration to the custom domain.
const CANONICAL_HOST = 'arcade.datacruise.app';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Redirect old workers.dev traffic to the custom domain.
    const host = (request.headers.get('host') || '').toLowerCase();
    if (host.endsWith('.workers.dev')) {
      return Response.redirect(
        'https://' + CANONICAL_HOST + url.pathname + url.search,
        301,
      );
    }

    if (url.pathname === '/api/validate-license') {
      return handleValidateLicense(request, env);
    }
    if (url.pathname === '/api/scene') {
      return handleScene(request, env, ctx);
    }
    if (url.pathname === '/api/short') {
      return handleShort(request, env, ctx);
    }
    // Short share paths: /g/<slug> -> the game page (keeps the og:image preview)
    if (url.pathname.startsWith('/g/')) {
      const gslug = url.pathname.slice(3).replace(/\/+$/, '').toLowerCase();
      if (SCENE_PROMPTS[gslug]) {
        return Response.redirect(url.origin + '/games/' + gslug + '/', 301);
      }
    }

    // Everything else falls through to static assets.
    return env.ASSETS.fetch(request);
  },
};
