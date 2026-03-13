/**
 * Pipeline principal — orquesta ingestión → análisis → semántico
 * docs/01_system_architecture.md
 * Soporta alineación letras ↔ audio de vídeo musical (intro, pausas)
 */
import { decodeAudioFile } from './ingestion/index.js';
import { extractFeatures, aggregateMediumWindow, analyzeStructure } from './analysis/index.js';
import { detectBPM } from './analysis/bpm-detection.js';
import { detectKey } from './analysis/key-detection.js';
import { detectLyricAlignmentOffset, detectPauseSegments } from './analysis/video-alignment.js';
import { processFeatureStream } from './semantic/index.js';
import { config } from './config.js';
import { buildSemanticTimeline } from './timeline/index.js';

/**
 * Combina segmentos de pausa detectados con override manual de config.
 * Los de config se añaden si no solapan con los detectados.
 */
function mergePauseSegments(detected, configOverride) {
  const all = [...(detected || [])];
  if (configOverride?.length) {
    for (const seg of configOverride) {
      const overlaps = all.some((d) => seg.start < d.end && seg.end > d.start);
      if (!overlaps) all.push({ start: seg.start, end: seg.end });
    }
  }
  return all.sort((a, b) => a.start - b.start);
}

/**
 * Resumen del análisis offline — estadísticas agregadas para reportes y UI
 */
function computeAnalysisSummary(semanticStates, features, { boundaries = [] }) {
  if (!semanticStates?.length) return {};
  const n = semanticStates.length;
  const avg = (key) => semanticStates.reduce((s, st) => s + (st[key] ?? 0.5), 0) / n;
  const max = (key) => Math.max(...semanticStates.map((st) => st[key] ?? 0.5));
  const sectionCount = boundaries?.length ?? 0;

  const instrumentPresence = {
    percussion: avg('percussion_presence'),
    vocal: avg('vocal_presence'),
    bass: avg('bass_presence'),
    pad: avg('pad_presence'),
    lead: avg('lead_presence'),
  };
  const dominantInstrument = Object.entries(instrumentPresence)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'vocal';

  // Fase 1: predominancia tonal (docs/28_song_map_proposal.md)
  const avgSpectralRegister = avg('spectral_register');
  const avgBassWeight = avg('bass_weight');
  const avgTrebleWeight = avg('treble_weight');
  const registerValues = semanticStates.map((st) => st.spectral_register ?? 0.5);
  const registerMean = registerValues.reduce((a, b) => a + b, 0) / n;
  const registerVariance = registerValues.reduce((s, v) => s + (v - registerMean) ** 2, 0) / n;
  const registerStd = Math.sqrt(registerVariance);
  const registerStability = Math.max(0, Math.min(1, 1 - registerStd * 2));

  let dominantRegister = 'mid';
  if (avgSpectralRegister < 0.35) dominantRegister = 'low';
  else if (avgSpectralRegister >= 0.65) dominantRegister = 'high';

  return {
    sectionCount,
    avgEnergy: avg('energy_level'),
    avgTension: avg('harmonic_tension'),
    peakEnergy: max('energy_level'),
    layerComplexity: avg('layer_complexity'),
    soundMass: avg('sound_mass'),
    instrumentPresence,
    dominantInstrument,
    avgSpectralRegister,
    avgBassWeight,
    avgTrebleWeight,
    dominantRegister,
    registerStability,
  };
}

/**
 * Ejecuta pipeline completo
 * @param {File} audioFile
 * @param {string} lyricsRaw
 * @param {string} lyricsFormat - 'lrc' | 'txt' | 'json' | 'auto'
 * @param {{ onProgress?: (p: { percent: number; stage: string }) => void }} opts
 * @returns {Promise<Object>}
 */
