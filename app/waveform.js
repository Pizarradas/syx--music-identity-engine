/**
 * Waveform interactivo — wavesurfer.js
 * Fase C: visualización de waveform con seek
 */
let wavesurfer = null;
let wavesurferContainer = null;
let WaveSurferClass = null;
let lastWaveformTime = -1;
const WAVEFORM_UPDATE_INTERVAL_MS = 80;

/**
 * Inicializa (precarga) el módulo WaveSurfer
 */
async function ensureWaveSurfer() {
  if (WaveSurferClass) return WaveSurferClass;
  const mod = await import('https://esm.sh/wavesurfer.js@7.12.1');
  WaveSurferClass = mod.default;
  return WaveSurferClass;
}

/**
 * Carga el waveform en el contenedor
 * @param {HTMLElement} container
 * @param {string} url - blob URL o path del audio
 * @param {HTMLAudioElement} audioEl - elemento de audio (para seek)
 * @param {Function} onSeek - callback(time) al hacer click/seek
 */
export async function loadWaveform(container, url, audioEl, onSeek) {
  if (!container || !url) return null;

  destroyWaveform();

  try {
    await ensureWaveSurfer();
    wavesurfer = WaveSurferClass.create({
      container,
      url,
      media: audioEl ?? undefined,
      waveColor: 'rgba(255, 255, 255, 0.25)',
      progressColor: 'rgba(255, 255, 255, 0.6)',
      cursorColor: 'rgba(255, 255, 255, 0.5)',
      height: 48,
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      normalize: true,
    });

    if (typeof onSeek === 'function') {
      wavesurfer.on('interaction', (time) => onSeek(time));
    }

    container.classList.add('has-waveform');
    wavesurferContainer = container;
    return wavesurfer;
  } catch (e) {
    console.warn('Waveform no disponible:', e.message);
    return null;
  }
}

/**
 * Actualiza la posición del cursor (sync con audio externo)
 * Throttled para reducir trabajo en main thread
 * @param {number} time - tiempo en segundos
 */
export function setWaveformTime(time) {
  if (!wavesurfer || typeof time !== 'number') return;
  const now = Date.now();
  if (now - lastWaveformTime < WAVEFORM_UPDATE_INTERVAL_MS) return;
  lastWaveformTime = now;
  wavesurfer.setTime(time);
}

/**
 * Destruye el waveform
 */
export function destroyWaveform() {
  if (wavesurfer) {
    try {
      wavesurfer.destroy();
    } catch (_) {}
    wavesurfer = null;
    if (wavesurferContainer) {
      wavesurferContainer.classList.remove('has-waveform');
      wavesurferContainer = null;
    }
  }
}
