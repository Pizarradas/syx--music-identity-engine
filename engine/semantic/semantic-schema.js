/**
 * Schema JSON para estado semántico y timeline
 * Permite exportar/importar análisis para reproducir o comparar
 */

import { SEMANTIC_KEYS } from './semantic-model.js';

/**
 * Schema del estado semántico (una ventana temporal)
 * @type {Object}
 */
export const SEMANTIC_STATE_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://syx.design/semantic-state',
  title: 'SemanticState',
  description: 'Estado semántico musical en un instante (0-1)',
  type: 'object',
  properties: SEMANTIC_KEYS.reduce((acc, k) => {
    acc[k] = { type: 'number', minimum: 0, maximum: 1, description: k };
    return acc;
  }, {}),
  additionalProperties: false,
};

/**
 * Schema del timeline completo
 * @type {Object}
 */
export const SEMANTIC_TIMELINE_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://syx.design/semantic-timeline',
  title: 'SemanticTimeline',
  description: 'Timeline de estados semánticos con metadatos',
  type: 'object',
  required: ['version', 'metadata', 'states'],
  properties: {
    version: { type: 'string', const: '1.0' },
    metadata: {
      type: 'object',
      properties: {
        duration: { type: 'number', description: 'Duración en segundos' },
        sampleRate: { type: 'number' },
        channels: { type: 'number' },
        trackName: { type: 'string' },
        hopMs: { type: 'number' },
      },
    },
    states: {
      type: 'array',
      items: {
        type: 'object',
        properties: SEMANTIC_KEYS.reduce((acc, k) => {
          acc[k] = { type: 'number', minimum: 0, maximum: 1 };
          return acc;
        }, {}),
      },
    },
    moments: {
      type: 'array',
      description: 'Puntos destacados (picos de energía, secciones)',
      items: {
        type: 'object',
        properties: {
          time: { type: 'number' },
          type: { type: 'string', enum: ['peak', 'drop', 'transition'] },
          intensity: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  },
};

/** Keys numéricos a exportar (semánticos + extendidos) */
const EXPORT_STATE_KEYS = [
  ...SEMANTIC_KEYS,
  'spectral_register', 'bass_weight', 'treble_weight',
  'transient_strength', 'chroma_strength', 'pitchiness', 'sharpness',
  'percussive_vs_pitched', 'bass_prominence', 'dominant_pitch_class',
  'spectral_richness', 'vocal_likelihood', 'bass_presence', 'pad_presence',
  'lead_presence', 'layer_complexity', 'sound_mass',
  'section_type', 'section_intensity', 'is_boundary',
];

function round3(v) {
  return typeof v === 'number' ? Math.round(v * 1000) / 1000 : v;
}

/**
 * Serializa resultado del pipeline a JSON exportable
 * Mapa completo de la canción: datos visuales entroncados con la música, listos para descarga
 * @param {Object} pipelineResult - Resultado de runPipeline
 * @param {Object} opts - { trackName, includeMoments }
 * @returns {Object}
 */
export function toExportableJson(pipelineResult, opts = {}) {
  const { trackName = '—', includeMoments = true } = opts;
  const meta = pipelineResult?.metadata || {};
  const states = pipelineResult?.semantic?.states || [];
  const summary = pipelineResult?.analysisSummary || {};
  const hopMs = 50;

  const moments = includeMoments ? detectMoments(states, meta.duration) : [];

  const timeline = states.map((s, i) => {
    const time = (i * hopMs) / 1000;
    const stateData = {};
    for (const k of EXPORT_STATE_KEYS) {
      if (s[k] !== undefined && typeof s[k] === 'number') {
        stateData[k] = round3(s[k]);
      } else if (s[k] !== undefined && typeof s[k] === 'string') {
        stateData[k] = s[k];
      } else if (s[k] !== undefined && typeof s[k] === 'boolean') {
        stateData[k] = s[k];
      }
    }
    return { time: round3(time), ...stateData };
  });

  const colorProfile = {
    primaryHue: meta.keyHue ?? 260,
    key: meta.key ?? null,
    keyMode: meta.keyMode ?? null,
    dominantRegister: summary.dominantRegister ?? 'mid',
    registerStability: summary.registerStability != null ? round3(summary.registerStability) : null,
  };

  const result = {
    version: '1.0',
    description: 'Mapa de la canción — datos visuales en tiempo real, entroncados con la música',
    metadata: {
      trackName,
      duration: meta.duration,
      sampleRate: meta.sampleRate,
      channels: meta.channels,
      bpm: meta.bpm,
      key: meta.key,
      keyMode: meta.keyMode,
      keyHue: meta.keyHue,
      hopMs,
    },
    analysisSummary: {
      dominantRegister: summary.dominantRegister,
      dominantInstrument: summary.dominantInstrument,
      avgEnergy: summary.avgEnergy != null ? round3(summary.avgEnergy) : null,
      avgTension: summary.avgTension != null ? round3(summary.avgTension) : null,
      peakEnergy: summary.peakEnergy != null ? round3(summary.peakEnergy) : null,
      avgSpectralRegister: summary.avgSpectralRegister != null ? round3(summary.avgSpectralRegister) : null,
      avgBassWeight: summary.avgBassWeight != null ? round3(summary.avgBassWeight) : null,
      avgTrebleWeight: summary.avgTrebleWeight != null ? round3(summary.avgTrebleWeight) : null,
      registerStability: summary.registerStability != null ? round3(summary.registerStability) : null,
      instrumentPresence: summary.instrumentPresence,
    },
    colorProfile,
    timeline,
    moments,
  };

  return result;
}

/**
 * Detecta momentos destacados (picos de energía)
 */
function detectMoments(states, duration) {
  if (!states.length || !duration) return [];
  const hopMs = 50;
  const e = states.map((s) => s.energy_level ?? 0.5);
  const mean = e.reduce((a, b) => a + b, 0) / e.length;
  const threshold = mean + 0.15;
  const moments = [];

  for (let i = 1; i < e.length - 1; i++) {
    if (e[i] > threshold && e[i] > e[i - 1] && e[i] > e[i + 1]) {
      const time = (i * hopMs) / 1000;
      moments.push({ time, type: 'peak', intensity: e[i] });
    }
  }

  return moments.slice(0, 20);
}
