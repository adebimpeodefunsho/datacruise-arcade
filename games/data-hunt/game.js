/* =============================================================
   Hunt the Data Treasure — game.js
   DataCruise Word Games #5
   ============================================================= */

/* ---------- COLOR PALETTE ---------- */
const COLORS = {
  red:    '#d4452f',
  blue:   '#3a6fc7',
  green:  '#3aa552',
  gold:   '#d4af37',
  silver: '#b8b8b8',
  purple: '#7a3f9f',
  orange: '#ee7a1a',
  pink:   '#ec77a8',
  white:  '#f4f4f4',
  black:  '#2a2a2a',
  brown:  '#6b4226',
  teal:   '#2a9d9d',
};

/* ---------- KINDS (varying real-world objects on the shelf) ----------
   Each kind is an inline-SVG silhouette drawn with currentColor. The
   parent element sets `color` to the cell's colour, so the silhouette's
   fill = the cell's colour. That means the colour the player sees on
   the shelf IS the colour the riddle describes — no more disk-vs-emoji
   mismatch.                                                            */
const KINDS = {
  vase: {
    label: 'vase',
    svg: `<path d="M42 16 L58 16 L58 24 Q60 28 56 32 L56 36 Q72 40 76 56 Q80 80 62 88 L38 88 Q20 80 24 56 Q28 40 44 36 L44 32 Q40 28 42 24 Z"/>
          <path d="M30 42 Q22 48 24 58" fill="none" stroke="currentColor" stroke-width="3"/>
          <path d="M70 42 Q78 48 76 58" fill="none" stroke="currentColor" stroke-width="3"/>
          <ellipse cx="50" cy="22" rx="6" ry="2" fill="rgba(0,0,0,0.35)"/>`
  },
  book: {
    label: 'book',
    svg: `<rect x="20" y="20" width="58" height="62" rx="2"/>
          <rect x="20" y="20" width="8" height="62" fill="rgba(0,0,0,0.4)"/>
          <rect x="76" y="22" width="2" height="58" fill="rgba(255,255,255,0.4)"/>
          <rect x="78" y="24" width="1" height="54" fill="rgba(255,255,255,0.25)"/>
          <rect x="36" y="38" width="34" height="2" fill="rgba(255,255,255,0.5)"/>
          <rect x="36" y="46" width="28" height="2" fill="rgba(255,255,255,0.5)"/>
          <rect x="36" y="54" width="32" height="2" fill="rgba(255,255,255,0.5)"/>`
  },
  cube: {
    label: 'gift box',
    svg: `<rect x="18" y="42" width="64" height="44" rx="2"/>
          <rect x="46" y="42" width="8" height="44" fill="rgba(255,255,255,0.55)"/>
          <rect x="18" y="58" width="64" height="6" fill="rgba(255,255,255,0.55)"/>
          <path d="M50 42 Q34 34 30 24 Q28 16 38 18 Q46 22 50 42 Z"/>
          <path d="M50 42 Q66 34 70 24 Q72 16 62 18 Q54 22 50 42 Z"/>
          <circle cx="50" cy="42" r="4"/>`
  },
  sphere: {
    label: 'ball',
    svg: `<circle cx="50" cy="50" r="32"/>
          <polygon points="50,38 60,46 56,58 44,58 40,46" fill="rgba(0,0,0,0.4)"/>
          <line x1="50" y1="38" x2="50" y2="22" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/>
          <line x1="60" y1="46" x2="76" y2="42" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/>
          <line x1="56" y1="58" x2="66" y2="74" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/>
          <line x1="44" y1="58" x2="34" y2="74" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/>
          <line x1="40" y1="46" x2="24" y2="42" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/>`
  },
  diamond: {
    label: 'gem',
    svg: `<polygon points="50,16 30,30 18,48 50,88 82,48 70,30"/>
          <line x1="30" y1="30" x2="70" y2="30" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
          <line x1="30" y1="30" x2="50" y2="48" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
          <line x1="70" y1="30" x2="50" y2="48" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
          <line x1="18" y1="48" x2="82" y2="48" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
          <line x1="50" y1="48" x2="50" y2="88" stroke="rgba(0,0,0,0.3)" stroke-width="1.5"/>`
  },
  cone: {
    label: 'ice-cream cone',
    svg: `<path d="M30 38 Q30 22 50 22 Q70 22 70 38 Q70 46 60 46 L40 46 Q30 46 30 38 Z"/>
          <circle cx="50" cy="22" r="6"/>
          <polygon points="30,46 70,46 50,88"/>
          <line x1="35" y1="56" x2="48" y2="56" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
          <line x1="40" y1="64" x2="58" y2="64" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
          <line x1="45" y1="72" x2="55" y2="72" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
          <line x1="34" y1="56" x2="40" y2="64" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
          <line x1="50" y1="56" x2="56" y2="64" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>`
  },
  cylinder: {
    label: 'tin can',
    svg: `<rect x="28" y="24" width="44" height="58"/>
          <ellipse cx="50" cy="24" rx="22" ry="5" fill="rgba(255,255,255,0.35)"/>
          <ellipse cx="50" cy="82" rx="22" ry="5" fill="rgba(0,0,0,0.3)"/>
          <rect x="28" y="42" width="44" height="22" fill="rgba(255,255,255,0.3)"/>
          <line x1="34" y1="50" x2="66" y2="50" stroke="rgba(0,0,0,0.45)" stroke-width="2"/>
          <line x1="34" y1="56" x2="58" y2="56" stroke="rgba(0,0,0,0.45)" stroke-width="1.5"/>`
  },
  pyramid: {
    label: 'tent',
    svg: `<polygon points="50,14 14,84 86,84"/>
          <polygon points="50,32 38,84 62,84" fill="rgba(0,0,0,0.5)"/>
          <line x1="50" y1="14" x2="50" y2="10" stroke="currentColor" stroke-width="2"/>
          <circle cx="50" cy="9" r="2"/>`
  },
  bell: {
    label: 'bell',
    svg: `<rect x="46" y="14" width="8" height="8" rx="2"/>
          <path d="M26 72 L74 72 L78 60 Q82 46 70 28 Q60 18 50 18 Q40 18 30 28 Q18 46 22 60 Z"/>
          <line x1="50" y1="72" x2="50" y2="84" stroke="currentColor" stroke-width="2"/>
          <circle cx="50" cy="86" r="5"/>
          <path d="M26 72 L74 72 L72 76 L28 76 Z" fill="rgba(0,0,0,0.3)"/>`
  },
  star: {
    label: 'star',
    svg: `<polygon points="50,12 60,38 86,40 65,57 71,84 50,69 29,84 35,57 14,40 40,38"/>
          <polygon points="50,12 60,38 50,42" fill="rgba(255,255,255,0.35)"/>`
  },
  shoe: {
    label: 'shoe',
    svg: `<path d="M12 70 Q12 56 26 53 L42 47 L48 56 L82 56 Q92 58 92 68 L92 78 L12 78 Z"/>
          <rect x="12" y="76" width="80" height="4" fill="rgba(0,0,0,0.35)"/>
          <path d="M30 64 Q44 70 64 68" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="3"/>
          <line x1="42" y1="56" x2="52" y2="60" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
          <line x1="46" y1="58" x2="56" y2="62" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
          <line x1="50" y1="60" x2="60" y2="64" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>`
  },
  dress: {
    label: 'dress',
    svg: `<polygon points="36,24 64,24 66,42 34,42"/>
          <polygon points="34,42 66,42 84,82 16,82"/>
          <path d="M38 24 Q50 18 62 24" fill="rgba(0,0,0,0.3)"/>
          <rect x="34" y="40" width="32" height="4" fill="rgba(0,0,0,0.35)"/>
          <line x1="38" y1="22" x2="34" y2="28" stroke="currentColor" stroke-width="2"/>
          <line x1="62" y1="22" x2="66" y2="28" stroke="currentColor" stroke-width="2"/>`
  },
  hat: {
    label: 'hat',
    svg: `<ellipse cx="50" cy="74" rx="40" ry="6"/>
          <rect x="32" y="22" width="36" height="50" rx="2"/>
          <rect x="32" y="60" width="36" height="6" fill="rgba(255,255,255,0.45)"/>
          <ellipse cx="50" cy="24" rx="16" ry="3" fill="rgba(255,255,255,0.3)"/>`
  },
  bag: {
    label: 'backpack',
    svg: `<path d="M24 36 Q24 30 32 30 L68 30 Q76 30 76 36 L76 82 Q76 88 70 88 L30 88 Q24 88 24 82 Z"/>
          <path d="M28 30 Q26 16 36 16 Q42 20 40 30" fill="none" stroke="currentColor" stroke-width="5"/>
          <path d="M72 30 Q74 16 64 16 Q58 20 60 30" fill="none" stroke="currentColor" stroke-width="5"/>
          <path d="M44 30 Q44 22 50 22 Q56 22 56 30" fill="none" stroke="currentColor" stroke-width="3"/>
          <rect x="32" y="54" width="36" height="22" rx="2" fill="rgba(255,255,255,0.35)"/>
          <line x1="32" y1="54" x2="68" y2="54" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/>
          <circle cx="62" cy="65" r="2" fill="rgba(0,0,0,0.4)"/>`
  },
  mug: {
    label: 'mug',
    svg: `<path d="M22 36 Q22 32 26 32 L62 32 Q66 32 66 36 L66 80 Q66 86 60 86 L28 86 Q22 86 22 80 Z"/>
          <path d="M66 44 Q82 44 82 58 Q82 72 66 72" fill="none" stroke="currentColor" stroke-width="6"/>
          <ellipse cx="44" cy="34" rx="20" ry="3" fill="rgba(0,0,0,0.4)"/>
          <path d="M36 24 Q40 20 36 16 Q32 12 36 8" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2.5"/>
          <path d="M48 24 Q52 20 48 16 Q44 12 48 8" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2.5"/>`
  },
  cake: {
    label: 'cake',
    svg: `<rect x="14" y="54" width="72" height="32" rx="2"/>
          <rect x="24" y="36" width="52" height="20" rx="2"/>
          <path d="M14 54 Q22 60 30 54 Q38 60 46 54 Q54 60 62 54 Q70 60 78 54 Q82 58 86 54 L86 60 L14 60 Z" fill="rgba(255,255,255,0.4)"/>
          <path d="M24 36 Q30 40 36 36 Q42 40 48 36 Q54 40 60 36 Q66 40 72 36 L76 38 L76 42 L24 42 Z" fill="rgba(255,255,255,0.4)"/>
          <rect x="48" y="22" width="4" height="14"/>
          <path d="M50 22 Q46 16 50 10 Q54 16 50 22 Z" fill="rgba(255,255,255,0.7)"/>`
  },
  key: {
    label: 'key',
    svg: `<circle cx="26" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="9"/>
          <circle cx="26" cy="50" r="5" fill="rgba(0,0,0,0.4)"/>
          <rect x="40" y="46" width="46" height="8"/>
          <rect x="78" y="54" width="6" height="10"/>
          <rect x="66" y="54" width="5" height="7"/>
          <rect x="56" y="54" width="4" height="5"/>`
  },
  camera: {
    label: 'camera',
    svg: `<rect x="10" y="34" width="80" height="48" rx="6"/>
          <rect x="38" y="24" width="24" height="12" rx="2"/>
          <rect x="70" y="40" width="10" height="6" fill="rgba(255,255,255,0.7)"/>
          <rect x="68" y="30" width="10" height="4" rx="1"/>
          <circle cx="50" cy="58" r="16"/>
          <circle cx="50" cy="58" r="14" fill="rgba(0,0,0,0.5)"/>
          <circle cx="50" cy="58" r="8" fill="rgba(255,255,255,0.4)"/>
          <circle cx="50" cy="58" r="3" fill="rgba(0,0,0,0.7)"/>
          <circle cx="46" cy="54" r="2" fill="rgba(255,255,255,0.6)"/>`
  },
  watch: {
    label: 'watch',
    svg: `<path d="M40 12 L60 12 L62 32 L38 32 Z"/>
          <path d="M38 68 L62 68 L60 88 L40 88 Z"/>
          <circle cx="50" cy="50" r="22"/>
          <circle cx="50" cy="50" r="18" fill="rgba(255,255,255,0.4)"/>
          <line x1="50" y1="50" x2="50" y2="38" stroke="rgba(0,0,0,0.7)" stroke-width="2.5"/>
          <line x1="50" y1="50" x2="60" y2="50" stroke="rgba(0,0,0,0.7)" stroke-width="2"/>
          <circle cx="50" cy="50" r="2"/>
          <line x1="50" y1="34" x2="50" y2="36" stroke="rgba(0,0,0,0.5)" stroke-width="2"/>
          <line x1="66" y1="50" x2="64" y2="50" stroke="rgba(0,0,0,0.5)" stroke-width="2"/>
          <line x1="50" y1="64" x2="50" y2="66" stroke="rgba(0,0,0,0.5)" stroke-width="2"/>
          <line x1="34" y1="50" x2="36" y2="50" stroke="rgba(0,0,0,0.5)" stroke-width="2"/>`
  },
  bottle: {
    label: 'lotion bottle',
    svg: `<path d="M30 38 Q30 34 36 34 L64 34 Q70 34 70 38 L70 84 Q70 88 64 88 L36 88 Q30 88 30 84 Z"/>
          <rect x="44" y="24" width="12" height="12"/>
          <path d="M40 14 L60 14 L58 24 L42 24 Z"/>
          <rect x="58" y="14" width="14" height="4"/>
          <rect x="68" y="18" width="4" height="4"/>
          <rect x="36" y="52" width="28" height="22" fill="rgba(255,255,255,0.45)"/>
          <line x1="40" y1="60" x2="60" y2="60" stroke="rgba(0,0,0,0.4)" stroke-width="2"/>
          <line x1="40" y1="66" x2="56" y2="66" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/>`
  },
  pencil: {
    label: 'pencil',
    svg: `<rect x="20" y="46" width="50" height="8"/>
          <polygon points="70,46 88,50 70,54"/>
          <polygon points="84,49 88,50 84,51" fill="rgba(0,0,0,0.55)"/>
          <rect x="12" y="46" width="8" height="8" fill="rgba(255,255,255,0.4)"/>
          <rect x="14" y="46" width="6" height="3" fill="rgba(0,0,0,0.5)"/>
          <rect x="36" y="46" width="2" height="8" fill="rgba(0,0,0,0.3)"/>
          <rect x="52" y="46" width="2" height="8" fill="rgba(0,0,0,0.3)"/>`
  },
  balloon: {
    label: 'balloon',
    svg: `<ellipse cx="50" cy="42" rx="22" ry="26"/>
          <polygon points="45,68 55,68 50,76"/>
          <path d="M50 76 Q40 80 50 86 Q60 90 50 96" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="42" cy="34" rx="6" ry="9" fill="rgba(255,255,255,0.4)"/>`
  },
  umbrella: {
    label: 'umbrella',
    svg: `<path d="M12 50 Q12 22 50 22 Q88 22 88 50 L50 50 Z"/>
          <path d="M50 22 L50 50 M30 50 Q30 30 50 22 M70 50 Q70 30 50 22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/>
          <rect x="48" y="50" width="4" height="32"/>
          <path d="M52 82 Q60 86 52 90" fill="none" stroke="currentColor" stroke-width="3"/>`
  },
  bicycle: {
    label: 'bicycle',
    svg: `<circle cx="26" cy="66" r="14" fill="none" stroke="currentColor" stroke-width="4"/>
          <circle cx="74" cy="66" r="14" fill="none" stroke="currentColor" stroke-width="4"/>
          <line x1="26" y1="66" x2="50" y2="40" stroke="currentColor" stroke-width="3"/>
          <line x1="50" y1="40" x2="74" y2="66" stroke="currentColor" stroke-width="3"/>
          <line x1="50" y1="40" x2="38" y2="66" stroke="currentColor" stroke-width="3"/>
          <line x1="44" y1="34" x2="56" y2="34" stroke="currentColor" stroke-width="3"/>
          <line x1="70" y1="28" x2="80" y2="28" stroke="currentColor" stroke-width="3"/>
          <circle cx="50" cy="40" r="3"/>`
  },
  guitar: {
    label: 'guitar',
    svg: `<ellipse cx="50" cy="64" rx="18" ry="22"/>
          <circle cx="50" cy="62" r="6" fill="rgba(0,0,0,0.45)"/>
          <rect x="46" y="20" width="8" height="42"/>
          <rect x="42" y="14" width="16" height="8" rx="1"/>
          <line x1="48" y1="22" x2="48" y2="78" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>
          <line x1="50" y1="22" x2="50" y2="78" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>
          <line x1="52" y1="22" x2="52" y2="78" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>`
  },
  flower: {
    label: 'flower',
    svg: `<circle cx="50" cy="28" r="10"/>
          <circle cx="34" cy="38" r="10"/>
          <circle cx="66" cy="38" r="10"/>
          <circle cx="40" cy="54" r="10"/>
          <circle cx="60" cy="54" r="10"/>
          <circle cx="50" cy="42" r="8" fill="rgba(0,0,0,0.4)"/>
          <rect x="48" y="50" width="4" height="34"/>
          <path d="M50 70 Q40 70 38 78" fill="currentColor"/>
          <path d="M50 60 Q60 60 62 68" fill="currentColor"/>`
  },
  chair: {
    label: 'chair',
    svg: `<rect x="28" y="18" width="44" height="38" rx="2"/>
          <rect x="32" y="24" width="36" height="4" fill="rgba(255,255,255,0.35)"/>
          <rect x="32" y="34" width="36" height="4" fill="rgba(255,255,255,0.35)"/>
          <rect x="24" y="54" width="52" height="8"/>
          <rect x="28" y="62" width="6" height="22"/>
          <rect x="66" y="62" width="6" height="22"/>`
  },
  fish: {
    label: 'fish',
    svg: `<ellipse cx="46" cy="50" rx="26" ry="14"/>
          <polygon points="72,50 90,38 86,50 90,62"/>
          <circle cx="34" cy="46" r="3" fill="rgba(255,255,255,0.8)"/>
          <circle cx="34" cy="46" r="1.5" fill="rgba(0,0,0,0.85)"/>
          <path d="M50 36 Q56 30 60 36" fill="currentColor"/>
          <path d="M40 60 Q44 64 50 60" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="2"/>`
  },
  car: {
    label: 'car',
    svg: `<path d="M14 60 L20 46 Q30 38 50 38 Q70 38 80 46 L86 60 L86 70 Q86 74 82 74 L18 74 Q14 74 14 70 Z"/>
          <rect x="26" y="46" width="20" height="14" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="54" y="46" width="20" height="14" rx="2" fill="rgba(255,255,255,0.4)"/>
          <circle cx="30" cy="76" r="7"/>
          <circle cx="70" cy="76" r="7"/>
          <circle cx="30" cy="76" r="3" fill="rgba(0,0,0,0.5)"/>
          <circle cx="70" cy="76" r="3" fill="rgba(0,0,0,0.5)"/>`
  },
  house: {
    label: 'house',
    svg: `<polygon points="50,14 14,46 86,46"/>
          <rect x="20" y="46" width="60" height="38"/>
          <rect x="42" y="60" width="16" height="24"/>
          <rect x="26" y="52" width="12" height="12" fill="rgba(255,255,255,0.4)"/>
          <rect x="62" y="52" width="12" height="12" fill="rgba(255,255,255,0.4)"/>
          <line x1="42" y1="58" x2="58" y2="58" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>`
  },
  tree: {
    label: 'tree',
    svg: `<rect x="44" y="56" width="12" height="30"/>
          <circle cx="50" cy="44" r="26"/>
          <circle cx="36" cy="36" r="12" fill="rgba(255,255,255,0.25)"/>
          <circle cx="60" cy="50" r="9" fill="rgba(0,0,0,0.2)"/>`
  },
  envelope: {
    label: 'envelope',
    svg: `<rect x="14" y="32" width="72" height="48" rx="2"/>
          <polygon points="14,32 50,56 86,32" fill="rgba(0,0,0,0.4)"/>
          <line x1="14" y1="80" x2="44" y2="56" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
          <line x1="86" y1="80" x2="56" y2="56" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>`
  },
  candle: {
    label: 'candle',
    svg: `<rect x="40" y="34" width="20" height="48"/>
          <path d="M50 34 Q44 26 50 14 Q56 26 50 34 Z" fill="rgba(255,255,255,0.65)"/>
          <rect x="34" y="80" width="32" height="4"/>
          <rect x="34" y="80" width="32" height="2" fill="rgba(255,255,255,0.3)"/>`
  },
  glasses: {
    label: 'glasses',
    svg: `<circle cx="30" cy="50" r="14" fill="none" stroke="currentColor" stroke-width="5"/>
          <circle cx="70" cy="50" r="14" fill="none" stroke="currentColor" stroke-width="5"/>
          <line x1="44" y1="50" x2="56" y2="50" stroke="currentColor" stroke-width="4"/>
          <line x1="16" y1="50" x2="8" y2="46" stroke="currentColor" stroke-width="3"/>
          <line x1="84" y1="50" x2="92" y2="46" stroke="currentColor" stroke-width="3"/>
          <circle cx="30" cy="50" r="9" fill="rgba(255,255,255,0.25)"/>
          <circle cx="70" cy="50" r="9" fill="rgba(255,255,255,0.25)"/>`
  },
  crown: {
    label: 'crown',
    svg: `<polygon points="14,72 86,72 80,38 70,52 60,28 50,46 40,28 30,52 20,38"/>
          <rect x="14" y="72" width="72" height="10"/>
          <circle cx="80" cy="38" r="4" fill="rgba(255,255,255,0.55)"/>
          <circle cx="50" cy="28" r="4" fill="rgba(255,255,255,0.55)"/>
          <circle cx="20" cy="38" r="4" fill="rgba(255,255,255,0.55)"/>
          <line x1="14" y1="78" x2="86" y2="78" stroke="rgba(0,0,0,0.3)" stroke-width="1.5"/>`
  },
  table: {
    label: 'table',
    svg: `<rect x="12" y="38" width="76" height="12" rx="2"/>
          <line x1="12" y1="46" x2="88" y2="46" stroke="rgba(0,0,0,0.35)" stroke-width="1.5"/>
          <rect x="20" y="50" width="6" height="34"/>
          <rect x="74" y="50" width="6" height="34"/>
          <rect x="30" y="50" width="6" height="34" fill="rgba(0,0,0,0.4)"/>
          <rect x="64" y="50" width="6" height="34" fill="rgba(0,0,0,0.4)"/>`
  },
};
const SHAPES = Object.keys(KINDS);   // any kind may appear as a filler
const SIZES  = ['small','medium','large'];
const COLOR_KEYS = Object.keys(COLORS);

