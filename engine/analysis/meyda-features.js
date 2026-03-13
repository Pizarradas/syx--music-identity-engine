/**
 * Wrapper de Meyda — features espectrales avanzados
 * Usa Meyda cuando está disponible; fallback a null para lógica existente
 * docs: https://meyda.js.org/audio-features.html
 */
let meydaModule = null;

const MEYDA_FEATURES = [
  'rms',
  'zcr',
  'spectralCentroid',
  'spectralRolloff',
  'spectralFlatness',
  'spectralFlux',
  'spectralSpread',
  'spectralKurtosis',
  'chroma',
  'perceptualSharpness',
  'perceptualSpread',
  'mfcc',
];

const MEYDA_CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/meyda@5.6.3/+esm',
  'https://esm.sh/meyda@5.6.3',
  'https://cdn.jsdelivr.net/npm/meyda@5.2.0/+esm',
  'https://esm.sh/meyda@5.2.0',
];

/**
 * Carga Meyda dinámicamente (ESM desde CDN, varios fallbacks)
 * @returns {Promise<object|null>} Meyda o null si falla
 */
async function loadMeyda() {
  if (meydaModule) return meydaModule;
  for (const url of MEYDA_CDN_URLS) {
    try {
      const mod = await import(/* @vite-ignore */ url);
      const M = mod?.default ?? mod?.Meyda ?? mod;
      if (M && typeof M.extract === 'function') {
        meydaModule = M;
        return meydaModule;
      }
    } catch (e) {
      continue;
    }
  }
  console.warn('Meyda no disponible desde ningún CDN, usando análisis nativo');
  meydaModule = null;
  return null;
}

/**
 * Comprueba si n es potencia de 2
 */
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Extrae features de una ventana usando Meyda
 * @param {Float32Array} samples - Muestras de audio (debe ser potencia de 2, ej. 2048)
 * @param {number} sampleRate
 * @param {Float32Array} prevSamples - Ventana anterior para spectralFlux (opcional)
 * @returns {Object|null} Features normalizados 0-1 o null
 */
export function extractWithMeyda(samples, sampleRate, prevSamples = null) {
  const Meyda = meydaModule?.default ?? meydaModule ?? (typeof window !== 'undefined' && window.Meyda);
  if (!Meyda || typeof Meyda.extract !== 'function' || !isPowerOfTwo(samples.length)) return null;

  let raw;
  try {
    Meyda.bufferSize = samples.length;
    Meyda.sampleRate = sampleRate;
    raw = Meyda.extract(MEYDA_FEATURES, samples, prevSamples || undefined);
  } catch (e) {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;

  const bufferSize = samples.length;
  const nyquist = sampleRate / 2;

  const rms = Math.min(1, (raw.rms ?? 0) * 10);
  const zcr = raw.zcr != null ? Math.min(1, raw.zcr / (bufferSize / 2)) : 0.5;
  const centroid = raw.spectralCentroid != null
    ? Math.min(1, raw.spectralCentroid / nyquist)
    : 0.5;
  const rolloff = raw.spectralRolloff != null
    ? Math.min(1, raw.spectralRolloff / nyquist)
    : 0.5;
  const flatness = Math.min(1, Math.max(0, raw.spectralFlatness ?? 0.5));
  const flux = Math.min(1, (raw.spectralFlux ?? 0) * 2);
  const spread = raw.spectralSpread != null
    ? Math.min(1, raw.spectralSpread / (bufferSize / 2))
    : 0.5;
  const kurtosis = Math.min(1, Math.max(0, raw.spectralKurtosis ?? 0.5));

  let chroma = null;
  if (Array.isArray(raw.chroma) && raw.chroma.length > 0) {
    chroma = raw.chroma.map((v) => Math.min(1, Math.max(0, v ?? 0)));
  }
  const perceptualSharpness = raw.perceptualSharpness != null
    ? Math.min(1, Math.max(0, raw.perceptualSharpness))
    : 0.5;
  const perceptualSpread = raw.perceptualSpread != null
    ? Math.min(1, Math.max(0, raw.perceptualSpread))
    : 0.5;
  let mfcc = null;
  if (Array.isArray(raw.mfcc) && raw.mfcc.length > 0) {
    mfcc = raw.mfcc.map((v) => (typeof v === 'number' ? v : 0));
  }

  let ampSpectrum = null;
  try {
    ampSpectrum = Meyda.extract(['amplitudeSpectrum'], samples)?.amplitudeSpectrum;
  } catch (_) {}
  let bandBass = 0.33, bandMids = 0.33, bandHighs = 0.33;
  if (ampSpectrum && ampSpectrum.length > 0) {
    const len = ampSpectrum.length;
    const bassEnd = Math.floor(len * 0.15);
    const midsEnd = Math.floor(len * 0.55);
    let sBass = 0, sMids = 0, sHighs = 0;
    for (let i = 0; i < bassEnd; i++) sBass += ampSpectrum[i];
    for (let i = bassEnd; i < midsEnd; i++) sMids += ampSpectrum[i];
    for (let i = midsEnd; i < len; i++) sHighs += ampSpectrum[i];
    const total = sBass + sMids + sHighs || 1;
    bandBass = Math.min(1, (sBass / total) * 3);
    bandMids = Math.min(1, (sMids / total) * 3);
    bandHighs = Math.min(1, (sHighs / total) * 3);
  }

  return {
    rms,
    spectralCentroid: centroid,
    spectralRolloff: rolloff,
    spectralFlatness: flatness,
    spectralFlux: flux,
    spectralSpread: spread,
    spectralKurtosis: kurtosis,
    chroma,
    perceptualSharpness,
    perceptualSpread,
    mfcc,
    bandBass,
    bandMids,
    bandHighs,
    zcr,
  };
}

/**
 * Inicializa Meyda para uso en el pipeline (precarga)
 * Llamar antes de extractFeatures si se quiere Meyda
 */
export async function initMeyda() {
  return loadMeyda();
}

/**
 * Indica si Meyda está disponible
 */
export function isMeydaAvailable() {
  return !!meydaModule;
}
