/**
 * Visualización guiada por datos — reglas matemáticas y geométricas
 * Cada elemento visual deriva de features/estado semántico.
 * docs: coherencia algoritmo ↔ visualización
 */

/** Proporción áurea */
const PHI = 1.618033988749895;

/** Intervalos musicales (ratios) para escalas geométricas */
const INTERVALS = {
  unison: 1,
  octave: 2,
  fifth: 3 / 2,
  fourth: 4 / 3,
  majorThird: 5 / 4,
};

/**
 * Frecuencia (Hz) → hue (0-360)
 * Escala cromática: 12 semitonos = 30° cada uno
 * A4=440Hz como referencia; log-scale para frecuencias
 */
export function frequencyToHue(freqHz, baseHue = 260) {
  if (!freqHz || freqHz < 20) return baseHue;
  const A4 = 440;
  const semitones = 12 * Math.log2(freqHz / A4);
  const hueStep = 30;
  const hue = (baseHue + (semitones % 12) * hueStep + 360) % 360;
  return hue;
}

/**
 * Índice de bin FFT (0..binCount) → frecuencia central
 */
export function binIndexToFrequency(binIndex, binCount, sampleRate) {
  const nyquist = sampleRate / 2;
  return (binIndex / binCount) * nyquist;
}

/**
 * Bandas espectrales → colores HSL
 * bass=rojo/ámbar, mids=verde/amarillo, highs=azul/violeta
 */
export function bandsToHues(bandBass, bandMids, bandHighs, baseHue = 260) {
  const hueBass = (baseHue + 30) % 360;
  const hueMids = (baseHue + 120) % 360;
  const hueHighs = (baseHue + 250) % 360;
  return {
    bass: hueBass,
    mids: hueMids,
    highs: hueHighs,
    blend: (bandBass * hueBass + bandMids * hueMids + bandHighs * hueHighs)
      / (bandBass + bandMids + bandHighs + 1e-6),
  };
}

/**
 * Vibraciones superpuestas — cada banda genera una onda
 * Amplitud = nivel banda. Frecuencia = ratio musical (bass lento, highs rápido)
 */
export function getSuperposedVibration(t, bandBass, bandMids, bandHighs) {
  const freqBass = 0.4;
  const freqMids = 1.6;
  const freqHighs = 4.0;
  const v = bandBass * Math.sin(2 * Math.PI * freqBass * t)
    + bandMids * Math.sin(2 * Math.PI * freqMids * t + 0.5)
    + bandHighs * Math.sin(2 * Math.PI * freqHighs * t + 1);
  return v / 3;
}

/**
 * Radios de anillos según proporción áurea
 * r_n = r0 * PHI^n
 */
export function goldenRatioRadii(baseRadius, count = 5) {
  return Array.from({ length: count }, (_, i) => baseRadius * Math.pow(PHI, i * 0.5));
}

/**
 * Escala de intervalos musicales para tamaños
 */
export function intervalScale(baseSize, count = 6) {
  const ratios = [1, INTERVALS.fourth, INTERVALS.fifth, INTERVALS.octave, INTERVALS.octave * INTERVALS.fifth];
  return Array.from({ length: count }, (_, i) => baseSize * (ratios[i] ?? Math.pow(2, i / 3)));
}

/**
 * Estado semántico acumulativo desde 0 hasta endIndex.
 * Los tokens deben reflejar cómo se ha desarrollado la canción hasta ese momento.
 * Usa media ponderada con decaimiento exponencial: momentos recientes pesan más,
 * pero toda la historia contribuye a la "identidad matemática" del track.
 * @param {Array<Object>} semanticStates - Estados semánticos del pipeline
 * @param {number} endIndex - Índice final (inclusive)
 * @param {{ decay?: number }} opts - decay: 0.002 = mucha memoria, 0.02 = poca
 * @returns {{ mean: Object, weights: number[] } | null}
 */
