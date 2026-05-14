// Magni — magnifying-glass detective mascot for the DataCruise Word Games series.
// Same character used in "Derive the Data Jargon". Returns an inline SVG string.

export function magniSvg({ blink = false } = {}) {
  return `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Magni the magnifying-glass detective">
  <defs>
    <radialGradient id="lensGlow" cx="40%" cy="35%" r="65%">
      <stop offset="0%"  stop-color="#0a0e14"/>
      <stop offset="60%" stop-color="#06080c"/>
      <stop offset="100%" stop-color="#000"/>
    </radialGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#00ff9c"/>
      <stop offset="100%" stop-color="#00f0ff"/>
    </linearGradient>
    <linearGradient id="handle" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#ff2e92"/>
      <stop offset="100%" stop-color="#7a1a4d"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.2"/>
    </filter>
  </defs>

  <g transform="rotate(38 130 130)">
    <rect x="124" y="118" width="74" height="22" rx="11" fill="url(#handle)" stroke="#ff7ab8" stroke-width="1.2"/>
    <rect x="124" y="118" width="74" height="22" rx="11" fill="none" stroke="#000" stroke-width="0.6" opacity="0.5"/>
    <rect x="186" y="120" width="10" height="18" rx="3" fill="#7a1a4d"/>
  </g>

  <circle cx="86" cy="86" r="76" fill="url(#rim)" opacity="0.18" filter="url(#soft)"/>
  <circle cx="86" cy="86" r="62" fill="url(#lensGlow)" stroke="url(#rim)" stroke-width="8"/>
  <circle cx="86" cy="86" r="56" fill="none" stroke="#00f0ff" stroke-width="1.2" opacity="0.6"/>

  <g opacity="0.45" font-family="JetBrains Mono, monospace" font-size="8" fill="#00ff9c">
    <text x="42" y="56">CROSS</text>
    <text x="42" y="68">10110010</text>
    <text x="42" y="118">11001011</text>
    <text x="42" y="130">WORDS!</text>
  </g>

  ${blink
    ? `<line x1="68" y1="90" x2="80" y2="90" stroke="#00ff9c" stroke-width="3" stroke-linecap="round"/>
       <line x1="92" y1="90" x2="104" y2="90" stroke="#00ff9c" stroke-width="3" stroke-linecap="round"/>`
    : `<circle cx="74" cy="88" r="5" fill="#00ff9c"/>
       <circle cx="98" cy="88" r="5" fill="#00ff9c"/>
       <circle cx="75.5" cy="86.5" r="1.2" fill="#06080c"/>
       <circle cx="99.5" cy="86.5" r="1.2" fill="#06080c"/>`
  }
  <path d="M70 104 Q86 116 102 104" fill="none" stroke="#00ff9c" stroke-width="2.5" stroke-linecap="round"/>

  <circle cx="60" cy="62" r="6" fill="#fff" opacity="0.18"/>
  <circle cx="68" cy="70" r="3" fill="#fff" opacity="0.25"/>
</svg>`.trim();
}