/* ---------- FILLER WORDS (non-data) ---------- */
const FILLER_WORDS = [
  'coin','mug','bowl','hat','sock','shoe','fork','spoon','knife','ring',
  'bead','comb','brush','soap','rope','kite','frog','duck','moth','fish',
  'lion','bear','wolf','swan','leaf','root','stem','wave','rain','snow',
  'mist','sand','rock','hill','lake','cloud','dust','silk','wool','ash',
  'ink','salt','sugar','flour','bread','cake','pie','jam','milk','tea',
  'egg','nut','seed','vine','herb','reed','moss','clay','tile','glass',
  'lamp','candle','pearl','bone','feather','shell'
];

/* ---------- RIDDLE POOLS ----------
   Numbered pools shared across sessions. activateRiddles() picks one row /
   column / colour / size variant per session every time a session starts,
   so the SQL panel reads differently on every new game load.
   Row riddles are FIRST-PERSON ("I bounce..."): the object speaks for
   itself, and never names its kind directly.                            */

/* OBJECT_RIDDLES — first-person poems where the target object speaks for
   itself. The kind (vase, book, gift box, ball, gem) is concealed in
   idiom or imagery, never named. Used by the object clue.              */
const OBJECT_RIDDLES = {
  vase: [
    { text: "I cradle fresh-cut blooms till their last petal falls",
      explain: "what cradles fresh-cut blooms? → a vase" },
    { text: "I drink water but never thirst, I hold flowers but never bloom",
      explain: "holds flowers in water yet never blooms → a vase" },
    { text: "I stand tall on the table, dressed in someone else's blooms",
      explain: "tall vessel wearing borrowed blooms → a vase" },
    { text: "Empty I am hollow, but with petals I am whole",
      explain: "hollow until filled with petals → a vase" },
  ],
  book: [
    { text: "I am full of words but never speak, full of stories but never travel",
      explain: "silent vessel of words and stories → a book" },
    { text: "I have a spine but no bones, I have leaves but no branches",
      explain: "a 'spine' and 'leaves' belong to → a book" },
    { text: "Open me and a thousand worlds spill out; close me and they sleep",
      explain: "opens worlds and closes them quiet → a book" },
    { text: "My pages flip with every story, yet I never grow tired",
      explain: "pages flipping with stories → a book" },
  ],
  cube: [
    { text: "I hide a surprise beneath my ribbon, and a smile inside my paper",
      explain: "surprise hiding under ribbon and paper → a gift box" },
    { text: "I wear a bow to every party, but I never dance",
      explain: "wears a bow, never dances → a gift box" },
    { text: "Unwrap me and joy spills out — until then I keep my secret",
      explain: "joy spills out on unwrapping → a gift box" },
    { text: "I am wrapped in joy and tied with a happy knot",
      explain: "wrapped in joy with a knot → a gift box" },
  ],
  sphere: [
    { text: "I bounce back from every fall, and roll wherever I am pushed",
      explain: "bounces from any fall and rolls on a push → a ball" },
    { text: "I am round but I am no fruit, I travel but I have no feet",
      explain: "round, footless, travels far → a ball" },
    { text: "Throw me up and I always come back down",
      explain: "thrown up but always comes back down → a ball" },
    { text: "I never sit still — give me a kick and I am away",
      explain: "never still, runs from a kick → a ball" },
  ],
  diamond: [
    { text: "I sparkle when sunlight strikes me, and hoard a thousand stars inside",
      explain: "sparkles in light, hoards starlight → a gem" },
    { text: "I am small but priceless, cold but full of fire",
      explain: "small, priceless, cold and fiery → a gem" },
    { text: "Carved from stone, I shine like fire that will not burn",
      explain: "cut stone, shines like cool fire → a gem" },
    { text: "I am tiny, yet kings have traded kingdoms to call me theirs",
      explain: "tiny but worth a kingdom → a gem" },
  ],
  bell: [
    { text: "I sing when I am struck, and silence when I am still",
      explain: "rings on a strike, silent at rest → a bell" },
    { text: "I dangle in towers, ready to ring across the rooftops",
      explain: "hangs in a tower and rings far → a bell" },
    { text: "I have a mouth that opens downward, yet I speak only with a swing",
      explain: "downward mouth that speaks by swinging → a bell" },
    { text: "Strike me softly and I whisper, strike me hard and I sing",
      explain: "loud or soft depending on the strike → a bell" },
  ],
  table: [
    { text: "I have a flat back and four sturdy feet, yet I never walk a step",
      explain: "flat back, four feet, doesn't walk → a table" },
    { text: "I stand still in the dining room, ready to bear plates at every meal",
      explain: "stands in the dining room holding plates → a table" },
    { text: "Set me with cups and supper; I will not spill a single drop",
      explain: "holds cups and supper without spilling → a table" },
    { text: "I am where families gather to eat, to read, and to play games",
      explain: "the gathering surface for meals and games → a table" },
  ],
  cylinder: [
    { text: "I am sealed shut to keep my dinner safe inside",
      explain: "sealed metal holding food → a tin can" },
    { text: "Round, metal, and humble — I wait on the shelf to be opened",
      explain: "round metal cylinder waiting to be opened → a tin can" },
    { text: "I hold soup or beans without losing a single drop",
      explain: "leakproof container of soup or beans → a tin can" },
    { text: "I am a metal drum the size of your fist, full of supper",
      explain: "small metal drum holding food → a tin can" },
  ],
  bag: [
    { text: "I follow children to school every morning, slung on a shoulder",
      explain: "follows kids to school on a shoulder → a backpack" },
    { text: "I carry their books on straps that are not mine to wear",
      explain: "carries books with straps → a backpack" },
    { text: "I have pockets but I am not a coat, I have straps but I am not a watch",
      explain: "pocketed, strapped, not a coat or watch → a backpack" },
    { text: "I bulge with lunches and notebooks, riding on a back",
      explain: "bulges with lunches and notebooks → a backpack" },
  ],
  hat: [
    { text: "I sit on top of a head, but I never have a thought of my own",
      explain: "perches on a head, mindless → a hat" },
    { text: "I shade your eyes from the sun and your scalp from the rain",
      explain: "shades the head from sun and rain → a hat" },
    { text: "I am worn to parties and to weddings, fancy or plain",
      explain: "an accessory for the head, plain or fancy → a hat" },
    { text: "Place me upon a crown and my whole job is done",
      explain: "purpose is fulfilled the moment it sits on a head → a hat" },
  ],
  key: [
    { text: "I have teeth but I do not chew, I have a head but I do not think",
      explain: "teeth that cut a lock, a head that turns → a key" },
    { text: "I open doors that hands alone cannot",
      explain: "opens locked doors → a key" },
    { text: "I am small and metal, and locks tremble at my touch",
      explain: "small metal item that locks obey → a key" },
    { text: "I jingle in pockets and unlock secret things",
      explain: "jingles in pockets, unlocks secrets → a key" },
  ],
  cone: [
    { text: "I am cold and sweet, scooped on a crunchy seat",
      explain: "cold + sweet + crunchy seat → an ice-cream cone" },
    { text: "I melt under the sun if you don't eat me fast enough",
      explain: "melts in the sun → an ice-cream cone" },
    { text: "Lick me on a hot summer day and I am gone in minutes",
      explain: "licked away on a hot day → an ice-cream cone" },
    { text: "I am dessert that drips down little fingers",
      explain: "drippy dessert → an ice-cream cone" },
  ],
  pyramid: [
    { text: "I am pitched in a field for a night under the stars",
      explain: "pitched in a field, under stars → a tent" },
    { text: "I shelter campers from the rain with my pointed roof",
      explain: "pointed-roof shelter for campers → a tent" },
    { text: "I am a triangle you can sleep inside",
      explain: "triangular shelter you sleep in → a tent" },
    { text: "Pegged to the ground, I keep wind and rain out",
      explain: "pegged-down weather shelter → a tent" },
  ],
  star: [
    { text: "I twinkle in the night sky, watching over the earth",
      explain: "twinkles in the night sky → a star" },
    { text: "I have five points, yet I am not a hand",
      explain: "five points, not a hand → a star" },
    { text: "I sit on top of every Christmas tree at year's end",
      explain: "Christmas-tree topper → a star" },
    { text: "I am a tiny sun, far, far away in the dark",
      explain: "a far-away sun → a star" },
  ],
  shoe: [
    { text: "I cover one foot at a time, and walk many miles a day",
      explain: "covers a foot and walks miles → a shoe" },
    { text: "I am laced up tight, ready to take you down the road",
      explain: "laced and road-ready → a shoe" },
    { text: "Slip me on and I will protect your sole all day",
      explain: "slipped on to protect a sole → a shoe" },
    { text: "I come in pairs; without my twin I am useless",
      explain: "paired footwear → a shoe" },
  ],
  dress: [
    { text: "I am pulled over the head and zipped up the back",
      explain: "over-the-head, back-zip clothing → a dress" },
    { text: "I have a skirt that twirls when you spin",
      explain: "twirling skirt → a dress" },
    { text: "I am worn to parties and weddings, fancy or plain",
      explain: "party / wedding garment → a dress" },
    { text: "I have shoulders without arms and a hem without a foot",
      explain: "shoulders + hem, no arms or feet → a dress" },
  ],
  mug: [
    { text: "I hold your morning brew, with a handle for your fingers",
      explain: "holds morning brew with a handle → a mug" },
    { text: "I steam at breakfast and cool by noon",
      explain: "steamy at breakfast → a mug" },
    { text: "My handle is for fingers, my belly for tea",
      explain: "finger-handle + tea-belly → a mug" },
    { text: "I am where coffee goes before it goes into you",
      explain: "coffee's stopover → a mug" },
  ],
  cake: [
    { text: "I am sweet and stacked, lit with candles on your birthday",
      explain: "stacked + candle-lit on birthdays → a cake" },
    { text: "I am sliced and shared, and everyone fights for the corner piece",
      explain: "sliced + shared, corner-piece prize → a cake" },
    { text: "Frosting is my coat; sponge is my heart",
      explain: "frosting coat + sponge heart → a cake" },
    { text: "I have layers and candles, ready for the singing to begin",
      explain: "layered + candled for singing → a cake" },
  ],
  camera: [
    { text: "I capture the moment but I never live in it",
      explain: "captures moments without living them → a camera" },
    { text: "I have one eye that opens just long enough to remember",
      explain: "one-eye memory-keeper → a camera" },
    { text: "Smile! I am about to keep this forever",
      explain: "asks for smiles to keep forever → a camera" },
    { text: "I click, and a memory is born inside me",
      explain: "clicks a memory into being → a camera" },
  ],
  watch: [
    { text: "I tell you the hour without ever speaking a word",
      explain: "wordless hour-teller → a watch" },
    { text: "I sit on your wrist and tick away your day",
      explain: "wrist-bound ticker → a watch" },
    { text: "I have two hands but neither can hold a thing",
      explain: "two hands that hold nothing → a watch" },
    { text: "I am tiny, round, and never late",
      explain: "tiny + round + punctual → a watch" },
  ],
  bottle: [
    { text: "Press my top and a creamy stream pours out",
      explain: "top-press + creamy stream → a lotion bottle" },
    { text: "I keep your skin soft, one pump at a time",
      explain: "pumps softness onto skin → a lotion bottle" },
    { text: "My nozzle is my mouth; my body is my belly",
      explain: "nozzle-mouth body-belly → a lotion bottle" },
    { text: "I sit on the bathroom shelf, ready to pour my heart out",
      explain: "bathroom-shelf pourer → a lotion bottle" },
  ],
  pencil: [
    { text: "I write your thoughts in soft grey lines",
      explain: "soft-grey-line writer → a pencil" },
    { text: "I have a wooden body and a single pointed tip",
      explain: "wooden body + pointed tip → a pencil" },
    { text: "Wear me down and I get shorter every day",
      explain: "wears shorter with use → a pencil" },
    { text: "I have an eraser on my back for your second chances",
      explain: "eraser-tail for second chances → a pencil" },
  ],
  balloon: [
    { text: "I am coloured skin filled with breath, floating up if let loose",
      explain: "breath-filled colour that floats away → a balloon" },
    { text: "Pop me and I am gone in a single flash",
      explain: "pops in a flash → a balloon" },
    { text: "I am held by a string but I would rather fly away",
      explain: "string-tethered would-be flyer → a balloon" },
    { text: "I am air dressed in colour, ready for a party",
      explain: "coloured air for parties → a balloon" },
  ],
  umbrella: [
    { text: "Open me when the sky weeps, and stay dry beneath my dome",
      explain: "weather-dome that opens against rain → an umbrella" },
    { text: "I am folded shut on sunny days, sprung wide on rainy ones",
      explain: "folded for sun, spread for rain → an umbrella" },
    { text: "I have ribs but no spine, a dome but no roof",
      explain: "ribbed dome without a spine → an umbrella" },
    { text: "I shelter your head from raindrops, one drop at a time",
      explain: "raindrop shelter → an umbrella" },
  ],
  bicycle: [
    { text: "I have two wheels and a seat, ready to roll downhill",
      explain: "two wheels + seat, rolls downhill → a bicycle" },
    { text: "Pedal my pedals and I will carry you forward",
      explain: "pedal-powered carrier → a bicycle" },
    { text: "I have handlebars in front, a chain behind, and never need fuel",
      explain: "fuel-less, chain-driven → a bicycle" },
    { text: "I am the swiftest way to school that needs no motor",
      explain: "motorless swift transport → a bicycle" },
  ],
  guitar: [
    { text: "I am strummed with fingers, and I sing in six bright strings",
      explain: "six-string finger-strummed singer → a guitar" },
    { text: "I am hollow and curved, with a long thin neck",
      explain: "hollow + curved + long neck → a guitar" },
    { text: "I am the centrepiece of every campfire song",
      explain: "campfire-song centrepiece → a guitar" },
    { text: "Pluck me and a melody pours out of my belly",
      explain: "plucked-belly melody-maker → a guitar" },
  ],
  flower: [
    { text: "I open my petals to greet the morning sun",
      explain: "petals open to the sun → a flower" },
    { text: "I am a bouquet's tiniest brick",
      explain: "bouquet's tiniest unit → a flower" },
    { text: "Pluck me and I will wither in your hand",
      explain: "withers when plucked → a flower" },
    { text: "I am the garden's brightest voice on a green lawn",
      explain: "bright voice on the lawn → a flower" },
  ],
  chair: [
    { text: "I have four legs and a tall back, but I never get tired",
      explain: "four legs + tall back, never tires → a chair" },
    { text: "Sit on me when you tire of standing",
      explain: "the sit-down for tired standers → a chair" },
    { text: "I am at every desk, every dining table, every porch",
      explain: "everywhere people sit → a chair" },
    { text: "I hold you up so your knees can rest",
      explain: "holds you up to rest your knees → a chair" },
  ],
  fish: [
    { text: "I swim with fins and breathe through gills, and never need a glass of water",
      explain: "fins + gills, lives in water → a fish" },
    { text: "I live my life under water, and never get dry",
      explain: "always wet, lives under water → a fish" },
    { text: "I have scales like armour and a tail like a fan",
      explain: "armour scales + fan tail → a fish" },
    { text: "I dart through ponds and rivers without a single step",
      explain: "darts through water without steps → a fish" },
  ],
  car: [
    { text: "I have four wheels and an engine, and I roar on highways",
      explain: "four-wheeled engine that roars → a car" },
    { text: "Press my pedal and I will whisk you anywhere",
      explain: "pedal-powered whisker → a car" },
    { text: "I have headlights for eyes and a steering wheel for a heart",
      explain: "headlight eyes + steering-wheel heart → a car" },
    { text: "I burn fuel to take you home each evening",
      explain: "fuel-burning home-carrier → a car" },
  ],
  house: [
    { text: "I have a roof, four walls, and a chimney that pokes out my top",
      explain: "roof + walls + chimney → a house" },
    { text: "Inside me families eat, sleep, and laugh together",
      explain: "family life happens inside → a house" },
    { text: "I have windows for eyes and a door for a mouth",
      explain: "windowed eyes + door mouth → a house" },
    { text: "I am where you go when you want to be home",
      explain: "where you go to be home → a house" },
  ],
  tree: [
    { text: "I have a trunk for a body and leaves for my hair",
      explain: "trunk-body + leafy hair → a tree" },
    { text: "Birds nest in my branches; my roots drink the rain",
      explain: "branches host birds, roots drink rain → a tree" },
    { text: "I grow tall over many seasons, shedding leaves each fall",
      explain: "grows tall, sheds leaves → a tree" },
    { text: "I am the forest's tallest neighbour",
      explain: "the forest's tallest neighbour → a tree" },
  ],
  envelope: [
    { text: "I carry a letter sealed safe inside my paper belly",
      explain: "paper belly carrying a letter → an envelope" },
    { text: "Stamp my corner and I will travel the world",
      explain: "stamped corner travels worldwide → an envelope" },
    { text: "I am closed by a flap and opened by a knife",
      explain: "flap-closed, knife-opened → an envelope" },
    { text: "My address tells the postman where to take me next",
      explain: "addressed for the postman → an envelope" },
  ],
  candle: [
    { text: "I melt as I burn, and shine without electricity",
      explain: "melts + shines without electricity → a candle" },
    { text: "Light my wick and I will glow until I am gone",
      explain: "lit wick that glows itself away → a candle" },
    { text: "I am wax in a stick, with a flame on my head",
      explain: "waxy stick + head-flame → a candle" },
    { text: "I make every dinner romantic and every blackout bearable",
      explain: "romance dinner + blackout helper → a candle" },
  ],
  glasses: [
    { text: "I sit on your nose and rest on your ears, sharpening every page",
      explain: "nose + ear perch that sharpens pages → glasses" },
    { text: "I have two lenses, one for each eye",
      explain: "two lenses for two eyes → glasses" },
    { text: "Without me the world is a blur; with me it snaps into focus",
      explain: "blur-to-focus device → glasses" },
    { text: "I am bent metal and ground glass, helping you see",
      explain: "bent-metal + ground-glass seeing aid → glasses" },
  ],
  crown: [
    { text: "I am the heaviest of hats, worn only by royalty",
      explain: "heavy hat for royalty → a crown" },
    { text: "I am gold and jewelled, perched atop a king's head",
      explain: "gold + jewelled, on a king's head → a crown" },
    { text: "I sparkle with gems and rule by my weight alone",
      explain: "jewel-sparkle + ruling weight → a crown" },
    { text: "I am the prize for the head that wins a kingdom",
      explain: "kingdom-winner's headpiece → a crown" },
  ],
};

