// SVG chart renderers for Decision Lab.
// Each function returns an SVG string. Pure functions, no DOM access.

const PALETTE = ['#ff6a00', '#ffc94d', '#0ea5a4', '#a78bfa', '#2563eb', '#dc2626', '#16a34a'];

function fmtNum(n) {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

// ---------- Bar chart ----------
// Spec: { type: 'bar', title, ylabel, data: [{label, value, color?}] }
export function renderBar(spec) {
  const VB_W = 640, VB_H = 360;
  const PAD_L = 60, PAD_R = 20, PAD_T = 40, PAD_B = 60;
  const plotW = VB_W - PAD_L - PAD_R;
  const plotH = VB_H - PAD_T - PAD_B;

  const data = spec.data;
  const maxV = Math.max(...data.map(d => d.value));
  const barW = plotW / data.length * 0.7;
  const gap = plotW / data.length * 0.3;

  let yTicks = '';
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const v = (maxV * i) / ticks;
    const y = PAD_T + plotH - (plotH * i) / ticks;
    yTicks += `<line x1="${PAD_L}" y1="${y}" x2="${PAD_L + plotW}" y2="${y}" stroke="#e5e5e5" stroke-width="1"/>`;
    yTicks += `<text x="${PAD_L - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b6b73" font-family="ui-sans-serif, system-ui">${fmtNum(v)}</text>`;
  }

  let bars = '';
  data.forEach((d, i) => {
    const x = PAD_L + (plotW / data.length) * i + gap / 2;
    const h = (d.value / maxV) * plotH;
    const y = PAD_T + plotH - h;
    const color = d.color || PALETTE[i % PALETTE.length];
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${color}" stroke="#0e0e10" stroke-width="2" rx="3"/>`;
    bars += `<text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="#0e0e10" font-family="ui-sans-serif, system-ui">${fmtNum(d.value)}</text>`;
    bars += `<text x="${x + barW / 2}" y="${PAD_T + plotH + 18}" text-anchor="middle" font-size="11" fill="#3a3a40" font-family="ui-sans-serif, system-ui">${escapeXml(d.label)}</text>`;
  });

  const title = spec.title ? `<text x="${VB_W / 2}" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="#0e0e10" font-family="ui-sans-serif, system-ui">${escapeXml(spec.title)}</text>` : '';
  const ylabel = spec.ylabel ? `<text x="14" y="${PAD_T + plotH / 2}" text-anchor="middle" transform="rotate(-90 14 ${PAD_T + plotH / 2})" font-size="11" font-weight="700" fill="#3a3a40" font-family="ui-sans-serif, system-ui">${escapeXml(spec.ylabel)}</text>` : '';

  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" class="chart-svg" role="img" aria-label="${escapeXml(spec.title || 'Bar chart')}">
    ${title}
    ${yTicks}
    <line x1="${PAD_L}" y1="${PAD_T + plotH}" x2="${PAD_L + plotW}" y2="${PAD_T + plotH}" stroke="#0e0e10" stroke-width="2"/>
    <line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + plotH}" stroke="#0e0e10" stroke-width="2"/>
    ${bars}
    ${ylabel}
  </svg>`;
}

// ---------- Line chart ----------
// Spec: { type: 'line', title, ylabel, xlabels, series: [{label, color, values}] }
export function renderLine(spec) {
  const VB_W = 640, VB_H = 360;
  const PAD_L = 60, PAD_R = 110, PAD_T = 40, PAD_B = 50;
  const plotW = VB_W - PAD_L - PAD_R;
  const plotH = VB_H - PAD_T - PAD_B;

  const allVals = spec.series.flatMap(s => s.values);
  const maxV = Math.max(...allVals);
  const minV = Math.min(0, ...allVals);
  const range = maxV - minV;
  const n = spec.xlabels.length;
  const xFor = (i) => PAD_L + (plotW * i) / (n - 1);
  const yFor = (v) => PAD_T + plotH - ((v - minV) / range) * plotH;

  let yTicks = '';
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const v = minV + (range * i) / ticks;
    const y = yFor(v);
    yTicks += `<line x1="${PAD_L}" y1="${y}" x2="${PAD_L + plotW}" y2="${y}" stroke="#e5e5e5" stroke-width="1"/>`;
    yTicks += `<text x="${PAD_L - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b6b73" font-family="ui-sans-serif, system-ui">${fmtNum(v)}</text>`;
  }

  let xLabels = '';
  spec.xlabels.forEach((lbl, i) => {
    xLabels += `<text x="${xFor(i)}" y="${PAD_T + plotH + 18}" text-anchor="middle" font-size="11" fill="#3a3a40" font-family="ui-sans-serif, system-ui">${escapeXml(lbl)}</text>`;
  });

  let lines = '';
  let legend = '';
  spec.series.forEach((s, idx) => {
    const color = s.color || PALETTE[idx % PALETTE.length];
    const path = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(v)}`).join(' ');
    lines += `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    s.values.forEach((v, i) => {
      lines += `<circle cx="${xFor(i)}" cy="${yFor(v)}" r="4" fill="${color}" stroke="#0e0e10" stroke-width="1.5"/>`;
    });
    legend += `<g transform="translate(${PAD_L + plotW + 12} ${PAD_T + 16 + idx * 22})">
      <rect width="14" height="14" fill="${color}" stroke="#0e0e10" stroke-width="1.5" rx="2"/>
      <text x="20" y="11" font-size="11" font-weight="700" fill="#0e0e10" font-family="ui-sans-serif, system-ui">${escapeXml(s.label)}</text>
    </g>`;
  });

  const title = spec.title ? `<text x="${VB_W / 2}" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="#0e0e10" font-family="ui-sans-serif, system-ui">${escapeXml(spec.title)}</text>` : '';
  const ylabel = spec.ylabel ? `<text x="14" y="${PAD_T + plotH / 2}" text-anchor="middle" transform="rotate(-90 14 ${PAD_T + plotH / 2})" font-size="11" font-weight="700" fill="#3a3a40" font-family="ui-sans-serif, system-ui">${escapeXml(spec.ylabel)}</text>` : '';

  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" class="chart-svg" role="img" aria-label="${escapeXml(spec.title || 'Line chart')}">
    ${title}
    ${yTicks}
    <line x1="${PAD_L}" y1="${PAD_T + plotH}" x2="${PAD_L + plotW}" y2="${PAD_T + plotH}" stroke="#0e0e10" stroke-width="2"/>
    <line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + plotH}" stroke="#0e0e10" stroke-width="2"/>
    ${lines}
    ${xLabels}
    ${legend}
    ${ylabel}
  </svg>`;
}

