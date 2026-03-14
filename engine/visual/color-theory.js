/**
 * Teoría de color RYB aplicada al match música → paleta
 * docs: primarios (Y,R,B), secundarios (O,G,V), terciarios, neutros (blanco/negro)
 * Modelo: círculo cromático de 12 tonos (30° por segmento)
 * Usa culori para distancia perceptual y gamut
 */
import { deriveWeightsFromSpec } from './genre-palette-spec.js';
import { ensureMinDistance } from './color-utils.js';

/** Círculo cromático de 12 tonos — alineado con teoría del color tradicional */
export const CHROMATIC_12_TONES = [
  { hue: 0, name: 'Red' },
  { hue: 30, name: 'Red Orange' },
  { hue: 60, name: 'Yellow' },
  { hue: 90, name: 'Yellow Green' },
  { hue: 120, name: 'Green' },
  { hue: 150, name: 'Blue Green' },
  { hue: 180, name: 'Cyan' },
  { hue: 210, name: 'Blue' },
  { hue: 240, name: 'Blue Violet' },
  { hue: 270, name: 'Violet' },
  { hue: 300, name: 'Red Violet' },
  { hue: 330, name: 'Orange Red' },
];
export const HUE_STEP_12 = 30;

/**
 * Cuantiza un hue al tono más cercano del círculo de 12
 * @param {number} hue - 0-360
 * @returns {number} hue alineado a 0, 30, 60, ..., 330
 */
export function quantizeTo12Tones(hue) {
  const h = ((hue % 360) + 360) % 360;
  const step = Math.round(h / HUE_STEP_12) * HUE_STEP_12;
  return step % 360;
}

/**
 * Match ingeniero de sonido:
 * - Fundamental/key → primario
 * - Armónicos/richness → secundarios
 * - Textura/microtonalidad → terciarios
 * - Dynamic range/claridad → neutros (blanco/negro)
 *
 * Reglas de aplicación de tokens:
 * - --semantic-color-primary-ryb: CTAs, elementos dominantes (tonalidad clara)
 * - --semantic-color-secondary-1: Acentos, iconos, badges (armónicos)
 * - --semantic-color-neutral: Fondos sutiles, texto secundario
 * - --semantic-color-neutral-light: Headroom, transparencia (brightness alto)
 * - --semantic-color-neutral-dark: Compresión, densidad (brightness bajo)
 */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** RYB primarios en OKLCH (hue 0-360): Amarillo, Rojo, Azul */
export const RYB_PRIMARIES = { yellow: 60, red: 0, blue: 240 };

/** RYB secundarios: Naranja, Verde, Violeta */
export const RYB_SECONDARIES = { orange: 30, green: 150, violet: 270 };

/**
 * Clasifica un hue (0-360) en rol RYB
 * @param {number} hue
 * @returns {'primary'|'secondary'|'tertiary'}
 */
export function classifyHueRYB(hue) {
  const h = ((hue % 360) + 360) % 360;
  const distToPrimary = (target) => {
    let d = Math.abs(h - target);
    if (d > 180) d = 360 - d;
    return d;
  };
  const primaryDists = [
    { role: 'primary', d: Math.min(distToPrimary(0), distToPrimary(60), distToPrimary(240)) },
  ];
  const distPrimary = Math.min(distToPrimary(0), distToPrimary(60), distToPrimary(240));
  const distSecondary = Math.min(distToPrimary(30), distToPrimary(150), distToPrimary(270));
  if (distPrimary < 25) return 'primary';
  if (distSecondary < 25) return 'secondary';
  return 'tertiary';
}

/**
 * Hue más cercano a un primario RYB
 * @param {number} hue
 * @returns {number} 0|60|240
 */
