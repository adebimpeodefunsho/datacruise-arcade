#!/usr/bin/env python3
"""Generate the /play/<slug>/ guide pages.

WHY THESE PAGES EXIST
---------------------
Every game page is a JavaScript canvas with 6-8 words of crawlable text, and
none of them can be given more: each sets height:100vh on <body>, and
derive-jargon, data-crossword, sentence-builder, scrub-mess and data-hunt use
position:fixed or overflow:hidden on top of that. Text appended below the
canvas would be unreachable on those pages, and unreachable text is cloaking.

So the readable content lives here instead: one real HTML page per game, which
is what Google indexes and what carries the house ads. The games themselves are
untouched and stay instant-play at /games/<slug>/, which is marked noindex so
the thin page never competes with its own guide.

To change a game's copy: edit GAMES below and re-run `python3 build_guides.py`.
"""

import html
import json
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE = "https://arcade.datacruise.app"

# ---------------------------------------------------------------------------
# Per-game content. `series` picks the palette and the sibling pool.
# `teaches` is the part that earns the search traffic — it is the only text on
# the site that explains the actual data concept, so keep it concrete.
# ---------------------------------------------------------------------------
GAMES = {
"mountain-climb": dict(
  series="chart", chart="Line chart", mascot="Bug-Bug", minutes="5–10",
  title="Bug-Bug's Mountain Climb",
  tagline="A line-chart game where every choice you make draws the chart.",
  lede="Bug-Bug wants to reach the golden trophy at the top of the mountain. "
       "Each day you choose how far to climb — and each choice becomes the next "
       "point on a line chart. Climb too hard and the stamina runs out before the "
       "summit; climb too gently and the days run out instead.",
  steps=[
    "Pick how far Bug-Bug climbs today. The choice is plotted as a point.",
    "Watch the line grow. The shape of it <em>is</em> your climb so far.",
    "Keep an eye on stamina — a steep day costs more than a gentle one.",
    "Reach the trophy before the days run out.",
  ],
  teaches="A line chart is the right picture whenever something is measured over "
          "and over as time passes — height, temperature, savings, a score. Children "
          "usually meet line charts already finished, as a shape to be read. Here "
          "the shape is built one decision at a time, so the line stops being "
          "decoration and starts being a record of what happened. Players also meet "
          "the idea of a trend without being taught the word: a run of steep days "
          "looks different from a run of gentle ones, and the difference is visible "
          "long before anyone can explain it.",
),
"block-city": dict(
  series="chart", chart="Bar chart", mascot="Bug-Bug", minutes="5–10",
  title="Bug-Bug's Block City",
  tagline="Stack the right blocks to grow each bar to the height the data asks for.",
  lede="A row of empty bars is waiting, and each one needs to reach an exact "
       "height. Stack blocks to grow a bar — too few and it falls short, too many "
       "and it overshoots. Finish the row and the city is built.",
  steps=[
    "Read the number each bar needs to reach.",
    "Stack blocks to grow that bar.",
    "Stop at exactly the right height — overshooting counts as a miss.",
    "Build every bar in the row to finish the city.",
  ],
  teaches="A bar chart compares separate things side by side: four flavours, six "
          "countries, three months of sales. What makes it work is that every bar "
          "starts from the same baseline, so height alone carries the comparison. "
          "Stacking the bars by hand makes that obvious in a way looking at a "
          "finished chart does not — a bar is tall because it holds more blocks, "
          "and nothing else. That is also the quiet lesson behind why a bar chart "
          "with a chopped-off axis misleads people.",
),
"pie-spinner": dict(
  series="chart", chart="Pie chart", mascot="Bug-Bug", minutes="5",
  title="Bug-Bug's Pie Spinner",
  tagline="Spin the slices until the pie matches the data.",
  lede="A pie sits on the board with its slices in the wrong proportions. Spin "
       "and resize them until each slice matches the share it is supposed to "
       "represent — and the whole pie finally adds up.",
  steps=[
    "Look at what each slice is meant to be worth.",
    "Spin a slice to make it bigger or smaller.",
    "Every slice has to fit — growing one shrinks another.",
    "Match the whole pie to finish the round.",
  ],
  teaches="A pie chart answers one question only: how does this split into parts "
          "of a whole? The constraint that the slices must always total 100% is "
          "the entire idea, and it is also the thing most often forgotten. Because "
          "making one slice bigger visibly squeezes the others, players feel that "
          "trade-off directly. It is a good first encounter with proportion, and a "
          "good first reason to notice that a pie with eleven slices tells you much "
          "less than a pie with three.",
),
"bubble-catcher": dict(
  series="chart", chart="Bubble chart", mascot="Bug-Bug", minutes="5–10",
  title="Bug-Bug's Bubble Catcher",
  tagline="Pull the string, catch the right bubbles, plot the chart.",
  lede="Bubbles drift down the screen, each one a different size and carrying a "
       "different value. Pull the string to catch the ones that belong on the "
       "chart — and leave the ones that do not.",
  steps=[
    "Watch the bubbles fall. Size matters as much as position.",
    "Pull the string to catch a bubble.",
    "Catch the ones the chart asks for; let the rest go.",
    "Fill the plot to complete the round.",
  ],
  teaches="A bubble chart is a scatter plot that carries a third number in the "
          "size of each dot — so one picture holds three measurements at once. "
          "That is a genuine step up in difficulty, and the usual mistake is "
          "reading bubble <em>width</em> when the number actually lives in the "
          "bubble's <em>area</em>. Catching bubbles by size makes the comparison "
          "physical, and gives a child a feel for when a chart is carrying more "
          "information than it first appears to.",
),
"dashboard-drop": dict(
  series="chart", chart="Dashboard", mascot="Bug-Bug", minutes="5–10",
  title="Bug-Bug's Dashboard Drop",
  tagline="Catch the falling charts and arrange them into a dashboard that makes sense.",
  lede="Charts tumble from the top of the screen — a bar here, a line there, a "
       "number card, a pie. Catch them and drop each one into the right place on "
       "the dashboard until the whole board tells one clear story.",
  steps=[
    "Catch a falling chart before it lands.",
    "Drop it into the panel where it belongs.",
    "Think about what sits next to what — order carries meaning.",
    "Fill the board to finish the dashboard.",
  ],
  teaches="A dashboard is not a pile of charts; it is an argument made of charts. "
          "The big number goes where the eye lands first, the trend sits near the "
          "thing it explains, and related charts sit together so they can be "
          "compared without hunting. Arranging the panels by hand introduces "
          "layout as a decision rather than an accident — which is the single "
          "biggest difference between a dashboard people use and one they ignore.",
),
"decision-lab": dict(
  series="chart", chart="Quiz", mascot="Bug-Bug", minutes="10–15",
  title="Bug-Bug's Decision Lab",
  tagline="Read the chart, answer the question, pass the round.",
  lede="Five rounds, twenty-five questions. Each one shows a chart and asks "
       "something you can only answer by actually reading it — which month was "
       "highest, which two are closest, what happens next if the line keeps going.",
  steps=[
    "Look at the chart on the bench.",
    "Read the question underneath it.",
    "Pick the answer the chart actually supports.",
    "Pass all five rounds to complete the lab.",
  ],
  teaches="This is the game that checks whether the other ten landed. Reading a "
          "chart well means more than naming the tallest bar: it means noticing "
          "what the axis starts at, telling a real difference from a tiny one, and "
          "resisting a conclusion the data does not support. The questions are "
          "built to reward looking twice, so a confident wrong answer is corrected "
          "by the chart itself rather than by being told off.",
),
"derive-jargon": dict(
  series="word", chart="Rebus puzzle", mascot="Buzz", minutes="5–10",
  title="Derive the Data Jargon",
  tagline="Read the picture, guess the data word.",
  lede="Each puzzle is a small rebus built out of letters and symbols, and each "
       "one hides a word from the language of data. Work out what the picture is "
       "saying and type the term.",
  steps=[
    "Study the rebus — the layout is the clue, not decoration.",
    "Say what you see out loud; these puzzles reward the ear.",
    "Type your guess.",
    "Solve the set to finish the round.",
  ],
  teaches="Data has a vocabulary problem: words like <strong>median</strong>, "
          "<strong>outlier</strong>, <strong>schema</strong> and "
          "<strong>aggregate</strong> sound forbidding long before they are "
          "difficult. Meeting them as puzzles rather than definitions removes the "
          "intimidation — a word you have solved is a word you own. By the end a "
          "player has handled a working data vocabulary without ever having sat "
          "through a glossary.",
),
"data-crossword": dict(
  series="word", chart="Crossword", mascot="Buzz", minutes="10–15",
  title="Crack the Data Crossword",
  tagline="A timed 10×10 crossword built entirely from data terms.",
  lede="A proper crossword grid, ten by ten, where every answer comes from the "
       "world of data. The clock is running — but the crossing letters are there "
       "to help, exactly as they should be.",
  steps=[
    "Pick a clue from the across or down list.",
    "Type the answer into the grid.",
    "Use the letters you have already placed to crack the harder clues.",
    "Fill the grid before the timer runs out.",
  ],
  teaches="A crossword forces recall rather than recognition — it is one thing to "
          "nod at the word <strong>variance</strong> in a sentence and quite "
          "another to produce it from a definition and seven letters. The crossing "
          "letters do something useful too: they let a half-remembered word be "
          "reconstructed from partial evidence, which is a surprisingly honest "
          "rehearsal of how real analysis often feels.",
),
"sentence-builder": dict(
  series="word", chart="Fill in the blanks", mascot="Buzz", minutes="5–10",
  title="Bridge the Data Sentence",
  tagline="Slot the missing words and bridge the sentence about data.",
  lede="A sentence about data appears with its middle missing. Choose the words "
       "that bridge the gap so the sentence says something true — five sentences "
       "a round, three rounds in all.",
  steps=[
    "Read the broken sentence from both ends.",
    "Pick the words that bridge the middle.",
    "Check it still means something true once it is whole.",
    "Complete five sentences to clear the round.",
  ],
  teaches="Knowing a word is not the same as being able to use it. These sentences "
          "put terms back into working order — <em>the median is the middle value "
          "when the numbers are sorted</em> — so the vocabulary arrives already "
          "attached to its grammar. It is also quiet practice at saying a finding "
          "out loud, which is the step most people find hardest once they have "
          "actually done the analysis.",
),
"scrub-mess": dict(
  series="word", chart="Data cleaning", mascot="Buzz", minutes="5–10",
  title="Scrub the Data Mess",
  tagline="Click the dirty data into the bin and leave only the clean rows.",
  lede="A heap of data lands on the screen and a good deal of it is wrong — "
       "duplicates, blanks, dates typed four different ways, a price with a stray "
       "letter in it. Tap the bad ones into the bin and leave the heap clean.",
  steps=[
    "Look over the heap for anything that does not belong.",
    "Tap a bad value to send it to the bin.",
    "Leave the clean rows exactly where they are.",
    "Clear the mess to finish the round.",
  ],
  teaches="Most of real data work is this, and almost nobody says so. Before any "
          "chart can be drawn, someone has to notice that the same customer is in "
          "the list twice, that a blank is not the same as a zero, and that "
          "<em>01/02</em> means different days in different countries. Spotting "
          "dirt is a trainable skill, and training it early makes a child "
          "sceptical in the most useful way: they stop assuming the numbers they "
          "are handed are correct.",
),
"data-hunt": dict(
  series="word", chart="SQL clues", mascot="Buzz", minutes="10–15",
  title="Hunt the Data Treasure",
  tagline="SQL-flavoured clues lead you across a shelf of curious objects.",
  lede="A shelf of odd objects, and a clue written the way a database would ask "
       "for it. Narrow the shelf down clue by clue until only the treasure is "
       "left.",
  steps=[
    "Read the clue — it describes the treasure by its properties.",
    "Rule out everything on the shelf that does not match.",
    "Use the next clue to narrow what is left.",
    "Pick the object the clues point at.",
  ],
  teaches="This is what a query really is: not code to be memorised, but a "
          "description precise enough that exactly one thing survives it. "
          "<em>Where colour is blue and size is small</em> is a filter, and "
          "stacking filters is how every database search in the world works. "
          "Meeting that idea as a treasure hunt means the eventual encounter with "
          "real SQL is a notation change rather than a new concept.",
),
}

