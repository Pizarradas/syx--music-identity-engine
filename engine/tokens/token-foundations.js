/**
 * Token Foundations — semantic → design token dimensions
 * docs/24_token_foundations_schema.md
 * docs/23_musical_semantic_compiler.md
 *
 * Las foundations son propiedades abstractas de diseño, no componentes UI.
 * Pipeline: semantic → token foundations → SYX translation layer → design tokens
 */

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** Claves de Token Foundations por categoría (doc 24) */
export const TOKEN_FOUNDATION_KEYS = {
  color: ['color_temperature', 'saturation_intensity', 'contrast_level', 'accent_energy'],
  typography: ['type_weight', 'type_width', 'type_tension', 'type_expression'],
  space: ['spatial_density', 'layout_openness', 'element_spacing'],
  shape: ['shape_hardness', 'corner_roundness', 'edge_aggression'],
  motion: ['motion_speed', 'motion_smoothness', 'motion_aggression', 'motion_decay'],
  surface: ['blur_level', 'grain_level', 'shadow_depth', 'transparency'],
};

/** Todas las claves en orden */
export const ALL_FOUNDATION_KEYS = Object.values(TOKEN_FOUNDATION_KEYS).flat();

/**
 * Crea objeto de foundations vacío (valores 0.5 por defecto)
 */
export function createEmptyFoundations() {
  return Object.fromEntries(ALL_FOUNDATION_KEYS.map((k) => [k, 0.5]));
}

/**
 * Mezcla estado instantáneo con acumulado para foundations acumulativas.
 * accumulatedWeight: cuánto pesa la historia (0..t) vs el momento actual.
 * Alto = identidad estable que refleja el desarrollo de la canción.
 */
const ACCUMULATED_WEIGHT = 0.65;

function blendSemantic(instant, accumulated, key) {
  if (!accumulated?.mean || accumulated.mean[key] == null) return instant[key] ?? 0.5;
  const acc = accumulated.mean[key] ?? 0.5;
  const inst = instant[key] ?? 0.5;
  return acc * ACCUMULATED_WEIGHT + inst * (1 - ACCUMULATED_WEIGHT);
}

/**
 * Compila estado semántico musical en token foundations.
 * Si context.accumulated está presente, los tokens son acumulativos: reflejan
 * el desarrollo de la canción desde el inicio hasta el momento actual.
 * @param {Object} semantic - Variables semánticas (estado instantáneo en t)
 * @param {Object} context - { hasLyrics, keyHue, fingerprint, accumulated?: { mean } }
 * @returns {Object} Token foundations 0-1
 */
export function semanticToTokenFoundations(semantic, context = {}) {
  const acc = context.accumulated;
  const e = blendSemantic(semantic, acc, 'energy_level');
  const b = blendSemantic(semantic, acc, 'timbral_brightness');
  const t = blendSemantic(semantic, acc, 'harmonic_tension');
  const d = blendSemantic(semantic, acc, 'texture_density');
  const o = blendSemantic(semantic, acc, 'structural_openness');
  const i = blendSemantic(semantic, acc, 'emotional_intensity');
  const mon = blendSemantic(semantic, acc, 'intimacy_vs_monumentality');
  const org = blendSemantic(semantic, acc, 'organicity_vs_mechanicality');
  const tonal = blendSemantic(semantic, acc, 'tonal_stability');
  const groove = blendSemantic(semantic, acc, 'groove');
  const rhythm = blendSemantic(semantic, acc, 'rhythmic_pressure');
  const sw = blendSemantic(semantic, acc, 'spectral_width');
  const dyn = blendSemantic(semantic, acc, 'dynamic_range');
  const pulse = blendSemantic(semantic, acc, 'pulse_stability');
  const melodic = blendSemantic(semantic, acc, 'melodic_prominence');
  const drama = blendSemantic(semantic, acc, 'structural_drama');
  const roughness = blendSemantic(semantic, acc, 'timbral_roughness');

  return {
    // Color — derivado de timbre y estado armónico
    color_temperature: clamp(0.3 + b * 0.4 + (1 - sw) * 0.1),
    saturation_intensity: clamp(0.4 + e * 0.4 + dyn * 0.2),
    contrast_level: clamp(0.5 + i * 0.4 + dyn * 0.15),
    accent_energy: clamp(0.3 + rhythm * 0.4 + groove * 0.3),

    // Typography — derivado de características melódicas y estructurales
    type_weight: clamp(0.4 + e * 0.5 + i * 0.2),
    type_width: clamp(0.3 + mon * 0.5),
    type_tension: clamp(0.3 + t * 0.5 + drama * 0.2),
    type_expression: clamp(0.4 + melodic * 0.4 + i * 0.3),

    // Space — derivado de densidad musical
    spatial_density: clamp(d * 0.7 + sw * 0.2 + t * 0.3),
    layout_openness: clamp(o * 0.8 + (1 - t) * 0.3),
    element_spacing: clamp(0.4 + (1 - d) * 0.4 + o * 0.2),

    // Shape — derivado de carácter rítmico
    shape_hardness: clamp(1 - org),
    corner_roundness: clamp(org * 0.8 + groove * 0.2),
    edge_aggression: clamp(0.2 + rhythm * 0.5 + t * 0.3),

    // Motion — derivado de ritmo y dinámica
    motion_speed: clamp(0.2 + e * 0.5 + groove * 0.2),
    motion_smoothness: clamp(pulse * 0.6 + org * 0.4),
    motion_aggression: clamp(0.2 + rhythm * 0.5 + i * 0.3),
    motion_decay: clamp(0.5 + (1 - rhythm) * 0.3),

    // Surface — derivado de textura tímbrica
    blur_level: clamp((1 - b) * 0.6 + roughness * 0.2),
    grain_level: clamp(roughness * 0.7 + d * 0.3),
    shadow_depth: clamp(0.3 + t * 0.4 + (1 - o) * 0.2),
    transparency: clamp(0.4 + o * 0.4 + (1 - d) * 0.2),
  };
}

/**
 * Formato de salida estructurado (doc 24)
 */
export function formatTokenFoundationsOutput(foundations) {
  return {
    color: Object.fromEntries(
      TOKEN_FOUNDATION_KEYS.color.map((k) => [k, foundations[k] ?? 0.5])
    ),
    typography: Object.fromEntries(
      TOKEN_FOUNDATION_KEYS.typography.map((k) => [k, foundations[k] ?? 0.5])
    ),
    space: Object.fromEntries(
      TOKEN_FOUNDATION_KEYS.space.map((k) => [k, foundations[k] ?? 0.5])
    ),
    shape: Object.fromEntries(
      TOKEN_FOUNDATION_KEYS.shape.map((k) => [k, foundations[k] ?? 0.5])
    ),
    motion: Object.fromEntries(
      TOKEN_FOUNDATION_KEYS.motion.map((k) => [k, foundations[k] ?? 0.5])
    ),
    surface: Object.fromEntries(
      TOKEN_FOUNDATION_KEYS.surface.map((k) => [k, foundations[k] ?? 0.5])
    ),
  };
}
