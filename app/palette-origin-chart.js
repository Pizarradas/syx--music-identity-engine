/**
 * Gráfico circular: Música → Paleta
 * Modelo: círculo cromático de 12 tonos con gradiente radial (saturado exterior → blanco centro)
 */
import { CHROMATIC_12_TONES } from '../engine/visual/color-theory.js';

let containerEl = null;
let svgEl = null;
const SIZE = 200;
const CENTER = SIZE / 2;
const INNER_R = 45;
const OUTER_R = 90;
const TONES_12 = 12;
const PARAM_KEYS = ['energy_level', 'harmonic_tension', 'timbral_brightness', 'rhythmic_pressure', 'groove'];
const PARAM_LABELS = ['Energía', 'Tensión', 'Brillo', 'Ritmo', 'Groove'];

const GENRE_DISPLAY_NAMES = {
  folk: 'Folk', celtic: 'Celtic', irish: 'Irish', medieval: 'Medieval', remix: 'Remix',
  acoustic: 'Acústico', ambient: 'Ambient', rock: 'Rock', metal: 'Metal', punk: 'Punk',
  grunge: 'Grunge', pop: 'Pop', indie: 'Indie', alternative: 'Alternativo', jazz: 'Jazz',
  classical: 'Clásica', opera: 'Ópera', baroque: 'Barroco', electronic: 'Electrónica',
  house: 'House', techno: 'Techno', edm: 'EDM', synthwave: 'Synthwave', hiphop: 'Hip-hop',
  trap: 'Trap', rnb: 'R&B', soul: 'Soul', blues: 'Blues', gospel: 'Gospel',
  country: 'Country', bluegrass: 'Bluegrass', latin: 'Latino', reggae: 'Reggae',
  salsa: 'Salsa', bossa: 'Bossa nova', world: 'World', flamenco: 'Flamenco',
  funk: 'Funk', disco: 'Disco', drone: 'Drone', noise: 'Noise', minimal: 'Minimal',
  cinematic: 'Cinematográfico', soundtrack: 'Banda sonora', default: 'Genérico',
};
export function formatGenreForDisplay(genre) {
  if (!genre) return '';
  const parts = String(genre).split(/[/\s,]+/).filter(Boolean);
  return parts.map((p) => GENRE_DISPLAY_NAMES[p.toLowerCase()] ?? (p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())).join(' / ');
}
// Fallback: hues fijos si no hay param_hues dinámicos del audio
const PARAM_HUES_FALLBACK = [20, 280, 85, 150, 320];

function oklchFromHue(hue, chroma = 0.25, lightness = 0.55) {
  return `oklch(${lightness} ${chroma} ${hue})`;
}

function getRootVar(name) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name)?.trim() || '';
}

