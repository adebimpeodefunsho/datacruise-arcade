/* ============================================================
   DataCruise Arcade — shareable RESULT CARD
   ------------------------------------------------------------
   A game calls, at its win/end moment:

     DataCruiseResult.ready({
       slug: 'mountain-climb',
       game: 'Mountain Climb',
       headline: '7 DAYS',              // the big brag
       sub: 'reached the summit',       // optional line under it
       stars: 3,                        // optional 0..starsMax
       starsMax: 3,                     // optional (default 3)
       // accent / mascot / url are auto-derived from slug but overridable
     });

   It drops a pulsing "📸 Share my score" button. Tapping it
   renders a captivating 1080×1080 card on a <canvas> and opens
   a reveal modal. From there:
     • Mobile: Web Share API shares the actual PNG *image* — it
       lands straight in the Facebook/WhatsApp/Instagram composer.
     • Desktop: Download the PNG + open the Facebook share dialog
       for the game link + copy link.

   Self-contained, no dependencies. Loaded with `defer`.
============================================================ */
(function () {
  'use strict';
  if (window.DataCruiseResult) return;

  var BASE = 'https://arcade.datacruise.app';

  // series palette + mascot per game slug
  var CHART = { accent: '#ff6a00', accent2: '#b23a00', mascot: '🐞', ink: '#0e0e10' };
  var WORD  = { accent: '#7c5cff', accent2: '#4326b0', mascot: '🔍', ink: '#0e0e10' };
  var SERIES = {
    'mountain-climb': CHART, 'block-city': CHART, 'bubble-catcher': CHART,
    'dashboard-drop': CHART, 'pie-spinner': CHART, 'decision-lab': CHART,
    'derive-jargon': WORD, 'data-crossword': WORD, 'data-hunt': WORD,
    'scrub-mess': WORD, 'sentence-builder': WORD
  };

  function metaContent(sel) {
    var el = document.querySelector(sel);
    return el ? el.getAttribute('content') : '';
  }

  // ---------- captivating card renderer ----------------------
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function star(ctx, cx, cy, spikes, outer, inner) {
    var rot = -Math.PI / 2, step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    for (var i = 0; i < spikes; i++) {
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    }
    ctx.closePath();
  }

  // fit text to a max width by shrinking font size
  function fitFont(ctx, text, weight, family, maxSize, minSize, maxWidth) {
    var size = maxSize;
    do {
      ctx.font = weight + ' ' + size + 'px ' + family;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 4;
    } while (size > minSize);
    return size;
  }

  var FAM = '"Nunito", ui-rounded, "SF Pro Rounded", system-ui, sans-serif';

  function drawCard(o) {
    var S = 1080;
    var canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    var ctx = canvas.getContext('2d');
    var pal = o._pal;

    // background gradient (always drawn — also the fallback if no scene)
    var g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, pal.accent);
    g.addColorStop(1, pal.accent2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    var hasScene = o._sceneImg && o._sceneImg.complete && o._sceneImg.naturalWidth > 0;

    if (hasScene) {
      // draw the AI scene "cover"-fitted, then tint it toward the game's
      // accent and add scrims so the top kicker / bottom footer stay legible.
      var iw = o._sceneImg.naturalWidth, ih = o._sceneImg.naturalHeight;
      var scale = Math.max(S / iw, S / ih);
      var dw = iw * scale, dh = ih * scale;
      ctx.drawImage(o._sceneImg, (S - dw) / 2, (S - dh) / 2, dw, dh);
      // subtle accent wash for series cohesion
      ctx.fillStyle = pal.accent2; ctx.globalAlpha = 0.12; ctx.fillRect(0, 0, S, S); ctx.globalAlpha = 1;
      // top scrim (behind kicker)
      var tg = ctx.createLinearGradient(0, 0, 0, 240);
      tg.addColorStop(0, 'rgba(14,14,16,0.55)'); tg.addColorStop(1, 'rgba(14,14,16,0)');
      ctx.fillStyle = tg; ctx.fillRect(0, 0, S, 240);
      // bottom scrim (behind footer + ribbon)
      var bg = ctx.createLinearGradient(0, S - 260, 0, S);
      bg.addColorStop(0, 'rgba(14,14,16,0)'); bg.addColorStop(1, 'rgba(14,14,16,0.62)');
      ctx.fillStyle = bg; ctx.fillRect(0, S - 260, S, 260);
    } else {
      // soft glow blobs
      var blob = function (x, y, r, a) {
        var rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, 'rgba(255,255,255,' + a + ')');
        rg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      };
      blob(180, 200, 320, 0.20);
      blob(940, 320, 260, 0.14);

      // confetti (deterministic scatter)
      var conf = ['#ffd23f', '#ffffff', '#ff8a3d', '#8affc1', '#8ab6ff'];
      var seed = 7;
      var rnd = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      for (var i = 0; i < 46; i++) {
        var cx = rnd() * S, cy = rnd() * S;
        if (cy > 300 && cy < 880 && cx > 90 && cx < 990) continue;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rnd() * 6.28);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = conf[(i % conf.length)];
        var w = 14 + rnd() * 16;
        roundRect(ctx, -w / 2, -w / 4, w, w / 2, 4); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // header kicker
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 30px ' + FAM;
    ctx.save();
    ctx.globalAlpha = 0.92;
    // dot + wordmark
    var kick = 'DATACRUISE ARCADE';
    ctx.font = '900 30px ' + FAM;
    var kw = ctx.measureText(kick).width;
    ctx.beginPath(); ctx.arc(S / 2 - kw / 2 - 26, 78, 13, 0, 7);
    ctx.fillStyle = '#ffd23f'; ctx.fill();
    ctx.beginPath(); ctx.arc(S / 2 - kw / 2 - 26, 78, 13, 0, 7);
    ctx.lineWidth = 3; ctx.strokeStyle = pal.ink; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(kick, S / 2 + 6, 90);
    ctx.restore();

    // mascot — only on the fallback gradient; when a scene is present it IS the hero
    if (!hasScene) {
      ctx.font = '150px ' + FAM;
      ctx.fillText(o.mascot || pal.mascot, S / 2, 300);
    }

    // central white card with hard black border/shadow (arcade look)
    var cardX = 90, cardY = 360, cardW = S - 180, cardH = 470, cr = 44;
    ctx.fillStyle = 'rgba(14,14,16,1)';
    roundRect(ctx, cardX + 10, cardY + 14, cardW, cardH, cr); ctx.fill(); // shadow
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, cardY, cardW, cardH, cr); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = pal.ink;
    roundRect(ctx, cardX, cardY, cardW, cardH, cr); ctx.stroke();

    // game title (kicker inside card)
    ctx.fillStyle = pal.accent2;
    ctx.font = '900 40px ' + FAM;
    ctx.fillText((o.game || '').toUpperCase(), S / 2, cardY + 84);

    // big headline metric (auto-fit)
    var headline = String(o.headline || 'YOU DID IT!');
    var hy = cardY + 210;
    var hSize = fitFont(ctx, headline, '900', FAM, 150, 60, cardW - 90);
    ctx.font = '900 ' + hSize + 'px ' + FAM;
    ctx.fillStyle = pal.ink;
    ctx.fillText(headline, S / 2, hy);

    // sub line
    if (o.sub) {
      ctx.font = '700 34px ' + FAM;
      ctx.fillStyle = '#55555b';
      ctx.fillText(String(o.sub), S / 2, hy + 58);
    }

    // stars row
    var sMax = o.starsMax || 3;
    if (typeof o.stars === 'number') {
      var gap = 84, sy = cardY + cardH - 78;
      var startX = S / 2 - ((sMax - 1) * gap) / 2;
      for (var s = 0; s < sMax; s++) {
        var filled = s < o.stars;
        star(ctx, startX + s * gap, sy, 5, 34, 15);
        ctx.fillStyle = filled ? '#ffc21c' : '#e7e7ea';
        ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = filled ? pal.ink : '#cfcfd4';
        ctx.stroke();
      }
    }

    // CTA ribbon
    var cy2 = 908;
    ctx.font = '900 46px ' + FAM;
    var cta = 'Can you beat me? 🎮';
    var cw = ctx.measureText(cta).width + 76;
    ctx.fillStyle = '#ffd23f';
    roundRect(ctx, S / 2 - cw / 2, cy2 - 46, cw, 74, 37); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = pal.ink;
    roundRect(ctx, S / 2 - cw / 2, cy2 - 46, cw, 74, 37); ctx.stroke();
    ctx.fillStyle = pal.ink;
    ctx.fillText(cta, S / 2, cy2 + 2);

    // footer url
    ctx.font = '800 30px ' + FAM;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText('▶  Play free · datacruise-arcade', S / 2, 1012);

    return canvas;
  }

  // ---------- share plumbing ---------------------------------
  function canvasToBlob(canvas) {
    return new Promise(function (res) {
      if (canvas.toBlob) canvas.toBlob(function (b) { res(b); }, 'image/png');
      else {
        var data = canvas.toDataURL('image/png').split(',')[1];
        var bin = atob(data), arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        res(new Blob([arr], { type: 'image/png' }));
      }
    });
  }

  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // ---------- UI: button + reveal modal ----------------------
  function injectStyle() {
    if (document.getElementById('dc-result-style')) return;
    var st = document.createElement('style');
    st.id = 'dc-result-style';
    st.textContent = [
      '.dc-res-fab{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483602;',
      'display:inline-flex;align-items:center;gap:9px;padding:14px 24px;cursor:pointer;',
      'background:#ffd23f;color:#0e0e10;border:3px solid #0e0e10;border-radius:999px;',
      'font-family:' + FAM + ';font-weight:900;font-size:19px;box-shadow:0 6px 0 0 #0e0e10;',
      '-webkit-tap-highlight-color:transparent;animation:dc-pop .4s ease, dc-bob 1.8s ease-in-out .5s infinite;}',
      '.dc-res-fab:active{transform:translateX(-50%) translateY(3px);box-shadow:0 2px 0 0 #0e0e10;}',
      '@keyframes dc-pop{from{transform:translateX(-50%) scale(.6);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}',
      '@keyframes dc-bob{0%,100%{margin-bottom:0}50%{margin-bottom:8px}}',
      '.dc-res-ov{position:fixed;inset:0;z-index:2147483603;display:none;align-items:center;justify-content:center;',
      'background:rgba(14,14,16,.72);backdrop-filter:blur(4px);padding:18px;}',
      '.dc-res-ov.open{display:flex;}',
      '.dc-res-modal{width:min(420px,94vw);max-height:94vh;overflow-y:auto;background:#fff;border:3px solid #0e0e10;border-radius:22px;',
      'box-shadow:0 10px 0 0 #0e0e10;padding:16px;font-family:' + FAM + ';text-align:center;}',
      '.dc-res-modal img{width:100%;border-radius:14px;display:block;border:2px solid #0e0e10;}',
      '.dc-res-slabel{font-size:12px;font-weight:800;color:#8a8a90;margin:14px 0 8px;letter-spacing:.05em;text-transform:uppercase;}',
      '.dc-res-plat{display:flex;justify-content:center;gap:9px;flex-wrap:wrap;}',
      '.dc-res-plat a,.dc-res-plat .dc-res-cp{width:46px;height:46px;border-radius:50%;border:2px solid #0e0e10;',
      'display:inline-flex;align-items:center;justify-content:center;font-size:19px;color:#fff;cursor:pointer;',
      'text-decoration:none;box-shadow:0 3px 0 0 #0e0e10;padding:0;font-family:' + FAM + ';font-weight:900;}',
      '.dc-res-plat a:active,.dc-res-plat .dc-res-cp:active{transform:translateY(2px);box-shadow:0 1px 0 0 #0e0e10;}',
      '.dc-p-wa{background:#25D366;}.dc-p-fb{background:#1877F2;}.dc-p-x{background:#0e0e10;}',
      '.dc-p-tg{background:#29A9EB;}.dc-p-em{background:#d9534f;}.dc-p-cp{background:#6b7280;}',
      '.dc-res-row{display:flex;gap:10px;margin-top:14px;}',
      '.dc-res-btn{flex:1;padding:13px 10px;border-radius:12px;border:3px solid #0e0e10;cursor:pointer;',
      'font-family:' + FAM + ';font-weight:900;font-size:16px;box-shadow:0 4px 0 0 #0e0e10;}',
      '.dc-res-btn:active{transform:translateY(3px);box-shadow:0 1px 0 0 #0e0e10;}',
      '.dc-res-primary{background:#ff6a00;color:#fff;}',
      '.dc-res-ghost{background:#f4f4f5;color:#0e0e10;}',
      '.dc-res-x{margin-top:10px;background:none;border:0;color:#8a8a90;font-family:' + FAM + ';',
      'font-weight:800;font-size:14px;cursor:pointer;}',
      '@media print{.dc-res-fab,.dc-res-ov{display:none!important}}'
    ].join('');
    document.head.appendChild(st);
  }

  function openModal(o, canvas, blob) {
    var link = o._shortUrl || o.url;
    var brag = (o.headline ? o.headline + ' on ' : '') + (o.game || 'DataCruise Arcade') +
      '! Can you beat me? 🎮';
    var U = encodeURIComponent(link);

    var ov = document.createElement('div');
    ov.className = 'dc-res-ov';
    var modal = document.createElement('div');
    modal.className = 'dc-res-modal';

    var img = document.createElement('img');
    img.alt = 'Your DataCruise result card';
    img.src = URL.createObjectURL(blob);
    modal.appendChild(img);

    // ---- per-platform share (link + your score as the message; the platform
    //      builds its own preview from the game's og:image hero card) ----------
    var slabel = document.createElement('div');
    slabel.className = 'dc-res-slabel';
    slabel.textContent = 'Share your score to';
    modal.appendChild(slabel);

    var plat = document.createElement('div');
    plat.className = 'dc-res-plat';
    function pRow(cls, ico, href, label) {
      var a = document.createElement('a');
      a.className = cls; a.href = href; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', label);
      a.innerHTML = ico;
      return a;
    }
    plat.appendChild(pRow('dc-p-wa', '💬',
      'https://wa.me/?text=' + encodeURIComponent(brag + '\n' + link), 'WhatsApp'));
    plat.appendChild(pRow('dc-p-fb', 'f',
      'https://www.facebook.com/sharer/sharer.php?u=' + U, 'Facebook'));
    plat.appendChild(pRow('dc-p-x', '𝕏',
      'https://twitter.com/intent/tweet?text=' + encodeURIComponent(brag) + '&url=' + U, 'X'));
    plat.appendChild(pRow('dc-p-tg', '✈',
      'https://t.me/share/url?url=' + U + '&text=' + encodeURIComponent(brag), 'Telegram'));
    plat.appendChild(pRow('dc-p-em', '✉',
      'mailto:?subject=' + encodeURIComponent(o.game || 'DataCruise Arcade') +
      '&body=' + encodeURIComponent(brag + '\n\nPlay free: ' + link), 'Email'));
    var cp = document.createElement('span');
    cp.className = 'dc-p-cp dc-res-cp';
    cp.setAttribute('role', 'button'); cp.setAttribute('aria-label', 'Copy link');
    cp.innerHTML = '🔗';
    cp.addEventListener('click', function () {
      var done = function () { cp.innerHTML = '✓'; setTimeout(function () { cp.innerHTML = '🔗'; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(done, done);
      } else {
        var ta = document.createElement('textarea'); ta.value = link;
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
    plat.appendChild(cp);
    modal.appendChild(plat);

    // ---- send the actual score PICTURE (native file share / save) -----------
    var row = document.createElement('div');
    row.className = 'dc-res-row';
    var picBtn = document.createElement('button');
    picBtn.className = 'dc-res-btn dc-res-primary';
    picBtn.textContent = '📸 Send the picture';
    var dlBtn = document.createElement('button');
    dlBtn.className = 'dc-res-btn dc-res-ghost';
    dlBtn.textContent = '⬇ Save';
    row.appendChild(picBtn); row.appendChild(dlBtn);
    modal.appendChild(row);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'dc-res-x';
    closeBtn.textContent = 'Close';
    modal.appendChild(closeBtn);

    ov.appendChild(modal);
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('open'); });

    function close() { ov.classList.remove('open'); setTimeout(function () { ov.remove(); }, 50); }
    closeBtn.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });

    var file = new File([blob], 'datacruise-' + o.slug + '.png', { type: 'image/png' });
    picBtn.addEventListener('click', function () {
      // Share the actual score image via the device (mobile: pick WhatsApp / IG / etc.)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: brag + ' ' + link }).catch(function () {});
        return;
      }
      // Desktop can't file-share — save the picture so it can be attached.
      download(blob, file.name);
    });
    dlBtn.addEventListener('click', function () { download(blob, file.name); });
  }

  // ---- celebration: a quick sparkle chime + confetti burst --
  function playChime() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      var now = ctx.currentTime;
      var notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 — bright rising arpeggio
      notes.forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        var t = now + i * 0.075;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.13, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.3);
      });
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 1400);
    } catch (e) {}
  }

  function confettiBurst(x, y) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var colors = ['#ffd23f', '#ff6a00', '#8affc1', '#8ab6ff', '#ffffff', '#ff8a3d'];
    for (var i = 0; i < 22; i++) {
      var p = document.createElement('div');
      var sz = 8 + Math.round(Math.random() * 6);
      p.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:' + sz + 'px;height:' + sz +
        'px;background:' + colors[i % colors.length] + ';border-radius:2px;z-index:2147483604;pointer-events:none;will-change:transform,opacity;';
      document.body.appendChild(p);
      var ang = Math.random() * Math.PI * 2;
      var dist = 70 + Math.random() * 150;
      var dx = Math.cos(ang) * dist;
      var dy = Math.sin(ang) * dist - 90; // bias upward
      var rot = Math.random() * 720 - 360;
      var anim = p.animate([
        { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx + 'px),calc(-50% + ' + dy + 'px)) rotate(' + rot + 'deg)', opacity: 0 }
      ], { duration: 850 + Math.random() * 550, easing: 'cubic-bezier(.15,.6,.4,1)' });
      anim.onfinish = function () { this.effect.target.remove(); };
    }
  }

  function celebrate(fab) {
    playChime();
    requestAnimationFrame(function () {
      var r = fab.getBoundingClientRect();
      confettiBurst(r.left + r.width / 2, r.top + r.height / 2);
    });
  }

  function showFab(o) {
    injectStyle();
    var old = document.querySelector('.dc-res-fab'); if (old) old.remove();
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'dc-res-fab';
    fab.innerHTML = '<span aria-hidden="true">📸</span><span>Share my score</span>';
    document.body.appendChild(fab);
    celebrate(fab);
    fab.addEventListener('click', function () {
      var canvas = drawCard(o);
      canvasToBlob(canvas).then(function (blob) { openModal(o, canvas, blob); });
    });

    // Auto-dismiss the button once the player heads into a new game / menu,
    // so it never lingers over fresh gameplay. Only ever removes the button.
    var killer = function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-action],button,a') : null;
      if (!t || t === fab || fab.contains(e.target)) return;
      var sig = (t.getAttribute && t.getAttribute('data-action') || '') + ' ' + (t.textContent || '');
      if (/start|restart|play.?again|new ?game|again|menu|quit|home/i.test(sig)) {
        fab.remove();
        document.removeEventListener('click', killer, true);
      }
    };
    document.addEventListener('click', killer, true);
    return fab;
  }

  // ---------- public API -------------------------------------
  window.DataCruiseResult = {
    ready: function (opts) {
      opts = opts || {};
      var pal = SERIES[opts.slug] || CHART;
      opts._pal = pal;
      if (!opts.url) {
        opts.url = metaContent('meta[property="og:url"]') ||
          (opts.slug ? BASE + '/games/' + opts.slug + '/' : location.href);
      }
      // Short link for the per-platform share buttons (falls back to opts.url).
      opts._shortUrl = opts.url;
      if (opts.slug) {
        fetch('/api/short?slug=' + encodeURIComponent(opts.slug), { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { if (d && d.short) opts._shortUrl = d.short; })
          .catch(function () {});
      }
      // Preload the AI scene backdrop (same-origin, so the canvas stays
      // exportable). Missing endpoint (e.g. local dev) -> stays null -> the
      // card falls back to its gradient. Bump requested well before the
      // player taps "share", so it's usually ready by card-draw time.
      opts._sceneImg = null;
      if (opts.slug) {
        var sImg = new Image();
        sImg.onload = function () { opts._sceneImg = sImg; };
        sImg.onerror = function () { opts._sceneImg = null; };
        sImg.src = '/api/scene?slug=' + encodeURIComponent(opts.slug);
      }
      // slight delay so it lands after the game's own win animation
      setTimeout(function () { showFab(opts); }, 450);
    },
    // let games remove the button when starting a new round
    clear: function () {
      var f = document.querySelector('.dc-res-fab'); if (f) f.remove();
    }
  };
})();