/* COLUMN_RIDDLES describe the DIGIT ITSELF — its shape on paper,
   its place in the number system, or a number-property — never an
   object that comes in that quantity.                              */
const COLUMN_RIDDLES = {
  1: [
    { text: "the digit drawn with a single straight downward stroke",
      explain: "1 is written as one straight line → column 1" },
    { text: "the loneliest digit — none come before it in the count",
      explain: "1 is the first counting number, standing alone → column 1" },
    { text: "the digit shaped like a tall thin candle",
      explain: "1 resembles a slim upright candle → column 1" },
    { text: "the only number that, multiplied by itself, stays the same",
      explain: "1 × 1 = 1; only 1 is unchanged → column 1" },
  ],
  2: [
    { text: "the digit drawn like a swan curling its neck above still water",
      explain: "2's top curve looks like a swan's neck → column 2" },
    { text: "the digit with a curl on top sitting on a flat foot",
      explain: "2 is a curve over a flat horizontal stroke → column 2" },
    { text: "the only even number that is also prime",
      explain: "2 is the lone even prime → column 2" },
    { text: "the digit shaped like an upside-down hook with a base",
      explain: "2 resembles an inverted hook → column 2" },
  ],
  3: [
    { text: "the digit drawn with two soft bumps one stacked above the other",
      explain: "3 is two stacked half-moons → column 3" },
    { text: "the digit that looks like a backwards letter E missing its middle bar",
      explain: "3 mirrors an E without its centre line → column 3" },
    { text: "the smallest odd prime number",
      explain: "3 is the smallest prime that isn't 2 → column 3" },
    { text: "the digit shaped like two scoops of ice cream stacked back-to-back",
      explain: "3 looks like two scoops one above the other → column 3" },
  ],
  4: [
    { text: "the digit drawn with two strokes that meet at a sharp corner",
      explain: "4 is two strokes joined at a right angle → column 4" },
    { text: "the digit shaped like a tilted flag pinned to an upright pole",
      explain: "4 looks like a small flag on a vertical pole → column 4" },
    { text: "the smallest perfect square greater than one",
      explain: "4 = 2 × 2, the smallest square after 1 → column 4" },
    { text: "the digit whose English name has the same many letters as its value",
      explain: "\"four\" has 4 letters → column 4" },
  ],
  5: [
    { text: "the digit drawn with a flat hat, a downward line, and a curling foot",
      explain: "5 is a top bar, a stroke down, then a curve out → column 5" },
    { text: "the digit shaped like a backwards letter S wearing a roof",
      explain: "5 looks like a reversed S with a flat top → column 5" },
    { text: "the digit that looks like a hook hanging from a shelf",
      explain: "5's lower curve hangs beneath its top bar → column 5" },
    { text: "the digit that sits exactly halfway to ten",
      explain: "5 is half of 10 → column 5" },
  ],
};

