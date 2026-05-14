// Magni — magnifying-glass detective mascot, shared with the DataCruise Word Games series.
// Returns an inline SVG string. Sized to the host container (100% width/height).

export function magniSvg({ blink = false, mood = 'smirk' } = {}) {
  const mouth = mood === 'cheer'
    ? `<path d="M68 102 Q86 122 104 102" fill="none" stroke="#00ff9c" stroke-width="3" stroke-linecap="round"/>
       <path d="M72 106 Q86 116 100 106" fill="#06080c" stroke="none"/>`
    : mood === 'frown'
    ? `<path d="M70 114 Q86 102 102 114" fill="none" stroke="#ff5577" stroke-width="2.5" stroke-linecap="round"/>`
    : `<path d="M70 104 Q86 116 102 104" fill="none" stroke="#00ff9c" stroke-width="2.5" stroke-linecap="round"/>`;

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

  <g opacity="0.5" font-family="JetBrains Mono, monospace" font-size="8" fill="#00ff9c">
    <text x="42" y="56">CLEAN?</text>
    <text x="42" y="68">10110010</text>
    <text x="42" y="124">SCRUB!</text>
    <text x="42" y="136">00101110</text>
  </g>

  ${blink
    ? `<line x1="68" y1="90" x2="80" y2="90" stroke="#00ff9c" stroke-width="3" stroke-linecap="round"/>
       <line x1="92" y1="90" x2="104" y2="90" stroke="#00ff9c" stroke-width="3" stroke-linecap="round"/>`
    : `<circle cx="74" cy="88" r="5" fill="#00ff9c"/>
       <circle cx="98" cy="88" r="5" fill="#00ff9c"/>
       <circle cx="75.5" cy="86.5" r="1.2" fill="#06080c"/>
       <circle cx="99.5" cy="86.5" r="1.2" fill="#06080c"/>`
  }
  ${mouth}

  <circle cx="60" cy="62" r="6" fill="#fff" opacity="0.18"/>
  <circle cx="68" cy="70" r="3" fill="#fff" opacity="0.25"/>
</svg>`.trim();
}

// SVG for the trash bin. Animates when `.open` class is applied.
export function trashBinSvg() {
  return `
<svg class="bin-svg" viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" aria-label="Trash bin">
  <defs>
    <linearGradient id="binBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#1a212e"/>
      <stop offset="100%" stop-color="#0a0e14"/>
    </linearGradient>
    <linearGradient id="binLid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#ff2e92"/>
      <stop offset="100%" stop-color="#7a1a4d"/>
    </linearGradient>
  </defs>

  <!-- shadow under bin -->
  <ellipse cx="80" cy="192" rx="60" ry="6" fill="#000" opacity="0.5"/>

  <!-- body -->
  <path d="M22 60 L138 60 L128 188 Q128 192 124 192 L36 192 Q32 192 32 188 Z"
        fill="url(#binBody)" stroke="#00f0ff" stroke-width="2"/>

  <!-- inner highlight -->
  <path d="M30 66 L130 66 L122 184 L38 184 Z" fill="none" stroke="#00f0ff" stroke-width="0.8" opacity="0.5"/>

  <!-- vertical ribs -->
  <line x1="55" y1="68" x2="51" y2="184" stroke="#00f0ff" stroke-width="0.8" opacity="0.4"/>
  <line x1="80" y1="68" x2="80" y2="184" stroke="#00f0ff" stroke-width="0.8" opacity="0.4"/>
  <line x1="105" y1="68" x2="109" y2="184" stroke="#00f0ff" stroke-width="0.8" opacity="0.4"/>

  <!-- "TRASH" label -->
  <text x="80" y="140" text-anchor="middle"
        font-family="JetBrains Mono, monospace" font-size="14"
        fill="#ff2e92" opacity="0.85" letter-spacing="2">TRASH</text>

  <!-- lid (animates) -->
  <g class="bin-lid">
    <rect x="14" y="42" width="132" height="16" rx="4" fill="url(#binLid)" stroke="#ff7ab8" stroke-width="1"/>
    <rect x="68" y="30" width="24" height="14" rx="3" fill="url(#binLid)" stroke="#ff7ab8" stroke-width="1"/>
  </g>
</svg>`.trim();
}
