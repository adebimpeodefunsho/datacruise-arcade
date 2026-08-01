#!/usr/bin/env python3
"""Bundle a DataCruise Arcade game into a self-contained GameMonetize
submission (single index.html + zip).

Per-game config lives in the GAMES dict below. To add a new game:
  1. Register it on GameMonetize → get a gameId.
  2. Add an entry: slug, gameId, module_order (dependency order),
     rewarded_hook (JS snippet that gets called on ad-complete), and
     the label shown on the ad button.
  3. Run: python3 build_gm.py <slug>

The bundler:
  * concatenates the source ES modules in dependency order
  * strips `import` statements and the `export` keyword from decls
  * inlines styles.css into a <style> tag
  * embeds favicon.svg as a data: URI
  * strips <script> tags pointing at /shared/* (arcade-hub only)
  * strips <link rel="stylesheet"> tags for the shared arcade CSS
  * strips the OG meta tags that hardcode arcade.datacruise.app URLs
  * bootstraps GameMonetize's SDK and wires the rewarded-ad hook
  * emits <slug>-gamemonetize.zip alongside a viewable index.html
"""

import base64
import os
import re
import shutil
import sys
import zipfile

ARCADE_ROOT = os.path.expanduser("~/datacruise-arcade")
OUT_ROOT = os.path.join(ARCADE_ROOT, "gm_assets")

