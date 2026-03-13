/**
 * Gráfico radar del perfil semántico — vista instantánea de las variables
 * Chart.js tipo radar
 */
const RADAR_KEYS = [
  'energy_level',
  'harmonic_tension',
  'timbral_brightness',
  'rhythmic_pressure',
  'emotional_intensity',
  'organicity_vs_mechanicality',
  'pitchiness',
];

const RADAR_LABELS = {
  energy_level: 'Energía',
  harmonic_tension: 'Tensión',
  timbral_brightness: 'Brillo',
  rhythmic_pressure: 'Ritmo',
  emotional_intensity: 'Emoción',
  organicity_vs_mechanicality: 'Orgánico',
  pitchiness: 'Tonalidad',
};

let radarChart = null;

function getComputedRgba(cssVar) {
  const el = document.createElement('span');
  el.style.cssText = `position:absolute;left:-9999px;background:var(${cssVar})`;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).backgroundColor;
  document.body.removeChild(el);
  if (rgb && rgb !== 'rgba(0, 0, 0, 0)' && rgb !== 'transparent') {
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) return `rgba(${m[1]},${m[2]},${m[3]},0.7)`;
  }
  return 'rgba(99, 102, 241, 0.7)';
}

export function initAlgorithmRadar(container) {
  if (!container || typeof Chart === 'undefined') return;

  const ctx = document.createElement('canvas');
  ctx.setAttribute('role', 'img');
  ctx.setAttribute('aria-label', 'Perfil semántico: Energía, Tensión, Brillo, Ritmo, Emoción, Orgánico, Tonalidad');
  container.appendChild(ctx);

  const fillColor = getComputedRgba('--semantic-color-primary');
  const borderColor = getComputedRgba('--semantic-color-primary');

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: RADAR_KEYS.map((k) => RADAR_LABELS[k]),
      datasets: [
        {
          label: 'Perfil',
          data: RADAR_KEYS.map(() => 0.5),
          backgroundColor: fillColor ? fillColor.replace(/[\d.]+\)$/, '0.2)') : 'rgba(99,102,241,0.2)',
          borderColor: borderColor || 'rgba(99,102,241,0.8)',
          borderWidth: 2,
          pointBackgroundColor: borderColor || 'rgba(99,102,241,0.9)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: { display: false },
      },
      scales: {
        r: {
          min: 0,
          max: 1,
          ticks: { display: false },
          pointLabels: {
            font: { size: 10 },
            color: 'rgba(255,255,255,0.9)',
          },
          grid: {
            color: 'rgba(255,255,255,0.15)',
          },
          angleLines: {
            color: 'rgba(255,255,255,0.1)',
          },
        },
      },
    },
  });
}

export function updateAlgorithmRadar(semantic) {
  if (!radarChart || !semantic) return;

  radarChart.data.datasets[0].data = RADAR_KEYS.map((k) => semantic[k] ?? 0.5);
  radarChart.update('none');
}

export function getAlgorithmRadar() {
  return radarChart;
}
