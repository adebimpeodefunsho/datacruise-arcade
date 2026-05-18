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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/validate-license') {
      return handleValidateLicense(request, env);
    }

    // Everything else falls through to static assets.
    return env.ASSETS.fetch(request);
  },
};
