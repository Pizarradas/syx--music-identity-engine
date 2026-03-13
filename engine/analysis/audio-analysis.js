/**
 * Motor de análisis de audio — Web Audio API + Meyda (opcional) + Web Worker
 * docs/03_audio_analysis_engine.md
 * Features: RMS, spectral centroid, rolloff, flatness, flux, band energies
 */
import { config } from '../config.js';
import { initMeyda, extractWithMeyda } from './meyda-features.js';

/** Meyda desde CDN (jsdelivr/esm.sh); fallback a análisis nativo si falla */
const USE_MEYDA = true;

/**
 * @typedef {Object} RawFeatures
 * @property {number} rms
 * @property {number} spectralCentroid
 * @property {number} spectralRolloff
 * @property {number} spectralFlatness
 */

function computeRms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

function getChannelData(buffer, channel = 0) {
  return buffer.getChannelData(channel);
}

/**
 * Usa AnalyserNode para FFT (offline)
 */
async function getSpectrumForWindow(buffer, startSample, length, fftSize) {
  const ctx = new OfflineAudioContext(1, length, buffer.sampleRate);
  const src = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, length, buffer.sampleRate);
  const ch = buffer.getChannelData(0);
  buf.getChannelData(0).set(ch.subarray(startSample, startSample + length));
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);

  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0;
  const gain = ctx.createGain();
  gain.gain.value = 1;
  src.disconnect();
  src.connect(analyser);
  analyser.connect(gain);
  gain.connect(ctx.destination);

  await ctx.startRendering();
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return Float32Array.from(data, (v) => v / 255);
}

/**
 * Analiza ventana de audio
 */
async function analyzeWindowAsync(buffer, startSample, length, fftSize) {
  const data = getChannelData(buffer);
  const samples = data.subarray(startSample, startSample + length);
  const rms = computeRms(samples);

  if (length < fftSize) {
    return { rms, spectralCentroid: 0.5, spectralRolloff: 0.5, spectralFlatness: 0.5 };
  }

  const spectrum = await getSpectrumForWindow(buffer, startSample, length, fftSize);
  const nyquist = buffer.sampleRate / 2;
  let centroidSum = 0, centroidWeight = 0;
  let totalEnergy = 0;
  let rolloffThreshold = 0;

  for (let i = 0; i < spectrum.length; i++) {
    const freq = (i / spectrum.length) * nyquist;
    const mag = spectrum[i];
    centroidSum += freq * mag;
    centroidWeight += mag;
    totalEnergy += mag;
  }
  rolloffThreshold = totalEnergy * 0.85;

  let cum = 0;
  let rolloff = 0;
  for (let i = 0; i < spectrum.length; i++) {
    cum += spectrum[i];
    if (cum >= rolloffThreshold) {
      rolloff = i / spectrum.length;
      break;
    }
  }

  let flatnessProd = 1;
  let flatnessCount = 0;
  const avg = totalEnergy / spectrum.length || 1e-10;
  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i] > 1e-10) {
      flatnessProd *= spectrum[i];
      flatnessCount++;
    }
  }
  const flatness = flatnessCount > 0
    ? Math.pow(flatnessProd, 1 / flatnessCount) / avg
    : 0.5;

  const spectralCentroid = centroidWeight > 0 ? Math.min(1, (centroidSum / centroidWeight) / nyquist) : 0.5;
  const spectralFlatness = Math.min(1, Math.max(0, isFinite(flatness) ? flatness : 0.5));

  return {
    rms,
    spectralCentroid,
    spectralRolloff: Math.min(1, rolloff),
    spectralFlatness,
  };
}

/**
 * Extrae features en Web Worker (no bloquea UI)
 */
function extractFeaturesWithWorker(buffer, fftSize, hopSamples) {
  return new Promise((resolve, reject) => {
    const data = getChannelData(buffer);
    const dataCopy = new Float32Array(data.length);
    dataCopy.set(data);
    const workerUrl = new URL('./analysis-worker.js', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'classic' });
    worker.onmessage = (e) => {
      worker.terminate();
      if (e.data.type === 'done') resolve(e.data.features);
      else reject(new Error(e.data.message || 'Worker error'));
    };
    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };
    worker.postMessage({
      type: 'analyze',
      data: dataCopy,
      fftSize,
      hopSamples,
    }, [dataCopy.buffer]);
  });
}

/**
 * Procesa AudioBuffer en ventanas.
 * Usa Worker si está disponible; si no, Meyda o análisis nativo en main thread.
 */