const COLOUR_RIDDLES = {
  gold: [
    { text: "what Midas's touch turns things into",
      explain: "King Midas turned everything he touched into gold" },
    { text: "the gleam of pirate treasure newly dug up",
      explain: "pirates dig up gleaming gold" },
    { text: "the shade of an Olympic first-place medal",
      explain: "first place wears a gold medal" },
    { text: "the hue of a buttercup held under your chin",
      explain: "buttercups glow gold under the chin" },
  ],
  blue: [
    { text: "the hue every clear horizon wears at noon",
      explain: "a clear midday sky / open sea → blue" },
    { text: "the colour of a robin's egg",
      explain: "robin eggs are a pale blue" },
    { text: "the shade the ocean reflects on a calm day",
      explain: "a calm ocean mirrors the sky's blue" },
    { text: "the colour of a clear winter morning",
      explain: "winter dawns wear a cold blue" },
  ],
  red: [
    { text: "the only traffic signal that commands HALT",
      explain: "a red traffic light means stop" },
    { text: "the colour that makes the bull charge",
      explain: "a matador's red cape provokes the bull" },
    { text: "the shade of a fire engine racing past",
      explain: "fire engines are painted red" },
    { text: "the warm flush that climbs into shy cheeks",
      explain: "shy cheeks turn red" },
  ],
  purple: [
    { text: "what red and blue make — the robe of emperors",
      explain: "red + blue mix to make purple; emperors wore purple" },
    { text: "the hue worn by kings and queens of old",
      explain: "royalty wore purple in the old courts" },
    { text: "the colour of a ripe plum's skin",
      explain: "ripe plums wear a deep purple skin" },
    { text: "the shade of lavender fields in summer",
      explain: "lavender fields turn fragrant purple" },
  ],
  green: [
    { text: "the hue of envy — and of every summer leaf",
      explain: "\"green with envy\"; summer leaves are green" },
    { text: "the colour grass wears all spring long",
      explain: "spring grass is green" },
    { text: "the shade every traffic light turns to say GO",
      explain: "go = green on the traffic light" },
    { text: "the colour of moss creeping over an old stone",
      explain: "moss greens over time" },
  ],
  orange: [
    { text: "the colour of a sunset just before the dark",
      explain: "sunset glows orange before nightfall" },
    { text: "the hue of a ripe pumpkin in October",
      explain: "pumpkins ripen to orange" },
    { text: "the warm shade of a flame's friendly cousin",
      explain: "flames burn orange" },
    { text: "the colour of the fruit that shares its own name",
      explain: "the fruit named 'orange' is orange" },
  ],
  silver: [
    { text: "the shimmer of moonlight on a lake at midnight",
      explain: "the moon's reflection looks silver" },
    { text: "the colour of a polished knife or fork",
      explain: "polished cutlery is silver" },
    { text: "the hue of a second-place medal at the Olympics",
      explain: "second place wears silver" },
    { text: "the shine of money turning under a thumb",
      explain: "coins flash silver" },
  ],
  teal: [
    { text: "the colour of a tropical lagoon at noon",
      explain: "tropical lagoons glow a bright teal" },
    { text: "the hue where deep blue and forest green agree to mix",
      explain: "blue + green = teal" },
    { text: "the shade a peacock wears across its plumes",
      explain: "peacock plumes glint teal" },
    { text: "the colour of the sea where it meets a coral reef",
      explain: "reef water turns teal" },
  ],
  brown: [
    { text: "the colour of tree bark wrapped around an old trunk",
      explain: "tree bark is brown" },
    { text: "the hue of a fresh-baked bread crust",
      explain: "bread crust is brown" },
    { text: "the shade of rich chocolate melting on the tongue",
      explain: "chocolate is brown" },
    { text: "the colour of soil ready for planting",
      explain: "rich soil is brown" },
  ],
  black: [
    { text: "the colour of a starless midnight sky",
      explain: "a moonless, starless night is black" },
    { text: "the hue of a raven's polished feathers",
      explain: "raven feathers shine black" },
    { text: "the shade of pen ink drying on paper",
      explain: "ink dries black" },
    { text: "the colour that swallows up every other",
      explain: "black absorbs all colours" },
  ],
  pink: [
    { text: "the colour of a flamingo's feathers",
      explain: "flamingo feathers are pink" },
    { text: "the hue of bubblegum stuck to a sneaker",
      explain: "bubblegum is pink" },
    { text: "the colour of a baby's cheeks after a bath",
      explain: "baby cheeks flush pink" },
    { text: "the warm rose shade of cherry blossoms in spring",
      explain: "cherry blossoms are pink" },
  ],
  white: [
    { text: "the colour of fresh fallen snow on a winter morning",
      explain: "snow is white" },
    { text: "the hue of a wedding gown",
      explain: "wedding gowns are white" },
    { text: "the shade of a cloud floating across a summer sky",
      explain: "summer clouds are white" },
    { text: "the colour of an empty page waiting for ink",
      explain: "a blank page is white" },
  ],
};