export async function runPipeline(audioFile, lyricsRaw, lyricsFormat = 'auto', opts = {}) {
  const { onProgress } = opts;
  const report = (percent, stage) => onProgress?.({ percent, stage });

  const ctx = new AudioContext();
  try {
    report(5, 'Decodificando audio…');
    const { buffer, metadata } = await decodeAudioFile(audioFile, ctx);
    if (ctx.state !== 'closed') ctx.close().catch(() => {});
    report(15, 'Audio decodificado');

    const lyrics = { lines: [], mode: 'none', warnings: [] };

    // Detección de alineación vídeo: intro y pausas para sincronización perfecta
    // Por defecto offset=0 (letras visibles). Solo aplica offset si config lo define explícitamente.
    // Para audio de vídeo con intro larga (ej. Out of Touch ~90s): config.lyrics.videoIntroOffsetSec = 90
    const configOverride = config.lyrics?.videoIntroOffsetSec;
    const [alignmentResult, pauseResult] = await Promise.all([
      Promise.resolve(detectLyricAlignmentOffset(buffer)),
      Promise.resolve(detectPauseSegments(buffer, { minPauseSec: 0.8 })),
    ]);
    const videoIntroOffsetSec = typeof configOverride === 'number' ? configOverride : 0;

    report(22, 'Extrayendo features…');
    const [features, bpmResult, keyResult] = await Promise.all([
      extractFeatures(buffer),
      detectBPM(buffer).catch(() => null),
      detectKey(buffer).catch(() => null),
    ]);
    report(55, 'Features extraídos');
    report(65, 'Analizando estructura…');
    const { sectionTypes, boundaries } = analyzeStructure(features, { noveltyThreshold: 0.55, minGap: 15 });
    report(75, 'Procesando semántica…');
    const semanticStates = processFeatureStream(features);
    for (let i = 0; i < semanticStates.length; i++) {
      const st = sectionTypes[i];
      if (st) {
        semanticStates[i].section_type = st.section_type;
        semanticStates[i].section_intensity = st.section_intensity;
        semanticStates[i].is_boundary = st.is_boundary;
      }
    }
    report(88, 'Construyendo timeline…');
    const semanticTimeline = buildSemanticTimeline(semanticStates);

    report(95, 'Resumiendo análisis…');
    const analysisSummary = computeAnalysisSummary(semanticStates, features, { boundaries });
    if (keyResult?.key) analysisSummary.key = keyResult.key;
    if (keyResult?.mode) analysisSummary.keyMode = keyResult.mode;
    if (bpmResult?.bpm) analysisSummary.bpm = bpmResult.bpm;

    report(100, 'Listo');

    return {
      analysisSummary,
      metadata: {
        duration: metadata.duration,
        sampleRate: metadata.sampleRate,
        channels: metadata.channels,
        bpm: bpmResult?.bpm ?? null,
        beatOffset: bpmResult?.offset ?? 0,
        key: keyResult?.key ?? null,
        keyMode: keyResult?.mode ?? null,
        keyConfidence: keyResult?.confidence ?? null,
        keyHue: keyResult?.hue ?? null,
        videoIntroOffsetSec,
        videoAlignmentConfidence: alignmentResult.confidence,
        videoAlignmentMethod: alignmentResult.method,
        pauseSegments: mergePauseSegments(pauseResult.pauses, config.lyrics?.pauseSegments),
      },
      lyrics: {
        lines: lyrics.lines,
        mode: lyrics.mode,
        warnings: lyrics.warnings,
      },
      features: {
        raw: features,
        medium: aggregateMediumWindow(features),
      },
      semantic: {
        states: semanticStates,
        timeline: semanticTimeline,
      },
      getStateAtTime: (t) => {
        const hopMs = config.analysis.shortWindowMs;
        const idx = Math.min(
          Math.floor((t * 1000) / hopMs),
          semanticStates.length - 1
        );
        const state = semanticStates[Math.max(0, idx)];
        return {
          time: t,
          semantic: state,
        };
      },
    };
  } finally {
    if (ctx.state !== 'closed') ctx.close().catch(() => {});
  }
}