# ---------- Per-game config ----------
GAMES = {
    "mountain-climb": {
        "gameId": "aq4rhv7si1o2z5xao0pfqqfmgmxzezwp",
        "title": "Bug-Bug's Mountain Climb",
        "module_order": ["rng.js", "svg.js", "audio.js", "state.js", "render.js", "main.js"],
        "ad_button_label": "▶ WATCH AD → REFILL STAMINA",
        "ad_button_visible_when": "state && state.phase === 'ended' && state.outcome === 'lose'",
        "resurrect_js": """
            state.phase = 'playing';
            state.outcome = null;
            state.stamina = Math.max(2, state.stamina);
            state.finishedAtMs = 0;
            app.innerHTML = renderGame(state);
        """.strip(),
    },
    "data-hunt": {
        "gameId": "g95u49cb8endwk1gy5sn5vdddstehfb4",
        "title": "Hunt the Data Treasure",
        # Non-modular game — single game.js file. Bundler preserves the game's
        # own custom index.html shell (session-end + game-end modals) and
        # inlines style.css + game.js into it.
        "single_file": True,
        "single_file_source": "game.js",
        "single_file_style": "style.css",
        # Ad button lives inside the session-end modal, above "Next Session →".
        "end_actions_selector": "#session-end-modal .modal-card",
        # Only surface the ad on a MISSED session (last treasuresFound was
        # missed: true — i.e. timeout or out-of-tries).
        "ad_button_visible_when": (
            "(function(){ var el=document.getElementById('session-end-modal');"
            " if(!el||el.classList.contains('hidden')) return false;"
            " var t=(typeof state!=='undefined')&&state.treasuresFound;"
            " var last=t&&t[t.length-1]; return !!(last&&last.missed); })()"
        ),
        "ad_button_label": "▶ WATCH AD → RETRY SESSION",
        "resurrect_js": """
            if (state.treasuresFound && state.treasuresFound.length) state.treasuresFound.pop();
            document.getElementById('session-end-modal').classList.add('hidden');
            startSession();
        """.strip(),
    },
    "sentence-builder": {
        "gameId": "aln10unnfj44dqvtlrxwwym0n8tnlc3w",
        "title": "Bridge the Data Sentence",
        "module_order": ["rounds.js", "sound.js", "main.js"],
        # Loss = imperfect round (didn't ace all sentences). Ad grants a
        # replay of the same round with fresh time. Perfect rounds skip the
        # ad — they've already won that one.
        "end_actions_selector": ".controls",
        "ad_button_label": "▶ WATCH AD → REPLAY ROUND",
        "ad_button_visible_when": (
            "state && state.status === 'reviewing' && state.lastRoundResult"
            " && state.lastRoundResult.correct < state.lastRoundResult.total"
        ),
        "resurrect_js": """
            startRound(state.roundIndex);
        """.strip(),
    },
    "scrub-mess": {
        "gameId": "syscwct0nn4flhgfmbqmiurboxsrkq7z",
        "title": "Scrub the Data Mess",
        "module_order": ["words.js", "sound.js", "mascot.js", "main.js"],
        # Loss = timer ran out AND player didn't finish scrubbing all messy
        # items. Ad grants +15 seconds and puts the game back into 'live' mode.
        # If the player cleared the heap (endReason === 'clean') or quit
        # manually, the ad button stays hidden.
        "end_actions_selector": ".result-actions",
        "ad_button_label": "▶ WATCH AD → +15 SECONDS",
        "ad_button_visible_when": (
            "state && state.screen === 'play' && state.phase === 'reveal'"
            " && state.endReason === 'time' && state.trashedMessy < state.totalMessy"
        ),
        "resurrect_js": """
            state.phase = 'live';
            state.endReason = '';
            state.timeLeft = (state.timeLeft || 0) + 15;
            render();
            startTimer();
        """.strip(),
    },
    "data-crossword": {
        "gameId": "vqru0z8yon89pseghdbzzsq5kfnik6re",
        "title": "Crack the Data Crossword",
        "module_order": ["puzzle.js", "sound.js", "mascot.js", "state.js", "render.js", "main.js"],
        # Loss = timer ran out before all words found. Ad grants +30s. If the
        # player already won (all words found + score tallied), the ad button
        # stays hidden — result === 'timeout' is our loss discriminator.
        "ad_button_label": "▶ WATCH AD → +30 SECONDS",
        "ad_button_visible_when": "state && state.screen === 'gameover' && state.result === 'timeout'",
        "resurrect_js": """
            state.result = null;
            state.screen = 'play';
            state.timeLeftMs = (state.timeLeftMs || 0) + 30000;
            draw._over = false;
            draw();
            startTimer();
        """.strip(),
    },
    "derive-jargon": {
        "gameId": "e3aevp2szk3m32whkqqkbu6ab52g0q1r",
        "title": "Derive the Data Jargon",
        "module_order": ["jargon.js", "sound.js", "mascot.js", "daily.js", "state.js", "render.js", "main.js"],
        # Loss: in Classic mode, lives hit 0 before all rounds done. Ad grants
        # +1 life so player can keep the streak alive. Daily mode is one-shot
        # (deterministic per date) — ad hook stays disabled there.
        "ad_button_label": "▶ WATCH AD → +1 LIFE",
        "ad_button_visible_when": "state && state.screen === 'gameover' && state.mode === 'classic' && (state.lives || 0) <= 0",
        "resurrect_js": """
            state.lives = 1;
            state.screen = 'round';
            draw._over = false;
            draw();
            startTimer();
        """.strip(),
    },
    "decision-lab": {
        "gameId": "0hmhteadfq07n01ftax00gzvxhdx99hs",
        "title": "Bug-Bug's Decision Lab",
        "module_order": ["svg.js", "audio.js", "charts.js", "questions.js", "state.js", "render.js", "main.js"],
        # Loss: player fails a round (below-threshold correct answers on any of
        # the 3 rounds). Ad grants a retry of the failed round.
        "ad_button_label": "▶ WATCH AD → RETRY THIS ROUND",
        "ad_button_visible_when": "state && state.phase === 'ended' && typeof didWin === 'function' && !didWin(state)",
        "resurrect_js": """
            if (state.roundScores && state.roundScores.length > 0) state.roundScores.pop();
            state.phase = 'round-intro';
            state.questionIndex = 0;
            state.currentRoundCorrect = 0;
            state.typedAnswer = '';
            app.innerHTML = render(state);
        """.strip(),
    },
    "bubble-catcher": {
        "gameId": "xk0s68gbzszr1m0tvq4zc1jcniryq7u0",
        "title": "Bug-Bug's Bubble Catcher",
        "module_order": ["state.js", "sound.js", "render.js", "main.js"],
        # Two loss paths: 3 missed bubbles OR round timer expires without all
        # slots filled. Ad grants both — 2 misses back AND 10s back on clock.
        "ad_button_label": "▶ WATCH AD → 2 CATCHES + 10s",
        "ad_button_visible_when": "state && state.phase === 'ended' && state.outcome === 'lose'",
        "resurrect_js": """
            state.phase = 'playing';
            state.outcome = null;
            state.misses = Math.max(0, (state.misses || 0) - 2);
            state.elapsedMs = Math.max(0, (state.elapsedMs || 0) - 10000);
            state.flashMs = 0;
            state.cheerMs = 0;
            app.innerHTML = renderGameShell(state);
            startLoop();
        """.strip(),
    },
    "pie-spinner": {
        "gameId": "dq2uo18bwk6rs9xqz8uikekel1jes4d7",
        "title": "Bug-Bug's Pie Spinner",
        "module_order": ["state.js", "sound.js", "render.js", "main.js"],
        # Loss: 8 spins used without lighting every pie slice. Ad grants +2 spins.
        "ad_button_label": "▶ WATCH AD → +2 SPINS",
        "ad_button_visible_when": "state && state.phase === 'ended' && state.outcome === 'lose'",
        "resurrect_js": """
            state.phase = 'playing';
            state.outcome = null;
            state.spinsUsed = Math.max(0, (state.spinsUsed || 0) - 2);
            state.resultFlashMs = 0;
            state.cheerMs = 0;
            app.innerHTML = renderGameShell(state);
            startLoop();
        """.strip(),
    },
    "block-city": {
        "gameId": "uz7nkp9xrxkuypcmpbxpnwy2x4mc3bcq",
        "title": "Bug-Bug's Block City",
        "module_order": ["state.js", "sound.js", "render.js", "main.js"],
        # Block City ends when the timer runs to zero. Rewarded ad adds 20s.
        # timeLeftMs = timeLimitMs - elapsedMs is recomputed each tick, so we
        # bump timeLimitMs rather than timeLeftMs directly.
        "ad_button_label": "▶ WATCH AD → +20 SECONDS",
        "ad_button_visible_when": "state && state.phase === 'ended' && state.outcome === 'lose'",
        "resurrect_js": """
            state.phase = 'playing';
            state.outcome = null;
            if (state.settings) state.settings.timeLimitMs = (state.settings.timeLimitMs || 0) + 20000;
            state.timeLeftMs = 20000;
            app.innerHTML = renderGameShell(state);
            startLoop();
        """.strip(),
    },
}


