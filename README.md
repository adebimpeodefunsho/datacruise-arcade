# DataCruise Arcade

A pack of 10 browser games that teach the **feel** of data — chart-building and word puzzles, no install, no accounts. Built as plain HTML/CSS/ES-module JavaScript so it can be hosted as a static site anywhere.

## What's in the pack

**Chart Games · with Bug-Bug** — drag, drop, climb and catch your way into different chart types.

| Slug              | Title                          | Chart type     |
|-------------------|--------------------------------|----------------|
| `mountain-climb`  | Bug-Bug's Mountain Climb       | Line chart     |
| `block-city`      | Bug-Bug's Block City           | Bar chart      |
| `pie-spinner`     | Bug-Bug's Pie Spinner          | Pie chart      |
| `bubble-catcher`  | Bug-Bug's Bubble Catcher       | Bubble chart   |
| `dashboard-drop`  | Bug-Bug's Dashboard Drop       | Dashboard      |

**Word Games · with Magni** — decode the language of data.

| Slug                | Title                       | Mechanic        |
|---------------------|-----------------------------|-----------------|
| `derive-jargon`     | Derive the Data Jargon      | ASCII rebus     |
| `data-crossword`    | Crack the Data Crossword    | Timed crossword |
| `sentence-builder`  | Bridge the Data Sentence    | Fill-in slots   |
| `scrub-mess`        | Scrub the Data Mess         | Data cleaning   |
| `data-hunt`         | Hunt the Data Treasure      | SQL clues       |

## Folder structure

```
.
├── index.html              ← the hub landing page
├── 404.html
├── manifest.webmanifest
├── favicon.svg
├── apple-touch-icon.svg
├── robots.txt
├── sitemap.xml
├── wrangler.jsonc          ← Cloudflare Worker config
├── src/
│   └── worker.js           ← Worker: handles POST /api/validate-license, delegates the rest to ASSETS
├── shared/
│   ├── hub.css             ← landing-page styles
│   ├── arcade-nav.js       ← injects the "← Arcade" back button into each game
│   ├── unlock.js           ← freemium gate: locks 6 paid cards, runs the unlock modal
│   └── previews/           ← SVG card illustrations + OG image
└── games/
    ├── mountain-climb/
    ├── block-city/
    ├── pie-spinner/
    ├── bubble-catcher/
    ├── dashboard-drop/
    ├── derive-jargon/
    ├── data-crossword/
    ├── sentence-builder/
    ├── scrub-mess/
    └── data-hunt/
```

## Cloudflare deployment

Hosted on **Cloudflare Workers Static Assets**. On push to `main`, Cloudflare rebuilds and serves:
- Static files from the repo root (via the `ASSETS` binding)
- `POST /api/validate-license` via the Worker at `src/worker.js`, which compares the submitted code against a shared `UNLOCK_CODE` secret

The Worker reads a single environment variable, set in the Cloudflare dashboard as an encrypted secret (**Workers & Pages → datacruise-arcade → Settings → Variables and Secrets**):

| Variable | Type | Value |
|---|---|---|
| `UNLOCK_CODE` | **Secret** (encrypted) | The shared code every buyer receives in their Gumroad welcome.txt |

Matching is **case-insensitive** and **whitespace-tolerant** so buyers who mis-capitalise or add extra spaces still unlock.

Payments are handled by **Gumroad** (https://datacruise.gumroad.com/l/wxahk). On purchase Gumroad delivers a welcome.txt file containing the unlock code to the buyer. The buyer pastes the code into the hub's unlock modal, the Worker compares it (normalised) against the `UNLOCK_CODE` secret, and the six paid games unlock on that device.

> **Earlier design (now retired):** We initially tried Lemon Squeezy with per-buyer licence keys, then switched to Gumroad after LS rejected the seller's identity verification. Gumroad's `/v2/licenses/verify` endpoint returned "license does not exist" for legitimately-issued Gumroad keys (cause unclear, support ticket pending). Rather than block launch, we moved to a single shared unlock code. Rotating it is a one-line Cloudflare secret update, so if it ever leaks we can roll forward in seconds.

Each `games/<slug>/` folder is a self-contained game (`index.html` plus its own assets). The only addition to each game's `index.html` is one line that loads `/shared/arcade-nav.js`, which injects a floating "← Arcade" pill linking back to the hub.

## Run locally

No build step — just serve the folder:

```bash
python3 -m http.server 8775 --directory .
```

Then open <http://localhost:8775/>.

## Deploy to Cloudflare Pages (free)

1. Push this folder to a new GitHub repo (any name, e.g. `datacruise-arcade`).
2. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Pick the repo. **Build settings:**
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `/`
4. **Save and Deploy.** Cloudflare builds and serves it on a `*.pages.dev` URL within a minute.
5. (Optional) Add a custom domain under the project's **Custom domains** tab.

Alternative free hosts that work the same way: **Netlify**, **Vercel**, **GitHub Pages**, **Render Static Sites**.

## Editing a game

The original per-game source folders (e.g. `~/MountainClimb_Game/`, `~/BlockCity_Game/`) are the canonical workspaces — `games/<slug>/` in this repo holds a copy. After editing a game in its source folder, re-sync into this repo:

```bash
cp -R ~/BlockCity_Game/app/* games/block-city/
```

The arcade-nav `<script>` line in each game's `index.html` should be preserved — `cp -R` overwrites it, so re-run the injection if you copy the whole index.html across.

## Adding a new game

1. Drop the game's `app/` folder into `games/<new-slug>/`.
2. Add this line before `</head>` in the game's `index.html`:
   ```html
   <script src="/shared/arcade-nav.js" defer></script>
   ```
3. Draw a new 320×180 SVG preview into `shared/previews/<new-slug>.svg`.
4. Add a new `<a class="game-card">…</a>` card in `index.html` pointing at the new slug.
5. Add the new URL to `sitemap.xml`.

## Roadmap

- Freemium gate: free trial of 2 games per series + one-time unlock for the rest, via Gumroad + a Cloudflare Worker for license-key validation.
- Per-game progress / stars saved in `localStorage`.
- A scoreboard / replay feature.
- More games — both series are designed to grow.

## Credits

Made by Adebimpe O. — DataCruise. Bug-Bug and Magni are the recurring mascots for the two series.
