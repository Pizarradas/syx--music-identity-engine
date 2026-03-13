/**
 * Feedback visual del algoritmo — qué analiza, coherencia
 * Muestra dominios activos y nivel de confianza del análisis
 */

const DOMAINS = [
  { id: 'energy', label: 'Energía', keys: ['energy_level'], lucideIcon: 'zap' },
  { id: 'harmony', label: 'Armonía', keys: ['harmonic_tension', 'tonal_stability'], lucideIcon: 'music-2' },
  { id: 'timbre', label: 'Timbre', keys: ['timbral_brightness', 'timbral_roughness'], lucideIcon: 'circle' },
  { id: 'register', label: 'Registro', keys: ['spectral_register', 'bass_weight', 'treble_weight'], lucideIcon: 'signal' },
  { id: 'rhythm', label: 'Ritmo', keys: ['rhythmic_pressure', 'pulse_stability'], lucideIcon: 'activity' },
  { id: 'instruments', label: 'Instrumentación', keys: ['percussion_presence', 'vocal_presence', 'bass_presence', 'pad_presence', 'lead_presence'], lucideIcon: 'layers' },
];

const HISTORY_LEN = 20;
let semanticHistory = [];

let container = null;
let domainEls = {};
let confidenceFill = null;

export function initAlgorithmFeedback(el) {
  if (!el) return;
  container = el;
  container.innerHTML = '';

  const title = document.createElement('h3');
  title.className = 'org-algorithm-feedback__title';
  title.textContent = 'Dominios activos';
  container.appendChild(title);

  const legend = document.createElement('p');
  legend.className = 'org-algorithm-feedback__legend';
  legend.innerHTML = 'Energía · Armonía · Timbre · Registro · Ritmo · Instrumentación';
  legend.setAttribute('aria-hidden', 'true');
  container.appendChild(legend);

  const domainsWrap = document.createElement('div');
  domainsWrap.className = 'org-algorithm-feedback__domains';
  DOMAINS.forEach((d) => {
    const span = document.createElement('span');
    span.className = 'org-algorithm-feedback__domain';
    span.setAttribute('data-domain', d.id);
    span.setAttribute('title', d.label);
    span.innerHTML = `<i data-lucide="${d.lucideIcon}"></i>`;
    span.setAttribute('aria-label', d.label);
    domainsWrap.appendChild(span);
    domainEls[d.id] = span;
  });
  container.appendChild(domainsWrap);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const confWrap = document.createElement('div');
  confWrap.className = 'org-algorithm-feedback__confidence';
  confWrap.setAttribute('title', 'Coherencia del análisis: estabilidad de las variables semánticas');
  confWrap.innerHTML = `
    <span class="org-algorithm-feedback__confidence-label">Coherencia</span>
    <div class="org-algorithm-feedback__confidence-track">
      <div class="org-algorithm-feedback__confidence-fill"></div>
    </div>
  `;
  confidenceFill = confWrap.querySelector('.org-algorithm-feedback__confidence-fill');
  container.appendChild(confWrap);
}

function getDomainScores(semantic) {
  return DOMAINS.map((d) => {
    const score = d.keys.reduce((s, k) => s + (semantic[k] ?? 0.5), 0) / Math.max(1, d.keys.length);
    return { id: d.id, score };
  });
}

function computeStability() {
  if (semanticHistory.length < 5) return 0.5;
  const keys = Object.keys(semanticHistory[0] || {});
  let totalVar = 0;
  let count = 0;
  for (const k of keys) {
    const vals = semanticHistory.map((h) => h[k] ?? 0.5);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    totalVar += variance;
    count++;
  }
  const avgVar = count ? totalVar / count : 0;
  const stability = Math.max(0, 1 - avgVar * 4);
  return Math.min(1, stability + 0.3);
}

export function updateAlgorithmFeedback(semantic, hasLyrics = false) {
  if (!container) return;

  if (!semantic) {
    semanticHistory = [];
    return;
  }

  semanticHistory.push({ ...semantic });
  if (semanticHistory.length > HISTORY_LEN) semanticHistory.shift();

  const scores = getDomainScores(semantic);
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top2 = sorted.slice(0, 2).map((s) => s.id);
  const active = sorted.filter((s) => s.score > 0.35).map((s) => s.id);

  DOMAINS.forEach((d) => {
    const el = domainEls[d.id];
    if (!el) return;
    const isActive = active.includes(d.id);
    const isTop = top2.includes(d.id);
    el.classList.toggle('is-active', isActive);
    el.classList.toggle('is-dominant', isTop);
  });

  const stability = computeStability();
  if (confidenceFill) {
    confidenceFill.style.width = `${Math.round(stability * 100)}%`;
  }
}
