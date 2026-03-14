/**
 * SYX Music Identity Engine — Configuración central
 * docs/08_configuration_system.md
 */
export const config = {
  ingestion: {
    audio: {
      maxSizeMb: 150,
      maxDurationSec: 600,
      mimeTypes: ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm'],
    },
    lyrics: {
      maxSizeKb: 256,
    },
  },
  analysis: {
    shortWindowMs: 45,
    mediumWindowMs: 2200,
    longWindowMs: 15000,
    fftSize: 4096,
    smoothingTimeConstant: 0.8,
    /**
     * true = Worker (rápido, sin Meyda): solo RMS, ZCR, bandas, flux aproximado.
     * false = main thread con Meyda: chroma, MFCC, perceptualSpread, spectral real.
     * Con Worker: vocal_presence, harmonic_tension usan fallbacks heurísticos.
     */
    useWorker: true,
  },
  semantic: {
    smoothingAlpha: 0.05,
    energyWeight: 1,
    timbralWeight: 1,
    tensionWeight: 1,
  },
  lyrics: {
    /** Offset en ms: positivo = retrasa el cambio, negativo = adelanta (muestra letra antes) */
    switchDelayMs: -120,
    /**
     * Offset de intro para audio de vídeo musical (segundos).
     * Las letras LRC suelen estar sincronizadas con la versión álbum.
     * Si el audio viene del vídeo (ej. intro extendida ~90s),
     * indica cuántos segundos de intro tiene el vídeo.
     * null = auto-detección; número = override manual.
     */
    videoIntroOffsetSec: null,
    /**
     * Segmentos de pausa (puentes instrumentales): durante estos intervalos
     * el tiempo de letras se congela para no avanzar.
     * Por defecto vacío: el pipeline detecta automáticamente con detectPauseSegments().
     * Override manual: [{ start: 197, end: 210 }] para casos donde la detección falle.
     */
    pauseSegments: [],
  },
};
