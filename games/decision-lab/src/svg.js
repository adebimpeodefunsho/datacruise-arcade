// Mini SVG assets specific to Decision Lab.

/** Bug-Bug — friendly orange ladybug with antennae. */
export function bug(scale = 1, mood = 'neutral') {
  const s = scale;
  // mood: 'happy' | 'sad' | 'neutral' | 'thinking'
  let mouth = `<path d="M -8 6 Q 0 10 8 6" stroke="#0e0e10" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  if (mood === 'happy')    mouth = `<path d="M -10 4 Q 0 14 10 4" stroke="#0e0e10" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  if (mood === 'sad')      mouth = `<path d="M -8 9 Q 0 3 8 9" stroke="#0e0e10" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  if (mood === 'thinking') mouth = `<line x1="-6" y1="8" x2="6" y2="8" stroke="#0e0e10" stroke-width="2.5" stroke-linecap="round"/>`;
  return `<g transform="scale(${s})">
    <!-- antennae -->
    <line x1="-8" y1="-22" x2="-12" y2="-32" stroke="#0e0e10" stroke-width="2" stroke-linecap="round"/>
    <line x1="8"  y1="-22" x2="12"  y2="-32" stroke="#0e0e10" stroke-width="2" stroke-linecap="round"/>
    <circle cx="-12" cy="-32" r="3" fill="#0e0e10"/>
    <circle cx="12"  cy="-32" r="3" fill="#0e0e10"/>
    <!-- body -->
    <ellipse cx="0" cy="0" rx="22" ry="20" fill="#ff6a00" stroke="#0e0e10" stroke-width="2.5"/>
    <!-- centre line -->
    <line x1="0" y1="-20" x2="0" y2="20" stroke="#0e0e10" stroke-width="2"/>
    <!-- spots -->
    <circle cx="-10" cy="-4" r="3" fill="#0e0e10"/>
    <circle cx="10"  cy="-4" r="3" fill="#0e0e10"/>
    <circle cx="-8"  cy="8"  r="2.5" fill="#0e0e10"/>
    <circle cx="8"   cy="8"  r="2.5" fill="#0e0e10"/>
    <!-- face -->
    <ellipse cx="0" cy="-12" rx="14" ry="10" fill="#ffd8a8" stroke="#0e0e10" stroke-width="2"/>
    <circle cx="-5" cy="-13" r="1.8" fill="#0e0e10"/>
    <circle cx="5"  cy="-13" r="1.8" fill="#0e0e10"/>
    <g transform="translate(0 -10)">
      ${mouth}
    </g>
  </g>`;
}

/** Capsule — Bug-Bug in a vertical pill-shape pod (think astronaut capsule). */
export function capsule(width = 200, height = 280, mood = 'neutral') {
  const cx = width / 2;
  return `<svg viewBox="0 0 ${width} ${height}" class="capsule-svg" role="img" aria-label="Bug-Bug in the answer pod">
    <!-- capsule outer -->
    <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="${(width - 28) / 2}" fill="#fff" stroke="#0e0e10" stroke-width="3"/>
    <!-- inner shading -->
    <rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="${(width - 44) / 2}" fill="#fff8f1"/>
    <!-- window glass shine -->
    <ellipse cx="${cx - 24}" cy="60" rx="10" ry="36" fill="#fff" opacity="0.7"/>
    <!-- Bug-Bug -->
    <g transform="translate(${cx} ${height / 2 + 10})">
      ${bug(1.6, mood)}
    </g>
    <!-- panel detail -->
    <circle cx="${cx - 50}" cy="${height - 38}" r="5" fill="#ff6a00" stroke="#0e0e10" stroke-width="2"/>
    <circle cx="${cx}" cy="${height - 38}" r="5" fill="#ffc94d" stroke="#0e0e10" stroke-width="2"/>
    <circle cx="${cx + 50}" cy="${height - 38}" r="5" fill="#0ea5a4" stroke="#0e0e10" stroke-width="2"/>
  </svg>`;
}

/** Decision Lab logo — a chart with a tick mark. */
export function logoMark(scale = 1) {
  return `<g transform="scale(${scale})">
    <rect x="-30" y="-22" width="60" height="40" rx="5" fill="#ff6a00" stroke="#0e0e10" stroke-width="3"/>
    <rect x="-22" y="-6"  width="6"  height="20" fill="#fff"/>
    <rect x="-12" y="-14" width="6"  height="28" fill="#fff"/>
    <rect x="-2"  y="-2"  width="6"  height="16" fill="#fff"/>
    <rect x="8"   y="-16" width="6"  height="30" fill="#fff"/>
    <circle cx="22" cy="-22" r="8" fill="#34d399" stroke="#0e0e10" stroke-width="2.5"/>
    <path d="M 18 -22 L 21 -19 L 26 -25" stroke="#0e0e10" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>`;
}
