/**
 * Modelo semántico musical — features → variables 0-1
 * docs/04_semantic_music_model.md
 * docs/22_advanced_musical_analysis.md
 * docs/23_harmonic_and_melodic_model.md
 * docs/24_instrumentation_and_texture_model.md
 * docs/25_structural_music_intelligence.md
 * Fase 2: smoothing adaptativo — transientes más rápidos, tonales más suaves
 */
import { config } from '../config.js';

const alphaBase = config.semantic.smoothingAlpha;

/** Alpha por variable: valores más bajos = transiciones más fluidas, "respiración" más sutil */
const ALPHA_MAP = {
  energy_level: 0.16,
  pulse_stability: 0.14,
  rhythmic_pressure: 0.15,
  emotional_intensity: 0.13,
  dynamic_range: 0.14,
  timbral_brightness: 0.05,
  harmonic_tension: 0.06,
  tonal_stability: 0.04,
  spectral_width: 0.05,
  timbral_roughness: 0.07,
  texture_density: 0.08,
  organicity_vs_mechanicality: 0.06,
  groove: 0.10,
  structural_openness: 0.07,
  intimacy_vs_monumentality: 0.09,
  groove_density: 0.10,
  melodic_prominence: 0.06,
  structural_drama: 0.08,
  percussion_presence: 0.13,
  vocal_presence: 0.07,
};

/**
 * Variables semánticas (0-1)
 * @typedef {Object} SemanticState
 */
export const SEMANTIC_KEYS = [
  'energy_level',
  'pulse_stability',
  'rhythmic_pressure',
  'timbral_brightness',
  'timbral_roughness',
  'harmonic_tension',
  'tonal_stability',
  'texture_density',
  'structural_openness',
  'emotional_intensity',
  'intimacy_vs_monumentality',
  'organicity_vs_mechanicality',
  'groove',
  'spectral_width',
  'dynamic_range',
  'groove_density',
  'melodic_prominence',
  'structural_drama',
  'percussion_presence',
  'vocal_presence',
];

/**
 * Crea estado semántico inicial (todos 0.5)
 */
export function createInitialState() {
  return Object.fromEntries(SEMANTIC_KEYS.map((k) => [k, 0.5]));
}

/**
 * Aplica smoothing exponencial con alpha adaptativo por variable
 */
function smooth(current, target, key) {
  const a = ALPHA_MAP[key] ?? alphaBase;
  return current + a * (target - current);
}

/**
 * Mapea raw features a variables semánticas
 */