export function initPaletteOriginChart(container) {
  if (!container) return;
  containerEl = container;
  containerEl.innerHTML = '';
  containerEl.className = 'palette-origin-chart-wrap palette-origin-chart';

  const wrap = document.createElement('div');
  wrap.className = 'palette-origin-chart__wrap';
  wrap.setAttribute('aria-label', 'Mapeo Música → Paleta: cómo cada parámetro de audio contribuye al color');

  const title = document.createElement('h4');
  title.className = 'palette-origin-chart__title';
  title.textContent = 'Música → Paleta';
  wrap.appendChild(title);

  const sub = document.createElement('p');
  sub.className = 'palette-origin-chart__sub';
  sub.textContent = 'Círculo cromático de 12 tonos · Pesos por rol (Primario, Secundario, Neutro…)';
  wrap.appendChild(sub);

  svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svgEl.setAttribute('class', 'palette-origin-chart__svg');
  svgEl.setAttribute('role', 'img');
  svgEl.setAttribute('aria-label', 'Gráfico circular de mapeo audio a color');

  // Fondo: rueda de 12 tonos con gradiente radial (saturado exterior → blanco centro)
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  CHROMATIC_12_TONES.forEach((tone, i) => {
    const rad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    rad.setAttribute('id', `palette-origin-tone-${i}`);
    rad.setAttribute('gradientUnits', 'userSpaceOnUse');
    rad.setAttribute('cx', String(CENTER));
    rad.setAttribute('cy', String(CENTER));
    rad.setAttribute('r', String(OUTER_R));
    rad.innerHTML = `<stop offset="0%" stop-color="oklch(0.98 0 0)"/>
      <stop offset="40%" stop-color="oklch(0.85 0.08 ${tone.hue})"/>
      <stop offset="75%" stop-color="oklch(0.6 0.2 ${tone.hue})"/>
      <stop offset="100%" stop-color="oklch(0.5 0.28 ${tone.hue})"/>`;
    defs.appendChild(rad);
  });
  svgEl.appendChild(defs);

  // Rueda de 12 segmentos (círculo cromático estándar)
  const segmentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  segmentGroup.setAttribute('class', 'palette-origin-chart__wheel');
  for (let i = 0; i < TONES_12; i++) {
    const tone = CHROMATIC_12_TONES[i];
    const startAngle = (i / TONES_12) * 360 - 90;
    const endAngle = ((i + 1) / TONES_12) * 360 - 90;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const r1 = INNER_R;
    const r2 = OUTER_R;
    const x1 = CENTER + r1 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = CENTER + r1 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = CENTER + r2 * Math.cos((startAngle * Math.PI) / 180);
    const y2 = CENTER + r2 * Math.sin((startAngle * Math.PI) / 180);
    const x3 = CENTER + r2 * Math.cos((endAngle * Math.PI) / 180);
    const y3 = CENTER + r2 * Math.sin((endAngle * Math.PI) / 180);
    const x4 = CENTER + r1 * Math.cos((endAngle * Math.PI) / 180);
    const y4 = CENTER + r1 * Math.sin((endAngle * Math.PI) / 180);
    path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`);
    path.setAttribute('fill', `url(#palette-origin-tone-${i})`);
    path.setAttribute('opacity', '0.9');
    path.setAttribute('title', tone?.name ?? `Tono ${i + 1}`);
    segmentGroup.appendChild(path);
  }
  svgEl.appendChild(segmentGroup);

  // Segmentos de parámetros (porciones que muestran el peso de cada uno)
  const paramGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  paramGroup.setAttribute('class', 'palette-origin-chart__params');
  paramGroup.setAttribute('id', 'palette-origin-params');
  svgEl.appendChild(paramGroup);

  // Centro: color resultante
  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', CENTER);
  centerCircle.setAttribute('cy', CENTER);
  centerCircle.setAttribute('r', INNER_R - 8);
  centerCircle.setAttribute('class', 'palette-origin-chart__result');
  centerCircle.setAttribute('fill', 'var(--semantic-color-primary, oklch(0.55 0.2 260))');
  centerCircle.setAttribute('stroke', 'oklch(1 0 0 / 0.2)');
  centerCircle.setAttribute('stroke-width', '2');
  svgEl.appendChild(centerCircle);

  // Leyenda
  const legend = document.createElement('div');
  legend.className = 'palette-origin-chart__legend';
  PARAM_LABELS.forEach((label, i) => {
    const item = document.createElement('span');
    item.className = 'palette-origin-chart__legend-item';
    item.setAttribute('data-param', PARAM_KEYS[i]);
    const h = PARAM_HUES_FALLBACK[i];
    item.innerHTML = `<span class="palette-origin-chart__legend-dot" style="background: ${oklchFromHue(h, 0.25)}"></span>${label}`;
    legend.appendChild(item);
  });
  wrap.appendChild(legend);

  wrap.appendChild(svgEl);
  containerEl.appendChild(wrap);
}

export function updatePaletteOriginChart(semantic, bandData = {}, visual = null) {
  if (!svgEl || !semantic) return;

  const paramGroup = svgEl.querySelector('#palette-origin-params');
  if (!paramGroup) return;

  const genre = visual?.genre_detected;
  const harmonyLabel = visual?.harmony_label;
  const subEl = containerEl?.querySelector('.palette-origin-chart__sub');
  if (subEl) {
    const genreDisplay = formatGenreForDisplay(genre);
    const genrePart = genreDisplay ? `Paleta base: ${genreDisplay}` : '';
    const harmonyDisplay = harmonyLabel && !/dinámica|dynamic/i.test(harmonyLabel) ? harmonyLabel : (genre ? 'Triádico' : null);
    const harmonyPart = harmonyDisplay ? ` · Armonía: ${harmonyDisplay}` : '';
    const weightsPart = ' · Pesos por rol (RYB)';
    subEl.textContent = genrePart || harmonyPart ? `${genrePart}${harmonyPart}${weightsPart}` : 'Círculo cromático de 12 tonos · Pesos por rol (Primario, Secundario, Neutro…)';
  }

  const chartSegments = visual?.chart_segments;
  const paramHues = visual?.param_hues ?? PARAM_HUES_FALLBACK;

  paramGroup.innerHTML = '';

  let segments;
  if (chartSegments?.length > 0) {
    segments = chartSegments.map((s) => ({
      weight: s.weight,
      hue: s.hue ?? 0,
      chroma: s.chroma ?? 0.25,
      lightness: 0.5,
      role: s.role,
      label: s.label,
    }));
  } else {
    const values = PARAM_KEYS.map((k) => semantic[k] ?? 0.5);
    const total = values.reduce((a, b) => a + b, 0) || 1;
    segments = values.map((v, i) => ({
      weight: v / total,
      hue: paramHues[i],
      chroma: 0.2 + v * 0.15,
      lightness: 0.45 + v * 0.2,
      role: 'param',
      label: PARAM_LABELS[i],
    }));
  }

  const totalW = segments.reduce((s, seg) => s + seg.weight, 0) || 1;
  let startAngle = -90;

  segments.forEach((seg) => {
    const sweep = (seg.weight / totalW) * 360;
    if (sweep < 1) return;
    const hue = (seg.role === 'white' || seg.role === 'black' || seg.role === 'neutral') ? 0 : seg.hue;
    const chroma = (seg.role === 'white' || seg.role === 'black') ? 0 : (seg.chroma ?? 0.25);
    const lightness = seg.role === 'white' ? 0.98 : seg.role === 'black' ? 0.08 : (seg.lightness ?? 0.5);
    const r1 = INNER_R - 6;
    const r2 = OUTER_R + 2;
    const sa = (startAngle * Math.PI) / 180;
    const ea = ((startAngle + sweep) * Math.PI) / 180;
    const x1 = CENTER + r1 * Math.cos(sa);
    const y1 = CENTER + r1 * Math.sin(sa);
    const x2 = CENTER + r2 * Math.cos(sa);
    const y2 = CENTER + r2 * Math.sin(sa);
    const x3 = CENTER + r2 * Math.cos(ea);
    const y3 = CENTER + r2 * Math.sin(ea);
    const x4 = CENTER + r1 * Math.cos(ea);
    const y4 = CENTER + r1 * Math.sin(ea);
    const largeArc = sweep > 180 ? 1 : 0;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 ${largeArc} 0 ${x1} ${y1} Z`);
    const fillColor = (seg.role === 'white' || seg.role === 'black') ? `oklch(${lightness} 0 0)` : `oklch(${lightness} ${chroma} ${hue})`;
    path.setAttribute('fill', fillColor);
    path.setAttribute('opacity', String(0.6 + seg.weight * 0.4));
    path.setAttribute('class', `palette-origin-chart__param-segment palette-origin-chart__segment--${seg.role}`);
    path.setAttribute('data-role', seg.role);
    path.setAttribute('title', `${seg.label ?? seg.role}: ${(seg.weight * 100).toFixed(0)}%`);
    if (seg.role === 'black') path.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    if (seg.role === 'black') path.setAttribute('stroke-width', '1');
    paramGroup.appendChild(path);
    startAngle += sweep;
  });

  const centerCircle = svgEl.querySelector('.palette-origin-chart__result');
  if (centerCircle) {
    const primary = getRootVar('--semantic-color-primary');
    if (primary) centerCircle.setAttribute('fill', primary);
  }

  const legend = containerEl?.querySelector('.palette-origin-chart__legend');
  if (legend && chartSegments?.length > 0) {
    legend.innerHTML = segments.map((seg) => {
      const fill = seg.role === 'white' ? 'oklch(0.98 0 0)' : seg.role === 'black' ? 'oklch(0.08 0 0)' : (seg.role === 'neutral' ? 'oklch(0.5 0.03 0)' : oklchFromHue(seg.hue, seg.chroma ?? 0.25));
      const pct = (seg.weight * 100).toFixed(0);
      return `<span class="palette-origin-chart__legend-item" data-role="${seg.role}"><span class="palette-origin-chart__legend-dot" style="background: ${fill}"></span>${seg.label} ${pct}%</span>`;
    }).join('');
  } else if (legend) {
    containerEl?.querySelectorAll('.palette-origin-chart__legend-dot').forEach((dot, i) => {
      const h = paramHues[i] ?? PARAM_HUES_FALLBACK[i];
      dot.style.background = oklchFromHue(h, 0.25);
    });
  }
}
