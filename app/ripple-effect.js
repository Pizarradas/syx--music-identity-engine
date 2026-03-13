/**
 * Ripple / transient — efecto visual al detectar picos de energía
 * Fase A: onda que se expande desde el centro cuando hay un transiente
 * Fase 1: umbrales adaptativos según energía base
 */
let rippleEl = null;
let lastEnergy = 0.5;
let lastRippleTime = 0;
let energyBaseline = 0.5;
const RIPPLE_COOLDOWN_MIN_MS = 280;
const RIPPLE_COOLDOWN_MAX_MS = 450;
const BASELINE_SMOOTH = 0.92;

/**
 * Umbral adaptativo: en secciones suaves (bajo baseline) detectamos spikes más pequeños
 */
function getAdaptiveThreshold() {
  if (energyBaseline < 0.35) return 0.28;
  if (energyBaseline < 0.5) return 0.32;
  if (energyBaseline < 0.65) return 0.38;
  return 0.45;
}

/**
 * Cooldown adaptativo: más energía = cooldown más corto para ritmos intensos
 */
function getAdaptiveCooldown() {
  const t = energyBaseline;
  return Math.round(RIPPLE_COOLDOWN_MIN_MS + (1 - t) * (RIPPLE_COOLDOWN_MAX_MS - RIPPLE_COOLDOWN_MIN_MS));
}

/**
 * Inicializa el overlay de ripple (usa div existente o crea uno)
 * @param {HTMLElement} container - Contenedor (ej. scene-container o org-app-canvas)
 */
export function initRipple(container) {
  if (!container) return;
  rippleEl = document.getElementById('ripple-overlay') || container.querySelector('.org-ripple-overlay');
  if (!rippleEl) {
    rippleEl = document.createElement('div');
    rippleEl.className = 'org-ripple-overlay';
    rippleEl.setAttribute('aria-hidden', 'true');
    container.appendChild(rippleEl);
  }
}

/**
 * Detecta transiente y dispara el efecto ripple
 * @param {number} energy - energy_level 0-1
 * @returns {boolean} true si se disparó ripple
 */
export function updateRipple(energy) {
  if (!rippleEl || typeof energy !== 'number') return false;

  const now = Date.now();
  const delta = energy - lastEnergy;
  energyBaseline = energyBaseline * BASELINE_SMOOTH + energy * (1 - BASELINE_SMOOTH);
  lastEnergy = energy;

  const threshold = getAdaptiveThreshold();
  const cooldownMs = getAdaptiveCooldown();
  const minEnergy = 0.38 + energyBaseline * 0.12;

  const isSpike = delta > threshold && energy > minEnergy;
  const cooldownOk = now - lastRippleTime > cooldownMs;

  if (isSpike && cooldownOk) {
    lastRippleTime = now;
    triggerRipple();
    return true;
  }
  return false;
}

/**
 * Dispara manualmente el efecto ripple (ej. al hacer clic o desde otro módulo)
 */
export function triggerRipple() {
  if (!rippleEl) return;
  rippleEl.classList.remove('org-ripple-overlay--active');
  void rippleEl.offsetWidth;
  rippleEl.classList.add('org-ripple-overlay--active');
  const duration = 600;
  setTimeout(() => {
    rippleEl?.classList.remove('org-ripple-overlay--active');
  }, duration);
}

/**
 * Flash breve en picos de energía — overlay que parpadea
 */
let flashEl = null;

export function initFlash(container) {
  if (!container) return;
  flashEl = document.getElementById('flash-overlay') || container.querySelector('.org-flash-overlay');
  if (!flashEl) {
    flashEl = document.createElement('div');
    flashEl.className = 'org-flash-overlay';
    flashEl.setAttribute('aria-hidden', 'true');
    container.appendChild(flashEl);
  }
}

export function triggerFlash() {
  if (!flashEl) return;
  flashEl.classList.remove('org-flash-overlay--active');
  void flashEl.offsetWidth;
  flashEl.classList.add('org-flash-overlay--active');
  setTimeout(() => {
    flashEl?.classList.remove('org-flash-overlay--active');
  }, 120);
}
