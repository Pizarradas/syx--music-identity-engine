/**
 * Gráfico circular: Música → Paleta
 * Visualiza cómo los parámetros de audio se mapean a colores OKLCH en tiempo real.
 */
let containerEl = null;
let svgEl = null;
const SIZE = 200;
const CENTER = SIZE / 2;
const INNER_R = 45;
const OUTER_R = 90;
const PARAM_KEYS = ['energy_level', 'harmonic_tension', 'timbral_brightness', 'rhythmic_pressure', 'groove'];
const PARAM_LABELS = ['Energía', 'Tensión', 'Brillo', 'Ritmo', 'Groove'];
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
  sub.textContent = 'Contribución de cada parámetro al color';
  wrap.appendChild(sub);

  svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svgEl.setAttribute('class', 'palette-origin-chart__svg');
  svgEl.setAttribute('role', 'img');
  svgEl.setAttribute('aria-label', 'Gráfico circular de mapeo audio a color');

  // Fondo: rueda de color OKLCH (conic-gradient vía defs)
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'palette-origin-hue-wheel');
  for (let i = 0; i <= 12; i++) {
    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop.setAttribute('offset', `${(i / 12) * 100}%`);
    const h = (i / 12) * 360;
    stop.setAttribute('stop-color', oklchFromHue(h, 0.2, 0.5));
    gradient.appendChild(stop);
  }
  defs.appendChild(gradient);

  const conicGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  conicGrad.setAttribute('id', 'palette-origin-conic');
  conicGrad.innerHTML = `
    <stop offset="0%" stop-color="oklch(0.15 0.02 0)"/>
    <stop offset="100%" stop-color="oklch(0.5 0.15 0)"/>
  `;
  defs.appendChild(conicGrad);

  svgEl.appendChild(defs);

  // Círculo exterior: rueda de hue (simulada con segmentos)
  const segmentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  segmentGroup.setAttribute('class', 'palette-origin-chart__wheel');
  for (let i = 0; i < 36; i++) {
    const startAngle = (i / 36) * 360 - 90;
    const endAngle = ((i + 1) / 36) * 360 - 90;
    const hue = (i / 36) * 360;
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
    path.setAttribute('fill', oklchFromHue(hue, 0.18, 0.5));
    path.setAttribute('opacity', '0.85');
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

  const paramHues = visual?.param_hues ?? PARAM_HUES_FALLBACK;

  paramGroup.innerHTML = '';

  const values = PARAM_KEYS.map((k) => semantic[k] ?? 0.5);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let startAngle = -90;

  values.forEach((v, i) => {
    const sweep = (v / total) * 360;
    const hue = paramHues[i];
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
    path.setAttribute('fill', oklchFromHue(hue, 0.2 + v * 0.15, 0.45 + v * 0.2));
    path.setAttribute('opacity', String(0.5 + v * 0.5));
    path.setAttribute('class', 'palette-origin-chart__param-segment');
    paramGroup.appendChild(path);
    startAngle += sweep;
  });

  const centerCircle = svgEl.querySelector('.palette-origin-chart__result');
  if (centerCircle) {
    const primary = getRootVar('--semantic-color-primary');
    if (primary) centerCircle.setAttribute('fill', primary);
  }

  containerEl?.querySelectorAll('.palette-origin-chart__legend-dot').forEach((dot, i) => {
    const h = paramHues[i] ?? PARAM_HUES_FALLBACK[i];
    dot.style.background = oklchFromHue(h, 0.25);
  });
}
