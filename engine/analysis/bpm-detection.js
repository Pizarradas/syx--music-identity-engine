/**
 * Detección de BPM — web-audio-beat-detector
 * Fase B: estima tempo y offset del primer beat
 */
let beatDetectorModule = null;

async function loadBeatDetector() {
  if (beatDetectorModule) return beatDetectorModule;
  try {
    beatDetectorModule = await import('https://esm.sh/web-audio-beat-detector@8.2.35');
    return beatDetectorModule;
  } catch (e) {
    console.warn('BPM detector no disponible:', e.message);
    return null;
  }
}

/**
 * Detecta BPM y offset del primer beat
 * @param {AudioBuffer} buffer - Buffer de audio decodificado
 * @param {Object} options - { minTempo, maxTempo, offset, duration }
 * @returns {Promise<{ bpm: number, offset: number }|null>}
 */
export async function detectBPM(buffer, options = {}) {
  const { minTempo = 60, maxTempo = 180 } = options;
  const mod = await loadBeatDetector();
  if (!mod?.guess) return null;

  try {
    const result = await mod.guess(buffer, { minTempo, maxTempo });
    if (result && typeof result.bpm === 'number' && result.bpm > 0) {
      return {
        bpm: Math.round(result.bpm),
        offset: typeof result.offset === 'number' ? Math.max(0, result.offset) : 0,
      };
    }
  } catch (e) {
    console.warn('BPM detection failed:', e.message);
  }
  return null;
}
