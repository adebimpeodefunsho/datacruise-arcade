/* ============================================================
   DataCruise Arcade — Worker entry point
   ------------------------------------------------------------
   Two concerns:

   1. POST /api/validate-license  — verifies a Gumroad licence key
      for the unlock flow on the hub.
   2. Everything else — delegated to the ASSETS binding, which
      serves the static site (index.html, /games/<slug>/..., etc.)

   Configuration via env var set in wrangler.jsonc and/or the
   Cloudflare dashboard (Workers & Pages → datacruise-arcade →
   Settings → Variables and Secrets):

   GUMROAD_PRODUCT_ID  — product ID or permalink slug. Public.
                         No secret/API-key is required — Gumroad's
                         licence-verify endpoint is unauthenticated
                         and only checks the key against the named
                         product.

   Earlier this Worker proxied to Lemon Squeezy. We switched to
   Gumroad because LS's identity-verification process rejected the
   creator. Gumroad is more permissive for indie digital creators.
============================================================ */

const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
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
  const licenseKey = (payload && payload.license_key || '').trim();
  if (!licenseKey) {
    return json(400, { valid: false, error: 'Missing license_key.' });
  }

  // 2. Check the Worker is configured
  if (!env.GUMROAD_PRODUCT_ID) {
    return json(500, {
      valid: false,
      error:
        'Unlock service is not configured yet. Please contact support.',
    });
  }

  // 3. Ask Gumroad whether the key is valid.
  // Note: Gumroad's verify endpoint accepts EITHER the UUID
  // product_id OR the short permalink as the product_id parameter
  // — they resolve it server-side.
  // increment_uses_count=false because we're only checking — the
  // count should track real customer activations, not our checks.
  let gumroadRes;
  try {
    const body = new URLSearchParams();
    body.append('product_id', env.GUMROAD_PRODUCT_ID);
    body.append('license_key', licenseKey);
    body.append('increment_uses_count', 'false');
    gumroadRes = await fetch(GUMROAD_VERIFY_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  } catch (_) {
    return json(502, {
      valid: false,
      error:
        'Could not reach the licence service. Please try again in a moment.',
    });
  }

  let data;
  try {
    data = await gumroadRes.json();
  } catch (_) {
    return json(502, {
      valid: false,
      error: 'Bad response from licence service.',
    });
  }

  // Gumroad responds with { success: true, uses: N, purchase: {...} }
  // on a valid key, or { success: false, message: "..." } on failure.
  if (data && data.success === true) {
    // Optional sanity check: refund'd / disputed / chargeback'd
    // purchases come back with purchase.refunded === true. Reject
    // those so a refunded buyer can't keep unlocking the games.
    const purchase = data.purchase || {};
    if (purchase.refunded === true || purchase.disputed === true || purchase.chargebacked === true) {
      return json(200, {
        valid: false,
        error: 'This key has been refunded and is no longer valid.',
      });
    }
    return json(200, { valid: true });
  }

  // Failure paths from Gumroad. Common messages:
  //   "That license does not exist for the provided product"
  //   "The license key is invalid"
  // We collapse them into a single user-friendly message.
  return json(200, {
    valid: false,
    error: 'That key doesn’t match. Check the email from your purchase.',
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
