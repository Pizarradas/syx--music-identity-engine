/**
 * Especificación de paletas por género musical
 *
 * Define para cada género:
 * - hues: primario, secundario (offset), terciario (offset)
 * Usa culori para interpolación perceptual en OKLCH
 */
import { interpolateOklch } from './color-utils.js';

/**
 * Define para cada género:
 * - weights: proporciones base (primary, secondary, tertiary, complementary, neutral)
 * - neutralLightRatio: balance blanco/negro (0.5 = 50/50)
 * - chroma, lightness: rangos base
 *
 * Las proporciones se usan como base y se modulan con variables semánticas.
 * Referencia: psicología del color + convenciones visuales por género.
 */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * @typedef {Object} GenrePaletteSpec
 * @property {number} primaryHue - Hue principal 0-360
 * @property {number} secondaryOffset - Offset del secundario (120 = triádico)
 * @property {number} tertiaryOffset - Offset del terciario (240 = triádico)
 * @property {number} primaryWeight - Peso base del primario (0-1)
 * @property {number} secondaryWeight - Peso base del secundario
 * @property {number} tertiaryWeight - Peso base del terciario
 * @property {number} complementaryWeight - Peso del complementario
 * @property {number} neutralWeight - Peso de neutros (blanco+gris+negro)
 * @property {number} neutralLightRatio - 0=negro, 1=blanco, 0.5=equilibrado
 * @property {number} chroma - Saturación base
 * @property {number} lightness - Claridad base
 * @property {number} [whiteBias] - 0-1, >0.6 favorece blanco en neutros (folk, ambient, etc.)
 * @property {number} [chromaBias] - 0=opaco/muted, 1=brillante; modula saturación por género
 * @property {string} [rationale] - Justificación breve
 */

