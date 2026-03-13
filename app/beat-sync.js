/**
 * Beat sync — Tone.js Transport + callbacks al ritmo del beat
 * Fase B: sincroniza Transport con HTML audio, dispara efectos en cada beat
 * Fase 5: pausa sync cuando pestaña oculta
 */
import { isPageVisible } from './performance-utils.js';

let Tone = null;
let syncRafId = null;
let beatCallbackId = null;
let lastBeatIndex = -1;
let beatCallbacks = new Set();
let currentUnsubscribers = [];
let currentBpm = 120;
let currentOffset = 0;
let audioElRef = null;
let cachedBeatTimes = [];
let cachedDuration = -1;

async function loadTone() {
  if (Tone) return Tone;
  try {
    const mod = await import('https://esm.sh/tone@14.8.49');
    Tone = mod.default ?? mod;
    return Tone;
  } catch (e) {
    console.warn('Tone.js no disponible:', e.message);
    return null;
  }
}

/**
 * Calcula tiempos de beat (segundos) desde BPM y offset
 */
function computeBeatTimes(bpm, offset, duration) {
  if (!bpm || bpm <= 0) return [];
  const beatInterval = 60 / bpm;
  const times = [];
  let t = offset;
  while (t < duration + 0.1) {
    if (t >= 0) times.push(t);
    t += beatInterval;
  }
  return times;
}

/**
 * Inicializa beat sync con BPM y offset
 * @param {number} bpm - Tempo detectado (default 120)
 * @param {number} offset - Offset del primer beat en segundos (default 0)
 */
export function setBPM(bpm, offset = 0) {
  currentBpm = Math.max(40, Math.min(200, bpm || 120));
  currentOffset = Math.max(0, offset);
  cachedBeatTimes = [];
  cachedDuration = -1;
}

/**
 * Suscribe callback que se ejecuta en cada beat
 * @param {(beatIndex: number, time: number) => void} cb
 * @returns {() => void} unsubscribe
 */
export function onBeat(cb) {
  if (typeof cb === 'function') beatCallbacks.add(cb);
  const unsub = () => beatCallbacks.delete(cb);
  currentUnsubscribers.push(unsub);
  return unsub;
}

/**
 * Limpia todas las suscripciones de beat (llamar al cambiar de track)
 */
export function clearBeatCallbacks() {
  currentUnsubscribers.forEach((fn) => fn());
  currentUnsubscribers = [];
}

/**
 * Dispara callbacks de beat (llamado desde el loop de actualización)
 * @param {number} currentTime - Tiempo actual del audio
 * @param {number} duration - Duración total
 */
export function checkBeat(currentTime, duration) {
  if (duration !== cachedDuration || cachedBeatTimes.length === 0) {
    cachedDuration = duration;
    cachedBeatTimes = computeBeatTimes(currentBpm, currentOffset, duration);
  }
  const beatTimes = cachedBeatTimes;
  if (beatTimes.length === 0) return;

  const threshold = 0.08;
  for (let i = 0; i < beatTimes.length; i++) {
    const bt = beatTimes[i];
    if (currentTime >= bt - threshold && currentTime < bt + threshold && i !== lastBeatIndex) {
      lastBeatIndex = i;
      beatCallbacks.forEach((cb) => {
        try {
          cb(i, currentTime);
        } catch (e) {
          console.warn('Beat callback error:', e);
        }
      });
      break;
    }
  }
  if (currentTime < beatTimes[0] - 0.5) lastBeatIndex = -1;
}

/**
 * Inicia sync de Tone.Transport con el elemento de audio (opcional)
 * @param {HTMLAudioElement} audioEl
 * @param {number} bpm
 * @param {number} offset
 */
export async function startTransportSync(audioEl, bpm = 120, offset = 0) {
  const T = await loadTone();
  if (!T) return;

  stopTransportSync();
  audioElRef = audioEl;
  setBPM(bpm, offset);

  T.Transport.bpm.value = currentBpm;
  T.Transport.seconds = 0;

  const sync = () => {
    if (!audioElRef || audioElRef.paused || !isPageVisible()) {
      syncRafId = requestAnimationFrame(sync);
      return;
    }
    T.Transport.seconds = audioElRef.currentTime;
    syncRafId = requestAnimationFrame(sync);
  };

  if (!audioEl.paused) {
    T.Transport.start();
    sync();
  }
}

/**
 * Detiene el sync de Transport
 */
export function stopTransportSync() {
  if (syncRafId) {
    cancelAnimationFrame(syncRafId);
    syncRafId = null;
  }
  if (Tone?.Transport) {
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }
  audioElRef = null;
  lastBeatIndex = -1;
}

/**
 * Obtiene BPM actual
 */
export function getBPM() {
  return currentBpm;
}
