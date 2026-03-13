/**
 * Motor de expresión de letra — hereda estado musical semántico
 * docs/06_lyrics_expression_engine.md
 * La letra NO reacciona al audio bruto; hereda del estado interpretado.
 */

/**
 * @typedef {Object} LyricGlobalState
 * @property {number} scale_base
 * @property {number} contrast
 * @property {number} layout_density
 * @property {number} alignment_tension
 * @property {number} transition_rhythm
 * @property {number} visual_stability
 */

/**
 * @typedef {Object} LyricLocalState
 * @property {number} line_emphasis
 * @property {number} tracking
 * @property {number} line_spacing
 * @property {number} opacity
 * @property {number} micro_displacement
 * @property {number} vibration_vs_stillness
 * @property {number} fragmentation
 * @property {number} appearance_speed
 */

function clamp(v, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Deriva estado global de letra desde semántico
 */
export function getLyricGlobalState(semantic) {
  const e = semantic.energy_level ?? 0.5;
  const t = semantic.harmonic_tension ?? 0.5;
  const d = semantic.texture_density ?? 0.5;
  const s = semantic.tonal_stability ?? 0.5;
  const emo = semantic.emotional_intensity ?? 0.5;

  return {
    scale_base: clamp(0.88 + e * 0.22 + emo * 0.08),
    contrast: clamp(0.6 + t * 0.3),
    layout_density: clamp(0.4 + d * 0.4),
    alignment_tension: clamp(t * 0.7),
    transition_rhythm: clamp(0.3 + e * 0.5),
    visual_stability: clamp(s),
  };
}

/**
 * Deriva estado local (línea activa) desde semántico
 * @param {Object} semantic
 * @param {boolean} isActive
 */
export function getLyricLocalState(semantic, isActive = true) {
  const e = semantic.energy_level ?? 0.5;
  const t = semantic.harmonic_tension ?? 0.5;
  const r = semantic.rhythmic_pressure ?? 0.5;
  const d = semantic.texture_density ?? 0.5;
  const emo = semantic.emotional_intensity ?? 0.5;

  return {
    line_emphasis: isActive ? clamp(0.85 + e * 0.25 + emo * 0.1) : clamp(0.5),
    tracking: clamp(0.9 + (1 - t) * 0.2),
    line_spacing: clamp(1 - d * 0.3, 0.7, 1.2),
    opacity: isActive ? clamp(0.9 + emo * 0.1 + e * 0.05) : clamp(0.5),
    micro_displacement: isActive ? clamp(r * 0.04, 0, 0.06) : 0,
    vibration_vs_stillness: clamp(1 - r),
    fragmentation: clamp(t * 0.2, 0, 0.3),
    appearance_speed: clamp(0.2 + e * 0.6),
  };
}

/**
 * Convierte estado de letra a CSS aplicable
 */
export function lyricStateToCss(global, local) {
  const g = global || {};
  const l = local || {};
  return {
    '--lyric-scale': g.scale_base ?? 1,
    '--lyric-contrast': g.contrast ?? 1,
    '--lyric-opacity': l.opacity ?? 1,
    '--lyric-tracking': `${l.tracking ?? 1}em`,
    '--lyric-emphasis': l.line_emphasis ?? 1,
    '--lyric-displacement': `${(l.micro_displacement ?? 0) * 100}px`,
  };
}