export function computeAccumulatedStateUpTo(semanticStates, endIndex, opts = {}) {
  if (!semanticStates?.length || endIndex < 0) return null;
  const end = Math.min(endIndex, semanticStates.length - 1);
  const decay = opts.decay ?? 0.008;
  const slice = semanticStates.slice(0, end + 1);
  const n = slice.length;
  const keys = Object.keys(slice[0] || {});

  const weights = slice.map((_, i) => Math.exp(-decay * (n - 1 - i)));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const normWeights = weights.map((w) => w / sumW);

  const mean = {};
  for (const k of keys) {
    mean[k] = slice.reduce((s, s0, i) => s + (s0[k] ?? 0.5) * normWeights[i], 0);
  }

  return { mean, weights: normWeights };
}

/**
 * Fingerprint del track — media semántica para hue base y saturación.
 * Por defecto usa los primeros 60 estados (intro); con sampleCount='all' usa toda la canción.
 * @param {Array<Object>} semanticStates
 * @param {number|'all'} sampleCount - 60 por defecto, 'all' para canción completa
 */
export function computeTrackFingerprint(semanticStates, sampleCount = 60) {
  if (!semanticStates?.length) return null;
  const useAll = sampleCount === 'all' || sampleCount === Infinity;
  const n = useAll ? semanticStates.length : Math.min(sampleCount, semanticStates.length);
  const slice = semanticStates.slice(0, n);
  const keys = Object.keys(slice[0] || {});

  const mean = {};
  for (const k of keys) {
    mean[k] = slice.reduce((s, s0) => s + (s0[k] ?? 0.5), 0) / n;
  }

  const energy = mean.energy_level ?? 0.5;
  const brightness = mean.timbral_brightness ?? 0.5;
  const tension = mean.harmonic_tension ?? 0.5;
  const org = mean.organicity_vs_mechanicality ?? 0.5;
  const rhythm = mean.rhythmic_pressure ?? 0.5;
  const groove = mean.groove ?? 0.5;
  const density = mean.texture_density ?? 0.5;
  const bassW = mean.bass_weight ?? 0.33;
  const trebleW = mean.treble_weight ?? 0.33;

  const organicWarm = Math.max(0, org * (1.2 - brightness * 0.5));
  const mechanicalCool = Math.max(0, (1 - org) * brightness * 1.2);
  const percussiveMagenta = Math.max(0, (rhythm + groove) * 0.6);
  const denseDark = Math.max(0, density * (1.2 - brightness * 0.4));
  const energyWarm = Math.max(0, energy * 0.8);

  const profiles = [
    { score: organicWarm, hue: 35 },
    { score: mechanicalCool, hue: 210 },
    { score: percussiveMagenta, hue: 330 },
    { score: denseDark, hue: 145 },
    { score: energyWarm, hue: 15 },
  ];
  profiles.sort((a, b) => b.score - a.score);
  const dominant = profiles[0];
  const secondary = profiles[1];

  let hueSeed = dominant.score > 0.1 ? dominant.hue : 200;
  if (secondary && secondary.score > 0.15) {
    hueSeed = hueSeed * 0.7 + secondary.hue * 0.3;
  }
  const spectralBias = (bassW - trebleW) * 60;
  hueSeed = (hueSeed + spectralBias + 360) % 360;

  const satSeed = 0.25 + energy * 0.5 + (1 - tension) * 0.25 + (rhythm + groove) * 0.1;

  return {
    hueBase: Math.max(0, Math.min(360, hueSeed)),
    satBase: Math.max(0.25, Math.min(0.85, satSeed)),
    mean,
  };
}

/**
 * Parámetros geométricos para el dashboard según estado semántico
 * Proporción áurea aplicada a radios base 100, 140, 180
 */
export function getGeometricParams(semantic) {
  const openness = semantic.structural_openness ?? 0.5;
  const org = semantic.organicity_vs_mechanicality ?? 0.5;

  const base = 90 + openness * 30;
  const radii = [
    base,
    base * Math.pow(PHI, 0.35),
    base * Math.pow(PHI, 0.7),
  ];

  return {
    radii,
    ringCount: 3,
    baseRadius: base,
    angularSpread: Math.PI * (0.5 + openness * 0.5),
    organicity: org,
  };
}