export async function extractFeatures(buffer, options = {}) {
  const { fftSize = config.analysis.fftSize } = options;
  const data = getChannelData(buffer);
  const sr = buffer.sampleRate;
  const hopMs = config.analysis.shortWindowMs;
  const hopSamples = Math.round((hopMs / 1000) * sr);

  const useWorker = config.analysis?.useWorker !== false;
  if (useWorker && typeof Worker !== 'undefined') {
    try {
      return await extractFeaturesWithWorker(buffer, fftSize, hopSamples);
    } catch (e) {
      console.warn('Worker no disponible, usando main thread:', e.message);
    }
  }

  const features = [];
  let pos = 0;
  let rmsPrev = 0;
  const rmsHistory = [];
  let prevWindow = null;

  if (USE_MEYDA) {
    try {
      await initMeyda();
    } catch (_) {}
  }

  while (pos + fftSize <= data.length) {
    const window = new Float32Array(data.subarray(pos, pos + fftSize));
    let meydaFeatures = null;
    if (USE_MEYDA) {
      try {
        meydaFeatures = extractWithMeyda(window, sr, prevWindow);
      } catch (_) {}
    }

    let feat;
    if (meydaFeatures) {
      rmsHistory.push(meydaFeatures.rms);
      if (rmsHistory.length > 20) rmsHistory.shift();
      const rmsMean = rmsHistory.reduce((a, b) => a + b, 0) / rmsHistory.length;
      const rmsVariance = rmsHistory.reduce((s, v) => s + (v - rmsMean) ** 2, 0) / rmsHistory.length;
      const dynamicRange = Math.min(1, Math.sqrt(rmsVariance) * 5);

      feat = {
        rms: meydaFeatures.rms,
        spectralCentroid: meydaFeatures.spectralCentroid,
        spectralRolloff: meydaFeatures.spectralRolloff,
        spectralFlatness: meydaFeatures.spectralFlatness,
        spectralFlux: meydaFeatures.spectralFlux,
        spectralSpread: meydaFeatures.spectralSpread,
        spectralKurtosis: meydaFeatures.spectralKurtosis,
        chroma: meydaFeatures.chroma,
        perceptualSharpness: meydaFeatures.perceptualSharpness,
        perceptualSpread: meydaFeatures.perceptualSpread,
        mfcc: meydaFeatures.mfcc,
        dynamicRange,
        bandBass: meydaFeatures.bandBass,
        bandMids: meydaFeatures.bandMids,
        bandHighs: meydaFeatures.bandHighs,
      };
    } else {
      const rms = computeRms(window);
      const zcr = zeroCrossingRate(window);
      const spectralCentroid = Math.min(1, zcr * 1.2);
      const spectralRolloff = Math.min(1, 0.3 + rms * 0.7);
      const spectralFlatness = Math.max(0.2, 1 - rms);
      const spectralFlux = Math.min(1, Math.abs(rms - rmsPrev) * 4);
      rmsPrev = rms;

      const third = Math.floor(fftSize / 3);
      const bass = computeRms(window.subarray(0, third));
      const mids = computeRms(window.subarray(third, third * 2));
      const highs = computeRms(window.subarray(third * 2));
      const total = bass + mids + highs || 1e-10;
      const bandBass = Math.min(1, bass / total * 3);
      const bandMids = Math.min(1, mids / total * 3);
      const bandHighs = Math.min(1, highs / total * 3);

      rmsHistory.push(rms);
      if (rmsHistory.length > 20) rmsHistory.shift();
      const rmsMean = rmsHistory.reduce((a, b) => a + b, 0) / rmsHistory.length;
      const rmsVariance = rmsHistory.reduce((s, v) => s + (v - rmsMean) ** 2, 0) / rmsHistory.length;
      const dynamicRange = Math.min(1, Math.sqrt(rmsVariance) * 5);

      feat = {
        rms,
        spectralCentroid,
        spectralRolloff,
        spectralFlatness,
        spectralFlux,
        spectralSpread: 0.5,
        spectralKurtosis: spectralFlatness,
        perceptualSharpness: 0.5,
        dynamicRange,
        bandBass,
        bandMids,
        bandHighs,
      };
    }

    features.push(feat);
    prevWindow = window;
    pos += hopSamples;
  }

  return features;
}

function zeroCrossingRate(samples) {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) crossings++;
  }
  return Math.min(1, Math.max(0, crossings / samples.length));
}

export function aggregateMediumWindow(features, windowCount = 40) {
  const out = [];
  for (let i = 0; i < features.length; i += windowCount) {
    const slice = features.slice(i, i + windowCount);
    if (slice.length === 0) break;
    const n = slice.length;
    out.push({
      rms: slice.reduce((s, f) => s + f.rms, 0) / n,
      spectralCentroid: slice.reduce((s, f) => s + f.spectralCentroid, 0) / n,
      spectralRolloff: slice.reduce((s, f) => s + f.spectralRolloff, 0) / n,
      spectralFlatness: slice.reduce((s, f) => s + f.spectralFlatness, 0) / n,
      spectralFlux: slice.reduce((s, f) => s + (f.spectralFlux ?? 0), 0) / n,
      dynamicRange: slice.reduce((s, f) => s + (f.dynamicRange ?? 0), 0) / n,
      bandBass: slice.reduce((s, f) => s + (f.bandBass ?? 0.33), 0) / n,
      bandMids: slice.reduce((s, f) => s + (f.bandMids ?? 0.33), 0) / n,
      bandHighs: slice.reduce((s, f) => s + (f.bandHighs ?? 0.33), 0) / n,
    });
  }
  return out;
}
