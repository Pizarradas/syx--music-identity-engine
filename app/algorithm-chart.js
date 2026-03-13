/**
 * Gráfico de evolución — Chart.js
 * Muestra la evolución de variables semánticas en el tiempo
 * Colores reactivos al tema (--semantic-color-primary)
 */
const HISTORY_LEN = 60;
const KEYS = ['energy_level', 'harmonic_tension', 'timbral_brightness', 'rhythmic_pressure', 'emotional_intensity', 'spectral_register'];

let chart = null;
const history = KEYS.reduce((acc, k) => ({ ...acc, [k]: [] }), {});

function getComputedRgba(cssVar) {
  const el = document.createElement('span');
  el.style.cssText = `position:absolute;left:-9999px;background:var(${cssVar})`;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).backgroundColor;
  document.body.removeChild(el);
  if (rgb && rgb !== 'rgba(0, 0, 0, 0)' && rgb !== 'transparent') {
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) return `rgba(${m[1]},${m[2]},${m[3]},0.9)`;
  }
  return null;
}

function withAlpha(rgba, a) {
  if (!rgba) return null;
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? `rgba(${m[1]},${m[2]},${m[3]},${a})` : rgba;
}

export function initAlgorithmChart(container) {
  if (!container || typeof Chart === 'undefined') return;

  const ctx = document.createElement('canvas');
  ctx.setAttribute('role', 'img');
  ctx.setAttribute('aria-label', 'Evolución del algoritmo en tiempo real');
  container.appendChild(ctx);

  const primary = getComputedRgba('--semantic-color-primary') || 'rgba(99, 102, 241, 0.9)';
  const warm = getComputedRgba('--semantic-color-accent-warm') || getComputedRgba('--semantic-color-primary') || 'rgba(236, 72, 153, 0.9)';
  const cool = getComputedRgba('--semantic-color-accent-cool') || getComputedRgba('--semantic-color-primary') || 'rgba(34, 211, 238, 0.9)';

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array(HISTORY_LEN).fill(''),
      datasets: [
        { label: 'Energía', data: [], borderColor: primary, backgroundColor: withAlpha(primary, 0.15) || primary, fill: true, tension: 0.3 },
        { label: 'Tensión', data: [], borderColor: warm, backgroundColor: withAlpha(warm, 0.15) || warm, fill: true, tension: 0.3 },
        { label: 'Brillo', data: [], borderColor: cool, backgroundColor: withAlpha(cool, 0.15) || cool, fill: true, tension: 0.3 },
        { label: 'Ritmo', data: [], borderColor: primary, backgroundColor: withAlpha(primary, 0.1) || primary, fill: true, tension: 0.3 },
        { label: 'Emoción', data: [], borderColor: warm, backgroundColor: withAlpha(warm, 0.1) || warm, fill: true, tension: 0.3 },
        { label: 'Registro', data: [], borderColor: cool, backgroundColor: withAlpha(cool, 0.08) || cool, fill: true, tension: 0.3 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { size: 11 },
            color: 'rgba(255,255,255,0.92)',
            padding: 8,
            usePointStyle: true,
          },
        },
      },
      scales: {
        x: { display: false },
        y: { min: 0, max: 1, display: true, ticks: { stepSize: 0.5, font: { size: 10 }, color: 'rgba(255,255,255,0.85)' } },
      },
    },
  });
}

let chartColorUpdateCounter = 0;

export function updateAlgorithmChart(semantic) {
  if (!chart || !semantic) return;

  KEYS.forEach((key, i) => {
    const dataset = chart.data.datasets[i];
    if (!dataset) return;
    const v = semantic[key] ?? 0.5;
    const arr = history[key];
    if (!arr) return;
    arr.push(v);
    if (arr.length > HISTORY_LEN) arr.shift();
    dataset.data = [...arr];
  });

  chartColorUpdateCounter++;
  if (chartColorUpdateCounter % 30 === 0) {
    const primary = getComputedRgba('--semantic-color-primary');
    const warm = getComputedRgba('--semantic-color-accent-warm') || primary;
    const cool = getComputedRgba('--semantic-color-accent-cool') || primary;
    if (primary) {
      chart.data.datasets[0].borderColor = primary;
      chart.data.datasets[0].backgroundColor = withAlpha(primary, 0.15);
      chart.data.datasets[3].borderColor = primary;
      chart.data.datasets[3].backgroundColor = withAlpha(primary, 0.1);
    }
    if (warm) {
      chart.data.datasets[1].borderColor = warm;
      chart.data.datasets[1].backgroundColor = withAlpha(warm, 0.15);
      chart.data.datasets[4].borderColor = warm;
      chart.data.datasets[4].backgroundColor = withAlpha(warm, 0.1);
    }
    if (cool) {
      chart.data.datasets[2].borderColor = cool;
      chart.data.datasets[2].backgroundColor = withAlpha(cool, 0.15);
      chart.data.datasets[5].borderColor = cool;
      chart.data.datasets[5].backgroundColor = withAlpha(cool, 0.08);
    }
  }

  chart.update('none');
}

const MAX_PROGRESSIVE_POINTS = 120;

/**
 * Modo progresivo: muestra la evolución completa hasta currentTime
 * El mapa se va rellenando a medida que suena la canción
 */
export function updateAlgorithmChartProgressive(currentTime, result) {
  if (!chart || !result?.semantic?.states?.length || !result?.metadata?.duration) return;
  const states = result.semantic.states;
  const duration = result.metadata.duration;
  const progress = Math.min(1, Math.max(0, currentTime / duration));
  const lastIdx = Math.floor(progress * (states.length - 1));
  const slice = states.slice(0, lastIdx + 1);
  if (slice.length === 0) return;
  const step = Math.max(1, Math.floor(slice.length / MAX_PROGRESSIVE_POINTS));
  const sampled = slice.filter((_, i) => i % step === 0 || i === slice.length - 1);
  KEYS.forEach((key, i) => {
    const dataset = chart.data.datasets[i];
    if (!dataset) return;
    dataset.data = sampled.map((s) => s[key] ?? 0.5);
  });
  chart.update('none');
}

export function getAlgorithmChart() {
  return chart;
}
