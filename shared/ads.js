/* ============================================================
   DataCruise Arcade — advertising
   ============================================================

   All 11 games are free (see FREE_MODE in shared/unlock.js), so ads are the
   earning path. This file is the ONLY place ad code lives.

   HOW IT WORKS
   ------------
   Mark a spot in the HTML:

       <div data-dc-ad="hub-mid"></div>

   ...and this file fills it. What it fills it with depends on CONFIG below:

     · ADSENSE_CLIENT empty  → a HOUSE AD (your own books / courses / apps).
                               Works today. No account, no approval, no review.
     · ADSENSE_CLIENT set    → a real AdSense unit, with the house ad still
                               used as the fallback when AdSense can't fill.

   So this is safe to deploy right now: it earns via your own products
   immediately, and flips to paid ads the moment you paste a publisher ID.

   THE KIDS' RULE — READ BEFORE CHANGING ANY PLACEMENT
   ---------------------------------------------------
   The Arcade is child-directed ("Designed for kids, classrooms..."). That has
   two hard consequences:

     1. CHILD_DIRECTED below forces non-personalised ads. Do not turn it off.
        It is a legal position (COPPA / UK Children's code), not a setting.
     2. NO AD MAY SIT OVER OR BESIDE GAMEPLAY. A mis-tap by a 7-year-old on an
        ad next to a game button is an invalid click, and enough of those gets
        an AdSense account banned — permanently, with no appeal in practice.
        Ads go on the hub, and on the end-of-game result screen. Never on the
        canvas, never a fixed bar during play, never next to a control.

   Placements are therefore deliberately few. That is the design, not an
   oversight — see ADS_SETUP.md.
============================================================ */