// ---------- Pie chart ----------
// Spec: { type: 'pie', title, data: [{label, value, color?}] }
export function renderPie(spec) {
  const VB_W = 640, VB_H = 360;
  const cx = 220, cy = 200, r = 130;
  const total = spec.data.reduce((s, d) => s + d.value, 0);

  let slices = '';
  let legend = '';
  let cursor = -Math.PI / 2;
  spec.data.forEach((d, i) => {
    const portion = d.value / total;
    const angle = portion * Math.PI * 2;
    const x1 = cx + r * Math.cos(cursor);
    const y1 = cy + r * Math.sin(cursor);
    cursor += angle;
    const x2 = cx + r * Math.cos(cursor);
    const y2 = cy + r * Math.sin(cursor);
    const large = angle > Math.PI ? 1 : 0;
    const color = d.color || PALETTE[i % PALETTE.length];
    slices += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${color}" stroke="#0e0e10" stroke-width="2.5"/>`;

    // Percentage label inside the slice
    const midAngle = cursor - angle / 2;
    const labelR = r * 0.65;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    if (portion > 0.05) {
      slices += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" font-family="ui-sans-serif, system-ui">${(portion * 100).toFixed(0)}%</text>`;
    }

    legend += `<g transform="translate(400 ${100 + i * 26})">
      <rect width="16" height="16" fill="${color}" stroke="#0e0e10" stroke-width="1.5" rx="2"/>
      <text x="22" y="13" font-size="12" font-weight="700" fill="#0e0e10" font-family="ui-sans-serif, system-ui">${escapeXml(d.label)} — ${fmtNum(d.value)}</text>
    </g>`;
  });

  const title = spec.title ? `<text x="${VB_W / 2}" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="#0e0e10" font-family="ui-sans-serif, system-ui">${escapeXml(spec.title)}</text>` : '';

  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" class="chart-svg" role="img" aria-label="${escapeXml(spec.title || 'Pie chart')}">
    ${title}
    ${slices}
    ${legend}
  </svg>`;
}

export function renderChart(spec) {
  switch (spec.type) {
    case 'bar':  return renderBar(spec);
    case 'line': return renderLine(spec);
    case 'pie':  return renderPie(spec);
    default:     return `<svg viewBox="0 0 640 360"><text x="320" y="180" text-anchor="middle">[unsupported chart: ${spec.type}]</text></svg>`;
  }
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
