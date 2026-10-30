# DataCruise Arcade — advertising setup

All 11 games are free, so advertising is the earning path. This is what was
built, what it earns today, and the account steps that only you can do.

---

## 1. What is already working

`shared/ads.js` is the only place ad code lives. It is live-ready right now and
is currently filling every slot with **house ads** — your own books, courses and
apps. No account, no approval, no review needed; it earns from day one.

Three placements, deliberately few:

| Slot name  | Where | Why there |
|---|---|---|
| `hub-mid`  | Hub, between Chart Games and Word Games | Natural break in the page, in normal flow |
| `hub-foot` | Hub, above the footer | End of the browse, high intent |
| `result`   | End-of-game result modal, below every button | A real break in play, never during it |

**There is no ad on a game page itself.** No banner over the canvas, no fixed
bar during play, nothing beside a control. That is a deliberate safety
decision, not an omission — see section 5.

---

## 2. Switching real ads on (two edits)

Once AdSense approves the site:

1. In `shared/ads.js`, set `ADSENSE_CLIENT` to your publisher ID
   (`'ca-pub-1234567890123456'`).
2. In `shared/ads.js`, paste the three ad-unit IDs into `SLOTS`.
3. In `/ads.txt`, uncomment the last line and put the same publisher ID in
   (without the `ca-` prefix).
4. Bump `CACHE_VERSION` in `sw.js`, then push.

That is the whole switch. House ads automatically become the *fallback* for any
unit AdSense cannot fill, so a slot is never an empty box.

To turn all advertising off again, set `ADS_ENABLED: false`. One line, same
pattern as `FREE_MODE`.

---

## 3. The account steps — only you can do these

I cannot create accounts or accept terms on your behalf, so these are yours:

1. **Apply to AdSense** at <https://adsense.google.com> with
   `arcade.datacruise.app`. Approval usually takes a few days to a few weeks.
   The site is in decent shape for review: real original content, a privacy
   story, no thin pages.

2. **Tag the site as child-directed.** This is not optional — the Arcade is
   aimed at kids and classrooms. Use Google's tool:
   <https://support.google.com/webmasters/answer/3221080>. Tag the whole
   `arcade.datacruise.app` domain. This disables interest-based advertising and
   remarketing on every ad request from the site.
   `CHILD_DIRECTED: true` in `ads.js` is the request-level half of this; the
   domain tag is the authoritative half. **Do both.**

3. **Turn on a consent banner for the EEA/UK.** Since January 2024 Google
   requires a *certified* CMP to serve ads to EEA, UK and Swiss users —
   without one, only "Limited Ads" serve. Google's own is free and already
   certified: AdSense → **Privacy & messaging** → create the
   *European regulations* message. You are UK-based, so this one matters
   immediately.

4. **Create three ad units** in AdSense (Display → Responsive), named to match
   the table above, and paste their IDs into `SLOTS`.

---

## 4. What this will realistically earn

Be clear-eyed about the arithmetic, because it drives what to do next:

- Ad income = **traffic × RPM**. Nothing else.
- Child-directed, non-personalised inventory earns roughly **£0.50–£2.50 per
  1,000 pageviews** — well below the £5–15 a general-audience site might see.
  That gap is the price of the compliance position, and it is not negotiable.
- So **~1,000 visits/month ≈ £1–3/month.** **~100,000 visits/month ≈ £100–250.**
- AdSense does not pay out until you reach **£60** in accrued earnings.

The honest conclusion: at low traffic the house ads are worth more than AdSense
will be, because one book sale or one £80 session beats thousands of ad
impressions. **Traffic is the whole game.** Which is why the SEO fixes below
mattered more than the ad code.

### Already fixed as part of this work

`robots.txt` was still blocking **7 of the 11 games** from Google, and
`sitemap.xml` listed only 4 — both left over from when those games sat behind
the £7.99 unlock. With the pack now free and earning per visit, that was
suppressing most of the site's search traffic. Both files now cover all 11
games.

**After deploying, resubmit the sitemap** in Google Search Console so the seven
newly-unblocked games get crawled.

---

## 5. The rules that protect the account

Read this before moving any ad.

- **Never put an ad over, beside, or under gameplay.** Players here are
  children. A mis-tap next to a game button is an *invalid click*, and enough
  invalid clicks gets an AdSense account banned — permanently, and appeals
  essentially never succeed. This is why game pages carry no ads and the result
  modal's ad sits below every button behind a divider.
- **Never click your own ads**, or ask anyone to.
- **Keep `CHILD_DIRECTED: true`.** It is a legal position (COPPA, UK
  Children's code), not a revenue setting.
- Paid units are labelled "Advertisement"; house ads are labelled "From
  DataCruise" rather than hiding behind the same word.

---

## 6. Third-party game networks are closed to us

**Do not spend more time here.** GameMonetize and CrazyGames have both rejected
the Arcade, on the grounds that the games fall below their production standard.
Two attempts, two refusals — that route is shut, and an earlier version of this
document was wrong to push it.

The practical consequence: **house ads are not a stopgap, they are the
business.** Everything in this repo should be aimed at making them earn, which
means two things and only two things:

1. **Traffic** — getting people onto the pages at all.
2. **Conversion** — turning those visitors into book buyers, session bookings,
   course readers and mailing-list subscribers.

A useful side effect of going in-house: the accidental-click rule in section 5
only ever mattered because invalid clicks get an *AdSense* account banned.
House ads are your own links, so a mis-tap costs nothing. Placement can be more
generous than section 5 allows — the remaining limit is simply not spoiling the
game for a child.

## 7. What was not done, and why

- **No ChatGPT/OpenAI ads.** OpenAI's ad platform launched in February 2026 but
  it is **buy-side only** — a way for advertisers to place ads *inside
  ChatGPT*. There is no publisher programme that lets a website carry OpenAI
  ads and earn from them. Nothing to integrate.
- **No premium game-ad networks** (Playwire, Venatus, AdinPlay). They are the
  right answer eventually, but they require roughly 500k+ monthly pageviews.
  Revisit once traffic justifies it.
- **No AdSense account created.** I cannot create accounts or accept terms on
  your behalf.
