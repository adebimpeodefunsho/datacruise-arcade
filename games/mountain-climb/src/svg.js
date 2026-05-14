// Reusable SVG component strings. Each returns a string that drops into innerHTML.

/** Bug-Bug character. scale = 1 is ~60px tall. */
export function bug(scale = 1) {
  return `
    <g transform="scale(${scale})">
      <ellipse cx="0" cy="22" rx="22" ry="4" fill="#3A2818" opacity="0.18"/>
      <g stroke="#2B1A12" stroke-width="2.4" stroke-linecap="round">
        <path d="M-14 6 L-22 14"/><path d="M-15 0 L-24 2"/><path d="M-14 -6 L-22 -10"/>
        <path d="M14 6 L22 14"/><path d="M15 0 L24 2"/><path d="M14 -6 L22 -10"/>
      </g>
      <ellipse cx="-14" cy="0" rx="9" ry="10" fill="#2B1A12"/>
      <path d="M-18 -7 q-6 -5 -10 -10" stroke="#2B1A12" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M-18 7 q-6 5 -10 10" stroke="#2B1A12" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="-28" cy="-17" r="2.5" fill="#2B1A12"/>
      <circle cx="-28" cy="17" r="2.5" fill="#2B1A12"/>
      <ellipse cx="3" cy="0" rx="18" ry="15" fill="url(#bugBody)" stroke="#8B1F1F" stroke-width="1.2"/>
      <path d="M-14 0 L21 0" stroke="#2B1A12" stroke-width="1.8"/>
      <rect x="2" y="-10" width="14" height="13" rx="3" fill="#5C8F4E" stroke="#3F6635" stroke-width="1.2"/>
      <rect x="5" y="-7" width="8" height="2" rx="1" fill="#FFD86B"/>
      <circle cx="-2" cy="7" r="2.4" fill="#2B1A12"/>
      <circle cx="10" cy="7" r="2.4" fill="#2B1A12"/>
      <circle cx="16" cy="0" r="2" fill="#2B1A12"/>
      <circle cx="-16" cy="-3" r="2.1" fill="#FFFDF7"/>
      <circle cx="-16" cy="3" r="2.1" fill="#FFFDF7"/>
      <circle cx="-15.6" cy="-3" r="1.1" fill="#2B1A12"/>
      <circle cx="-15.6" cy="3" r="1.1" fill="#2B1A12"/>
      <circle cx="-11" cy="6" r="2" fill="#FFB7B7" opacity="0.7"/>
      <path d="M-19 1 q-2 3 -4 1" stroke="#FFFDF7" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    </g>`;
}

/** Golden trophy cup. scale=1 fits roughly 80px wide. */
export function trophy(scale = 1) {
  return `
    <g transform="scale(${scale})">
      <ellipse cx="0" cy="40" rx="26" ry="4" fill="#7A4A0F" opacity="0.28"/>
      <rect x="-18" y="24" width="36" height="14" rx="3" fill="url(#goldGrad)" stroke="#8B5A14" stroke-width="2"/>
      <rect x="-22" y="34" width="44" height="8" rx="2" fill="url(#goldGrad)" stroke="#8B5A14" stroke-width="2"/>
      <rect x="-7" y="14" width="14" height="12" fill="url(#goldGrad)" stroke="#8B5A14" stroke-width="2"/>
      <path d="M-18 -12 Q-34 -10 -34 4 Q-34 16 -18 16" fill="none" stroke="#8B5A14" stroke-width="2.4"/>
      <path d="M-20 -10 Q-30 -8 -30 4 Q-30 14 -20 14" fill="url(#goldGrad)" stroke="#8B5A14" stroke-width="2"/>
      <path d="M18 -12 Q34 -10 34 4 Q34 16 18 16" fill="none" stroke="#8B5A14" stroke-width="2.4"/>
      <path d="M20 -10 Q30 -8 30 4 Q30 14 20 14" fill="url(#goldGrad)" stroke="#8B5A14" stroke-width="2"/>
      <path d="M-22 -18 L-20 14 Q-20 22 0 22 Q20 22 20 14 L22 -18 Z" fill="url(#goldGrad)" stroke="#8B5A14" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="0" cy="-18" rx="22" ry="4" fill="url(#goldGrad)" stroke="#8B5A14" stroke-width="2"/>
      <ellipse cx="0" cy="-18" rx="18" ry="2" fill="#FFE564" opacity="0.9"/>
      <ellipse cx="-8" cy="-8" rx="5" ry="14" fill="url(#goldShine)"/>
      <text x="0" y="6" text-anchor="middle" font-size="11" font-weight="800" fill="#7A4A0F">★</text>
    </g>`;
}

