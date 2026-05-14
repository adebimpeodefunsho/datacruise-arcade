# Bug-Bug's Mountain Climb — MVP

A line-chart climbing game. Each daily choice plots the next point on the chart.

## Run it locally

This is a no-build, vanilla HTML / CSS / ES-module-JS app. To play, you need any tiny static-file server.

```bash
cd /Users/adebimpeo/Desktop/MountainClimb_Game/app
python3 -m http.server 8765
```

Then open <http://localhost:8765> in your browser.

> The page can't be opened directly via `file://` because browsers block ES module imports there for security reasons. Any static server works — `python3 -m http.server` is the easiest because Python is preinstalled on macOS.

## Folder layout

```
app/
├── index.html       # entry point
├── styles.css       # all visual styling (v4 orange palette)
├── favicon.svg
├── README.md
└── src/
    ├── main.js      # bootstrap, event delegation, localStorage
    ├── state.js     # pure state machine + game constants
    ├── rng.js       # seeded Mulberry32 RNG + share-code helpers
    ├── svg.js       # SVG component strings (bug, trophy, weather, hearts)
    └── render.js    # title / game / end screen renderers
```

## How the game works

- 10 days, 400 m summit.
- Each day: pick **🛌 Rest** (+0–5m, +2 stamina), **🥾 Climb** (+40–60m, −1 stamina), **⚡ Sprint** (+80–120m, −2 stamina).
- Weather: ☀️ Sunny adds +10m, ⛈️ Storm subtracts 10m and blocks Sprint.
- Forecast shows today's + tomorrow's weather. Days 3+ are hidden.
- Reach 400m by day 10 to win. Star tier depends on altitude and remaining stamina.

## Share-by-seed

Each game has a 4-char seed (e.g. `A7K9`). The seed determines the entire weather sequence + dice rolls, so the same seed = the same game.

- **Replay seed** on the end screen plays the same seed again.
- **Share seed** copies a URL like `?seed=A7K9` — paste it to friends to compete on identical conditions.

## Embed in WordPress / any site

The folder is fully static. Upload `index.html`, `styles.css`, `favicon.svg`, and the `src/` folder to your host, then iframe it:

```html
<iframe src="https://yourhost.example.com/mountain-climb/" width="1100" height="900" frameborder="0"></iframe>
```

Make sure the host serves `.js` files with the `application/javascript` MIME type (every modern static host does).

## Phase 2 (not done yet — see GAME_DESIGN.md for roadmap)

- Animations for chart-segment draw + bug hop + dice tumble
- Sound effects + cozy music loop with toggle
- Difficulty selector (Sunny Trail / Standard / Avalanche Pass)
- Title-screen parallax background
- A "DataCruise Arcade" wrapper to plug in game #2 (Cake Builder)