(function () {
  'use strict';

  /* ---------------------------------------------------------------
     CONFIG — the whole switchboard. Nothing else in the repo needs
     editing to turn advertising on, off, or up.
  --------------------------------------------------------------- */
  var CONFIG = {

    /* Master switch. false = no ad code runs at all, house ads included.
       Mirrors the FREE_MODE pattern used by unlock.js / arcade-nav.js. */
    ADS_ENABLED: true,

    /* Your AdSense publisher ID, e.g. 'ca-pub-1234567890123456'.
       LEAVE EMPTY until AdSense has approved the site. While empty, every
       slot shows a house ad instead — which is the right thing to show
       during the review anyway, since AdSense rejects sites whose ad slots
       are empty boxes.
       When you fill this in, also put the matching line in /ads.txt. */
    ADSENSE_CLIENT: '',

    /* Per-placement AdSense ad-unit IDs (the data-ad-slot number AdSense
       gives you when you create a unit). A placement with no ID here falls
       back to a house ad, so you can switch them on one at a time. */
    SLOTS: {
      'hub-mid':    '',   /* hub, between Chart Games and Word Games */
      'hub-foot':   '',   /* hub, above the footer */
      'result':     '',   /* end-of-game result screen */
      'guide-mid':  '',   /* /play/<slug>/, after "What it teaches" */
      'guide-foot': ''    /* /play/<slug>/, below the final Play button */
    },

    /* Child-directed treatment. Forces non-personalised ads on every
       request. KEEP TRUE. The site-wide tag also has to be set once in
       Google's own tool — see ADS_SETUP.md step 3. */
    CHILD_DIRECTED: true,

    /* House ads (promos for DataCruise's own books/courses/apps).
       OFF by deliberate choice: these slots are for Google's paid ads, which
       is where the revenue is meant to come from. The house-ad machinery is
       left intact — flip this to true to use them as a fallback for inventory
       AdSense cannot fill, which is the only sensible use for them now. */
    HOUSE_ADS: false
  };

  /* ---------------------------------------------------------------
     HOUSE ADS — your own products. Every URL here was checked live.
     Audience is a parent, teacher or curious grown-up over a kid's
     shoulder, so these are pitched at them, not at the child.
  --------------------------------------------------------------- */
  var HOUSE = [
    {
      key: 'books',
      fits: ['word', 'hub'],
      eyebrow: 'Picture books',
      title: 'The Grandma &amp; Grandpa Village books',
      body: 'Warm illustrated stories for ages 3–6 and 7–12, posted straight from the author.',
      cta: 'See the books',
      url: 'https://datacruise.app/store/books/',
      tone: 'orange'
    },
    {
      key: 'course',
      fits: ['chart', 'hub'],
      eyebrow: 'Free course',
      title: 'Learn to actually read your data',
      body: 'Free Tableau and data-analysis lessons on the Data Cruise blog. No sign-up wall.',
      cta: 'Start learning',
      url: 'https://datacruise.blog/courses/',
      tone: 'blue'
    },
    {
      key: 'apps',
      fits: ['hub', 'chart', 'word'],
      eyebrow: 'More free apps',
      title: 'Nine more DataCruise apps — all free',
      body: 'Speech practice, prayer, migraine tracking, home organising. Nothing to pay, nothing to install.',
      cta: 'Browse them',
      url: 'https://datacruise.app/',
      tone: 'lilac'
    },
    {
      key: 'speakle',
      fits: ['word', 'hub'],
      eyebrow: 'For younger kids',
      title: 'Speakle — gentle speech practice',
      body: 'A kind, private little app that helps a child practise sounds and words at their own pace.',
      cta: 'Try Speakle',
      url: 'https://datacruise.app/speakle',
      tone: 'teal'
    },
    {
      /* Deliberately points at the BLOG's existing subscribe form rather than
         collecting an address here. The Arcade is child-directed, and taking
         an email address on a site aimed at under-13s pulls in COPPA's
         verifiable-parental-consent machinery and the UK Children's code.
         The blog is a general-audience site and already has a working Jetpack
         form, so the list gets built there with none of that exposure. */
      key: 'newsletter',
      fits: ['hub', 'chart', 'word'],
      eyebrow: 'Stay in touch',
      title: 'New games and lessons, by email',
      body: 'Subscribe to Data Cruise and hear first when a new game or free lesson goes up.',
      cta: 'Subscribe free',
      url: 'https://datacruise.blog/',
      tone: 'teal'
    },
    {
      key: 'session',
      fits: ['chart', 'hub'],
      eyebrow: 'One-to-one',
      title: 'Stuck on your own data at work?',
      body: 'A 60-minute 1:1 session — leave with the chart, the method and the answer. Free intro call first.',
      cta: 'See how it works',
      url: 'https://datacruise.blog/one-to-one-sessions/',
      tone: 'orange'
    }
  ];

  /* ---------------------------------------------------------------
     Context. Which series is this page about? A visitor reading about a
     bar chart is a different person from one reading about data jargon,
     and showing each the nearer product converts better than rotating
     blindly through all five.

     Works from the URL alone, so it needs no per-page markup and is
     correct on hub, guide (/play/<slug>/) and game (/games/<slug>/) alike.
  --------------------------------------------------------------- */
  var WORD_GAMES = [
    'derive-jargon', 'data-crossword', 'sentence-builder', 'scrub-mess', 'data-hunt'
  ];

  function pageContext() {
    var m = window.location.pathname.match(/\/(?:play|games)\/([a-z0-9-]+)/i);
    if (!m) return 'hub';
    return WORD_GAMES.indexOf(m[1].toLowerCase()) !== -1 ? 'word' : 'chart';
  }

  var CONTEXT = pageContext();

  /* ---------------------------------------------------------------
     Attribution. Every house-ad link carries UTM parameters, so the
     analytics already running on the DESTINATION (the blog, the store,
     datacruise.app) reports how many visitors the Arcade sent, which ad
     sent them, and from which slot — and, where there is a checkout,
     whether they bought.

     Without this there is no way to tell a house ad that works from one
     that nobody ever touches, and no way to choose what to write next.

       utm_source   = arcade        (which property sent them)
       utm_medium   = house_ad      (separates these from social/search)
       utm_campaign = <ad key>      (which creative)
       utm_content  = <slot name>   (hub-mid / hub-foot / result)
  --------------------------------------------------------------- */
  function trackedUrl(ad, slotName) {
    var params = {
      utm_source: 'arcade',
      utm_medium: 'house_ad',
      utm_campaign: ad.key || 'unknown',
      utm_content: slotName || 'unknown'
    };
    try {
      var u = new URL(ad.url);
      Object.keys(params).forEach(function (k) {
        /* Never clobber a parameter the destination URL already sets. */
        if (!u.searchParams.has(k)) u.searchParams.set(k, params[k]);
      });
      return u.toString();
    } catch (e) {
      /* Malformed URL, or no URL support — send them to the plain link
         rather than dropping the click entirely. */
      return ad.url;
    }
  }

  if (!CONFIG.ADS_ENABLED) return;

  var USING_ADSENSE = /^ca-pub-\d{10,}$/.test(CONFIG.ADSENSE_CLIENT.trim());

  /* ---------------------------------------------------------------
     Styles. Reserved heights everywhere so a filling ad never shoves
     the page around (layout shift is both ugly and an SEO penalty).
  --------------------------------------------------------------- */
  var CSS = [
    '.dc-ad{margin:26px auto;width:100%;max-width:728px;padding:0 16px;box-sizing:border-box;}',
    '.dc-ad-label{display:block;font:700 10px/1.4 ui-rounded,"SF Pro Rounded","Nunito",system-ui,sans-serif;',
    'letter-spacing:.12em;text-transform:uppercase;color:#6b6b73;margin:0 0 6px 2px;}',
    '.dc-ad-box{min-height:110px;}',

    /* Compact variant for the result modal. */
    '.dc-ad.dc-ad-compact{margin:14px 0 2px;padding:0;max-width:none;}',
    '.dc-ad.dc-ad-compact .dc-ad-box{min-height:0;}',

    /* --- house ad --- */
    '.dc-house{display:block;border:3px solid #0e0e10;border-radius:14px;background:#fff;',
    'box-shadow:0 5px 0 0 #0e0e10;padding:16px 18px;color:#0e0e10;text-decoration:none;',
    'font-family:ui-rounded,"SF Pro Rounded","Nunito",system-ui,sans-serif;',
    'transition:transform 90ms ease,box-shadow 90ms ease;}',
    '.dc-house:hover{transform:translateY(-2px);box-shadow:0 7px 0 0 #0e0e10;}',
    '.dc-house:active{transform:translateY(2px);box-shadow:0 2px 0 0 #0e0e10;}',
    '.dc-house-eyebrow{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.1em;',
    'text-transform:uppercase;padding:3px 9px;border-radius:999px;border:2px solid #0e0e10;margin-bottom:9px;}',
    '.dc-house-t{margin:0 0 5px;font-size:17px;font-weight:900;line-height:1.25;}',
    '.dc-house-b{margin:0 0 11px;font-size:13.5px;line-height:1.45;color:#3a3a40;}',
    '.dc-house-cta{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:7px 15px;',
    'border-radius:999px;border:2px solid #0e0e10;font-size:13px;font-weight:800;color:#fff;}',
    '.dc-house.t-orange .dc-house-eyebrow{background:#ffc94d;}',
    '.dc-house.t-orange .dc-house-cta{background:#ff6a00;}',
    '.dc-house.t-blue   .dc-house-eyebrow{background:#dbeafe;}',
    '.dc-house.t-blue   .dc-house-cta{background:#2563eb;}',
    '.dc-house.t-lilac  .dc-house-eyebrow{background:#ede9fe;}',
    '.dc-house.t-lilac  .dc-house-cta{background:#7c5cf0;}',
    '.dc-house.t-teal   .dc-house-eyebrow{background:#ccfbf1;}',
    '.dc-house.t-teal   .dc-house-cta{background:#0ea5a4;}',

    '@media (max-width:480px){',
    '.dc-ad{margin:20px auto;padding:0 12px;}',
    '.dc-house{padding:14px 15px;}',
    '.dc-house-t{font-size:16px;}',
    '.dc-house-b{font-size:13px;}',
    '}',
    '@media (prefers-reduced-motion:reduce){',
    '.dc-house{transition:none;}',
    '.dc-house:hover,.dc-house:active{transform:none;box-shadow:0 5px 0 0 #0e0e10;}',
    '}',
    '@media print{.dc-ad{display:none!important;}}'
  ].join('');

  function styles() {
    if (document.getElementById('dc-ads-style')) return;
    var st = document.createElement('style');
    st.id = 'dc-ads-style';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------------------------------------------------------------
     AdSense loader. Loaded once, lazily — only when a real unit is
     actually about to be filled, so a visitor who never scrolls past
     the hero never pays for the request.
  --------------------------------------------------------------- */
  var adsenseRequested = false;

  function loadAdSense() {
    if (adsenseRequested || !USING_ADSENSE) return;
    adsenseRequested = true;

    window.adsbygoogle = window.adsbygoogle || [];

    /* Non-personalised ads. MUST be set before the library loads.
       This is the request-level half of the child-directed position; the
       site-wide half is the tag you set once in Google's tool. */
    if (CONFIG.CHILD_DIRECTED) {
      window.adsbygoogle.requestNonPersonalizedAds = 1;
    }

    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
            encodeURIComponent(CONFIG.ADSENSE_CLIENT.trim());
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------------------------------------------------------------
     House ad rendering
  --------------------------------------------------------------- */
  /* Only the ads that suit this page, falling back to everything if a
     context somehow matches nothing. */
  var POOL = HOUSE.filter(function (ad) {
    return !ad.fits || ad.fits.indexOf(CONTEXT) !== -1;
  });
  if (!POOL.length) POOL = HOUSE;

  /* Random start so repeat visitors do not always meet the same ad first,
     then step through the pool so two slots on one page never match. */
  var houseCursor = Math.floor(Math.random() * POOL.length);

  function nextHouse() {
    var ad = POOL[houseCursor % POOL.length];
    houseCursor++;
    return ad;
  }

  function renderHouse(box, slotName) {
    if (!CONFIG.HOUSE_ADS) return false;
    var ad = nextHouse();
    var a = document.createElement('a');
    a.className = 'dc-house t-' + ad.tone;
    a.href = trackedUrl(ad, slotName);
    a.setAttribute('data-house-ad', ad.key);
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML =
      '<span class="dc-house-eyebrow">' + ad.eyebrow + '</span>' +
      '<p class="dc-house-t">' + ad.title + '</p>' +
      '<p class="dc-house-b">' + ad.body + '</p>' +
      '<span class="dc-house-cta">' + ad.cta + ' <span aria-hidden="true">→</span></span>';
    box.appendChild(a);
    return true;
  }

  /* ---------------------------------------------------------------
     AdSense unit rendering, with a house-ad fallback when the unit
     comes back unfilled (common on low-traffic and child-directed
     inventory — an empty bordered box looks broken, a house ad does not).
  --------------------------------------------------------------- */
  function renderAdSense(box, slotId, slotName) {
    loadAdSense();

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', CONFIG.ADSENSE_CLIENT.trim());
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    box.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      renderHouse(box, slotName);
      return;
    }

    /* AdSense marks an unfilled unit with data-ad-status="unfilled" and
       collapses it. Give it a moment, then put a house ad in the gap. */
    setTimeout(function () {
      if (ins.getAttribute('data-ad-status') === 'unfilled') {
        ins.remove();
        renderHouse(box, slotName);
      }
    }, 2500);
  }

  /* ---------------------------------------------------------------
     Fill one placeholder
  --------------------------------------------------------------- */
  function fill(el) {
    if (!el || el.getAttribute('data-dc-ad-filled')) return;
    el.setAttribute('data-dc-ad-filled', '1');

    var name = el.getAttribute('data-dc-ad') || '';
    var slotId = (CONFIG.SLOTS[name] || '').trim();
    var paid = USING_ADSENSE && slotId !== '';

    styles();
    el.classList.add('dc-ad');

    /* Policy: an ad must be distinguishable from content. Paid units say
       "Advertisement"; our own promos say so honestly instead of hiding
       behind the same word. */
    var label = document.createElement('span');
    label.className = 'dc-ad-label';
    label.textContent = paid ? 'Advertisement' : 'From DataCruise';
    el.appendChild(label);

    var box = document.createElement('div');
    box.className = 'dc-ad-box';
    el.appendChild(box);

    if (paid) {
      renderAdSense(box, slotId, name);
    } else if (!renderHouse(box, name)) {
      el.remove();   /* house ads off and no paid unit — leave no empty frame */
    }
  }

  /* ---------------------------------------------------------------
     Lazy fill. Units request only as they come near the viewport:
     better viewability (which is what actually sets your CPM) and no
     wasted impressions on a visitor who bounces from the hero.
  --------------------------------------------------------------- */
  function observe(el) {
    if (!('IntersectionObserver' in window)) { fill(el); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        fill(entry.target);
      });
    }, { rootMargin: '300px 0px' });
    io.observe(el);

    /* Safety net. A placeholder starts at zero height, and in some embedded or
       headless viewports (the Claude browser pane reports a 0x0 viewport, for
       one) a zero-area element never registers as intersecting — so the
       observer would never fire and the slot would stay empty forever. An
       unfilled slot earns nothing, so after a short grace period fill it
       regardless. Harmless when the observer has already done its job: fill()
       is idempotent via the data-dc-ad-filled flag. */
    setTimeout(function () {
      if (!el.getAttribute('data-dc-ad-filled') && el.isConnected) {
        io.unobserve(el);
        fill(el);
      }
    }, 4000);
  }

  function scan(root) {
    var nodes = (root || document).querySelectorAll('[data-dc-ad]:not([data-dc-ad-filled])');
    Array.prototype.forEach.call(nodes, observe);
  }

  /* ---------------------------------------------------------------
     Public API — used by shared/resultcard.js to drop a unit into the
     end-of-game modal, which does not exist in the HTML at load time.
  --------------------------------------------------------------- */
  window.DataCruiseAds = {
    /* Build a ready-to-insert ad element. Returns null when there is
       nothing to show, so callers can skip the whole block. */
    unit: function (name, opts) {
      opts = opts || {};
      var slotId = (CONFIG.SLOTS[name] || '').trim();
      var paid = USING_ADSENSE && slotId !== '';
      if (!paid && !CONFIG.HOUSE_ADS) return null;

      var el = document.createElement('div');
      el.setAttribute('data-dc-ad', name);
      if (opts.compact) el.classList.add('dc-ad-compact');
      /* Modals are opened deliberately, so fill immediately rather than
         waiting on an intersection that has already happened. */
      fill(el);
      return el;
    },
    rescan: scan,
    enabled: true
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scan(); }, { once: true });
  } else {
    scan();
  }
})();
