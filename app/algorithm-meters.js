/**
 * Mesa de mezclas — metros VU reactivos del algoritmo
 * Estilo mesa de mezclas: vertical, peak hold, color por variable
 */

const LABELS = {
  energy_level: 'Energía',
  harmonic_tension: 'Tensión',
  timbral_brightness: 'Brillo',
  rhythmic_pressure: 'Ritmo',
  emotional_intensity: 'Emoción',
  organicity_vs_mechanicality: 'Orgánico',
  spectral_register: 'Registro',
};

const TOOLTIPS = {
  energy_level: 'Nivel de energía sonora (RMS). Alto = más volumen e intensidad.',
  harmonic_tension: 'Tensión armónica. Alto = disonancias, inestabilidad tonal.',
  timbral_brightness: 'Brillo tímbrico. Alto = agudos dominantes, sonido más brillante.',
  rhythmic_pressure: 'Presión rítmica. Alto = ritmo marcado, percusivo.',
  emotional_intensity: 'Intensidad emocional. Derivada de energía y textura.',
  organicity_vs_mechanicality: 'Orgánico vs mecánico. Alto = más natural, menos sintético.',
  spectral_register: 'Registro tonal. Bajo = graves dominantes, alto = agudos dominantes.',
};

const DISPLAY_KEYS = [
  'energy_level',
  'harmonic_tension',
  'timbral_brightness',
  'rhythmic_pressure',
  'emotional_intensity',
  'organicity_vs_mechanicality',
  'spectral_register',
];

const PEAK_HOLD_MS = 400;
const PEAK_DECAY_PER_FRAME = 0.02;

let container = null;
let meterEls = {};
let peakValues = {};

export function initAlgorithmMeters(el) {
  if (!el) return;
  container = el;
  container.innerHTML = '';
  peakValues = {};

  DISPLAY_KEYS.forEach((key) => {
    const wrap = document.createElement('div');
    wrap.className = `org-algorithm-meter org-algorithm-meter--${key.replace(/_/g, '-')}`;
    wrap.setAttribute('data-key', key);
    wrap.setAttribute('title', TOOLTIPS[key] || '');
    wrap.innerHTML = `
      <span class="org-algorithm-meter__label">${LABELS[key] || key}</span>
      <div class="org-algorithm-meter__track">
        <div class="org-algorithm-meter__peak" aria-hidden="true"></div>
        <div class="org-algorithm-meter__fill" style="height: 0%"></div>
      </div>
    `;
    container.appendChild(wrap);
    meterEls[key] = {
      fill: wrap.querySelector('.org-algorithm-meter__fill'),
      peak: wrap.querySelector('.org-algorithm-meter__peak'),
    };
    peakValues[key] = 0;
  });
}

export function updateAlgorithmMeters(semantic) {
  if (!semantic) return;
  DISPLAY_KEYS.forEach((key) => {
    const m = meterEls[key];
    if (!m) return;
    const v = semantic[key] ?? 0.5;
    const pct = Math.round(v * 100);

    m.fill.style.height = `${pct}%`;

    if (v > peakValues[key]) {
      peakValues[key] = v;
    } else {
      peakValues[key] = Math.max(0, peakValues[key] - PEAK_DECAY_PER_FRAME);
    }
    m.peak.style.height = `${Math.round(peakValues[key] * 100)}%`;
  });
}