/* Each size variant is a FULL predicate (left side + operator + right side)
   so we can mix `size =` and `size >` / `size <` without double-prefixing. */
const SIZE_EXPRESSIONS = {
  large: [
    { sql: "size = MAX(sizes)",                  explain: "3 size tiers (small, medium, large); MAX → large" },
    { sql: "size = GREATEST(small, medium, large)", explain: "GREATEST of the 3 tiers → large" },
    { sql: "size > MEDIAN(sizes)",               explain: "above the middle tier → large" },
  ],
  small: [
    { sql: "size = MIN(sizes)",                  explain: "MIN of the 3 tiers → small" },
    { sql: "size = LEAST(small, medium, large)", explain: "LEAST of the 3 tiers → small" },
    { sql: "size < MEDIAN(sizes)",               explain: "below the middle tier → small" },
  ],
  medium: [
    { sql: "size = MEDIAN(sizes)",                          explain: "MEDIAN of the 3 tiers → medium" },
    { sql: "size = (MIN(sizes) + MAX(sizes)) / 2",          explain: "tiers 1 + 3 = 4, ÷ 2 = 2 → medium" },
    { sql: "size = AVG(MIN(sizes), MAX(sizes))",            explain: "AVG of the lowest and highest tier → medium" },
  ],
};

