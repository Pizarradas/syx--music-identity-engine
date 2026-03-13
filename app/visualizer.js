/**
 * Visualizador de espectro — barras radiales que reaccionan al audio en tiempo real
 * Usa Web Audio API AnalyserNode. Layout circular, distribución logarítmica.
 * Fase 2: más bandas, FFT mayor, colores por frecuencia.
 * Fase 5: throttle adaptativo, pausa cuando pestaña oculta
 */
import { getVisualThrottle, isPageVisible, getSpectrumBarCount } from './performance-utils.js';
const SMOOTHING = 0.88;
const FFT_SIZE = 512;

/** Rangos de bins por barra: distribución logarítmica (más resolución en graves) */
function getBarRanges(binCount, barCount) {
  const ranges = [];
  for (let i = 0; i < barCount; i++) {
    const t0 = i / barCount;
    const t1 = (i + 1) / barCount;
    const frac0 = Math.pow(t0, 0.6);
    const frac1 = Math.pow(t1, 0.6);
    let start = Math.floor(frac0 * binCount);
    let end = Math.min(binCount, Math.max(start + 1, Math.ceil(frac1 * binCount)));
    ranges.push({ start, end, center: (start + end) / 2 });
  }
  return ranges;
}

/** Frecuencia (Hz) → hue 0-360, escala cromática */
function frequencyToHue(freqHz, base = 260) {
  if (!freqHz || freqHz < 20) return base;
  const A4 = 440;
  const semitones = 12 * Math.log2(freqHz / A4);
  return (base + (semitones % 12) * 30 + 360) % 360;
}

let audioContext = null;
let analyser = null;
let source = null;
let dataArray = null;
let animationId = null;
let barsContainer = null;
let barElements = [];
let lastBandData = { bass: 0.33, mids: 0.33, highs: 0.33 };
let lastBandCallback = null;
let baseHue = 260;
let vizFrameCount = 0;
let cachedBarRanges = null;
let cachedBarRangesKey = '';

export function initSpectrumBars(container) {
  if (!container) return;
  barsContainer = container;
  barElements = [];
  container.classList.add('org-music-dashboard__spectrum--radial');

  const barCount = getSpectrumBarCount();
  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    bar.className = 'org-music-dashboard__spectrum-bar';
    bar.setAttribute('role', 'presentation');
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    bar.style.setProperty('--bar-angle', `${angle}rad`);
    bar.style.setProperty('--bar-index', String(i));
    bar.style.setProperty('--bar-freq-hue', String(baseHue));
    container.appendChild(bar);
    barElements.push(bar);
  }
}

export function connectAudio(audioElement) {
  if (!audioElement || !barsContainer) return;

  disconnectAudio();

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioContext = new Ctx();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING;

    source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => startAnimation());
    } else {
      startAnimation();
    }
  } catch (e) {
    console.warn('Visualizador de espectro no disponible:', e.message);
  }
}

function startAnimation() {
  if (animationId) cancelAnimationFrame(animationId);

  function update() {
    animationId = requestAnimationFrame(update);
    if (!isPageVisible() || !analyser || !dataArray || !barElements.length) return;

    analyser.getByteFrequencyData(dataArray);

    const binCount = dataArray.length;
    let bassSum = 0, midsSum = 0, highsSum = 0;
    const bassEnd = Math.floor(binCount * 0.15);
    const midsEnd = Math.floor(binCount * 0.55);
    for (let j = 0; j < bassEnd; j++) bassSum += dataArray[j];
    for (let j = bassEnd; j < midsEnd; j++) midsSum += dataArray[j];
    for (let j = midsEnd; j < binCount; j++) highsSum += dataArray[j];
    const total = bassSum + midsSum + highsSum || 1;
    const rmsApprox = Math.min(1, (bassSum + midsSum + highsSum) / (binCount * 80));
    const centroidApprox = total > 0
      ? (bassSum * 0.15 + midsSum * 0.55 + highsSum * 1) / (bassSum + midsSum + highsSum)
      : 0.5;
    lastBandData = {
      bass: Math.min(1, (bassSum / total) * 3),
      mids: Math.min(1, (midsSum / total) * 3),
      highs: Math.min(1, (highsSum / total) * 3),
      rms: rmsApprox,
      centroid: Math.min(1, centroidApprox),
    };
    if (lastBandCallback) lastBandCallback(lastBandData);

    vizFrameCount++;
    const vizThrottle = getVisualThrottle();
    if (vizFrameCount % (vizThrottle + 1) !== 0) return;

    const barCount = barElements.length;
    const cacheKey = `${binCount}|${barCount}`;
    if (cachedBarRangesKey !== cacheKey) {
      cachedBarRanges = getBarRanges(binCount, barCount);
      cachedBarRangesKey = cacheKey;
    }
    const barRanges = cachedBarRanges;

    const sampleRate = audioContext?.sampleRate ?? 44100;
    const nyquist = sampleRate / 2;

    for (let i = 0; i < barElements.length; i++) {
      const bar = barElements[i];
      const { start, end, center } = barRanges[i];
      let sum = 0;
      for (let j = start; j < end; j++) sum += dataArray[j];
      const count = Math.max(1, end - start);
      const avg = sum / count;
      const normalized = Math.min(1, avg / 160);
      const height = 6 + normalized * 52;
      const centerFreq = (center / binCount) * nyquist;
      const hue = frequencyToHue(centerFreq, baseHue);
      bar.style.setProperty('--bar-height', `${height}px`);
      bar.style.setProperty('--bar-freq-hue', String(hue));
    }
  }
  update();
}

export function onBandData(cb) {
  lastBandCallback = cb;
}

export function getRealtimeBands() {
  return lastBandData;
}

export function disconnectAudio() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (source && audioContext) {
    try {
      source.disconnect();
    } catch (_) {}
  }
  if (analyser && audioContext) {
    try {
      analyser.disconnect();
    } catch (_) {}
  }
  if (audioContext?.state !== 'closed') {
    audioContext?.close().catch(() => {});
  }
  source = null;
  analyser = null;
  audioContext = null;
  dataArray = null;

  barElements.forEach((bar) => {
    bar.style.height = '8px';
  });
}

export function setBarColor(color) {
  if (!barsContainer) return;
  barsContainer.style.setProperty('--music-spectrum-bar-color', color);
}

/** Actualiza hue base para colores por frecuencia (sincronizado con tema) */
export function setBaseHue(hue) {
  if (typeof hue === 'number' && hue >= 0 && hue <= 360) baseHue = hue;
}

export function setSpectrumProminence(prominence) {
  if (!barsContainer) return;
  barsContainer.style.setProperty('--music-spectrum-bar-opacity', String(prominence));
}