SERIES_LABEL = {"chart": "Chart Games", "word": "Word Games"}


def siblings(slug):
    """Two other games from the same series — internal links Google can follow,
    and a genuine next step for a player who liked this one."""
    order = [s for s in GAMES if GAMES[s]["series"] == GAMES[slug]["series"] and s != slug]
    # Rotate the starting point by this game's position, so the pairings differ
    # from page to page instead of every guide linking the same two siblings.
    start = list(GAMES).index(slug) % len(order)
    return [order[(start + k) % len(order)] for k in range(2)]


def esc(t):
    """Strip inline markup, then HTML-escape — for use in HTML attributes."""
    return html.escape(re.sub(r"<[^>]+>", "", t), quote=True)


def plain(t):
    """Strip inline markup and unescape entities — the raw text of a value."""
    return html.unescape(re.sub(r"<[^>]+>", "", t)).strip()


def page(slug, g):
    sibs = siblings(slug)
    play_url = "/games/%s/" % slug
    canon = "%s/play/%s/" % (BASE, slug)
    desc = esc(g["tagline"] + " " + g["lede"])[:300].rsplit(" ", 1)[0] + "…"
    shot = "/shared/previews/%s.svg" % slug
    og = "%s/shared/previews/%s-og.jpg" % (BASE, slug)

    steps = "\n".join("        <li>%s</li>" % s for s in g["steps"])
    more = "\n".join(
        '        <li><a href="/play/%s/"><strong>%s</strong><span>%s</span></a></li>'
        % (s, html.escape(GAMES[s]["title"]), html.escape(GAMES[s]["tagline"]))
        for s in sibs
    )

    # Built with json.dumps, NOT HTML-escaped. Inside a ld+json script block the
    # content is JSON, so an apostrophe must stay an apostrophe — HTML-escaping it
    # puts a literal "&#x27;" into the game's name as Google reads it.
    ld = json.dumps({
      "@context": "https://schema.org",
      "@type": "VideoGame",
      "name": plain(g["title"]),
      "url": canon,
      "description": plain(g["tagline"]),
      "image": og,
      "inLanguage": "en",
      "genre": "Educational",
      "applicationCategory": "GameApplication",
      "gamePlatform": "Web browser",
      "operatingSystem": "Any",
      "playMode": "SinglePlayer",
      "isAccessibleForFree": True,
      "offers": {"@type": "Offer", "price": "0", "priceCurrency": "GBP"},
      "publisher": {"@type": "Organization", "name": "DataCruise", "url": "https://datacruise.app/"},
      "isFamilyFriendly": True,
      "typicalAgeRange": "7-12",
    }, indent=2, ensure_ascii=False).replace("</", "<\\/")

    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>%(title)s — how to play, and what it teaches | DataCruise Arcade</title>
  <link rel="canonical" href="%(canon)s" />
  <meta name="description" content="%(desc)s" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="theme-color" content="#ff6a00" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="DataCruise Arcade" />
  <meta property="og:url" content="%(canon)s" />
  <meta property="og:title" content="%(title)s — free browser game" />
  <meta property="og:description" content="%(tagline)s Free to play, no install." />
  <meta property="og:image" content="%(og)s" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="%(title)s — free browser game" />
  <meta name="twitter:description" content="%(tagline)s Free to play, no install." />
  <meta name="twitter:image" content="%(og)s" />

  <link rel="stylesheet" href="/shared/hub.css?v=2" />
  <link rel="stylesheet" href="/shared/guide.css" />
  <script src="/shared/ads.js" defer></script>
  <script src="/shared/sw-register.js" defer></script>
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "b41ed92d610147e3bfc623898279857d"}'></script>

  <script type="application/ld+json">%(ld)s</script>
