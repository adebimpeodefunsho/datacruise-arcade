/* ============================================================
   DataCruise Arcade — Worker entry point
   ------------------------------------------------------------
   This Worker handles two concerns:

   1. POST /api/validate-license  — verifies a Lemon Squeezy
      licence key for the unlock flow on the hub.
   2. Everything else — delegated to the ASSETS binding, which
      serves the static site (index.html, /games/<slug>/..., etc.)

   Configuration via env vars set in the Cloudflare dashboard
   (Workers & Pages → datacruise-arcade → Settings → Variables
   and Secrets):

   LEMONSQUEEZY_API_KEY      — Secret (encrypted). Required.
   LEMONSQUEEZY_STORE_ID     — plain text. 375568.
   LEMONSQUEEZY_PRODUCT_ID   — plain text. 1058410.
============================================================ */

const LS_VALIDATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/validate';

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

  if (!env.LEMONSQUEEZY_API_KEY) {
    return json(500, {
      valid: false,
      error:
        'Unlock service is not configured yet. Please contact support.',
    });
  }

  // Ask Lemon Squeezy whether the key is valid
  let lsRes;
  try {
    const body = new URLSearchParams();
    body.append('license_key', licenseKey);
    lsRes = await fetch(LS_VALIDATE_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
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

  let lsData;
  try {
    lsData = await lsRes.json();
  } catch (_) {
    return json(502, {
      valid: false,
      error: 'Bad response from licence service.',
    });
  }

  // Lemon Squeezy returns { valid: true|false, license_key: {...}, meta: {...} }
  if (!lsData || lsData.valid !== true) {
    return json(200, {
      valid: false,
      error: 'That key doesn’t match. Check the email from your purchase.',
    });
  }

  // Scope to a single store + product (extra safety against keys
  // from other LS products getting reused here).
  const meta = lsData.meta || {};
  if (
    env.LEMONSQUEEZY_STORE_ID &&
    String(meta.store_id) !== String(env.LEMONSQUEEZY_STORE_ID)
  ) {
    return json(200, {
      valid: false,
      error: 'Key not recognised for this store.',
    });
  }
  if (
    env.LEMONSQUEEZY_PRODUCT_ID &&
    String(meta.product_id) !== String(env.LEMONSQUEEZY_PRODUCT_ID)
  ) {
    return json(200, {
      valid: false,
      error: 'Key is for a different product.',
    });
  }

  // Reject expired / disabled keys (active and inactive are both
  // acceptable — "inactive" just means "not yet activated").
  const status = lsData.license_key && lsData.license_key.status;
  if (status && status !== 'active' && status !== 'inactive') {
    return json(200, { valid: false, error: `Key is ${status}.` });
  }

  return json(200, { valid: true });
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
