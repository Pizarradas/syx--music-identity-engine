/**
 * Burbujas emocionales — visualización data-driven por sectores
 * Cada sector = dominio emocional. Burbujas: tamaño, color y posición desde variables semánticas.
 * docs: enfoque matemático, métricas explícitas
 */

const gsap = typeof window !== 'undefined' ? window.gsap : null;

/** Sectores emocionales: ángulo inicio, keys, hue base (0-360) */
const SECTORS = [
  { id: 'energy', label: 'E', keys: ['energy_level', 'rhythmic_pressure', 'dynamic_range'], hue: 25, fullLabel: 'Energía' },
  { id: 'tension', label: 'T', keys: ['harmonic_tension', 'tonal_stability'], hue: 260, fullLabel: 'Tensión' },
  { id: 'timbre', label: 'B', keys: ['timbral_brightness', 'spectral_width', 'timbral_roughness'], hue: 180, fullLabel: 'Brillo' },
  { id: 'emotion', label: 'Em', keys: ['emotional_intensity', 'intimacy_vs_monumentality'], hue: 320, fullLabel: 'Emoción' },
  { id: 'rhythm', label: 'R', keys: ['groove', 'groove_density', 'pulse_stability'], hue: 80, fullLabel: 'Ritmo' },
  { id: 'organic', label: 'O', keys: ['organicity_vs_mechanicality', 'texture_density'], hue: 140, fullLabel: 'Orgánico' },
];

const BUBBLES_PER_SECTOR = 2;
const RADIUS_MIN = 0.15;
const RADIUS_MAX = 0.42;
const SECTOR_ANGLE = 360 / SECTORS.length;

let container = null;
let bubblesEl = null;
let metricsEl = null;
let lastValues = {};

/**
 * Promedio ponderado de keys en semantic
 */
function sectorValue(semantic, sector) {
  const vals = sector.keys.map((k) => semantic[k] ?? 0.5);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Valor normalizado para tamaño de burbuja (0.2 - 1)
 */
function sizeFromValue(v) {
  return 0.2 + v * 0.8;
}

/**
 * Posición polar dentro del sector → x, y normalizados (-0.5 a 0.5)
 */
function bubblePosition(sectorIndex, bubbleIndex) {
  const sectorStart = (sectorIndex * SECTOR_ANGLE - 90) * (Math.PI / 180);
  const angleSpread = SECTOR_ANGLE * 0.65;
  const t = BUBBLES_PER_SECTOR > 1 ? bubbleIndex / (BUBBLES_PER_SECTOR - 1) : 0;
  const angle = sectorStart + t * angleSpread * 0.6;
  const r = 0.18 + (bubbleIndex * 0.14);
  return {
    x: 0.5 + Math.cos(angle) * r,
    y: 0.5 + Math.sin(angle) * r,
  };
}

/**
 * Crea o actualiza el DOM de burbujas
 */
export function initEmotionBubbles(bubblesContainer, metricsContainer) {
  if (!bubblesContainer) return;
  bubblesEl = bubblesContainer;
  metricsEl = metricsContainer;

  bubblesEl.innerHTML = '';
  bubblesEl.setAttribute('aria-label', 'Burbujas por dominio emocional');

  SECTORS.forEach((sector, si) => {
    for (let bi = 0; bi < BUBBLES_PER_SECTOR; bi++) {
      const bubble = document.createElement('div');
      bubble.className = 'org-emotion-bubble';
      bubble.setAttribute('data-sector', sector.id);
      bubble.setAttribute('data-index', String(bi));
      bubble.setAttribute('role', 'img');
      bubble.setAttribute('aria-label', `${sector.fullLabel} ${bi + 1}`);
      const pos = bubblePosition(si, bi);
      bubble.style.setProperty('--bubble-size', '0.5');
      bubble.style.setProperty('--bubble-x', String(pos.x * 100) + '%');
      bubble.style.setProperty('--bubble-y', String(pos.y * 100) + '%');
      bubble.style.setProperty('--bubble-hue', String(sector.hue));
      bubble.style.setProperty('--bubble-sat', '0.5');
      bubble.style.setProperty('--bubble-light', '0.5');
      bubblesEl.appendChild(bubble);
    }
  });

  if (metricsEl) {
    metricsEl.innerHTML = '';
    SECTORS.forEach((sector) => {
      const span = document.createElement('span');
      span.className = 'org-emotion-metric';
      span.setAttribute('data-sector', sector.id);
      span.innerHTML = `<strong>${sector.label}</strong><em>0.50</em>`;
      metricsEl.appendChild(span);
    });
  }
}

/**
 * Actualiza burbujas y métricas desde estado semántico
 */
export function updateEmotionBubbles(semantic, baseHue = 260) {
  if (!semantic || !bubblesEl) return;

  const bubbles = bubblesEl.querySelectorAll('.org-emotion-bubble');
  let idx = 0;

  SECTORS.forEach((sector, si) => {
    const sectorVal = sectorValue(semantic, sector);
    const hue = (sector.hue + baseHue * 0.3) % 360;
    const saturation = 0.5 + sectorVal * 0.4;
    const lightness = 0.4 + (1 - sectorVal) * 0.25;

    for (let bi = 0; bi < BUBBLES_PER_SECTOR; bi++) {
      const bubble = bubbles[idx];
      if (!bubble) {
        idx++;
        continue;
      }

      const key = sector.keys[bi % sector.keys.length];
      const v = semantic[key] ?? 0.5;
      const size = sizeFromValue(v);
      const pos = bubblePosition(si, bi);

      const prev = lastValues[`${si}-${bi}`];
      const changed = !prev || Math.abs(prev.size - size) > 0.02 || Math.abs(prev.v - v) > 0.02;

      bubble.style.setProperty('--bubble-size', String(size));
      bubble.style.setProperty('--bubble-x', String(pos.x * 100) + '%');
      bubble.style.setProperty('--bubble-y', String(pos.y * 100) + '%');
      bubble.style.setProperty('--bubble-hue', String(hue));
      bubble.style.setProperty('--bubble-sat', String(saturation));
      bubble.style.setProperty('--bubble-light', String(lightness));
      bubble.style.setProperty('--bubble-value', String(v));

      if (gsap && changed) {
        gsap.to(bubble, {
          '--bubble-size': size,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }

      lastValues[`${si}-${bi}`] = { size, v };
      idx++;
    }

    if (metricsEl) {
      const metricEl = metricsEl.querySelector(`[data-sector="${sector.id}"]`);
      if (metricEl) {
        const valStr = sectorVal.toFixed(2);
        metricEl.innerHTML = `<strong>${sector.label}</strong><em>${valStr}</em>`;
        metricEl.style.setProperty('--metric-value', String(sectorVal));
      }
    }
  });
}
