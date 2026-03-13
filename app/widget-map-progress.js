/**
 * Mapa progresivo — sumatorios y operaciones que aparecen durante la reproducción
 * Al final de la canción se ve el mapa completo del análisis
 * docs/29_dashboard_philosophy.md
 */

const MAP_KEYS = [
  { id: 'energy', label: 'E', full: 'Energía', key: 'energy_level' },
  { id: 'tension', label: 'T', full: 'Tensión', key: 'harmonic_tension' },
  { id: 'brightness', label: 'B', full: 'Brillo', key: 'timbral_brightness' },
  { id: 'rhythm', label: 'R', full: 'Ritmo', key: 'rhythmic_pressure' },
  { id: 'emotion', label: 'Em', full: 'Emoción', key: 'emotional_intensity' },
  { id: 'register', label: 'Reg', full: 'Registro', key: 'spectral_register' },
];

const HOP_MS = 50;

let mapsEl = null;
let sumsEl = null;
let mapChips = [];

export function initMapProgress(mapsContainer, sumsContainer) {
  if (!mapsContainer) return;
  mapsEl = mapsContainer;
  mapsEl.innerHTML = '';
  mapChips = [];
  MAP_KEYS.forEach((m) => {
    const chip = document.createElement('div');
    chip.className = 'org-center-map-chip';
    chip.setAttribute('data-map', m.id);
    chip.setAttribute('title', `${m.full} map`);
    chip.innerHTML = `<span class="org-center-map-chip__label">${m.label}. map</span>`;
    mapsEl.appendChild(chip);
    mapChips.push({ ...m, el: chip });
  });

  if (!sumsContainer) return;
  sumsEl = sumsContainer;
  sumsEl.innerHTML = '';
  sumsEl.className = 'org-center-dashboard__sums';
}

function getStatesUpToTime(states, duration, currentTime) {
  if (!states?.length || !duration) return [];
  const progress = Math.min(1, Math.max(0, currentTime / duration));
  const lastIdx = Math.floor(progress * (states.length - 1));
  return states.slice(0, lastIdx + 1);
}

function computeAggregates(states) {
  if (!states.length) return {};
  const n = states.length;
  const sum = (key) => states.reduce((s, st) => s + (st[key] ?? 0.5), 0);
  const max = (key) => Math.max(...states.map((st) => st[key] ?? 0.5));
  const avg = (key) => sum(key) / n;
  let peakCount = 0;
  let lastHigh = false;
  const energyArr = states.map((s) => s.energy_level ?? 0.5);
  for (let i = 1; i < energyArr.length; i++) {
    const curr = energyArr[i];
    const prev = energyArr[i - 1];
    if (curr > 0.7 && prev <= 0.7) peakCount++;
  }
  let boundaryCount = 0;
  states.forEach((s) => { if (s.is_boundary) boundaryCount++; });
  return {
    avgEnergy: avg('energy_level'),
    avgTension: avg('harmonic_tension'),
    avgBrightness: avg('timbral_brightness'),
    avgRhythm: avg('rhythmic_pressure'),
    avgEmotion: avg('emotional_intensity'),
    avgRegister: avg('spectral_register'),
    peakEnergy: max('energy_level'),
    peakTension: max('harmonic_tension'),
    peakCount,
    boundaryCount,
    framesAnalyzed: n,
  };
}

export function updateMapProgress(currentTime, result) {
  if (!result?.semantic?.states || !result?.metadata?.duration) return;
  const meta = result.metadata;
  const states = getStatesUpToTime(result.semantic.states, meta.duration, currentTime);
  const agg = computeAggregates(states);
  const progress = meta.duration > 0 ? Math.min(1, currentTime / meta.duration) : 0;

  const avgByMap = { energy: agg.avgEnergy, tension: agg.avgTension, brightness: agg.avgBrightness, rhythm: agg.avgRhythm, emotion: agg.avgEmotion, register: agg.avgRegister };
  mapChips.forEach(({ id, el }) => {
    if (!el) return;
    const v = avgByMap[id] ?? 0.5;
    el.style.setProperty('--map-value', String(v));
    el.style.setProperty('--map-progress', String(progress));
  });

  if (!sumsEl) return;
  if (states.length === 0) {
    sumsEl.innerHTML = '<p class="org-center-sum__empty">Reproduce para ver sumatorios</p>';
    sumsEl.classList.remove('has-data');
    return;
  }
  sumsEl.classList.add('has-data');
  const progressPct = (progress * 100).toFixed(0);
  const bpmStr = meta.bpm ? `${meta.bpm}` : '—';
  const keyStr = meta.key ? `${meta.key} ${meta.keyMode || ''}`.trim() : '—';
  sumsEl.innerHTML = `
    <div class="org-center-sum org-center-sum--progress" title="Progreso del mapa"><span class="org-center-sum__label">Mapa</span><span class="org-center-sum__value">${progressPct}%</span></div>
    <div class="org-center-sum" title="Tempo en BPM"><span class="org-center-sum__label">BPM</span><span class="org-center-sum__value">${bpmStr}</span></div>
    <div class="org-center-sum" title="Tonalidad"><span class="org-center-sum__label">Key</span><span class="org-center-sum__value">${keyStr}</span></div>
    <div class="org-center-sum" title="Energía media"><span class="org-center-sum__label">E. media</span><span class="org-center-sum__value">${(agg.avgEnergy * 100).toFixed(0)}%</span></div>
    <div class="org-center-sum" title="Tensión media"><span class="org-center-sum__label">T. media</span><span class="org-center-sum__value">${(agg.avgTension * 100).toFixed(0)}%</span></div>
    <div class="org-center-sum" title="Picos de energía"><span class="org-center-sum__label">Picos</span><span class="org-center-sum__value">${agg.peakCount}</span></div>
    <div class="org-center-sum" title="Secciones"><span class="org-center-sum__label">Secc.</span><span class="org-center-sum__value">${agg.boundaryCount}</span></div>
  `;
}
