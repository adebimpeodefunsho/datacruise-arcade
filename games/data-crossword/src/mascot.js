// Buzz — the brown-faced bee mascot for Crack the Data Crossword.
// (Matches the game's AI share-scene bee.) Returns an inline SVG string.

export function beeSvg({ blink = false } = {}) {
  return `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Buzz the bee">
  <defs>
    <linearGradient id="beeBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd54a"/>
      <stop offset="100%" stop-color="#f3ad00"/>
    </linearGradient>
    <radialGradient id="beeFace" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#e2ab77"/>
      <stop offset="100%" stop-color="#c6875a"/>
    </radialGradient>
    <linearGradient id="beeWing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e2fbff"/>
      <stop offset="100%" stop-color="#a6e6ff"/>
    </linearGradient>
    <clipPath id="beeBodyClip"><ellipse cx="100" cy="152" rx="48" ry="36"/></clipPath>
  </defs>

  <g opacity="0.8">
    <ellipse cx="58" cy="64" rx="24" ry="40" transform="rotate(-30 58 64)" fill="url(#beeWing)" stroke="#7fd6ef" stroke-width="2"/>
    <ellipse cx="142" cy="64" rx="24" ry="40" transform="rotate(30 142 64)" fill="url(#beeWing)" stroke="#7fd6ef" stroke-width="2"/>
  </g>

  <ellipse cx="100" cy="152" rx="48" ry="36" fill="url(#beeBody)" stroke="#c8891a" stroke-width="2.5"/>
  <g clip-path="url(#beeBodyClip)" fill="#2e2417">
    <rect x="50" y="149" width="100" height="13"/>
    <rect x="50" y="176" width="100" height="13"/>
  </g>

  <circle cx="100" cy="86" r="56" fill="url(#beeFace)" stroke="#a9713f" stroke-width="2.5"/>

  <path d="M82 40 Q74 16 62 12" fill="none" stroke="#2e2417" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="61" cy="11" r="6.5" fill="#2e2417"/>
  <path d="M118 40 Q126 16 138 12" fill="none" stroke="#2e2417" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="139" cy="11" r="6.5" fill="#2e2417"/>

  <circle cx="70" cy="101" r="11" fill="#ff8f8f" opacity="0.72"/>
  <circle cx="130" cy="101" r="11" fill="#ff8f8f" opacity="0.72"/>

  ${blink
    ? `<path d="M74 82 Q82 87 90 82" fill="none" stroke="#241a0f" stroke-width="3.5" stroke-linecap="round"/>
       <path d="M110 82 Q118 87 126 82" fill="none" stroke="#241a0f" stroke-width="3.5" stroke-linecap="round"/>`
    : `<circle cx="82" cy="82" r="11" fill="#fff"/>
       <circle cx="118" cy="82" r="11" fill="#fff"/>
       <circle cx="84" cy="84" r="6" fill="#241a0f"/>
       <circle cx="120" cy="84" r="6" fill="#241a0f"/>
       <circle cx="86.5" cy="81" r="2" fill="#fff"/>
       <circle cx="122.5" cy="81" r="2" fill="#fff"/>`
  }

  <path d="M84 107 Q100 123 116 107" fill="none" stroke="#3a2a19" stroke-width="4" stroke-linecap="round"/>
  <circle cx="78" cy="62" r="7" fill="#fff" opacity="0.18"/>
</svg>`.trim();
}
