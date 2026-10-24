/* ============================================================
   DataCruise Arcade — shared script loaded by every game page
     1. Gates the 7 paid games behind the unlock.
     2. Injects the floating "← Arcade" back-to-hub button.
     3. Loads Cloudflare Web Analytics (privacy-friendly, no cookies).
============================================================ */

/* ---- Paywall gate -------------------------------------------------------
   Every game page loads this file, so it is the only place that can gate all
   11 games without editing each of them. Runs FIRST, before the nav button and
   before the game's own (also deferred) scripts.

   Before this existed, the lock lived only on the hub's cards: typing or
   following a paid game's URL played it in full, for free.

   NOTE — deliberate duplication: PAID below mirrors CATALOGUE.paid in
   shared/unlock.js. unlock.js is an IIFE that only ever runs on the hub, and
   game pages load nothing but this file, so sharing one constant would mean
   adding a script tag to all 11 game HTML files. If a game moves between free
   and paid, EDIT BOTH LISTS.

   This is a client-side gate, exactly like the hub's. It closes the casual and
   organic route in (a search result, a shared link, a guessed URL). It is not a
   hard paywall — anyone with devtools can still set the flag. Hard enforcement
   would mean serving the paid games' files from the Worker behind a signed
   cookie, which is a much larger change.
------------------------------------------------------------------------- */
(function gatePaidGames() {
  /* FREE_MODE — the full pack is currently given away, so this gate stands down and
     every game URL plays. Mirrors FREE_MODE in shared/unlock.js: if one is flipped the
     other must be too, or the hub and the direct URLs will disagree. Set both back to
     false to restore the paid £8 gate exactly as it was. */
  var FREE_MODE = true;
  if (FREE_MODE) return;

  var PAID = [
    'pie-spinner', 'bubble-catcher', 'dashboard-drop', 'data-crossword',
    'scrub-mess', 'data-hunt', 'decision-lab'
  ];
  var STORAGE_KEY = 'datacruise.unlock.v1';

  var match = window.location.pathname.match(/\/games\/([a-z0-9-]+)(?:\/|\/index\.html)?$/i);
  var slug = match ? match[1].toLowerCase() : '';
  if (!slug || PAID.indexOf(slug) === -1) return;   // hub, or a free game

  var unlocked;
  try {
    var obj = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    unlocked = !!(obj && obj.unlocked);
  } catch (_) {
    /* Storage blocked (private mode, cookies off). Fail OPEN: locking out a
       buyer who paid is far worse than letting a rare visitor through. */
    unlocked = true;
  }
  if (unlocked) return;

  /* replace(), not assign() — Back must not bounce them into the game again. */
  window.location.replace('/#unlock');
})();

// ---- Cloudflare Web Analytics --------------------------------
(function loadCfAnalytics() {
  if (window.__cfBeaconLoaded) return;
  window.__cfBeaconLoaded = true;
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute(
    'data-cf-beacon',
    '{"token": "b41ed92d610147e3bfc623898279857d"}'
  );
  (document.head || document.documentElement).appendChild(s);
})();

// ---- Back-to-Arcade button -----------------------------------
(function () {
  if (window.__arcadeNavInjected) return;
  window.__arcadeNavInjected = true;

  const css = `
    .arcade-nav-back {
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 2147483600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px 8px 10px;
      /* 44px is what a finger needs; this sits on every game page. */
      min-height: 44px;
      box-sizing: border-box;
      background: #ff6a00;
      color: #fff;
      font-family: ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.01em;
      text-decoration: none;
      border: 2px solid #0e0e10;
      border-radius: 999px;
      box-shadow: 0 4px 0 0 #0e0e10;
      cursor: pointer;
      transition: transform 80ms ease, box-shadow 80ms ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .arcade-nav-back:hover {
      transform: translateY(-1px);
      box-shadow: 0 5px 0 0 #0e0e10;
    }
    .arcade-nav-back:active {
      transform: translateY(3px);
      box-shadow: 0 1px 0 0 #0e0e10;
    }
    .arcade-nav-back-arrow {
      display: inline-block;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      color: #0e0e10;
      font-size: 14px;
      line-height: 18px;
      text-align: center;
      font-weight: 900;
    }
    @media (max-width: 480px) {
      .arcade-nav-back {
        top: 8px;
        left: 8px;
        padding: 7px 12px 7px 8px;
        font-size: 13px;
      }
    }
    @media print {
      .arcade-nav-back { display: none !important; }
    }
  `;

  function inject() {
    if (document.getElementById('arcade-nav-style')) return;

    const style = document.createElement('style');
    style.id = 'arcade-nav-style';
    style.textContent = css;
    document.head.appendChild(style);

    const a = document.createElement('a');
    a.className = 'arcade-nav-back';
    a.href = '../../index.html';
    a.setAttribute('aria-label', 'Back to DataCruise Arcade');
    a.innerHTML = '<span class="arcade-nav-back-arrow" aria-hidden="true">←</span><span>Arcade</span>';
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject, { once: true });
  } else {
    inject();
  }
})();

/* Offline support: every game page loads this file, so it is the one place
   that reaches all 11 games without editing each of them. */
(function () {
  if (document.querySelector('script[src="/shared/sw-register.js"]')) return;
  var t = document.createElement('script');
  t.src = '/shared/sw-register.js';
  t.defer = true;
  document.head.appendChild(t);
})();