/* Double single-quotes in a string so it can be embedded inside an SQL
   '...' literal — e.g. "else's" → "else''s".                          */
const sqlEscape = s => String(s).replace(/'/g, "''");

/* ---------- SESSION POOL ----------
   10 templates, each pairing a unique data-word with a unique
   (kind, colour) combo. `startGame` shuffles this pool and picks 5
   per game, so no kind or word repeats inside a game AND a different
   set is chosen on every game replay. Target row/col are randomized
   per session at run time, not stored here.                          */
const SESSION_POOL = [
  { word: 'JOIN',   shape: 'vase',     color: 'gold',   size: 'large',
    meaning: 'JOIN combines rows from two or more tables based on a related column.' },
  { word: 'INDEX',  shape: 'book',     color: 'blue',   size: 'small',
    meaning: 'An INDEX speeds up data retrieval by letting the database jump to rows without scanning the whole table.' },
  { word: 'SCHEMA', shape: 'cube',     color: 'red',    size: 'medium',
    meaning: 'A SCHEMA is the blueprint of a database — the tables, columns, types, and how they fit together.' },
  { word: 'QUERY',  shape: 'sphere',   color: 'purple', size: 'large',
    meaning: 'A QUERY is a request for data — the SELECT statement you write to ask the database a question.' },
  { word: 'PIVOT',  shape: 'diamond',  color: 'green',  size: 'medium',
    meaning: 'PIVOT turns rows into columns — reshaping data so categories become column headers.' },
  { word: 'TABLE',  shape: 'table',    color: 'orange', size: 'medium',
    meaning: 'A TABLE is a collection of related rows organised into named columns — the basic unit of storage in a database.' },
  { word: 'FIELD',  shape: 'cylinder', color: 'silver', size: 'small',
    meaning: 'A FIELD is a single column in a table — the named attribute each row carries a value for.' },
  { word: 'MERGE',  shape: 'bag',      color: 'teal',   size: 'large',
    meaning: 'MERGE inserts, updates, or deletes rows in one statement based on whether a matching row already exists.' },
  { word: 'GROUP',  shape: 'hat',      color: 'brown',  size: 'medium',
    meaning: 'GROUP BY collects rows that share a value so you can compute aggregates over each set.' },
  { word: 'FILTER', shape: 'key',      color: 'black',  size: 'small',
    meaning: 'FILTER narrows the rows a query considers — typically using WHERE or HAVING conditions.' },
];

/* Number of sessions per game. */
const GAME_LENGTH = 5;

/* Pick fresh riddles for the current session and build the SQL + decode.
   Only the OBJECT and COLOUR clues are emitted. Both the object riddle
   (decoded to a kind) and the colour riddle (decoded to a colour) resolve
   to one cell each, and `buildGrid` keeps the target's kind & colour
   unique on the shelf so they converge on the same cell — the target.
   COLUMN_RIDDLES and SIZE_EXPRESSIONS remain in the file for future use. */
function activateRiddles(sess) {
  const objR    = pickRandom(OBJECT_RIDDLES[sess.shape]);
  const colourR = pickRandom(COLOUR_RIDDLES[sess.color]);

  const objSql    = `'${sqlEscape(objR.text)}'`;
  const colourSql = `'${sqlEscape(colourR.text)}'`;

  state.activeSql = [
    "SELECT  treasure",
    "FROM    shelf",
    `WHERE   object = ${objSql}`,
    `  AND   colour = ${colourSql};`
  ];
  state.activeDecode = [
    [`object = ${objSql}`,    objR.explain],
    [`colour = ${colourSql}`, colourR.explain],
  ];
}

/* ---------- DIFFICULTY ---------- */
/* perRow = max wrong clicks allowed on a single row before that row locks. */
const DIFFICULTY = {
  easy:   { time: 60, tries: 3, perRow: 2 },
  medium: { time: 45, tries: 2, perRow: 2 },
  hard:   { time: 30, tries: 1, perRow: 2 },
};

/* ---------- STATE ---------- */
const state = {
  sessionIdx: 0,
  difficulty: 'medium',
  score: 0,
  timeLeft: 0,
  triesLeft: 0,
  timerId: null,
  treasuresFound: [],
  grid: [],            // 30 cells
  rowWrongCounts: [0,0,0,0,0],  // wrong clicks per row (1-indexed via -1)
  locked: false,
  sessionStart: 0,
  gameSessions: [],    // 5 templates picked from SESSION_POOL for this game
  activeSql: [],       // current session's SQL lines (rotated each load)
  activeDecode: [],    // current session's decode pairs
};

/* ---------- AUDIO (Web Audio API) ---------- */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { audioCtx = null; }
  }
}
function tone(freq, dur = 0.15, type = 'sine', gainVal = 0.18) {
  ensureAudio();
  if (!audioCtx) return;
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain); gain.connect(audioCtx.destination);
  const t = audioCtx.currentTime;
  gain.gain.setValueAtTime(gainVal, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur);
}
function playSuccess() {
  tone(523, 0.13);
  setTimeout(() => tone(659, 0.13), 110);
  setTimeout(() => tone(784, 0.28), 220);
  setTimeout(() => tone(1047, 0.32), 360);
}
function playWrong()   { tone(180, 0.28, 'sawtooth', 0.16); }
function playTimeup()  { tone(140, 0.45, 'sawtooth', 0.18); }
function playReveal()  { tone(659, 0.1); setTimeout(() => tone(880, 0.18), 90); }