/** Especificaciones completas por género */
export const GENRE_PALETTE_SPECS = {
  metal: {
    primaryHue: 0,
    secondaryOffset: 270,
    tertiaryOffset: 180,
    primaryWeight: 0.22,
    secondaryWeight: 0.18,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.2,
    neutralWeight: 0.2,
    neutralLightRatio: 0.25,
    chroma: 0.28,
    lightness: 0.42,
    rationale: 'Energía, oscuridad, poder → rojo/negro predominantes',
  },
  rock: {
    primaryHue: 18,
    secondaryOffset: 200,
    tertiaryOffset: 120,
    primaryWeight: 0.28,
    secondaryWeight: 0.22,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.12,
    neutralWeight: 0.2,
    neutralLightRatio: 0.45,
    chroma: 0.26,
    lightness: 0.5,
    rationale: 'Rebeldía, energía → rojo-naranja dominante',
  },
  punk: {
    primaryHue: 355,
    secondaryOffset: 60,
    tertiaryOffset: 120,
    primaryWeight: 0.35,
    secondaryWeight: 0.25,
    tertiaryWeight: 0.15,
    complementaryWeight: 0.1,
    neutralWeight: 0.15,
    neutralLightRatio: 0.5,
    chroma: 0.32,
    lightness: 0.48,
    rationale: 'Agresividad, contraste → rojo/amarillo fuerte',
  },
  grunge: {
    primaryHue: 25,
    secondaryOffset: 180,
    tertiaryOffset: 270,
    primaryWeight: 0.2,
    secondaryWeight: 0.2,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.15,
    neutralWeight: 0.25,
    neutralLightRatio: 0.35,
    chroma: 0.18,
    lightness: 0.4,
    chromaBias: 0.25,
    rationale: 'Suciedad, melancolía → tierras, verdes apagados',
  },

  electronic: {
    primaryHue: 255,
    secondaryOffset: 320,
    tertiaryOffset: 200,
    primaryWeight: 0.3,
    secondaryWeight: 0.25,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.1,
    neutralWeight: 0.15,
    neutralLightRatio: 0.55,
    chroma: 0.3,
    lightness: 0.52,
    rationale: 'Sintético, futurista → azul/magenta',
  },
  house: {
    primaryHue: 295,
    secondaryOffset: 60,
    tertiaryOffset: 180,
    primaryWeight: 0.28,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.08,
    neutralWeight: 0.18,
    neutralLightRatio: 0.6,
    chroma: 0.32,
    lightness: 0.55,
    rationale: 'Groove, diversión → magenta/amarillo',
  },
  techno: {
    primaryHue: 250,
    secondaryOffset: 280,
    tertiaryOffset: 180,
    primaryWeight: 0.28,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.1,
    neutralWeight: 0.18,
    neutralLightRatio: 0.5,
    chroma: 0.24,
    lightness: 0.48,
    rationale: 'Mecánico, frío → azul/violeta',
  },
  ambient: {
    primaryHue: 205,
    secondaryOffset: 270,
    tertiaryOffset: 170,
    primaryWeight: 0.2,
    secondaryWeight: 0.16,
    tertiaryWeight: 0.12,
    complementaryWeight: 0.03,
    neutralWeight: 0.49,
    neutralLightRatio: 0.8,
    chroma: 0.12,
    lightness: 0.54,
    whiteBias: 0.88,
    chromaBias: 0.22,
    rationale: 'Espacio, calma → azules, blanco predominante, colores opacos',
  },
  edm: {
    primaryHue: 310,
    secondaryOffset: 180,
    tertiaryOffset: 60,
    primaryWeight: 0.32,
    secondaryWeight: 0.28,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.05,
    neutralWeight: 0.15,
    neutralLightRatio: 0.6,
    chroma: 0.36,
    lightness: 0.58,
    chromaBias: 0.92,
    rationale: 'Energía, fiesta → magenta/cyan/amarillo brillantes',
  },
  synthwave: {
    primaryHue: 340,
    secondaryOffset: 180,
    tertiaryOffset: 60,
    primaryWeight: 0.3,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.06,
    neutralWeight: 0.18,
    neutralLightRatio: 0.5,
    chroma: 0.34,
    lightness: 0.56,
    chromaBias: 0.9,
    rationale: '80s synth-pop, neón → magenta/rosa/cyan vibrante',
  },

  hiphop: {
    primaryHue: 280,
    secondaryOffset: 50,
    tertiaryOffset: 200,
    primaryWeight: 0.28,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.12,
    neutralWeight: 0.18,
    neutralLightRatio: 0.5,
    chroma: 0.3,
    lightness: 0.48,
    rationale: 'Bold, urbano → magenta/naranja',
  },
  trap: {
    primaryHue: 288,
    secondaryOffset: 340,
    tertiaryOffset: 200,
    primaryWeight: 0.26,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.12,
    neutralWeight: 0.18,
    neutralLightRatio: 0.45,
    chroma: 0.24,
    lightness: 0.45,
    rationale: 'Oscuro, sintético → violeta',
  },
  rnb: {
    primaryHue: 330,
    secondaryOffset: 30,
    tertiaryOffset: 250,
    primaryWeight: 0.3,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.08,
    neutralWeight: 0.2,
    neutralLightRatio: 0.55,
    chroma: 0.26,
    lightness: 0.52,
    rationale: 'Sensual, suave → magenta/naranja',
  },
  soul: {
    primaryHue: 25,
    secondaryOffset: 200,
    tertiaryOffset: 330,
    primaryWeight: 0.28,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.08,
    neutralWeight: 0.2,
    neutralLightRatio: 0.55,
    chroma: 0.26,
    lightness: 0.5,
    rationale: 'Calidez, alma → naranja/azul',
  },

  pop: {
    primaryHue: 340,
    secondaryOffset: 60,
    tertiaryOffset: 300,
    primaryWeight: 0.32,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.05,
    neutralWeight: 0.17,
    neutralLightRatio: 0.65,
    chroma: 0.34,
    lightness: 0.58,
    chromaBias: 0.85,
    rationale: 'Brillante, alegre → rosa/amarillo',
  },
  indie: {
    primaryHue: 272,
    secondaryOffset: 120,
    tertiaryOffset: 50,
    primaryWeight: 0.26,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.22,
    complementaryWeight: 0.1,
    neutralWeight: 0.18,
    neutralLightRatio: 0.55,
    chroma: 0.22,
    lightness: 0.52,
    rationale: 'Alternativo, melancólico → violeta/verde',
  },
  alternative: {
    primaryHue: 240,
    secondaryOffset: 50,
    tertiaryOffset: 280,
    primaryWeight: 0.26,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.12,
    neutralWeight: 0.18,
    neutralLightRatio: 0.52,
    chroma: 0.24,
    lightness: 0.5,
    rationale: 'Alternativo, tensión → azul/naranja',
  },

  jazz: {
    primaryHue: 52,
    secondaryOffset: 250,
    tertiaryOffset: 30,
    primaryWeight: 0.28,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.08,
    neutralWeight: 0.2,
    neutralLightRatio: 0.5,
    chroma: 0.2,
    lightness: 0.48,
    rationale: 'Sofisticación, noche → dorado/azul',
  },
  classical: {
    primaryHue: 43,
    secondaryOffset: 220,
    tertiaryOffset: 270,
    primaryWeight: 0.26,
    secondaryWeight: 0.2,
    tertiaryWeight: 0.14,
    complementaryWeight: 0.04,
    neutralWeight: 0.36,
    neutralLightRatio: 0.72,
    chroma: 0.14,
    lightness: 0.54,
    whiteBias: 0.7,
    chromaBias: 0.32,
    rationale: 'Elegancia, profundidad → dorado/azul, blancos presentes',
  },
  opera: {
    primaryHue: 20,
    secondaryOffset: 280,
    tertiaryOffset: 0,
    primaryWeight: 0.3,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.08,
    neutralWeight: 0.2,
    neutralLightRatio: 0.55,
    chroma: 0.22,
    lightness: 0.5,
    rationale: 'Drama, lujo → rojo/violeta',
  },
  baroque: {
    primaryHue: 35,
    secondaryOffset: 250,
    tertiaryOffset: 60,
    primaryWeight: 0.28,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.06,
    neutralWeight: 0.24,
    neutralLightRatio: 0.58,
    chroma: 0.18,
    lightness: 0.48,
    rationale: 'Ornamental, dorado → ámbar/azul',
  },

  folk: {
    primaryHue: 140,
    secondaryOffset: 205,
    tertiaryOffset: 50,
    primaryWeight: 0.24,
    secondaryWeight: 0.2,
    tertiaryWeight: 0.16,
    complementaryWeight: 0.06,
    neutralWeight: 0.34,
    neutralLightRatio: 0.78,
    chroma: 0.2,
    lightness: 0.56,
    whiteBias: 0.78,
    chromaBias: 0.35,
    rationale: 'Naturaleza, calma → verde/azul/ámbar, blanco presente',
  },
  celtic: {
    primaryHue: 172,
    secondaryOffset: 140,
    tertiaryOffset: 270,
    primaryWeight: 0.22,
    secondaryWeight: 0.2,
    tertiaryWeight: 0.14,
    complementaryWeight: 0.05,
    neutralWeight: 0.39,
    neutralLightRatio: 0.82,
    chroma: 0.16,
    lightness: 0.56,
    whiteBias: 0.85,
    chromaBias: 0.28,
    rationale: 'Etéreo, místico → azul/verde/violeta, blanco predominante',
  },
  acoustic: {
    primaryHue: 130,
    secondaryOffset: 200,
    tertiaryOffset: 45,
    primaryWeight: 0.26,
    secondaryWeight: 0.22,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.05,
    neutralWeight: 0.29,
    neutralLightRatio: 0.75,
    chroma: 0.18,
    lightness: 0.58,
    whiteBias: 0.72,
    chromaBias: 0.38,
    rationale: 'Autenticidad, calidez → verde/azul/ámbar, blanco presente',
  },
  country: {
    primaryHue: 48,
    secondaryOffset: 100,
    tertiaryOffset: 30,
    primaryWeight: 0.3,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.08,
    neutralWeight: 0.18,
    neutralLightRatio: 0.55,
    chroma: 0.26,
    lightness: 0.52,
    rationale: 'Tierra, tradición → ámbar/verde',
  },
  bluegrass: {
    primaryHue: 68,
    secondaryOffset: 130,
    tertiaryOffset: 40,
    primaryWeight: 0.28,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.08,
    neutralWeight: 0.18,
    neutralLightRatio: 0.52,
    chroma: 0.28,
    lightness: 0.5,
    rationale: 'Rural, energía → ámbar/verde',
  },

  blues: {
    primaryHue: 250,
    secondaryOffset: 30,
    tertiaryOffset: 200,
    primaryWeight: 0.3,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.08,
    neutralWeight: 0.2,
    neutralLightRatio: 0.4,
    chroma: 0.2,
    lightness: 0.45,
    rationale: 'Melancolía, alma → azul/naranja',
  },
  gospel: {
    primaryHue: 25,
    secondaryOffset: 200,
    tertiaryOffset: 330,
    primaryWeight: 0.3,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.08,
    neutralWeight: 0.2,
    neutralLightRatio: 0.6,
    chroma: 0.28,
    lightness: 0.52,
    rationale: 'Elevación, calor → naranja/azul',
  },

  latin: {
    primaryHue: 48,
    secondaryOffset: 150,
    tertiaryOffset: 15,
    primaryWeight: 0.3,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.08,
    neutralWeight: 0.16,
    neutralLightRatio: 0.55,
    chroma: 0.32,
    lightness: 0.54,
    rationale: 'Energía, calor → naranja/verde',
  },
  reggae: {
    primaryHue: 95,
    secondaryOffset: 30,
    tertiaryOffset: 140,
    primaryWeight: 0.3,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.06,
    neutralWeight: 0.18,
    neutralLightRatio: 0.55,
    chroma: 0.3,
    lightness: 0.52,
    rationale: 'Relajación, naturaleza → verde/naranja',
  },
  salsa: {
    primaryHue: 8,
    secondaryOffset: 180,
    tertiaryOffset: 330,
    primaryWeight: 0.32,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.08,
    neutralWeight: 0.16,
    neutralLightRatio: 0.58,
    chroma: 0.34,
    lightness: 0.55,
    rationale: 'Fiesta, fuego → rojo/cyan',
  },
  bossa: {
    primaryHue: 72,
    secondaryOffset: 200,
    tertiaryOffset: 140,
    primaryWeight: 0.28,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.06,
    neutralWeight: 0.22,
    neutralLightRatio: 0.6,
    chroma: 0.2,
    lightness: 0.52,
    rationale: 'Suave, sofisticado → dorado/azul',
  },
  world: {
    primaryHue: 82,
    secondaryOffset: 270,
    tertiaryOffset: 140,
    primaryWeight: 0.26,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.22,
    complementaryWeight: 0.08,
    neutralWeight: 0.2,
    neutralLightRatio: 0.52,
    chroma: 0.26,
    lightness: 0.5,
    rationale: 'Diversidad, tierra → verde/violeta',
  },
  flamenco: {
    primaryHue: 10,
    secondaryOffset: 200,
    tertiaryOffset: 330,
    primaryWeight: 0.32,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.1,
    neutralWeight: 0.16,
    neutralLightRatio: 0.5,
    chroma: 0.3,
    lightness: 0.48,
    rationale: 'Pasión, fuego → rojo/azul',
  },

  funk: {
    primaryHue: 38,
    secondaryOffset: 300,
    tertiaryOffset: 180,
    primaryWeight: 0.28,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.08,
    neutralWeight: 0.18,
    neutralLightRatio: 0.58,
    chroma: 0.34,
    lightness: 0.54,
    rationale: 'Groove, diversión → dorado/magenta',
  },
  disco: {
    primaryHue: 315,
    secondaryOffset: 60,
    tertiaryOffset: 340,
    primaryWeight: 0.32,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.05,
    neutralWeight: 0.17,
    neutralLightRatio: 0.65,
    chroma: 0.36,
    lightness: 0.58,
    rationale: 'Fiesta, brillo → magenta/amarillo',
  },

  drone: {
    primaryHue: 180,
    secondaryOffset: 260,
    tertiaryOffset: 200,
    primaryWeight: 0.2,
    secondaryWeight: 0.18,
    tertiaryWeight: 0.15,
    complementaryWeight: 0.05,
    neutralWeight: 0.42,
    neutralLightRatio: 0.45,
    chroma: 0.1,
    lightness: 0.45,
    rationale: 'Minimal, espacio → teal, muchos neutros',
  },
  noise: {
    primaryHue: 0,
    secondaryOffset: 180,
    tertiaryOffset: 270,
    primaryWeight: 0.24,
    secondaryWeight: 0.22,
    tertiaryWeight: 0.18,
    complementaryWeight: 0.18,
    neutralWeight: 0.18,
    neutralLightRatio: 0.35,
    chroma: 0.18,
    lightness: 0.4,
    rationale: 'Caos, agresión → rojo/verde apagados',
  },
  minimal: {
    primaryHue: 230,
    secondaryOffset: 280,
    tertiaryOffset: 180,
    primaryWeight: 0.18,
    secondaryWeight: 0.16,
    tertiaryWeight: 0.1,
    complementaryWeight: 0.03,
    neutralWeight: 0.53,
    neutralLightRatio: 0.78,
    chroma: 0.1,
    lightness: 0.54,
    whiteBias: 0.85,
    chromaBias: 0.25,
    rationale: 'Pureza, espacio → azul, blanco predominante',
  },
  cinematic: {
    primaryHue: 210,
    secondaryOffset: 260,
    tertiaryOffset: 160,
    primaryWeight: 0.18,
    secondaryWeight: 0.16,
    tertiaryWeight: 0.1,
    complementaryWeight: 0.03,
    neutralWeight: 0.53,
    neutralLightRatio: 0.82,
    chroma: 0.1,
    lightness: 0.52,
    whiteBias: 0.9,
    chromaBias: 0.2,
    rationale: 'Orquestal, atmósfera → azul/cian, blanco predominante',
  },
  soundtrack: {
    primaryHue: 195,
    secondaryOffset: 270,
    tertiaryOffset: 150,
    primaryWeight: 0.16,
    secondaryWeight: 0.14,
    tertiaryWeight: 0.1,
    complementaryWeight: 0.02,
    neutralWeight: 0.58,
    neutralLightRatio: 0.85,
    chroma: 0.08,
    lightness: 0.5,
    whiteBias: 0.92,
    chromaBias: 0.18,
    rationale: 'Ethereal, cinematográfico → azul oscuro, blancos predominantes',
  },
  medieval: {
    primaryHue: 35,
    secondaryOffset: 220,
    tertiaryOffset: 280,
    primaryWeight: 0.24,
    secondaryWeight: 0.2,
    tertiaryWeight: 0.14,
    complementaryWeight: 0.05,
    neutralWeight: 0.37,
    neutralLightRatio: 0.68,
    chroma: 0.16,
    lightness: 0.5,
    whiteBias: 0.72,
    chromaBias: 0.3,
    rationale: 'Antiguo, atmósfera → ámbar/azul, blancos presentes',
  },
  remix: {
    primaryHue: 305,
    secondaryOffset: 180,
    tertiaryOffset: 60,
    primaryWeight: 0.3,
    secondaryWeight: 0.26,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.08,
    neutralWeight: 0.16,
    neutralLightRatio: 0.58,
    chroma: 0.34,
    lightness: 0.56,
    chromaBias: 0.88,
    rationale: 'Electrónico, vibrante → magenta/cyan brillantes',
  },
  default: {
    primaryHue: 200,
    secondaryOffset: 120,
    tertiaryOffset: 240,
    primaryWeight: 0.26,
    secondaryWeight: 0.24,
    tertiaryWeight: 0.2,
    complementaryWeight: 0.12,
    neutralWeight: 0.18,
    neutralLightRatio: 0.55,
    chroma: 0.24,
    lightness: 0.52,
    rationale: 'Balance genérico → azul/verde',
  },
};

