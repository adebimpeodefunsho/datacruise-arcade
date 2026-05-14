/* ============================================================
   POST /api/validate-license
   ------------------------------------------------------------
   Cloudflare Pages Function. Auto-deployed by Cloudflare on push.

   Request body  (JSON): { "license_key": "DC-XXXX-XXXX-XXXX" }
   Response      (JSON): { "valid": true|false, "error"?: "…" }

   Talks to the Lemon Squeezy License API:
     POST https://api.lemonsqueezy.com/v1/licenses/validate
   Validates the key, and (optionally) scopes the result to a
   single store + product so keys from other LS products don't
   work here.

   Environment variables (set in Cloudflare dashboard →
   Workers & Pages → datacruise-arcade → Settings → Variables):

   LEMONSQUEEZY_API_KEY       (required) — your LS API key, kept secret
   LEMONSQUEEZY_STORE_ID      (optional) — only accept keys from this store
   LEMONSQUEEZY_PRODUCT_ID    (optional) — only accept keys for this product
============================================================ */

const LS_VALIDATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/validate';

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const onRequestPost = async ({ request, env }) => {
  // 1. Parse the body
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
  if (!env.LEMONSQUEEZY_API_KEY) {
    return json(500, {
      valid: false,
      error:
        'Unlock service is not configured yet. Try the dev test key, or contact support.',
    });
  }

  // 3. Ask Lemon Squeezy whether the key is valid
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
      error: 'Could not reach the licence service. Please try again in a moment.',
    });
  }

  let lsData;
  try {
    lsData = await lsRes.json();
  } catch (_) {
    return json(502, { valid: false, error: 'Bad response from licence service.' });
  }

  // Lemon Squeezy returns { valid: true|false, license_key: {...}, meta: {...} }
  if (!lsData || lsData.valid !== true) {
    return json(200, {
      valid: false,
      error: 'That key doesn’t match. Check the email from your purchase.',
    });
  }

  // 4. (Optional) scope to a single store + product
  const meta = lsData.meta || {};
  if (env.LEMONSQUEEZY_STORE_ID && String(meta.store_id) !== String(env.LEMONSQUEEZY_STORE_ID)) {
    return json(200, { valid: false, error: 'Key not recognised for this store.' });
  }
  if (
    env.LEMONSQUEEZY_PRODUCT_ID &&
    String(meta.product_id) !== String(env.LEMONSQUEEZY_PRODUCT_ID)
  ) {
    return json(200, { valid: false, error: 'Key is for a different product.' });
  }

  // 5. (Optional) reject inactive / expired / revoked keys
  const status = lsData.license_key && lsData.license_key.status;
  if (status && status !== 'active' && status !== 'inactive') {
    return json(200, { valid: false, error: `Key is ${status}.` });
  }

  return json(200, { valid: true });
};

// Anything other than POST → 405
export const onRequest = async () =>
  json(405, { valid: false, error: 'Method not allowed.' });
