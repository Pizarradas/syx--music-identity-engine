/**
 * Key detection — Krumhansl-Schmuckler con perfiles cromáticos
 * Fase C: detecta tonalidad y devuelve paleta asociada
 */
import { initMeyda, extractWithMeyda } from './meyda-features.js';
import { config } from '../config.js';

/** Perfiles Krumhansl-Kessler: mayor y menor (12 valores por pitch class C..B) */
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getChannelData(buffer, channel = 0) {
  return buffer.getChannelData(channel);
}

function pearsonCorrelation(a, b) {
  const n = a.length;
  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
    sumAB += a[i] * b[i];
    sumA2 += a[i] * a[i];
    sumB2 += b[i] * b[i];
  }
  const denom = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  if (denom < 1e-10) return 0;
  return (n * sumAB - sumA * sumB) / denom;
}

/**
 * Rota array circularmente
 */
function rotate(arr, n) {
  const r = ((n % 12) + 12) % 12;
  return [...arr.slice(r), ...arr.slice(0, r)];
}

/**
 * Detecta tonalidad comparando chroma agregado con perfiles K-S
 * @param {number[]} chromaProfile - 12 valores (C..B)
 * @returns {{ key: string, mode: string, confidence: number }}
 */
function detectKeyFromChroma(chromaProfile) {
  if (!chromaProfile || chromaProfile.length !== 12) return null;

  const sum = chromaProfile.reduce((a, b) => a + b, 0);
  const normalized = sum > 0 ? chromaProfile.map((v) => v / sum) : chromaProfile.map(() => 1 / 12);

  let bestKey = 'C';
  let bestMode = 'major';
  let bestCorr = -1;

  for (let shift = 0; shift < 12; shift++) {
    const rotated = rotate(normalized, -shift);
    const corrMajor = pearsonCorrelation(rotated, MAJOR_PROFILE);
    const corrMinor = pearsonCorrelation(rotated, MINOR_PROFILE);
    if (corrMajor > bestCorr) {
      bestCorr = corrMajor;
      bestKey = PITCH_NAMES[shift];
      bestMode = 'major';
    }
    if (corrMinor > bestCorr) {
      bestCorr = corrMinor;
      bestKey = PITCH_NAMES[shift];
      bestMode = 'minor';
    }
  }

  return {
    key: bestKey,
    mode: bestMode,
    confidence: Math.max(0, Math.min(1, (bestCorr + 1) / 2)),
  };
}

/**
 * Mapea tonalidad a hue base (0-360) para paleta
 * C=0, C#=30, D=60... escala cromática
 */
export function keyToHue(key, mode = 'major') {
  const idx = PITCH_NAMES.indexOf(key);
  if (idx < 0) return 260;
  const hue = idx * 30;
  return mode === 'minor' ? (hue + 15) % 360 : hue;
}

/**
 * Detecta tonalidad del buffer usando Meyda chroma
 * @param {AudioBuffer} buffer
 * @returns {Promise<{ key: string, mode: string, confidence: number, hue: number }|null>}
 */
export async function detectKey(buffer) {
  try {
    await initMeyda();
  } catch (_) {}

  const data = getChannelData(buffer);
  const sr = buffer.sampleRate;
  const fftSize = config.analysis.fftSize ?? 4096;
  const hopMs = config.analysis.shortWindowMs ?? 45;
  const hopSamples = Math.round((hopMs / 1000) * sr);

  const chromaSum = new Array(12).fill(0);
  let count = 0;
  let prevWindow = null;

  for (let pos = 0; pos + fftSize <= data.length; pos += hopSamples) {
    const window = new Float32Array(data.subarray(pos, pos + fftSize));
    const result = extractWithMeyda(window, sr, prevWindow);
    prevWindow = window;

    if (result?.chroma && Array.isArray(result.chroma) && result.chroma.length >= 12) {
      const rms = result.rms ?? 0.5;
      for (let i = 0; i < 12; i++) {
        chromaSum[i] += (result.chroma[i] ?? 0) * (0.3 + rms);
      }
      count++;
    }
  }

  if (count === 0) return null;

  const keyResult = detectKeyFromChroma(chromaSum);
  if (!keyResult) return null;

  return {
    ...keyResult,
    hue: keyToHue(keyResult.key, keyResult.mode),
  };
}