export function sun(scale = 1) {
  return `
    <g transform="scale(${scale})">
      <circle cx="0" cy="0" r="22" fill="url(#sunny)" stroke="#E5A024" stroke-width="2"/>
      <g stroke="#FFB347" stroke-width="4" stroke-linecap="round">
        <line x1="0" y1="-32" x2="0" y2="-40"/>
        <line x1="0" y1="32" x2="0" y2="40"/>
        <line x1="-32" y1="0" x2="-40" y2="0"/>
        <line x1="32" y1="0" x2="40" y2="0"/>
        <line x1="-22" y1="-22" x2="-30" y2="-30"/>
        <line x1="22" y1="22" x2="30" y2="30"/>
        <line x1="-22" y1="22" x2="-30" y2="30"/>
        <line x1="22" y1="-22" x2="30" y2="-30"/>
      </g>
    </g>`;
}

export function cloud(scale = 1) {
  return `
    <g transform="scale(${scale})">
      <ellipse cx="-14" cy="2" rx="18" ry="12" fill="#D9DFE9" stroke="#A5B0C2" stroke-width="2"/>
      <ellipse cx="14" cy="2" rx="20" ry="13" fill="#D9DFE9" stroke="#A5B0C2" stroke-width="2"/>
      <ellipse cx="0" cy="-8" rx="18" ry="12" fill="#D9DFE9" stroke="#A5B0C2" stroke-width="2"/>
      <ellipse cx="0" cy="0" rx="26" ry="11" fill="#E8ECF3"/>
    </g>`;
}

export function storm(scale = 1) {
  return `
    <g transform="scale(${scale})">
      <ellipse cx="0" cy="0" rx="30" ry="18" fill="url(#stormGrad)"/>
      <ellipse cx="-18" cy="2" rx="18" ry="13" fill="url(#stormGrad)"/>
      <ellipse cx="18" cy="2" rx="20" ry="13" fill="url(#stormGrad)"/>
      <ellipse cx="-6" cy="-8" rx="18" ry="13" fill="#5A6675"/>
      <g stroke="#7CB7D9" stroke-width="3" stroke-linecap="round">
        <line x1="-16" y1="12" x2="-20" y2="24"/>
        <line x1="-2" y1="12" x2="-6" y2="24"/>
        <line x1="12" y1="12" x2="8" y2="24"/>
      </g>
      <path d="M0 4 L-4 14 L2 16 L-2 26" stroke="#FFE08A" stroke-width="2" fill="#FFD86B" stroke-linejoin="round"/>
    </g>`;
}

export function heartFull(scale = 1) {
  return `
    <g transform="scale(${scale})">
      <path d="M0 -8 C-7 -16 -20 -10 -20 0 C-20 8 -10 14 0 22 C10 14 20 8 20 0 C20 -10 7 -16 0 -8 Z"
            fill="#FF7A6B" stroke="#E55564" stroke-width="2"/>
      <ellipse cx="-7" cy="-3" rx="4" ry="3" fill="#FFB7B7" opacity="0.6"/>
    </g>`;
}

export function heartEmpty(scale = 1) {
  return `
    <g transform="scale(${scale})">
      <path d="M0 -8 C-7 -16 -20 -10 -20 0 C-20 8 -10 14 0 22 C10 14 20 8 20 0 C20 -10 7 -16 0 -8 Z"
            fill="#FFFDF7" stroke="#D9C7A6" stroke-width="2" stroke-dasharray="3 3"/>
    </g>`;
}

/** All gradients referenced above. Drop this inside a single <defs> on the page so all SVGs can use them. */
export function gradientDefs() {
  return `
    <defs>
      <radialGradient id="bugBody" cx="0.4" cy="0.4" r="0.7">
        <stop offset="0%" stop-color="#FF8A8A"/>
        <stop offset="100%" stop-color="#D63A3A"/>
      </radialGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFE564"/>
        <stop offset="50%" stop-color="#FFC72C"/>
        <stop offset="100%" stop-color="#C7891A"/>
      </linearGradient>
      <linearGradient id="goldShine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
        <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="sunny" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFE08A"/>
        <stop offset="100%" stop-color="#FFB347"/>
      </linearGradient>
      <linearGradient id="stormGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7E8DA0"/>
        <stop offset="100%" stop-color="#3F4A5C"/>
      </linearGradient>
      <linearGradient id="lineGrad" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stop-color="#E55525"/>
        <stop offset="100%" stop-color="#A82B1A"/>
      </linearGradient>
    </defs>`;
}