/* ---------- DOM REFERENCES ---------- */
const $ = (id) => document.getElementById(id);
const startScreen      = $('start-screen');
const gameScreen       = $('game-screen');
const sessionNumEl     = $('session-num');
const scoreEl          = $('score');
const timerEl          = $('timer');
const triesEl          = $('tries');
const sqlDisplay       = $('sql-display');
const hintText         = $('hint-text');
const treasuresList    = $('treasures-list');
const shelfEl          = $('shelf');
const feedbackEl       = $('feedback');
const sessionEndModal  = $('session-end-modal');
const sessionEndTitle  = $('session-end-title');
const revealWordEl     = $('reveal-word');
const explanationList  = $('explanation-list');
const wordMeaningEl    = $('word-meaning');
const nextBtn          = $('next-session-btn');
const gameEndModal     = $('game-end-modal');
const finalScoreEl     = $('final-score');
const finalListEl      = $('final-list');
const playAgainBtn     = $('play-again-btn');

/* ---------- GAME FLOW ---------- */

function startGame(difficulty) {
  state.sessionIdx     = 0;
  state.difficulty     = difficulty;
  state.score          = 0;
  state.treasuresFound = [];

  // Pick GAME_LENGTH data-words from the pool (for unique educational
  // payoffs), then OVERRIDE each picked template's shape + colour with a
  // freshly shuffled value drawn from the FULL kind / colour pools. This
  // way every kind in `SHAPES` (perfume, cake, shoe, camera, star, …) has
  // a chance to hide the treasure across games, not just the original 10.
  // Clone each template so we never mutate the source SESSION_POOL.
  const pickedDataWords = shuffle([...SESSION_POOL]).slice(0, GAME_LENGTH);
  const randomKinds   = shuffle([...SHAPES]).slice(0, GAME_LENGTH);
  const randomColors  = shuffle([...COLOR_KEYS]).slice(0, GAME_LENGTH);
  state.gameSessions = pickedDataWords.map((tpl, i) => ({
    ...tpl,
    shape: randomKinds[i],
    color: randomColors[i],
    size:  pickRandom(SIZES),
  }));

  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  ensureAudio();
  startSession();
}

function startSession() {
  const sess = state.gameSessions[state.sessionIdx];
  const diff = DIFFICULTY[state.difficulty];

  state.timeLeft       = diff.time;
  state.triesLeft      = diff.tries;
  state.rowWrongCounts = [0, 0, 0, 0, 0];
  state.locked         = false;
  state.sessionStart   = Date.now();
  // Randomize where the treasure hides this session — different row/col
  // every time startSession runs, even within the same game.
  state.targetRow      = 1 + Math.floor(Math.random() * 5);
  state.targetCol      = 1 + Math.floor(Math.random() * 6);
  state.grid           = buildGrid(sess);
  activateRiddles(sess);  // pick fresh object/colour variants for this run

  // header
  sessionNumEl.textContent = state.sessionIdx + 1;
  scoreEl.textContent      = state.score;
  timerEl.textContent      = state.timeLeft;
  triesEl.textContent      = state.triesLeft;

  // SQL panel
  sqlDisplay.innerHTML = renderSql(state.activeSql);
  hintText.textContent = `Decode each clue → click the matching object. Max ${diff.perRow} wrong per row, then that row locks!`;

  // shelf
  renderShelf();
  renderTreasuresList();

  // timer
  clearInterval(state.timerId);
  state.timerId = setInterval(tickTimer, 1000);
}

function tickTimer() {
  state.timeLeft--;
  timerEl.textContent = state.timeLeft;
  if (state.timeLeft <= 10) timerEl.style.color = '#ff8a6e';
  else                       timerEl.style.color = '';
  if (state.timeLeft <= 0) endSession('timeout');
}

function endSession(reason) {
  clearInterval(state.timerId);
  state.locked = true;

  const sess = state.gameSessions[state.sessionIdx];
  let points = 0;

  if (reason === 'found') {
    points = computePoints();
    state.score += points;
    state.treasuresFound.push({ word: sess.word, points });
    playSuccess();
  } else {
    state.treasuresFound.push({ word: sess.word, points: 0, missed: true });
    if (reason === 'timeout') playTimeup();
  }

  scoreEl.textContent = state.score;

  // reveal the treasure cell if not already
  const targetIdx = state.grid.findIndex(c => c.isTreasure);
  if (targetIdx >= 0 && !state.grid[targetIdx].revealed) {
    revealCell(targetIdx, true /* asReveal */);
    playReveal();
  }

  // show end-of-session modal after the enlarge-and-hold finishes:
  // 0.55s bounce-in + ~4.95s hold (~5s of looking at the enlarged object)
  // + 0.25s word fade-in + ~1.5s beat to read the word = ~7.25s total.
  setTimeout(() => showSessionEndModal(reason, points), 7250);
}

function computePoints() {
  const diff = DIFFICULTY[state.difficulty];
  const baseByDiff = { easy: 100, medium: 200, hard: 350 };
  const base = baseByDiff[state.difficulty];
  const timeBonus  = state.timeLeft * 3;
  const triesBonus = state.triesLeft * 30;
  return base + timeBonus + triesBonus;
}

function showSessionEndModal(reason, points) {
  const sess = state.gameSessions[state.sessionIdx];

  if (reason === 'found') {
    sessionEndTitle.textContent = `Session ${state.sessionIdx + 1} — Treasure Found! +${points} pts`;
  } else if (reason === 'timeout') {
    sessionEndTitle.textContent = `Session ${state.sessionIdx + 1} — Time's Up!`;
  } else {
    sessionEndTitle.textContent = `Session ${state.sessionIdx + 1} — Out of Tries!`;
  }

  revealWordEl.textContent = sess.word;

  explanationList.innerHTML = state.activeDecode.map(([clause, expl]) =>
    `<li><b>${escapeHtml(clause)}</b> &nbsp;→&nbsp; ${escapeHtml(expl)}</li>`
  ).join('');

  wordMeaningEl.textContent = sess.meaning;

  sessionEndModal.classList.remove('hidden');
}

nextBtn.addEventListener('click', () => {
  sessionEndModal.classList.add('hidden');
  state.sessionIdx++;
  if (state.sessionIdx >= state.gameSessions.length) {
    showGameEnd();
  } else {
    startSession();
  }
});

