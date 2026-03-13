/**
 * Alineación letras ↔ audio de vídeo musical
 * Detecta intro, pausas y offset para sincronización perfecta con versiones de vídeo.
 * docs/07_timeline_synchronization.md
 *
 * Los vídeos musicales suelen tener:
 * - Intro extendida (ej. "Dance on Your Knees" antes de "Out of Touch" ~90s)
 * - Pausas instrumentales
 * - Estructura distinta a la versión álbum
 *
 * Las letras LRC suelen estar sincronizadas con la versión álbum/single.
 * Este módulo detecta el offset necesario para alinear con el audio del vídeo.
 */
import { config } from '../config.js';

const HOP_MS = config.analysis.shortWindowMs ?? 50;
const WINDOW_SAMPLES_MIN = 2048;

/**
 * Calcula RMS de una ventana de muestras
 */
function computeRms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/**
 * Encuentra el inicio de la sección principal (fin del intro).
 * Heurística: primera transición de baja energía a energía sostenida,
 * o el primer pico que sugiere cambio de sección (intro → canción).
 *
 * @param {AudioBuffer} buffer
 * @returns {{ offsetSec: number, confidence: number, method: string }}
 */
export function detectLyricAlignmentOffset(buffer) {
  const sr = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const hopSamples = Math.max(WINDOW_SAMPLES_MIN, Math.floor((sr * HOP_MS) / 1000));
  const windowSamples = hopSamples * 2;

  const rmsValues = [];
  const times = [];

  for (let i = 0; i < data.length - windowSamples; i += hopSamples) {
    const window = data.subarray(i, i + windowSamples);
    rmsValues.push(computeRms(window));
    times.push(i / sr);
  }

  if (rmsValues.length < 10) {
    return { offsetSec: 0, confidence: 0, method: 'insufficient_data' };
  }

  // Umbral: considerar "silencio" por debajo, "música" por encima
  const maxRms = Math.max(...rmsValues);
  const avgRms = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
  const silenceThreshold = Math.max(0.008, Math.min(0.03, avgRms * 0.5));
  const musicThreshold = Math.max(0.02, Math.min(0.08, avgRms * 1.2));

  // Método 1: Intro con silencio — primera vez que la energía se mantiene alta
  let firstSustainedMusic = -1;
  const sustainFrames = Math.ceil(1.5 / (HOP_MS / 1000)); // 1.5 segundos sostenidos

  for (let i = 0; i <= rmsValues.length - sustainFrames; i++) {
    const slice = rmsValues.slice(i, i + sustainFrames);
    const allAbove = slice.every((r) => r > musicThreshold);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    if (allAbove && avg > musicThreshold * 1.2) {
      firstSustainedMusic = i;
      break;
    }
  }

  if (firstSustainedMusic >= 0) {
    const offsetSec = times[firstSustainedMusic];
    const confidence = rmsValues[firstSustainedMusic] / Math.max(0.01, maxRms);
    return {
      offsetSec: Math.max(0, offsetSec - 0.5),
      confidence: Math.min(1, confidence),
      method: 'sustained_onset',
    };
  }

  // Método 2: Transición silencio → música (intro con silencio real)
  let firstAboveSilence = -1;
  for (let i = 0; i < rmsValues.length; i++) {
    if (rmsValues[i] > silenceThreshold) {
      firstAboveSilence = i;
      break;
    }
  }

  if (firstAboveSilence > 0) {
    return {
      offsetSec: Math.max(0, times[firstAboveSilence] - 0.3),
      confidence: 0.7,
      method: 'silence_to_music',
    };
  }

  // Método 3: Primer pico significativo (cambio de sección)
  let maxJumpIdx = 0;
  let maxJump = 0;
  for (let i = 5; i < rmsValues.length - 5; i++) {
    const prev = rmsValues.slice(Math.max(0, i - 5), i).reduce((a, b) => a + b, 0) / 5;
    const curr = rmsValues[i];
    const jump = curr - prev;
    if (jump > maxJump && curr > musicThreshold) {
      maxJump = jump;
      maxJumpIdx = i;
    }
  }

  if (maxJump > 0.01 && maxJumpIdx > 10) {
    return {
      offsetSec: Math.max(0, times[maxJumpIdx] - 0.5),
      confidence: Math.min(1, maxJump * 20),
      method: 'section_transition',
    };
  }

  return { offsetSec: 0, confidence: 0, method: 'no_detection' };
}

/**
 * Detecta segmentos de pausa/silencio en el audio (para time warp).
 * Útil cuando el vídeo tiene cortes o pausas que no existen en la versión álbum.
 *
 * @param {AudioBuffer} buffer
 * @param {Object} opts
 * @param {number} opts.minPauseSec - Duración mínima para considerar pausa (default 0.8)
 * @param {number} opts.silenceThreshold - RMS por debajo del cual es "silencio" (default auto)
 * @returns {{ pauses: Array<{ start: number, end: number, duration: number }> }}
 */
export function detectPauseSegments(buffer, opts = {}) {
  const minPauseSec = opts.minPauseSec ?? 0.8;
  const sr = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const hopSamples = Math.max(WINDOW_SAMPLES_MIN, Math.floor((sr * HOP_MS) / 1000));
  const windowSamples = hopSamples * 2;

  const rmsValues = [];
  const times = [];

  for (let i = 0; i < data.length - windowSamples; i += hopSamples) {
    const window = data.subarray(i, i + windowSamples);
    rmsValues.push(computeRms(window));
    times.push(i / sr);
  }

  const avgRms = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
  const silenceThreshold = opts.silenceThreshold ?? Math.max(0.006, avgRms * 0.35);

  const minFrames = Math.ceil(minPauseSec / (HOP_MS / 1000));
  const pauses = [];
  let inPause = false;
  let pauseStart = 0;

  for (let i = 0; i < rmsValues.length; i++) {
    const isSilent = rmsValues[i] < silenceThreshold;
    if (isSilent && !inPause) {
      inPause = true;
      pauseStart = i;
    } else if (!isSilent && inPause) {
      inPause = false;
      const duration = times[i] - times[pauseStart];
      if (duration >= minPauseSec) {
        pauses.push({
          start: times[pauseStart],
          end: times[i],
          duration,
        });
      }
    }
  }

  if (inPause && times.length > 0) {
    const duration = times[times.length - 1] - times[pauseStart];
    if (duration >= minPauseSec) {
      pauses.push({
        start: times[pauseStart],
        end: times[times.length - 1],
        duration,
      });
    }
  }

  return { pauses };
}

/**
 * Convierte tiempo de audio (reproductor) a tiempo de letra (LRC).
 * Las letras están sincronizadas con la versión álbum; el audio del vídeo puede tener intro.
 *
 * @param {number} audioTime - Tiempo actual del reproductor (audio del vídeo)
 * @param {number} introOffsetSec - Segundos de intro antes de la canción
 * @returns {number} Tiempo para lookup en la timeline de letras
 */
export function audioTimeToLyricTime(audioTime, introOffsetSec) {
  return Math.max(0, audioTime - introOffsetSec);
}