# ---------- Bundler primitives ----------

NAMESPACE_IMPORT_RE = re.compile(
    r'import\s*\*\s*as\s+(\w+)\s+from\s+["\']\.\/(\w+)\.js["\']'
)

EXPORT_NAME_RE = re.compile(
    r'^\s*export\s+(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+))',
    re.MULTILINE,
)


TOP_DECL_RE = re.compile(r'^(const|let|var)\s+(\w+)\b')


def strip_module_syntax(src: str, seen: set = None) -> str:
    """Remove `import ... from "..."` (single- and multi-line) and the
    `export` keyword from top-level declarations. If `seen` is provided,
    top-level `const/let/var X` declarations whose identifier is already in
    `seen` are commented out (dedup across modules that legitimately shared
    a const name in their own module scopes)."""
    lines = src.splitlines(keepends=True)
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()
        if stripped.startswith("import "):
            rest = line.strip()
            if rest.endswith(";") or rest.endswith('"') or rest.endswith("'"):
                i += 1
                continue
            # Multi-line import — swallow lines until we find one whose closing
            # quote+semicolon marks the end. Handles both single- and double-quoted
            # module specifiers, with or without a trailing semicolon.
            while i < len(lines):
                end = lines[i].rstrip()
                if end.endswith('";') or end.endswith("';") or end.endswith('"') or end.endswith("'"):
                    i += 1
                    break
                i += 1
            continue

        # Strip `export ` from the head so declarations become plain top-level.
        replaced = re.sub(r"^(\s*)export\s+", r"\1", line)

        # Track/dedupe TRUE top-level const/let/var declarations. Only column-0
        # lines qualify — indented `const t = ...` inside a function body must
        # NOT be treated as a top-level declaration.
        if seen is not None and replaced and not replaced[0].isspace():
            m = TOP_DECL_RE.match(replaced)
            if m:
                ident = m.group(2)
                if ident in seen:
                    replaced = "/* dedup */ // " + replaced
                else:
                    seen.add(ident)
        out.append(replaced)
        i += 1
    return "".join(out)