function featuresToSemantic(features) {
  const rms = Math.min(1, features.rms * 10);
  const centroid = features.spectralCentroid ?? 0.5;
  const rolloff = features.spectralRolloff ?? 0.5;
  const flatness = features.spectralFlatness ?? 0.5;
  const flux = Math.min(1, (features.spectralFlux ?? 0) * 2);
  const spread = features.spectralSpread ?? 0.5;
  const kurtosis = features.spectralKurtosis ?? 0.5;
  const dynRange = Math.min(1, features.dynamicRange ?? 0.5);
  const bandBass = features.bandBass ?? 0.33;
  const bandMids = features.bandMids ?? 0.33;
  const bandHighs = features.bandHighs ?? 0.33;
  const perceptualSharpness = features.perceptualSharpness ?? 0.5;
  const chroma = features.chroma;
  const zcr = features.zcr ?? 0.5;
  const perceptualSpread = features.perceptualSpread ?? 0.5;
  const mfcc = features.mfcc;

  const chromaStrength = Array.isArray(chroma) && chroma.length > 0
    ? Math.min(1, Math.max(...chroma) * 1.2)
    : flatness * 0.7 + centroid * 0.3;
  const pitchiness = Math.min(1, (kurtosis ?? 0.5) * 0.8 + flatness * 0.2);
  const transientStrength = Math.min(1, (flux ?? 0) * 1.5);
  const sharpness = perceptualSharpness;
  const percussiveVsPitched = Math.min(1, (1 - pitchiness) * 0.6 + (1 - spread) * 0.2 + (zcr != null ? Math.abs(zcr - 0.5) * 1.2 : 0.3));
  const bassProminence = Math.min(1, bandBass * 1.5);
  const dominantPitchClass = Array.isArray(chroma) && chroma.length >= 12
    ? chroma.reduce((best, v, i) => (v > (chroma[best] ?? 0) ? i : best), 0)
    : -1;
  const spectralRichness = Math.min(1, perceptualSpread * 0.8 + spread * 0.2);
  const vocalLikelihood = Array.isArray(mfcc) && mfcc.length >= 5
    ? Math.min(1, 0.3 + (Math.abs(mfcc[2] ?? 0) + Math.abs(mfcc[3] ?? 0) + Math.abs(mfcc[4] ?? 0)) / 40)
    : bandMids * 0.6 + flatness * 0.2 + centroid * 0.2;

  // Groove: combinación de ritmo estable + algo de variación (flux moderado)
  const groove = Math.min(1, rms * 0.6 + (1 - flux) * 0.3 + Math.abs(bandBass - 0.33) * 2);
  // Spectral width: spread real (Meyda) o aproximación por bandas
  const spectralWidth = Math.min(1, (spread ?? 0.5) * 0.5 + Math.abs(bandBass - bandHighs) * 1.2 + centroid * 0.2);

  // docs/22-25: variables extendidas (heurísticas hasta MIR completo)
  const grooveDensity = groove * 0.8 + (1 - flatness) * 0.2;
  const melodicProminence = flatness * 0.7 + centroid * 0.3 + pitchiness * 0.2 + chromaStrength * 0.15;
  const structuralDrama = dynRange * 0.6 + rms * 0.4;
  const percussionPresence = flux * 0.5 + (1 - flatness) * 0.3 + bandBass * 0.2 + transientStrength * 0.2 + percussiveVsPitched * 0.15;
  const vocalPresence = bandMids * 0.5 + flatness * 0.3 + centroid * 0.2 + chromaStrength * 0.1 + vocalLikelihood * 0.2;
  const bassPresence = bassProminence;
  const padPresence = Math.min(1, flatness * 0.6 + spread * 0.4 + (1 - sharpness) * 0.3);
  const leadPresence = Math.min(1, melodicProminence * 0.6 + centroid * 0.4 + chromaStrength * 0.2);
  const bandSpread = Math.abs(bandBass - 0.33) + Math.abs(bandMids - 0.33) + Math.abs(bandHighs - 0.33);
  const layerComplexity = Math.min(1, spectralRichness * 0.4 + bandSpread * 0.8 + (1 - flatness) * 0.3);
  const soundMass = Math.min(1, rms * 0.5 + bandBass * 0.4 + (1 - centroid) * 0.3);

  // Fase 1: predominancia tonal (docs/28_song_map_proposal.md)
  // spectral_register: 0 = graves, 0.5 = equilibrado, 1 = agudos
  const highVsLowRatio = (bandBass + bandHighs) > 0.01
    ? bandHighs / (bandBass + 0.01)
    : 1;
  const spectralRegister = Math.min(1, Math.max(0,
    centroid * 0.55 + (highVsLowRatio / (1 + highVsLowRatio)) * 0.45
  ));
  const bassWeight = Math.min(1, bandBass * 1.5);
  const trebleWeight = Math.min(1, bandHighs * 1.5);

  return {
    energy_level: rms,
    pulse_stability: Math.min(1, 0.4 + (1 - flux) * 0.5),
    rhythmic_pressure: rms * 0.7 + flux * 0.3,
    timbral_brightness: centroid,
    timbral_roughness: Math.min(1, (1 - flatness) * 0.7 + perceptualSharpness * 0.3),
    harmonic_tension: (1 - rolloff) * 0.5 + rms * 0.3 + flux * 0.2,
    tonal_stability: Math.min(1, flatness * 0.7 + (kurtosis ?? 0.5) * 0.3),
    texture_density: rms * 0.5 + (1 - flatness) * 0.3 + (bandMids + bandHighs) * 0.2,
    structural_openness: Math.min(1, 0.3 + dynRange * 0.7),
    emotional_intensity: rms * 0.6 + (1 - flatness) * 0.2 + dynRange * 0.2,
    intimacy_vs_monumentality: 0.5 + (rms - 0.5) * 0.4 + (bandBass - 0.33) * 0.5,
    organicity_vs_mechanicality: flatness,
    groove,
    spectral_width: spectralWidth,
    dynamic_range: dynRange,
    groove_density: grooveDensity,
    melodic_prominence: melodicProminence,
    structural_drama: structuralDrama,
    percussion_presence: percussionPresence,
    vocal_presence: vocalPresence,
    transient_strength: transientStrength,
    chroma_strength: chromaStrength,
    pitchiness,
    sharpness,
    percussive_vs_pitched: percussiveVsPitched,
    bass_prominence: bassProminence,
    dominant_pitch_class: dominantPitchClass,
    spectral_richness: spectralRichness,
    vocal_likelihood: vocalLikelihood,
    bass_presence: bassPresence,
    pad_presence: padPresence,
    lead_presence: leadPresence,
    layer_complexity: layerComplexity,
    sound_mass: soundMass,
    spectral_register: spectralRegister,
    bass_weight: bassWeight,
    treble_weight: trebleWeight,
  };
}

/**
 * Procesa stream de features y devuelve stream de estados semánticos suavizados
 */
export function processFeatureStream(features, initialState = null) {
  const state = initialState || createInitialState();
  const result = [];

  for (const f of features) {
    const target = featuresToSemantic(f);
    const next = {};
    for (const k of SEMANTIC_KEYS) {
      next[k] = smooth(state[k], target[k], k);
      state[k] = next[k];
    }
    next.transient_strength = target.transient_strength;
    next.chroma_strength = target.chroma_strength;
    next.pitchiness = target.pitchiness;
    next.sharpness = target.sharpness;
    next.percussive_vs_pitched = target.percussive_vs_pitched;
    next.bass_prominence = target.bass_prominence;
    next.dominant_pitch_class = target.dominant_pitch_class;
    next.spectral_richness = target.spectral_richness;
    next.vocal_likelihood = target.vocal_likelihood;
    next.bass_presence = target.bass_presence;
    next.pad_presence = target.pad_presence;
    next.lead_presence = target.lead_presence;
    next.layer_complexity = target.layer_complexity;
    next.sound_mass = target.sound_mass;
    next.spectral_register = target.spectral_register;
    next.bass_weight = target.bass_weight;
    next.treble_weight = target.treble_weight;
    result.push({ ...next });
  }

  return result;
}