function showGameEnd() {
  finalScoreEl.textContent = state.score;
  finalListEl.innerHTML = state.treasuresFound.map(t =>
    `<li>${t.word} <span>${t.missed ? 'missed' : '+' + t.points + ' pts'}</span></li>`
  ).join('');
  gameEndModal.classList.remove('hidden');
  const found = state.treasuresFound.filter(t => !t.missed).length;
  const totalT = state.gameSessions.length || 5;
  window.DataCruiseResult && DataCruiseResult.ready({
    slug: 'data-hunt', game: 'Hunt the Data Treasure',
    headline: found + '/' + totalT + ' 💎',
    sub: state.score + ' pts of treasure',
    stars: found >= totalT ? 3 : found >= Math.ceil(totalT * 0.6) ? 2 : found > 0 ? 1 : 0, starsMax: 3,
  });
}

playAgainBtn.addEventListener('click', () => {
  gameEndModal.classList.add('hidden');
  gameScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

/* ---------- GRID BUILD ---------- */

function buildGrid(sess) {
  const cells = new Array(30);
  const fillerPool = [...FILLER_WORDS];
  shuffle(fillerPool);
  let fillerIdx = 0;
  const nextFiller = () => fillerPool[(fillerIdx++) % fillerPool.length];

  /* ---- uniqueness rules for synergy ---------------------------------
     - The target's KIND appears only on the target cell, so the object
       riddle (decoded to a kind) resolves to one cell.
     - The target's COLOUR also appears only on the target cell, so the
       colour riddle alone identifies the same cell.
     - Every filler picks from a kind / colour pool that excludes both.
     Target position is read from state.targetRow / state.targetCol,
     randomized at the start of each session.                          */
  const targetRow = state.targetRow;
  const targetCol = state.targetCol;
  const targetIdx = (targetRow - 1) * 6 + (targetCol - 1);
  cells[targetIdx] = {
    row: targetRow, col: targetCol, isTreasure: true,
    word: sess.word,
    shape: sess.shape, color: sess.color, size: sess.size,
    revealed: false, wrong: false,
  };

  // Pick 29 DISTINCT filler kinds (no duplicates on the shelf) from the
  // pool excluding the target's own kind. SHAPES holds 30+ kinds so 29
  // distinct picks always fit.
  const fillerKindPool = shuffle(SHAPES.filter(k => k !== sess.shape)).slice(0, 29);
  let kindIdx = 0;
  const fillerColors = COLOR_KEYS.filter(c => c !== sess.color);

  for (let i = 0; i < 30; i++) {
    if (i === targetIdx) continue;
    const r = Math.floor(i / 6) + 1;
    const c = (i % 6) + 1;
    cells[i] = {
      row: r, col: c, isTreasure: false,
      word: '',                          // non-treasure cells are EMPTY
      shape: fillerKindPool[kindIdx++],
      color: pickRandom(fillerColors),
      size:  pickRandom(SIZES),
      revealed: false, wrong: false,
    };
  }
  return cells;
}

/* ---------- RENDERING ---------- */

function renderShelf() {
  shelfEl.innerHTML = '';
  for (let r = 1; r <= 5; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'shelf-row';
    rowEl.dataset.row = r;
    for (let c = 1; c <= 6; c++) {
      const idx  = (r - 1) * 6 + (c - 1);
      const cell = state.grid[idx];

      const cellEl = document.createElement('div');
      cellEl.className = 'shelf-cell';
      cellEl.dataset.idx = idx;

      const wrap = document.createElement('div');
      wrap.className = 'shape-wrap';
      // Inline-SVG silhouette filled with the cell's colour via currentColor.
      const kind = KINDS[cell.shape] || KINDS.vase;
      wrap.innerHTML = `<svg class="kind-svg size-${cell.size}" viewBox="0 0 100 100" fill="currentColor" stroke="currentColor" stroke-width="0" style="color: ${COLORS[cell.color]}">${kind.svg}</svg>`;
      cellEl.appendChild(wrap);

      const wordEl = document.createElement('div');
      wordEl.className = cell.isTreasure ? 'word-label' : 'word-label empty-label';
      wordEl.textContent = cell.isTreasure ? cell.word.toUpperCase() : 'EMPTY';
      cellEl.appendChild(wordEl);

      cellEl.addEventListener('click', () => onCellClick(idx));
      rowEl.appendChild(cellEl);
    }
    shelfEl.appendChild(rowEl);
  }
}

function renderSql(lines) {
  return lines.map(line => highlightSql(line)).join('\n');
}

function highlightSql(line) {
  // order matters: strings first (handles SQL '' escapes), then keywords,
  // then functions, then numbers
  return escapeHtml(line)
    .replace(/'((?:[^']|'')*)'/g, '<span class="sql-string">\'$1\'</span>')
    .replace(/\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|AS)\b/g,
             '<span class="sql-keyword">$1</span>')
    .replace(/\b(ROW_OF|COL_OF|RIDDLE|SQRT|POWER|COUNT|LENGTH|MIN|MAX|MEDIAN|CEIL|FLOOR|ABS|MOD|SUM|AVG|ROUND|GREATEST|LEAST)\b/g,
             '<span class="sql-function">$1</span>')
    .replace(/(?<![\w'>])(\d+)(?!['\w])/g, '<span class="sql-number">$1</span>');
}

function renderTreasuresList() {
  const items = [];
  for (let i = 0; i < state.gameSessions.length; i++) {
    const found = state.treasuresFound[i];
    if (found) {
      items.push(`<li><span>${found.word}</span><span class="pts">${
        found.missed ? 'missed' : '+' + found.points
      }</span></li>`);
    } else if (i === state.sessionIdx) {
      items.push(`<li class="placeholder">Session ${i+1} — hunting now…</li>`);
    } else {
      items.push(`<li class="placeholder">Session ${i+1} — locked</li>`);
    }
  }
  treasuresList.innerHTML = items.join('');
}

/* ---------- CLICK HANDLING ---------- */

function onCellClick(idx) {
  if (state.locked) return;
  const cell = state.grid[idx];
  if (cell.revealed) return;

  const diff = DIFFICULTY[state.difficulty];
  const rowMisses = state.rowWrongCounts[cell.row - 1];

  // row already locked — reject the click without spending a try
  if (rowMisses >= diff.perRow) {
    showFeedback(`Row ${cell.row} is locked — try a different row`, 'wrong');
    return;
  }

  if (cell.isTreasure) {
    revealCell(idx, false);
    state.grid[idx].correct = true;
    document.querySelector(`.shelf-cell[data-idx="${idx}"]`).classList.add('correct');
    showFeedback("Treasure found!", 'correct');
    endSession('found');
  } else {
    // wrong — flash word, decrement global tries, increment per-row counter
    state.triesLeft--;
    state.rowWrongCounts[cell.row - 1]++;
    triesEl.textContent = state.triesLeft;
    playWrong();
    flashWrong(idx);

    // lock the row if it just hit the per-row cap
    if (state.rowWrongCounts[cell.row - 1] >= diff.perRow) {
      lockRow(cell.row);
    }

    if (state.triesLeft <= 0) {
      setTimeout(() => endSession('outoftries'), 900);
    }
  }
}

function lockRow(rowNum) {
  const rowEl = shelfEl.querySelector(`.shelf-row[data-row="${rowNum}"]`);
  if (rowEl) rowEl.classList.add('locked');
  showFeedback(`Row ${rowNum} locked — 2 misses used`, 'wrong');
}

function revealCell(idx, asReveal) {
  const cell = state.grid[idx];
  cell.revealed = true;
  const cellEl = document.querySelector(`.shelf-cell[data-idx="${idx}"]`);
  // Enlarge the hiding object, hold it large for ~5s so the player gets
  // a clear look, then swap to .revealed so the data-word treasure fades
  // in over it. Total: 0.55s bounce-in transition + ~4.95s hold.
  cellEl.classList.add('enlarging');
  setTimeout(() => {
    cellEl.classList.remove('enlarging');
    cellEl.classList.add('revealed');
  }, 5500);
}

function flashWrong(idx) {
  const cellEl = document.querySelector(`.shelf-cell[data-idx="${idx}"]`);
  cellEl.classList.add('revealed', 'wrong');
  showFeedback("Empty — no treasure here", 'wrong');
  setTimeout(() => {
    cellEl.classList.remove('revealed', 'wrong');
    state.grid[idx].revealed = false;
  }, 1400);
}

function showFeedback(msg, kind) {
  feedbackEl.textContent = msg;
  feedbackEl.className = `feedback ${kind}`;
  feedbackEl.classList.remove('hidden');
  clearTimeout(feedbackEl._t);
  feedbackEl._t = setTimeout(() => feedbackEl.classList.add('hidden'), 1600);
}

/* ---------- UTILS ---------- */

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ---------- BOOT ---------- */

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => startGame(btn.dataset.diff));
});