export function snapToNearestPrimary(hue) {
  const primaries = [0, 60, 240];
  let best = primaries[0];
  let bestDist = 360;
  for (const p of primaries) {
    let d = Math.abs(((hue - p + 180) % 360) - 180);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

/**
 * Calcula pesos cromáticos. Si opts.genreSpec está presente, usa proporciones base del género
 * moduladas por semántica. Si no, usa heurísticas semánticas puras.
 * @param {Object} semantic - estado semántico 0-1
 * @param {Object} [opts] - { genreSpec, genreNeutralMix }
 */
export function computeColorWeights(semantic, opts = {}) {
  const { genreSpec } = opts;
  if (genreSpec) {
    return deriveWeightsFromSpec(genreSpec, semantic);
  }

  const tonal = semantic.tonal_stability ?? 0.5;
  const sw = semantic.spectral_width ?? 0.5;
  const density = semantic.texture_density ?? 0.5;
  const dyn = semantic.dynamic_range ?? 0.5;
  const brightness = semantic.timbral_brightness ?? 0.5;
  const tension = semantic.harmonic_tension ?? 0.5;
  const energy = semantic.energy_level ?? 0.5;
  const org = semantic.organicity_vs_mechanicality ?? 0.5;
  const melodic = semantic.melodic_prominence ?? 0.5;
  const intimacy = semantic.intimacy_vs_monumentality ?? 0.5;
  const spectralRich = semantic.spectral_richness ?? 0.5;

  const genreNeutral = opts.genreNeutralMix ?? null;
  const primaryFolk = org * melodic * 0.25;
  const primaryWeight = clamp(0.2 + tonal * 0.45 + (1 - density) * 0.25 + primaryFolk, 0.15, 0.58);
  const secondaryMech = (1 - org) * spectralRich * 0.2;
  const secondaryWeight = clamp(0.18 + sw * 0.5 + density * 0.12 + secondaryMech, 0.12, 0.5);
  const tertiaryMech = (1 - org) * density * 0.35;
  const tertiaryWeight = clamp(0.08 + density * 0.45 + (1 - tonal) * 0.25 + tertiaryMech, 0.05, 0.42);
  const neutralAcoustic = org * (1 - energy) * 0.25;
  const neutralIntimate = intimacy * dyn * 0.2;
  const neutralComputed = dyn * 0.45 + (1 - energy) * 0.25 + neutralAcoustic + neutralIntimate;
  const neutralWeight = genreNeutral != null
    ? clamp(genreNeutral * 0.7 + neutralComputed * 0.3, 0.03, 0.5)
    : clamp(neutralComputed, 0.03, 0.38);
  const compTension = tension * 0.6 + (1 - org) * 0.15;
  const complementaryWeight = clamp(compTension, 0, 0.35);
  const neutralLightRatio = clamp(0.35 + brightness * 0.45 + (1 - tension) * 0.15 + org * 0.1, 0.2, 0.85);

  const total = primaryWeight + secondaryWeight + tertiaryWeight + neutralWeight + complementaryWeight;
  const norm = total > 0 ? total : 1;
  const nNorm = neutralWeight / norm;
  const whiteWeight = nNorm * neutralLightRatio;
  const blackWeight = nNorm * (1 - neutralLightRatio);

  return {
    primaryWeight: primaryWeight / norm,
    secondaryWeight: secondaryWeight / norm,
    tertiaryWeight: tertiaryWeight / norm,
    neutralWeight: nNorm,
    whiteWeight,
    blackWeight,
    complementaryWeight: complementaryWeight / norm,
    neutralLightRatio,
  };
}

/** Umbral mínimo para mostrar segmento (evita "Otros" agregados) */
const SEGMENT_MIN = 0.02;

/** Chroma base para segmentos cromáticos; boost para amarillos/naranjas (0-60°) que se apagan con chroma baja */
const CHROMA_BASE = 0.28;
const CHROMA_WARM_BOOST = 0.12;

function chromaForHue(hue, chromaBias = 0.5) {
  const h = ((hue % 360) + 360) % 360;
  const isWarm = h <= 60 || h >= 330;
  const base = CHROMA_BASE + (isWarm ? CHROMA_WARM_BOOST : 0);
  const mod = 0.5 + chromaBias;
  const c = base * mod;
  return clamp(c, chromaBias < 0.4 ? 0.12 : 0.18, chromaBias > 0.7 ? 0.48 : 0.42);
}

/**
 * Segmentos para el gráfico de rosca: rol + peso + hue + chroma
 * opts.secondaryOffset, opts.tertiaryOffset permiten paletas por género (ej. folk: 205°, 50°)
 * opts.chromaBias: 0=opaco, 1=brillante — modula saturación de segmentos cromáticos
 */
export function computeChartSegments(semantic, hueBase, paramHues, weights, opts = {}) {
  const secOff = opts.secondaryOffset ?? 120;
  const terOff = opts.tertiaryOffset ?? 240;
  const chromaBias = opts.chromaBias ?? 0.5;
  const use12Tones = opts.quantizeTo12Tones === true;
  const q = (h) => use12Tones ? quantizeTo12Tones(h) : h;
  const hueComp = q((hueBase + 180) % 360);
  const hueSec1 = q((hueBase + secOff + 360) % 360);
  const hueTer = q((hueBase + terOff + 360) % 360);
  const hueBaseQ = q(hueBase);

  const wW = Math.max(weights.whiteWeight ?? 0, SEGMENT_MIN);
  const bW = Math.max(weights.blackWeight ?? 0, SEGMENT_MIN);

  const lightness = 0.5;
  const chromaP = chromaForHue(hueBaseQ, chromaBias);
  const chromaS = chromaForHue(hueSec1, chromaBias);
  const chromaT = chromaForHue(hueTer, chromaBias);
  const chromaC = chromaForHue(hueComp, chromaBias);
  const chromas = [chromaP, chromaS, chromaT, chromaC];
  const hues = [hueBaseQ, hueSec1, hueTer, hueComp];
  const colors = hues.map((h, i) => ({ l: lightness, c: chromas[i], h }));
  const separated = ensureMinDistance(colors, 12);
  const [hP, hS, hT, hC] = separated.map((c) => c.h);

  const segments = [
    { role: 'primary', weight: Math.max(weights.primaryWeight, SEGMENT_MIN), hue: hP, chroma: chromaP, label: 'Primario' },
    { role: 'secondary', weight: Math.max(weights.secondaryWeight, SEGMENT_MIN), hue: hS, chroma: chromaS, label: 'Secundario' },
    { role: 'tertiary', weight: Math.max(weights.tertiaryWeight, SEGMENT_MIN), hue: hT, chroma: chromaT, label: 'Terciario' },
    { role: 'complementary', weight: Math.max(weights.complementaryWeight, SEGMENT_MIN), hue: hC, chroma: chromaC, label: 'Comp.' },
    { role: 'white', weight: wW, hue: 0, chroma: 0, lightness: 0.98, label: 'Blanco' },
    { role: 'black', weight: bW, hue: 0, chroma: 0, lightness: 0.08, label: 'Negro' },
  ];

  const totalW = segments.reduce((s, seg) => s + seg.weight, 0) || 1;
  return segments.map((s) => ({ ...s, weight: s.weight / totalW }));
}
