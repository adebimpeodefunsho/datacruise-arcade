/* ============================================================
   DataCruise Arcade — shared "Share" button
   ------------------------------------------------------------
   Injects a floating top-right "Share" pill on every page.

   • On phones (where most Facebook traffic lands) it opens the
     native OS share sheet via the Web Share API — one tap to
     Facebook, WhatsApp, Messages, etc.
   • On desktop it opens a small popover: Facebook, WhatsApp, X,
     and Copy link.

   The URL it shares is the page's canonical og:url (so a shared
   link always points at the live site, never a localhost/file://
   address used while developing). Title/text come from the
   og:title / og:description tags.

   Loaded with `defer` from the hub and every game page.
============================================================ */
(function () {
  'use strict';
  if (window.__arcadeShareInjected) return;
  window.__arcadeShareInjected = true;

  // ---- what to share ----------------------------------------
  function meta(sel) {
    const el = document.querySelector(sel);
    return el ? el.getAttribute('content') : '';
  }
  const shareUrl =
    meta('meta[property="og:url"]') ||
    (document.querySelector('link[rel="canonical"]') || {}).href ||
    location.href;
  const shareTitle =
    meta('meta[property="og:title"]') || document.title || 'DataCruise Arcade';
  const shareText =
    meta('meta[property="og:description"]') ||
    'A little browser game that teaches the feel of data. Tap to play.';

  const U = encodeURIComponent(shareUrl);
  const T = encodeURIComponent(shareTitle);
  const TT = encodeURIComponent(shareTitle + ' — ' + shareText);

  const LINKS = {
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + U,
    whatsapp: 'https://wa.me/?text=' + encodeURIComponent(shareTitle + '  ' + shareUrl),
    x: 'https://twitter.com/intent/tweet?url=' + U + '&text=' + T,
  };

  // ---- styles (mirrors the top-left "Arcade" back pill) -----
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
      display: none; flex-direction: column; gap: 6px;
      padding: 10px; min-width: 190px;
      background: #fff; border: 2px solid #0e0e10; border-radius: 16px;
      box-shadow: 0 6px 0 0 #0e0e10;
      font-family: ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif;
    }
    .dc-share-pop.open { display: flex; }
    .dc-share-pop a, .dc-share-pop button {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 10px;
      background: #f4f4f5; border: 0; width: 100%;
      color: #0e0e10; font: inherit; font-weight: 700; font-size: 14px;
      text-decoration: none; cursor: pointer; text-align: left;
    }
    .dc-share-pop a:hover, .dc-share-pop button:hover { background: #ffe9c7; }
    .dc-share-emoji { font-size: 17px; width: 20px; text-align: center; }
    .dc-share-copied { color: #12833b; }
    @media (max-width: 480px) {
      .dc-share-btn { top: 8px; right: 8px; padding: 7px 12px 7px 10px; font-size: 13px; }
      .dc-share-pop { top: 48px; right: 8px; }
    }
    @media print { .dc-share-btn, .dc-share-pop { display: none !important; } }
  `;

  function buildPopoverRow(href, emoji, label) {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML =
      '<span class="dc-share-emoji" aria-hidden="true">' + emoji + '</span><span>' + label + '</span>';
    return a;
  }

  function inject() {
    if (document.getElementById('dc-share-style')) return;
    const style = document.createElement('style');
    style.id = 'dc-share-style';
    style.textContent = css;
    document.head.appendChild(style);

    // The button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dc-share-btn';
    btn.setAttribute('aria-label', 'Share this game');
    btn.innerHTML = '<span class="dc-share-ico" aria-hidden="true">↗</span><span>Share</span>';
    document.body.appendChild(btn);

    // Desktop fallback popover
    const pop = document.createElement('div');
    pop.className = 'dc-share-pop';
    pop.appendChild(buildPopoverRow(LINKS.facebook, '📘', 'Facebook'));
    pop.appendChild(buildPopoverRow(LINKS.whatsapp, '💬', 'WhatsApp'));
    pop.appendChild(buildPopoverRow(LINKS.x, '✖️', 'X / Twitter'));

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.innerHTML = '<span class="dc-share-emoji" aria-hidden="true">🔗</span><span>Copy link</span>';
    copyBtn.addEventListener('click', function () {
      const done = function () {
        copyBtn.querySelector('span:last-child').textContent = 'Copied!';
        copyBtn.classList.add('dc-share-copied');
        setTimeout(function () { pop.classList.remove('open'); }, 900);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(done, done);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        document.body.removeChild(ta); done();
      }
    });
    pop.appendChild(copyBtn);
    document.body.appendChild(pop);

    btn.addEventListener('click', function () {
      // Native share sheet where available (mobile) — the viral path.
      if (navigator.share) {
        navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(function () {});
        return;
      }
      pop.classList.toggle('open');
    });

    // Close popover on outside click
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