def collect_namespace_imports(module_sources: dict) -> dict:
    """Scan all modules for `import * as NS from "./MOD.js"` patterns.
    Returns { NS: MOD } dict — later used to synthesise a namespace object
    { NS: { export1, export2, ... } } from MOD's export list."""
    ns_map = {}
    for src in module_sources.values():
        for m in NAMESPACE_IMPORT_RE.finditer(src):
            ns, mod = m.group(1), m.group(2)
            ns_map[ns] = mod
    return ns_map


def module_exports(src: str) -> list:
    """Return list of top-level export identifiers in a module source."""
    names = []
    for m in EXPORT_NAME_RE.finditer(src):
        names.append(m.group(1) or m.group(2))
    return names


def build_sdk_block(cfg):
    """Generate the GameMonetize SDK bootstrap + rewarded-ad hook JavaScript
    from a game's config. Shared between modular and single-file bundles."""
    game_id = cfg["gameId"]
    ad_label = cfg["ad_button_label"]
    ad_visible_when = cfg["ad_button_visible_when"]
    resurrect_js = cfg["resurrect_js"]
    # Per-game selector override for where the "▶ WATCH AD" button gets
    # injected. Default is the broad selector that matches most Word Games /
    # arcade end-card DOM patterns.
    end_actions_selector = cfg.get(
        "end_actions_selector",
        ".end-actions, .card .actions, .game-over-actions, .actions-row",
    )
    injection_reference = cfg.get("injection_reference", "firstChild")
    return f"""
/* ==== GameMonetize SDK bootstrap ==== */
const PLATFORM = "site";
const AD = {{ enabled: true, gameId: "{game_id}" }};
let _gmReady = false, _gmPending = null;
// Enable GameMonetize test-ad mode on localhost / dev origins so ads actually
// serve during local verification. Real domains (GameMonetize's player,
// arcade.datacruise.app, etc.) get the production ad stack instead.
const _gmIsLocalOrigin = /^(127\\.0\\.0\\.1|localhost|0\\.0\\.0\\.0|::1)$/.test(location.hostname);
if (PLATFORM === "site" && AD.enabled && AD.gameId) {{
  window.SDK_OPTIONS = {{
    gameId: AD.gameId,
    testing: _gmIsLocalOrigin,
    debug: _gmIsLocalOrigin,
    onEvent: function (a) {{
      switch (a && a.name) {{
        case "SDK_READY":                   _gmReady = true; break;
        case "SDK_GAME_PAUSE":               if (_gmPending) _gmPending.adShown = true; break;
        case "SDK_REWARDED_WATCH_COMPLETE": if (_gmPending) _gmPending.earned = true; break;
        case "SDK_GAME_START":              _gmResolve(true); break;
        case "SDK_ERROR":                   _gmResolve(false); break;
      }}
    }}
  }};
  (function (d, s, id) {{
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://api.gamemonetize.com/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }})(document, "script", "gamemonetize-sdk");
}}
function _gmResolve(ok) {{
  if (!_gmPending) return;
  const g = _gmPending; _gmPending = null;
  clearTimeout(g.timer);
  if (typeof g.done === "function") g.done(!!ok);
}}
function showRewardedAd(onReward) {{
  const done = (ok) => {{ if (ok && typeof onReward === "function") onReward(); }};
  if (_gmReady && typeof sdk !== "undefined" && sdk && typeof sdk.showBanner === "function") {{
    _gmPending = {{ done, earned: false, adShown: false,
                     timer: setTimeout(() => _gmResolve(true), 25000) }};
    try {{ sdk.showBanner(); }} catch (e) {{ _gmResolve(true); }}
    return;
  }}
  setTimeout(() => done(true), 800);
}}

/* ==== Rewarded-ad hook ==== */
function _handleWatchAdContinue() {{
  if (!({ad_visible_when})) return;
  showRewardedAd(() => {{
    {resurrect_js}
  }});
}}

(function () {{
  const seen = new WeakSet();
  const check = () => {{
    if (!({ad_visible_when})) return;
    const actions = document.querySelector("{end_actions_selector}");
    if (!actions || seen.has(actions)) return;
    if (actions.querySelector('[data-action="watch-ad-continue"]')) return;
    seen.add(actions);
    const btn = document.createElement("button");
    btn.className = "gold";
    btn.setAttribute("data-action", "watch-ad-continue");
    btn.textContent = "{ad_label}";
    const refNode = actions.{injection_reference};
    actions.insertBefore(btn, refNode);
  }};
  setInterval(check, 400);
}}());

document.addEventListener("click", function (e) {{
  const t = e.target.closest && e.target.closest("[data-action]");
  if (t && t.getAttribute("data-action") === "watch-ad-continue") {{
    e.preventDefault();
    _handleWatchAdContinue();
  }}
}}, true);
"""


