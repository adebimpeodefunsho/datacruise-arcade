/* ============================================================
   DataCruise Arcade — Back-to-Arcade button
   Self-contained: injected on load into each game's page.
   Adds a floating top-left "← Arcade" pill linking to the hub.
============================================================ */

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