/** Irish usa la misma spec que celtic */
const GENRE_ALIASES = { irish: 'celtic' };

/**
 * Obtiene la especificación de paleta para un género
 */
export function getGenrePaletteSpec(genre) {
  const key = GENRE_ALIASES[genre] ?? genre;
  return GENRE_PALETTE_SPECS[key] ?? GENRE_PALETTE_SPECS.default;
}

/**
 * Combina dos especificaciones según scores de afinidad
 */
export function blendGenrePaletteSpecs(genre1, genre2, score1, score2) {
  const s1 = getGenrePaletteSpec(genre1);
  const s2 = getGenrePaletteSpec(genre2);
  const total = score1 + score2 || 1;
  const w1 = score1 / total;
  const w2 = score2 / total;

  const blendNum = (a, b) => a * w1 + b * w2;
  const blendHue = (a, b) => {
    const c1 = { l: 0.5, c: 0.2, h: a };
    const c2 = { l: 0.5, c: 0.2, h: b };
    const blended = interpolateOklch(c1, c2, w2);
    return ((blended?.h ?? a) + 360) % 360;
  };

  return {
    primaryHue: blendHue(s1.primaryHue, s2.primaryHue),
    secondaryOffset: blendNum(s1.secondaryOffset, s2.secondaryOffset),
    tertiaryOffset: blendNum(s1.tertiaryOffset, s2.tertiaryOffset),
    primaryWeight: blendNum(s1.primaryWeight, s2.primaryWeight),
    secondaryWeight: blendNum(s1.secondaryWeight, s2.secondaryWeight),
    tertiaryWeight: blendNum(s1.tertiaryWeight, s2.tertiaryWeight),
    complementaryWeight: blendNum(s1.complementaryWeight, s2.complementaryWeight),
    neutralWeight: blendNum(s1.neutralWeight, s2.neutralWeight),
    neutralLightRatio: blendNum(s1.neutralLightRatio, s2.neutralLightRatio),
    chroma: blendNum(s1.chroma, s2.chroma),
    lightness: blendNum(s1.lightness, s2.lightness),
    whiteBias: blendNum(s1.whiteBias ?? 0.5, s2.whiteBias ?? 0.5),
    chromaBias: blendNum(s1.chromaBias ?? 0.5, s2.chromaBias ?? 0.5),
    genre: score1 > score2 * 1.5 ? genre1 : `${genre1}/${genre2}`,
  };
}

