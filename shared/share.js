/* ============================================================
   DataCruise Arcade — shared "Share" button
   ------------------------------------------------------------
   Floating top-right "Share" pill on every page. Tapping it opens
   an explicit list of platforms (WhatsApp, Facebook, X, Telegram,
   Email, Copy link) — the same on phone and desktop, so people
   always see where they're sharing instead of the OS's generic
   share sheet.

   • Link: uses a SHORT link from /api/short?slug=… (falls back to
     the full og:url if the shortener is unavailable). Short links
     are much tidier in a WhatsApp message.
   • Image: each platform fetches the page's og:image (the game's
     hero card) to build its own link preview — so the picture
     rides along with the link automatically.
   • "More apps…" still exposes the native share sheet for anyone
     who wants it.

   Loaded with `defer` from the hub and every game page.
============================================================ */
(function () {
  'use strict';
  if (window.__arcadeShareInjected) return;
  window.__arcadeShareInjected = true;

  function meta(sel) {
    const el = document.querySelector(sel);
    return el ? el.getAttribute('content') : '';
  }
  const fullUrl =
    meta('meta[property="og:url"]') ||
    (document.querySelector('link[rel="canonical"]') || {}).href ||
    location.href;
  const shareTitle =
    meta('meta[property="og:title"]') || document.title || 'DataCruise Arcade';
  const shareText =
    meta('meta[property="og:description"]') ||
    'A little browser game that teaches the feel of data. Tap to play.';

  // Link actually shared — swapped to the short link once it loads.
  let linkUrl = fullUrl;

  // ---- fetch a short link (same-origin, cached at the edge) -----
  (function loadShort() {
    let slug = 'hub';
    const m = fullUrl.match(/\/games\/([a-z0-9-]+)\/?/i);
    if (m) slug = m[1];
    fetch('/api/short?slug=' + encodeURIComponent(slug), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.short) { linkUrl = d.short; } })
      .catch(function () {});
  })();

  // ---- per-platform share intents ------------------------------
  function intents() {
    const u = encodeURIComponent(linkUrl);
    const waText = encodeURIComponent(shareTitle + ' — play free 🎮\n' + linkUrl);
    return {
      whatsapp: 'https://wa.me/?text=' + waText,
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u,
      x: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareTitle + ' 🎮') + '&url=' + u,
      telegram: 'https://t.me/share/url?url=' + u + '&text=' + encodeURIComponent(shareTitle),
      email: 'mailto:?subject=' + encodeURIComponent(shareTitle) +
        '&body=' + encodeURIComponent(shareText + '\n\nPlay free: ' + linkUrl),
    };
  }

  const css = `
    .dc-share-btn {
      position: fixed; top: 12px; right: 12px; z-index: 2147483601;
      display: inline-flex; align-items: center; gap: 7px;
      padding: 8px 14px 8px 12px;
      background: #ffd23f; color: #0e0e10;
      font-family: ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif;
      font-weight: 800; font-size: 14px; letter-spacing: 0.01em;
      border: 2px solid #0e0e10; border-radius: 999px;
      box-shadow: 0 4px 0 0 #0e0e10; cursor: pointer;
      transition: transform 80ms ease, box-shadow 80ms ease;
      user-select: none; -webkit-tap-highlight-color: transparent;
    }
    .dc-share-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 0 0 #0e0e10; }
    .dc-share-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 0 #0e0e10; }
    .dc-share-ico { font-size: 15px; line-height: 1; }

    .dc-share-pop {
      position: fixed; top: 54px; right: 12px; z-index: 2147483601;
      display: none; flex-direction: column; gap: 5px;
      padding: 10px; min-width: 210px; max-width: calc(100vw - 24px);
      background: #fff; border: 2px solid #0e0e10; border-radius: 16px;
      box-shadow: 0 6px 0 0 #0e0e10;
      font-family: ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif;
    }
    .dc-share-pop.open { display: flex; }
    .dc-share-pop .dc-title { font-size: 12px; font-weight: 800; color: #8a8a90;
      padding: 2px 4px 4px; letter-spacing: .04em; text-transform: uppercase; }
    .dc-share-pop a, .dc-share-pop button {
      display: flex; align-items: center; gap: 11px;
      padding: 10px 12px; border-radius: 10px;
      background: #f4f4f5; border: 0; width: 100%;
      color: #0e0e10; font: inherit; font-weight: 700; font-size: 14px;
      text-decoration: none; cursor: pointer; text-align: left;
    }
    .dc-share-pop a:active, .dc-share-pop button:active { transform: scale(0.98); }
    .dc-share-pop a:hover, .dc-share-pop button:hover { background: #ffe9c7; }
    .dc-share-ic { width: 26px; height: 26px; border-radius: 7px; flex: 0 0 26px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 15px; color: #fff; }
    .dc-ic-wa { background: #25D366; }
    .dc-ic-fb { background: #1877F2; }
    .dc-ic-x  { background: #0e0e10; }
    .dc-ic-tg { background: #29A9EB; }
    .dc-ic-em { background: #d9534f; }
    .dc-ic-cp { background: #6b7280; }
    .dc-ic-more { background: #ffce3a; color: #0e0e10; }
    .dc-share-copied { color: #12833b; }
    @media (max-width: 480px) {
      .dc-share-btn { top: 8px; right: 8px; padding: 7px 12px 7px 10px; font-size: 13px; }
      .dc-share-pop { top: 48px; right: 8px; }
    }
    @media print { .dc-share-btn, .dc-share-pop { display: none !important; } }
  `;

  function row(kind, icoClass, icoChar, label) {
    const a = document.createElement('a');
    a.target = '_blank';
    a.rel = 'noopener';
    a.dataset.kind = kind;
    a.innerHTML = '<span class="dc-share-ic ' + icoClass + '" aria-hidden="true">' + icoChar +
      '</span><span>' + label + '</span>';
    return a;
  }

  function inject() {
    if (document.getElementById('dc-share-style')) return;
    const style = document.createElement('style');
    style.id = 'dc-share-style';
    style.textContent = css;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dc-share-btn';
    btn.setAttribute('aria-label', 'Share this game');
    btn.innerHTML = '<span class="dc-share-ico" aria-hidden="true">↗</span><span>Share</span>';
    document.body.appendChild(btn);

    const pop = document.createElement('div');
    pop.className = 'dc-share-pop';
    pop.setAttribute('role', 'menu');
    const title = document.createElement('div');
    title.className = 'dc-title';
    title.textContent = 'Share to';
    pop.appendChild(title);

    const rWa = row('whatsapp', 'dc-ic-wa', '💬', 'WhatsApp');
    const rFb = row('facebook', 'dc-ic-fb', 'f', 'Facebook');
    const rX = row('x', 'dc-ic-x', '𝕏', 'X (Twitter)');
    const rTg = row('telegram', 'dc-ic-tg', '✈', 'Telegram');
    const rEm = row('email', 'dc-ic-em', '✉', 'Email');
    [rWa, rFb, rX, rTg, rEm].forEach(function (a) { pop.appendChild(a); });

    // Set/refresh hrefs each time the popover opens (so the short link,
    // once loaded, is always used).
    function refreshLinks() {
      const I = intents();
      rWa.href = I.whatsapp; rFb.href = I.facebook; rX.href = I.x;
      rTg.href = I.telegram; rEm.href = I.email;
    }

    // Copy link
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.innerHTML = '<span class="dc-share-ic dc-ic-cp" aria-hidden="true">🔗</span><span>Copy link</span>';
    copyBtn.addEventListener('click', function () {
      const done = function () {
        copyBtn.querySelector('span:last-child').textContent = 'Copied!';
        copyBtn.classList.add('dc-share-copied');
        setTimeout(function () { pop.classList.remove('open'); }, 900);
      };
      const val = linkUrl;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(done, done);
      } else {
        const ta = document.createElement('textarea');
        ta.value = val; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        document.body.removeChild(ta); done();
      }
    });
    pop.appendChild(copyBtn);

    // More apps… (native sheet) — only where supported
    if (navigator.share) {
      const moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.innerHTML = '<span class="dc-share-ic dc-ic-more" aria-hidden="true">⋯</span><span>More apps…</span>';
      moreBtn.addEventListener('click', function () {
        pop.classList.remove('open');
        navigator.share({ title: shareTitle, text: shareText, url: linkUrl }).catch(function () {});
      });
      pop.appendChild(moreBtn);
    }

    document.body.appendChild(pop);

    btn.addEventListener('click', function () {
      refreshLinks();
      pop.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!pop.classList.contains('open')) return;
      if (e.target === btn || btn.contains(e.target) || pop.contains(e.target)) return;
      pop.classList.remove('open');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject, { once: true });
  } else {
    inject();
  }
})();
