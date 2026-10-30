# DataCruise Arcade — earning from a free arcade

All 11 games are free, and third-party game networks are closed to us:
**GameMonetize and CrazyGames have both rejected the Arcade** as below their
production standard. So house ads are not a stopgap — they are the business.

That makes the job two things, and only two things:

1. **Traffic** — get people onto the pages at all.
2. **Conversion** — turn them into book buyers, session bookings, course
   readers and subscribers.

---

## 1. How the ad system works

`shared/ads.js` is the only place ad code lives. Mark a spot with
`<div data-dc-ad="name"></div>` and it fills.

Five placements:

| Slot | Where |
|---|---|
| `hub-mid`    | Hub, between Chart Games and Word Games |
| `hub-foot`   | Hub, above the footer |
| `guide-mid`  | `/play/<slug>/`, after "What it teaches" |
| `guide-foot` | `/play/<slug>/`, below the final Play button |
| `result`     | End-of-game result modal, below every button |

**Contextual.** The ad is chosen by what the page is about, worked out from the
URL. A chart-game page shows the 1:1 session and the Tableau course; a
word-game page shows the books and Speakle; the hub shows everything. Two slots
on one page never show the same ad.

**Attributed.** Every link carries UTMs — `utm_source=arcade`,
`utm_medium=house_ad`, `utm_campaign=<ad>`, `utm_content=<slot>`. The analytics
already running on datacruise.blog, the store and datacruise.app will report
which ad sent a visitor, from which slot, and whether they bought. **This is how
you decide what to write more of** — check it monthly.

**Switches.** `ADS_ENABLED: false` turns everything off. `ADSENSE_CLIENT` +
`SLOTS` turn on paid AdSense (house ads then become the unfilled-fallback);
if you ever do that, also fill in `/ads.txt`, tag the domain child-directed,
and read section 4.

---

## 2. Why the content lives at /play/<slug>/

Every game page is a JavaScript canvas carrying **6–8 words** of crawlable
text. Google had nothing to rank — which is the real reason there was no
traffic, not the ad setup.

The games cannot be given that text. All 11 set `height:100vh` on `<body>`, and
derive-jargon, data-crossword, sentence-builder, scrub-mess and data-hunt add
`position:fixed` or `overflow:hidden`. Anything appended below the canvas would
be unreachable on those five — and unreachable text is cloaking, which is worse
than no text.

So each game has a guide page instead: `/play/<slug>/`, about 250 words on what
the game actually teaches, how to play, and a Play button straight into the
untouched game. These are what Google indexes and where the house ads earn.

- Game pages are `noindex,follow` so a thin canvas can never outrank its own
  guide. Direct links, social cards and play are unaffected.
- `sitemap.xml` lists the hub plus the 11 guides.
- The hub links every guide under each series grid, and each guide links two
  siblings.

**To edit a game's copy:** change `GAMES` in `build_guides.py`, run
`python3 build_guides.py`, bump `CACHE_VERSION` in `sw.js`, push.

---

## 3. What to do next

**Yours, and currently the bottleneck:**

1. **Google Search Console** — <https://search.google.com/search-console>. Add
   `arcade.datacruise.app`, verify, submit
   `https://arcade.datacruise.app/sitemap.xml`. Until this happens the guide
   pages may sit undiscovered for weeks. Google does not accept IndexNow.
2. **Check the UTM reports monthly.** If nobody clicks the books ad, write a
   different one; if the session ad converts, make more pages that suit it.

**Already done, no action needed:**

- IndexNow submitted — Bing, Yandex and Seznam have all 12 URLs
  (`./indexnow.sh` re-runs it after any content deploy; the key file at the
  repo root must stay served).
- `robots.txt` no longer blocks anything; it used to hide 7 of the 11 games.
- Canonicals on every page, and the two meta descriptions that were missing.
- `VideoGame` structured data per guide; `WebSite` / `Organization` /
  `ItemList` on the hub.

**Worth doing when there is traffic to justify it:**

- More guide-page content — a worked example, a printable, a short video.
  These pages are the asset now; every addition compounds.
- Premium game-ad networks (Playwire, Venatus) need roughly 500k monthly
  pageviews. Not now.

---

## 4. Rules, if you ever add AdSense

These only matter for paid ads — a mis-tap on your own link costs nothing, but
on an AdSense unit it is an *invalid click*, and enough of those bans an
account permanently.

- No ad over, beside or under gameplay. That is why the result-modal unit sits
  below every button behind a divider, and why game pages carry nothing else.
- Keep `CHILD_DIRECTED: true`. It is a legal position (COPPA, UK Children's
  code), not a revenue setting — and it also means non-personalised ads, which
  earn roughly £0.50–£2.50 per 1,000 views rather than £5–15.
- You would also need: the child-directed domain tag
  (<https://support.google.com/webmasters/answer/3221080>) and a certified
  consent banner for EEA/UK traffic (AdSense → Privacy & messaging →
  *European regulations*, which is free).

**Never collect email addresses on the Arcade itself.** It is child-directed,
so taking an address here pulls in COPPA's verifiable-parental-consent
machinery and the UK Children's code. The newsletter house ad points at the
blog's existing form instead, where the audience is general and the exposure
is not.

---

## 5. What was ruled out

- **ChatGPT / OpenAI ads.** OpenAI's ad platform is buy-side only — ads *inside*
  ChatGPT. There is no publisher programme for websites. Nothing to integrate.
- **GameMonetize, CrazyGames.** Both rejected the Arcade. `build_gm.py` and the
  10 registered game IDs are dead weight; do not spend more time there.
