/**
 * Centro orientado a datos — gráficos y metros como protagonistas
 * Las dinámicas de los datos en tiempo real son el foco, no los efectos decorativos
 */
const KEYS = ['energy_level', 'harmonic_tension', 'timbral_brightness', 'rhythmic_pressure', 'emotional_intensity'];
const LABELS = ['Energía', 'Tensión', 'Brillo', 'Ritmo', 'Emoción'];
const HISTORY_LEN = 80;
const MAX_PROGRESSIVE_POINTS = 150;

let centerChart = null;
let metersContainer = null;
let meterElements = [];

function getComputedRgba(cssVar) {
  const el = document.createElement('span');
  el.style.cssText = `position:absolute;left:-9999px;background:var(${cssVar})`;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).backgroundColor;
  document.body.removeChild(el);
  if (rgb && rgb !== 'rgba(0, 0, 0, 0)' && rgb !== 'transparent') {
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) return `rgba(${m[1]},${m[2]},${m[3]},0.92)`;
  }
  return 'rgba(255,255,255,0.85)';
}

function withAlpha(rgba, a) {
  if (!rgba) return null;
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? `rgba(${m[1]},${m[2]},${m[3]},${a})` : rgba;
}

export function initCenterDataStage(container) {
  if (!container) return;

  container.innerHTML = '';
  container.className = 'center-data-stage';

  const chartWrap = document.createElement('div');
  chartWrap.className = 'center-data-stage__chart';
  chartWrap.setAttribute('aria-label', 'Evolución temporal de variables semánticas');

  const canvas = document.createElement('canvas');
  chartWrap.appendChild(canvas);
  container.appendChild(chartWrap);

  const metersWrap = document.createElement('div');
  metersWrap.className = 'center-data-stage__meters';
  metersWrap.setAttribute('aria-label', 'Valores actuales en tiempo real');
  KEYS.forEach((_, i) => {
    const m = document.createElement('div');
    m.className = 'center-data-stage__meter';
    m.setAttribute('data-meter', KEYS[i]);
    m.innerHTML = `
      <span class="center-data-stage__meter-label">${LABELS[i]}</span>
      <div class="center-data-stage__meter-track">
        <div class="center-data-stage__meter-fill"></div>
        <div class="center-data-stage__meter-peak"></div>
      </div>
      <span class="center-data-stage__meter-value">—</span>
    `;
    metersWrap.appendChild(m);
    meterElements.push({ key: KEYS[i], el: m, peak: 0 });
  });
  container.appendChild(metersWrap);

  if (typeof Chart !== 'undefined') {
    const primary = getComputedRgba('--semantic-color-primary');
    const warm = getComputedRgba('--semantic-color-accent-warm') || primary;
    const cool = getComputedRgba('--semantic-color-accent-cool') || primary;

    centerChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: Array(HISTORY_LEN).fill(''),
        datasets: [
          { label: LABELS[0], data: [], borderColor: primary, backgroundColor: withAlpha(primary, 0.2), fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 },
          { label: LABELS[1], data: [], borderColor: warm, backgroundColor: withAlpha(warm, 0.18), fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 },
          { label: LABELS[2], data: [], borderColor: cool, backgroundColor: withAlpha(cool, 0.18), fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 },
          { label: LABELS[3], data: [], borderColor: primary, backgroundColor: withAlpha(primary, 0.12), fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 },
          { label: LABELS[4], data: [], borderColor: warm, backgroundColor: withAlpha(warm, 0.12), fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 120 },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 14,
              font: { size: 11 },
              color: 'rgba(255,255,255,0.9)',
              padding: 10,
              usePointStyle: true,
            },
          },
        },
        scales: {
          x: { display: false },
          y: {
            min: 0,
            max: 1,
            display: true,
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: { stepSize: 0.25, font: { size: 10 }, color: 'rgba(255,255,255,0.7)' },
          },
        },
      },
    });
  }
}

const history = KEYS.reduce((acc, k) => ({ ...acc, [k]: [] }), {});
let colorUpdateCounter = 0;
const PEAK_DECAY = 0.015;

export function updateCenterDataStage(semantic, currentTime, result) {
  if (!semantic) return;

  KEYS.forEach((key, i) => {
    const v = semantic[key] ?? 0.5;

    const meter = meterElements[i];
    if (meter?.el) {
      const fill = meter.el.querySelector('.center-data-stage__meter-fill');
      const peak = meter.el.querySelector('.center-data-stage__meter-peak');
      const valueEl = meter.el.querySelector('.center-data-stage__meter-value');
      if (fill) {
        fill.style.width = `${Math.round(v * 100)}%`;
        fill.style.transition = 'width 80ms ease-out';
      }
      if (meter.peak < v) meter.peak = v;
      else meter.peak = Math.max(0, meter.peak - PEAK_DECAY);
      if (peak) peak.style.width = `${Math.round(meter.peak * 100)}%`;
      if (valueEl) valueEl.textContent = `${Math.round(v * 100)}%`;
    }

    if (centerChart?.data?.datasets?.[i]) {
      const arr = history[key];
      if (result?.semantic?.states?.length && result?.metadata?.duration) {
        const progress = Math.min(1, currentTime / result.metadata.duration);
        const lastIdx = Math.floor(progress * (result.semantic.states.length - 1));
        const slice = result.semantic.states.slice(0, lastIdx + 1);
        const step = Math.max(1, Math.floor(slice.length / MAX_PROGRESSIVE_POINTS));
        const sampled = slice.filter((_, j) => j % step === 0 || j === slice.length - 1);
        centerChart.data.datasets[i].data = sampled.map((s) => s[key] ?? 0.5);
      } else {
        arr.push(v);
        if (arr.length > HISTORY_LEN) arr.shift();
        centerChart.data.datasets[i].data = [...arr];
      }
    }
  });

  colorUpdateCounter++;
  if (centerChart && colorUpdateCounter % 40 === 0) {
    const primary = getComputedRgba('--semantic-color-primary');
    const warm = getComputedRgba('--semantic-color-accent-warm') || primary;
    const cool = getComputedRgba('--semantic-color-accent-cool') || primary;
    if (primary) {
      centerChart.data.datasets[0].borderColor = primary;
      centerChart.data.datasets[0].backgroundColor = withAlpha(primary, 0.2);
      centerChart.data.datasets[3].borderColor = primary;
      centerChart.data.datasets[3].backgroundColor = withAlpha(primary, 0.12);
    }
    if (warm) {
      centerChart.data.datasets[1].borderColor = warm;
      centerChart.data.datasets[1].backgroundColor = withAlpha(warm, 0.18);
      centerChart.data.datasets[4].borderColor = warm;
      centerChart.data.datasets[4].backgroundColor = withAlpha(warm, 0.12);
    }
    if (cool) {
      centerChart.data.datasets[2].borderColor = cool;
      centerChart.data.datasets[2].backgroundColor = withAlpha(cool, 0.18);
    }
  }

  if (centerChart) centerChart.update('none');
}