/**
 * Deriva pesos cromáticos desde la spec del género, modulados por semántica
 * @param {Object} spec - salida de getGenrePaletteSpec o blendGenrePaletteSpecs
 * @param {Object} semantic - variables semánticas 0-1
 * @returns {{ primaryWeight, secondaryWeight, tertiaryWeight, neutralWeight, complementaryWeight, whiteWeight, blackWeight, neutralLightRatio }}
 */
export function deriveWeightsFromSpec(spec, semantic = {}) {
  const tonal = semantic.tonal_stability ?? 0.5;
  const sw = semantic.spectral_width ?? 0.5;
  const density = semantic.texture_density ?? 0.5;
  const dyn = semantic.dynamic_range ?? 0.5;
  const brightness = semantic.timbral_brightness ?? 0.5;
  const tension = semantic.harmonic_tension ?? 0.5;
  const energy = semantic.energy_level ?? 0.5;
  const org = semantic.organicity_vs_mechanicality ?? 0.5;
  const melodic = semantic.melodic_prominence ?? 0.5;
  const mon = semantic.intimacy_vs_monumentality ?? 0.5;
  const spectralRich = semantic.spectral_richness ?? 0.5;

  const isNeutralHeavy = spec.neutralWeight >= 0.35;
  const mod = isNeutralHeavy ? 0.16 : 0.25;
  const primaryW = clamp(
    spec.primaryWeight + (tonal - 0.5) * mod + (energy - 0.5) * 0.12,
    0.12,
    0.5
  );
  const secondaryW = clamp(
    spec.secondaryWeight + (sw - 0.5) * mod * 0.8 + (spectralRich - 0.5) * 0.06,
    0.1,
    0.45
  );
  const tertiaryW = clamp(
    spec.tertiaryWeight + (density - 0.5) * mod * 0.8 - (1 - melodic) * 0.04,
    0.05,
    0.4
  );
  const compW = clamp(spec.complementaryWeight + tension * 0.15 - org * 0.05, 0, 0.35);
  const whiteBias = spec.whiteBias ?? 0.5;
  const neutralBoost = whiteBias > 0.6 ? (whiteBias - 0.5) * 0.4 : 0;
  const neutralW = clamp(
    spec.neutralWeight + (dyn - 0.5) * 0.12 + (1 - energy) * 0.12 + (1 - mon) * 0.06 + neutralBoost,
    0.05,
    0.62
  );

  const total = primaryW + secondaryW + tertiaryW + compW + neutralW;
  const norm = total > 0 ? total : 1;

  const nNorm = neutralW / norm;
  const lrBase = spec.neutralLightRatio + (brightness - 0.5) * 0.28 + (1 - tension) * 0.1 + (mon - 0.5) * 0.08;
  const lrBoost = whiteBias > 0.6 ? (whiteBias - 0.5) * 0.25 : 0;
  const neutralLR = clamp(lrBase + lrBoost, 0.2, 0.92);
  const whiteW = nNorm * neutralLR;
  const blackW = nNorm * (1 - neutralLR);

  return {
    primaryWeight: primaryW / norm,
    secondaryWeight: secondaryW / norm,
    tertiaryWeight: tertiaryW / norm,
    complementaryWeight: compW / norm,
    neutralWeight: nNorm,
    whiteWeight: whiteW,
    blackWeight: blackW,
    neutralLightRatio: neutralLR,
  };
}
