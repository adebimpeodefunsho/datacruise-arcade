/* Registers the Arcade service worker. Loaded by the hub and, via
   arcade-nav.js, by every game — so whichever page someone lands on first
   installs the offline cache. Safe to load more than once. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (window.__arcadeSW) return;
  window.__arcadeSW = true;

  window.addEventListener('load', function () {
    navigator.serviceWorker
      /* updateViaCache:'none' — never let a cached copy of sw.js hide a deploy. */
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', function () {
            /* A new version took over an already-controlled page: reload once
               so nobody keeps playing against half-old code. */
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              sw.postMessage('skip-waiting');
            }
          });
        });
      })
      .catch(function () { /* offline support is a bonus, never a blocker */ });
  });

  var reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
})();