</head>
<body>
  <header class="guide-top">
    <span class="logo-dot"></span>
    <a href="/">DataCruise <em>Arcade</em></a>
  </header>

  <main class="guide %(series)s">
    <nav class="crumb"><a href="/">Arcade</a> › <a href="/#%(seriesanchor)s">%(serieslabel)s</a> › %(title)s</nav>

    <span class="kicker">%(chart)s · with %(mascot)s</span>
    <h1>%(title)s</h1>
    <p class="lede">%(lede)s</p>

    <a class="play-cta" href="%(play)s">▶ Play free</a>
    <p class="play-note">Runs in your browser. Nothing to install, nothing to pay, no account.</p>

    <img class="shot" src="%(shot)s" alt="%(title)s — %(tagline)s" width="320" height="180" loading="lazy" />
    <p class="shot-cap">%(title)s</p>

    <h2>How to play</h2>
    <ol>
%(steps)s
    </ol>

    <h2>What it teaches</h2>
    <p>%(teaches)s</p>

    <div data-dc-ad="guide-mid"></div>

    <h2>Good to know</h2>
    <ul class="facts">
      <li><b>Ages</b>7–12, and curious grown-ups</li>
      <li><b>Time</b>About %(minutes)s minutes</li>
      <li><b>Cost</b>Free, no account</li>
      <li><b>Works on</b>Phone, tablet, laptop</li>
    </ul>

    <h2>More games like this</h2>
    <ul class="more-games">
