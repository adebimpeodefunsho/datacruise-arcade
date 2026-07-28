/* ============================================================
   DataCruise Arcade — Worker entry point
   ------------------------------------------------------------
   Two concerns:

   1. POST /api/validate-license  — checks the submitted code
      against the shared UNLOCK_CODE secret.
   2. Everything else — delegated to the ASSETS binding, which
      serves the static site (index.html, /games/<slug>/..., etc.)

   Why a static code instead of per-buyer licence keys?
   -------------------------------------------------------------
   The initial plan was to validate per-buyer keys via Lemon
   Squeezy, then Gumroad. LS rejected the seller's identity
   verification, and Gumroad's /v2/licenses/verify endpoint
   returned "license does not exist" for valid Gumroad-issued
   keys (their support ticket pending). To unblock launch we
   switched to a single shared unlock code delivered to every
   buyer via Gumroad's welcome content. The downside is one
   buyer can in principle share the code with friends — but at
   v1 volume the piracy risk is negligible, and rotating the
   code is a 5-second Cloudflare secret update.

   Configuration via env var set in the Cloudflare dashboard
   (Workers & Pages → datacruise-arcade → Settings → Variables
   and Secrets):

   UNLOCK_CODE  — encrypted secret. The code every buyer receives
                  in their Gumroad welcome.txt. Stored encrypted
                  at rest, never logged. Matching is
                  case-insensitive and whitespace-tolerant so
                  buyers who mis-capitalise or add extra spaces
                  still unlock.
============================================================ */

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Normalise an unlock code for comparison: lowercase, trim,
 * collapse any run of whitespace to a single space.
 * Lets "DataCruise Arcade Unlocked" match "  datacruise   arcade unlocked  ".
 */
function normaliseCode(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

async function handleValidateLicense(request, env) {
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
  const submitted = normaliseCode(payload && payload.license_key);
  if (!submitted) {
    return json(400, { valid: false, error: 'Missing license_key.' });
  }

  // 2. Check the Worker is configured
  if (!env.UNLOCK_CODE) {
    return json(500, {
      valid: false,
      error:
        'Unlock service is not configured yet. Please contact support.',
    });
  }

  // 3. Compare against the configured secret
  const expected = normaliseCode(env.UNLOCK_CODE);
  if (submitted === expected) {
    return json(200, { valid: true });
  }

  return json(200, {
    valid: false,
    error: 'That code doesn’t match. Check the email from your purchase.',
  });
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

  let path;
  if (slug === 'hub' || slug === '') path = '/';
  else if (SCENE_PROMPTS[slug]) path = '/games/' + slug + '/';
  else return json(400, { error: 'Unknown slug.' });

  const target = url.origin + path;
  const cache = caches.default;
  const cacheKey = new Request(url.origin + '/api/short?slug=' + slug, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let short = target; // fallback = full URL
  try {
    const r = await fetch(
      'https://is.gd/create.php?format=simple&url=' + encodeURIComponent(target),
      { headers: { 'user-agent': 'datacruise-arcade-share' } }
    );
    const t = (await r.text()).trim();
    if (r.ok && /^https?:\/\/\S+$/.test(t)) short = t;
  } catch (_) { /* keep fallback */ }

  const body = JSON.stringify({ short: short, full: target });
  const resp = new Response(body, {
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      // Only cache real short links hard; fallbacks are retried next time.
      'cache-control': short !== target ? 'public, max-age=86400' : 'no-store',
    },
  });
  if (short !== target) ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/validate-license') {
      return handleValidateLicense(request, env);
    }
    if (url.pathname === '/api/scene') {
      return handleScene(request, env, ctx);
    }
    if (url.pathname === '/api/short') {
      return handleShort(request, env, ctx);
    }

    // Everything else falls through to static assets.
    return env.ASSETS.fetch(request);
  },
};
