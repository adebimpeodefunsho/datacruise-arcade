# Cloudflare Pages Functions

Files in `functions/` are deployed as Cloudflare Pages Functions on every push to `main`. They become available at the matching URL path on the same domain as the static site.

## Routes

| File | URL path | Purpose |
|---|---|---|
| `functions/api/validate-license.js` | `POST /api/validate-license` | Validates a Lemon Squeezy licence key for the unlock flow |

## Environment variables to set in Cloudflare

Go to **Workers & Pages → `datacruise-arcade` → Settings → Variables and Secrets** and add:

| Variable | Type | Required | Notes |
|---|---|---|---|
| `LEMONSQUEEZY_API_KEY` | **Secret** | ✅ Yes | Create in https://app.lemonsqueezy.com/settings/api → "Create API Key". Encrypted; never logged. |
| `LEMONSQUEEZY_STORE_ID` | Variable | Recommended | Restricts validation to keys from your store. Find it in your LS dashboard URL, e.g. `app.lemonsqueezy.com/stores/12345/…` → `12345`. |
| `LEMONSQUEEZY_PRODUCT_ID` | Variable | Recommended | Restricts validation to one product so non-arcade keys (if you sell other things in the same store) don't unlock the arcade. Visible on the product's edit page URL. |

After adding the variables, click **Save** and **Redeploy** the project for them to take effect.

## Testing locally

Pages Functions can be run locally with Wrangler:

```bash
npm install -g wrangler        # one-time
wrangler pages dev . --port 8775
```

That serves both the static site **and** the Functions. The dev test key (`DC-ARCADE-DEV-2026`) works in the hub even without the Functions deployed — it short-circuits the client-side check.

## How the flow works

1. User pastes a key into the modal on the hub.
2. `shared/unlock.js` does `fetch('/api/validate-license', { method: 'POST', body: JSON.stringify({ license_key }) })`.
3. This file runs on Cloudflare's edge, forwards the key to Lemon Squeezy's `/v1/licenses/validate` endpoint authed with `LEMONSQUEEZY_API_KEY`.
4. We check the response, optionally scope to store/product, and reply `{ valid: true|false }`.
5. On `valid: true`, the hub saves an unlock flag to `localStorage` and removes the lock overlays from the paid game cards.