%(more)s
    </ul>

    <h2>Ready?</h2>
    <p><a class="play-cta" href="%(play)s">▶ Play %(title)s</a></p>

    <div data-dc-ad="guide-foot"></div>
  </main>

  <footer class="guide-foot">
    <a href="/">All 11 games</a> · <a href="/#chart-games">Chart Games</a> ·
    <a href="/#word-games">Word Games</a> · © DataCruise
  </footer>
</body>
</html>
""" % dict(
        title=html.escape(g["title"]), canon=canon, desc=desc, og=og, ld=ld,
        tagline=html.escape(g["tagline"]), lede=g["lede"], play=play_url, shot=shot,
        steps=steps, more=more, chart=html.escape(g["chart"]), mascot=g["mascot"],
        minutes=g["minutes"], teaches=g["teaches"], series=g["series"],
        serieslabel=SERIES_LABEL[g["series"]],
        seriesanchor="chart-games" if g["series"] == "chart" else "word-games",
    )


def main():
    for slug, g in GAMES.items():
        d = os.path.join(ROOT, "play", slug)
        os.makedirs(d, exist_ok=True)
        out = os.path.join(d, "index.html")
        with open(out, "w", encoding="utf-8") as f:
            f.write(page(slug, g))
        words = len(re.sub(r"<[^>]+>", " ", page(slug, g)).split())
        print("play/%-18s %4d words" % (slug + "/", words))


if __name__ == "__main__":
    main()