def bundle_single_file(slug: str):
    """Bundle a single-file game (its own index.html + game.js + style.css)
    into a fully self-contained submission. Used for games like Data Hunt that
    aren't structured as ES modules."""
    cfg = GAMES[slug]
    game_dir = os.path.join(ARCADE_ROOT, "games", slug)
    out_dir = os.path.join(OUT_ROOT, slug)
    os.makedirs(out_dir, exist_ok=True)

    js_file = cfg.get("single_file_source", "game.js")
    css_file = cfg.get("single_file_style", "style.css")

    with open(os.path.join(game_dir, "index.html")) as f:
        html = f.read()
    with open(os.path.join(game_dir, css_file)) as f:
        css = f.read()
    with open(os.path.join(game_dir, js_file)) as f:
        js = f.read()

    # Strip shared arcade-hub scripts and the local stylesheet link
    html = re.sub(r'\s*<link rel="stylesheet" href="[^"]+"[^>]*>', '', html)
    html = re.sub(r'\s*<script src="/shared/[^"]+"[^>]*></script>', '', html)
    # Strip OG / twitter meta tags with hardcoded arcade.datacruise.app URLs
    html = re.sub(r'\s*<meta property="og:url"[^>]*/?>', '', html)
    html = re.sub(r'\s*<meta property="og:image[^"]*"[^>]*/?>', '', html)
    html = re.sub(r'\s*<meta name="twitter:image"[^>]*/?>', '', html)
    # Strip the game's own script tag (we'll inline it below)
    html = re.sub(rf'\s*<script[^>]*src="{re.escape(js_file)}[^"]*"[^>]*></script>', '', html)

    sdk_block = build_sdk_block(cfg)
    inline_style = f'<style>\n{css}\n</style>'
    inline_script = f'<script>\n{js}\n\n{sdk_block}\n</script>'

    if '</head>' in html:
        html = html.replace('</head>', f'{inline_style}\n</head>')
    else:
        html = inline_style + html
    if '</body>' in html:
        html = html.replace('</body>', f'{inline_script}\n</body>')
    else:
        html = html + inline_script

    out_html = os.path.join(out_dir, "index.html")
    with open(out_html, "w") as f:
        f.write(html)
    zip_path = os.path.join(out_dir, f"{slug}-gamemonetize.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(out_html, arcname="index.html")

    print(f"[{slug}] wrote {out_html} ({os.path.getsize(out_html):,} bytes)")
    print(f"[{slug}] wrote {zip_path} ({os.path.getsize(zip_path):,} bytes)")
    return out_dir


def bundle_game(slug: str):
    cfg = GAMES[slug]
    if cfg.get("single_file"):
        return bundle_single_file(slug)
    game_dir = os.path.join(ARCADE_ROOT, "games", slug)
    src_dir = os.path.join(game_dir, "src")
    out_dir = os.path.join(OUT_ROOT, slug)
    os.makedirs(out_dir, exist_ok=True)

    # ---- Read modules once (needed twice: for concat AND for namespace scan) ----
    module_sources = {}
    for name in cfg["module_order"]:
        with open(os.path.join(src_dir, name)) as f:
            module_sources[name] = f.read()

    # ---- Detect `import * as NS from "./MOD.js"` and emit namespace objects ----
    ns_map = collect_namespace_imports(module_sources)
    ns_block = ""
    if ns_map:
        ns_lines = []
        for ns, mod in ns_map.items():
            mod_file = f"{mod}.js"
            if mod_file not in module_sources:
                continue
            exports = module_exports(module_sources[mod_file])
            if not exports:
                continue
            ns_lines.append(f"const {ns} = {{ {', '.join(exports)} }};")
        if ns_lines:
            ns_block = "/* ==== Synthesised namespace objects for `import * as X` ==== */\n" + "\n".join(ns_lines) + "\n"

    # ---- Concatenate modules (strip syntax + dedupe cross-module names) ----
    # `seen` tracks top-level const/let/var identifiers so if two modules
    # independently declared the same name (legit in ES-module scopes), the
    # second occurrence is commented out.
    seen = set()
    parts = []
    for idx, name in enumerate(cfg["module_order"]):
        if idx == len(cfg["module_order"]) - 1 and ns_block:
            parts.append(ns_block)
        stripped = strip_module_syntax(module_sources[name], seen=seen)
        parts.append(f"/* ==== {name} ==== */\n{stripped}\n")
    bundled_js = "\n".join(parts)

    # ---- Read styles.css ----
    css_path = os.path.join(game_dir, "styles.css")
    with open(css_path) as f:
        bundled_css = f.read()

    # ---- Read favicon (or fall back to game_dir root) ----
    favicon_path = os.path.join(game_dir, "favicon.svg")
    if os.path.exists(favicon_path):
        with open(favicon_path) as f:
            favicon_svg = f.read()
        favicon_href = "data:image/svg+xml;base64," + base64.b64encode(favicon_svg.encode()).decode()
    else:
        favicon_href = ""

    # ---- GameMonetize SDK + rewarded-ad hook (shared helper) ----
    sdk_block = build_sdk_block(cfg)
    bundled_js_full = bundled_js + "\n" + sdk_block

    # ---- Compose the self-contained index.html ----
    # (Don't reuse the game's own index.html — it references external
    # /shared/* scripts and hardcoded arcade URLs. Build a fresh minimal shell.)
    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>{cfg['title']}</title>
  <link rel="icon" href="{favicon_href}"/>
  <style>
{bundled_css}
  </style>
</head>
<body>
  <div id="app" aria-live="polite"></div>
  <script>
{bundled_js_full}
  </script>
</body>
</html>
"""

    # ---- Write files ----
    out_html = os.path.join(out_dir, "index.html")
    with open(out_html, "w") as f:
        f.write(html)

    zip_path = os.path.join(out_dir, f"{slug}-gamemonetize.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(out_html, arcname="index.html")

    print(f"[{slug}] wrote {out_html} ({os.path.getsize(out_html):,} bytes)")
    print(f"[{slug}] wrote {zip_path} ({os.path.getsize(zip_path):,} bytes)")
    return out_dir


if __name__ == "__main__":
    slugs = sys.argv[1:] or list(GAMES.keys())
    for slug in slugs:
        if slug not in GAMES:
            print(f"unknown slug: {slug}. known: {list(GAMES)}", file=sys.stderr)
            sys.exit(1)
        bundle_game(slug)
