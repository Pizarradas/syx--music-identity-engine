/**
 * Paletas base por género — especificación + modulación
 *
 * Pipeline de asignación de color:
 * 1. detectGenreAffinity(semantic) → scores por género
 * 2. getGenrePaletteSpec / blendGenrePaletteSpecs → paleta base con proporciones
 * 3. applyHarmonyToSpec → reglas tipo Kuler (análogo, triádico, complementario…)
 * 4. modulatePalette → energía/tensión/brillo + ethereal/earthy para folk
 * 5. keyHue puede ajustar el primario si keyConfidence > 0.4
 *
 * Las proporciones (primaryWeight, secondaryWeight, etc.) vienen de genre-palette-spec.
 */
import { getGenrePaletteSpec, blendGenrePaletteSpecs } from './genre-palette-spec.js';
import { applyHarmonyToSpec } from './harmony-rules.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Paletas base: primary hue, secondary offset, neutralMix (0-1), chroma base, lightness base
 * Cobertura amplia: Rock, Metal, Punk, Electronic, Hip-hop, Pop, R&B, Jazz, Classical,
 * Folk, Ambient, Reggae, Latin, Blues, Country, Indie, Funk, Disco, World, Opera, etc.
 */
export const GENRE_PALETTES = {
  // Rock & derivados
  metal: { primary: 0, secondaryOffset: 270, neutralMix: 0.35, chroma: 0.28, lightness: 0.45 },
  rock: { primary: 15, secondaryOffset: 200, neutralMix: 0.25, chroma: 0.26, lightness: 0.5 },
  punk: { primary: 0, secondaryOffset: 60, neutralMix: 0.2, chroma: 0.3, lightness: 0.48 },
  grunge: { primary: 25, secondaryOffset: 180, neutralMix: 0.4, chroma: 0.18, lightness: 0.42 },

  // Electrónica
  electronic: { primary: 260, secondaryOffset: 320, neutralMix: 0.15, chroma: 0.28, lightness: 0.52 },
  house: { primary: 300, secondaryOffset: 60, neutralMix: 0.2, chroma: 0.3, lightness: 0.55 },
  techno: { primary: 220, secondaryOffset: 280, neutralMix: 0.25, chroma: 0.22, lightness: 0.48 },
  ambient: { primary: 200, secondaryOffset: 280, neutralMix: 0.45, chroma: 0.12, lightness: 0.5 },
  edm: { primary: 320, secondaryOffset: 180, neutralMix: 0.1, chroma: 0.35, lightness: 0.58 },
  synthwave: { primary: 300, secondaryOffset: 200, neutralMix: 0.2, chroma: 0.3, lightness: 0.52 },

  // Hip-hop & urban
  hiphop: { primary: 320, secondaryOffset: 50, neutralMix: 0.25, chroma: 0.28, lightness: 0.48 },
  trap: { primary: 280, secondaryOffset: 340, neutralMix: 0.3, chroma: 0.22, lightness: 0.45 },
  rnb: { primary: 330, secondaryOffset: 30, neutralMix: 0.2, chroma: 0.25, lightness: 0.52 },
  soul: { primary: 25, secondaryOffset: 200, neutralMix: 0.25, chroma: 0.24, lightness: 0.5 },

  // Pop & mainstream
  pop: { primary: 340, secondaryOffset: 60, neutralMix: 0.18, chroma: 0.32, lightness: 0.56 },
  indie: { primary: 280, secondaryOffset: 120, neutralMix: 0.22, chroma: 0.2, lightness: 0.52 },
  alternative: { primary: 200, secondaryOffset: 50, neutralMix: 0.28, chroma: 0.22, lightness: 0.5 },

  // Jazz & clásica
  jazz: { primary: 50, secondaryOffset: 200, neutralMix: 0.35, chroma: 0.18, lightness: 0.48 },
  classical: { primary: 40, secondaryOffset: 220, neutralMix: 0.4, chroma: 0.14, lightness: 0.52 },
  opera: { primary: 20, secondaryOffset: 280, neutralMix: 0.3, chroma: 0.2, lightness: 0.5 },
  baroque: { primary: 35, secondaryOffset: 250, neutralMix: 0.38, chroma: 0.16, lightness: 0.48 },

  // Folk & acústico
  folk: { primary: 45, secondaryOffset: 120, neutralMix: 0.3, chroma: 0.22, lightness: 0.52 },
  acoustic: { primary: 40, secondaryOffset: 140, neutralMix: 0.35, chroma: 0.2, lightness: 0.54 },
  country: { primary: 50, secondaryOffset: 100, neutralMix: 0.28, chroma: 0.24, lightness: 0.52 },
  bluegrass: { primary: 55, secondaryOffset: 130, neutralMix: 0.25, chroma: 0.26, lightness: 0.5 },

  // Blues & roots
  blues: { primary: 250, secondaryOffset: 30, neutralMix: 0.3, chroma: 0.2, lightness: 0.45 },
  gospel: { primary: 30, secondaryOffset: 200, neutralMix: 0.25, chroma: 0.26, lightness: 0.52 },

  // Latin & world
  latin: { primary: 30, secondaryOffset: 150, neutralMix: 0.2, chroma: 0.3, lightness: 0.54 },
  reggae: { primary: 95, secondaryOffset: 30, neutralMix: 0.22, chroma: 0.28, lightness: 0.52 },
  salsa: { primary: 15, secondaryOffset: 180, neutralMix: 0.18, chroma: 0.32, lightness: 0.55 },
  bossa: { primary: 55, secondaryOffset: 200, neutralMix: 0.35, chroma: 0.18, lightness: 0.5 },
  world: { primary: 75, secondaryOffset: 270, neutralMix: 0.28, chroma: 0.24, lightness: 0.5 },
  flamenco: { primary: 10, secondaryOffset: 200, neutralMix: 0.25, chroma: 0.28, lightness: 0.48 },

  // Funk & disco
  funk: { primary: 55, secondaryOffset: 300, neutralMix: 0.15, chroma: 0.32, lightness: 0.54 },
  disco: { primary: 300, secondaryOffset: 60, neutralMix: 0.12, chroma: 0.35, lightness: 0.56 },

  // Otros
  drone: { primary: 180, secondaryOffset: 260, neutralMix: 0.5, chroma: 0.08, lightness: 0.45 },
  noise: { primary: 0, secondaryOffset: 180, neutralMix: 0.4, chroma: 0.15, lightness: 0.4 },
  minimal: { primary: 220, secondaryOffset: 280, neutralMix: 0.5, chroma: 0.1, lightness: 0.5 },
  cinematic: { primary: 210, secondaryOffset: 260, neutralMix: 0.45, chroma: 0.12, lightness: 0.5 },
  soundtrack: { primary: 200, secondaryOffset: 270, neutralMix: 0.55, chroma: 0.1, lightness: 0.48 },
  default: { primary: 200, secondaryOffset: 120, neutralMix: 0.25, chroma: 0.22, lightness: 0.52 },
};

/**
 * Heurísticas de afinidad por género — variables semánticas típicas de cada uno
 * @param {Object} semantic - estado semántico 0-1
 * @returns {Array<{ genre: string, score: number }>} ordenado por score descendente
 */
export function detectGenreAffinity(semantic) {
  const org = semantic.organicity_vs_mechanicality ?? 0.5;
  const b = semantic.timbral_brightness ?? 0.5;
  const d = semantic.texture_density ?? 0.5;
  const rhythm = semantic.rhythmic_pressure ?? 0.5;
  const groove = semantic.groove ?? 0.5;
  const e = semantic.energy_level ?? 0.5;
  const tension = semantic.harmonic_tension ?? 0.5;
  const melodic = semantic.melodic_prominence ?? 0.5;
  const vocal = semantic.vocal_presence ?? 0.5;
  const dyn = semantic.dynamic_range ?? 0.5;
  const bassW = semantic.bass_weight ?? 0.33;
  const trebleW = semantic.treble_weight ?? 0.33;
  const perc = semantic.percussion_presence ?? 0.5;
  const tonal = semantic.tonal_stability ?? 0.5;
  const mon = semantic.intimacy_vs_monumentality ?? 0.5;
  const i = semantic.emotional_intensity ?? 0.5;
  const sw = semantic.spectral_width ?? 0.5;

  // Discriminadores: rock/hip-hop necesitan percusión; folk gana cuando hay poco perc y alta tonalidad
  const rockPenalty = perc < 0.4 ? (0.4 - perc) * 0.4 : 0;
  const hiphopPenalty = perc < 0.45 ? (0.45 - perc) * 0.45 : 0;
  const folkBonus = (1 - perc) * 0.18 + tonal * 0.12 + melodic * 0.06;
  const acousticBonus = (1 - perc) * 0.2 + tonal * 0.12 + melodic * 0.05;

  const cinematicScore = (1 - e) * 0.35 + org * 0.25 + melodic * 0.22 + mon * 0.2 + (1 - rhythm) * 0.15 + (1 - perc) * 0.12;
  const soundtrackScore = (1 - e) * 0.4 + org * 0.28 + melodic * 0.25 + mon * 0.22 + (1 - perc) * 0.18;

  const scores = [
    { genre: 'cinematic', score: cinematicScore },
    { genre: 'soundtrack', score: soundtrackScore },
    { genre: 'metal', score: e * 0.3 + rhythm * 0.25 + (1 - org) * 0.28 + tension * 0.22 },
    { genre: 'rock', score: Math.max(0, e * 0.28 + rhythm * 0.28 + (1 - org) * 0.2 + tension * 0.15 - rockPenalty) },
    { genre: 'punk', score: e * 0.4 + rhythm * 0.32 + (1 - org) * 0.2 + tension * 0.1 },
    { genre: 'grunge', score: e * 0.25 + (1 - b) * 0.3 + d * 0.25 + (1 - org) * 0.2 },
    { genre: 'electronic', score: (1 - org) * 0.4 + b * 0.25 + perc * 0.2 + rhythm * 0.18 },
    { genre: 'house', score: (1 - org) * 0.35 + groove * 0.35 + rhythm * 0.2 + b * 0.15 },
    { genre: 'techno', score: (1 - org) * 0.4 + rhythm * 0.3 + perc * 0.2 + (1 - melodic) * 0.15 },
    { genre: 'ambient', score: (1 - e) * 0.4 + org * 0.25 + d * 0.22 + (1 - rhythm) * 0.18 },
    { genre: 'edm', score: e * 0.35 + (1 - org) * 0.3 + b * 0.2 + groove * 0.2 },
    { genre: 'synthwave', score: (1 - org) * 0.35 + b * 0.25 + groove * 0.2 + (1 - tension) * 0.15 },
    { genre: 'hiphop', score: Math.max(0, groove * 0.35 + perc * 0.3 + (bassW > 0.4 ? 0.28 : 0) + rhythm * 0.2 - hiphopPenalty) },
    { genre: 'trap', score: groove * 0.3 + perc * 0.35 + (bassW > 0.45 ? 0.3 : 0) + (1 - org) * 0.2 },
    { genre: 'rnb', score: vocal * 0.32 + melodic * 0.28 + i * 0.22 + groove * 0.2 },
    { genre: 'soul', score: vocal * 0.3 + org * 0.25 + i * 0.28 + melodic * 0.2 },
    { genre: 'pop', score: vocal * 0.35 + melodic * 0.35 + groove * 0.2 + (1 - tension) * 0.12 },
    { genre: 'indie', score: (vocal + melodic + org) * 0.28 + (1 - tension) * 0.18 + groove * 0.15 },
    { genre: 'alternative', score: (1 - org) * 0.25 + tension * 0.25 + e * 0.2 + melodic * 0.2 },
    { genre: 'jazz', score: org * 0.32 + groove * 0.28 + melodic * 0.28 + dyn * 0.2 },
    { genre: 'classical', score: org * 0.35 + melodic * 0.32 + tonal * 0.22 + (1 - e) * 0.18 },
    { genre: 'opera', score: vocal * 0.4 + melodic * 0.32 + mon * 0.2 + i * 0.18 },
    { genre: 'baroque', score: org * 0.3 + melodic * 0.3 + tonal * 0.25 + (1 - rhythm) * 0.15 },
    { genre: 'folk', score: org * 0.42 + vocal * 0.25 + melodic * 0.22 + mon * 0.18 + folkBonus },
    { genre: 'celtic', score: org * 0.38 + melodic * 0.28 + mon * 0.22 + (1 - e) * 0.18 + (1 - rhythm) * 0.12 + folkBonus },
    { genre: 'medieval', score: org * 0.36 + melodic * 0.3 + mon * 0.24 + (1 - e) * 0.2 + tonal * 0.12 + folkBonus },
    { genre: 'acoustic', score: org * 0.45 + melodic * 0.25 + (1 - perc) * 0.2 + tonal * 0.15 + acousticBonus },
    { genre: 'country', score: org * 0.35 + vocal * 0.32 + melodic * 0.22 + mon * 0.15 },
    { genre: 'bluegrass', score: org * 0.38 + groove * 0.25 + melodic * 0.22 + (1 - tension) * 0.15 },
    { genre: 'blues', score: org * 0.32 + i * 0.32 + groove * 0.22 + (1 - b) * 0.2 },
    { genre: 'gospel', score: vocal * 0.38 + i * 0.28 + org * 0.22 + melodic * 0.18 },
    { genre: 'latin', score: rhythm * 0.38 + perc * 0.32 + groove * 0.22 + e * 0.15 },
    { genre: 'reggae', score: groove * 0.38 + (bassW > 0.35 ? 0.32 : 0) + org * 0.22 + (1 - tension) * 0.18 },
    { genre: 'salsa', score: rhythm * 0.4 + perc * 0.3 + groove * 0.2 + e * 0.18 },
    { genre: 'bossa', score: org * 0.35 + groove * 0.3 + melodic * 0.25 + (1 - e) * 0.15 },
    { genre: 'world', score: org * 0.35 + perc * 0.28 + melodic * 0.22 + dyn * 0.18 },
    { genre: 'flamenco', score: rhythm * 0.35 + i * 0.28 + org * 0.22 + perc * 0.2 },
    { genre: 'funk', score: groove * 0.42 + perc * 0.32 + (bassW > 0.35 ? 0.28 : 0) + org * 0.15 },
    { genre: 'disco', score: groove * 0.35 + b * 0.28 + (1 - org) * 0.22 + e * 0.2 },
    { genre: 'drone', score: (1 - e) * 0.5 + d * 0.3 + (1 - rhythm) * 0.25 + (1 - melodic) * 0.15 },
    { genre: 'noise', score: d * 0.4 + (1 - tonal) * 0.3 + (1 - org) * 0.25 + tension * 0.2 },
    { genre: 'minimal', score: (1 - e) * 0.4 + (1 - d) * 0.25 + tension * 0.2 + (1 - rhythm) * 0.2 },
  ];

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

/**
 * Obtiene la paleta base del género desde la especificación
 */
export function getGenrePalette(genre) {
  const spec = getGenrePaletteSpec(genre);
  return specToPalette(spec);
}

/**
 * Combina paletas de género dominante y secundario
 */
export function blendGenrePalettes(genre1, genre2, score1, score2) {
  const spec = blendGenrePaletteSpecs(genre1, genre2, score1, score2);
  return { ...specToPalette(spec), genreSpec: spec };
}

function specToPalette(spec, genre = null) {
  return {
    primary: spec.primaryHue,
    secondaryOffset: spec.secondaryOffset ?? 120,
    tertiaryOffset: spec.tertiaryOffset ?? 240,
    chroma: spec.chroma,
    lightness: spec.lightness,
    neutralMix: spec.neutralWeight,
    genre: spec.genre ?? genre ?? 'default',
    genreSpec: spec,
  };
}

/**
 * Modula la paleta base según variables semánticas (energía, tensión, brillo).
 * Incluye modulación "ethereal vs earthy" para folk/acústico:
 * - Ethereal (monumental, baja energía, brillante) → azules, blancos, más neutros
 * - Earthy (íntimo, energía media, cálido) → ámbar, verdes, tierras
 * @param {Object} basePalette - salida de getGenrePalette o blendGenrePalettes
 * @param {Object} semantic
 * @param {string} [genre] - género detectado (para metadata)
 * @returns {Object} paleta final con hue, secondaryHue, chroma, lightness, neutralMix, genre
 */
export function modulatePalette(basePalette, semantic, genre = null) {
  const e = semantic.energy_level ?? 0.5;
  const tension = semantic.harmonic_tension ?? 0.5;
  const b = semantic.timbral_brightness ?? 0.5;
  const dyn = semantic.dynamic_range ?? 0.5;
  const mon = semantic.intimacy_vs_monumentality ?? 0.5;

  let hue = (basePalette.primary + 360) % 360;
  const secondaryHue = (hue + (basePalette.secondaryOffset ?? 120) + 360) % 360;

  // Folk/acústico: modulación ethereal (azules, blancos) vs earthy (ámbar, tierras)
  const genreStr = String(genre ?? basePalette.genre ?? '');
  const isFolkFamily = /folk|acoustic|celtic|irish|medieval|world|ambient|cinematic|soundtrack/i.test(genreStr);
  const etherealScore = mon * (1 - e) * b;
  if (isFolkFamily && etherealScore > 0.14) {
    const blend = clamp((etherealScore - 0.14) * 3, 0, 0.75);
    const etherealHue = 172;
    hue = (hue * (1 - blend) + etherealHue * blend + 360) % 360;
  }

  const chroma = clamp(basePalette.chroma * (0.85 + e * 0.3) + tension * 0.05, 0.08, 0.4);
  const lightness = clamp(basePalette.lightness + (b - 0.5) * 0.15 + (e - 0.5) * 0.08, 0.35, 0.7);
  let neutralMix = clamp(basePalette.neutralMix + dyn * 0.15 - e * 0.1, 0.05, 0.55);
  if (isFolkFamily && etherealScore > 0.2) {
    neutralMix = clamp(neutralMix + etherealScore * 0.25, 0.1, 0.55);
  }

  return {
    hue,
    secondaryHue,
    chroma,
    lightness,
    neutralMix,
    genre: genre ?? basePalette.genre ?? 'default',
  };
}

/** Keywords que sugieren folk/celtic irlandés → boost en detección (normaliza _ y - a espacio) */
const CELTIC_FOLK_KEYWORDS = /irish|celtic|county\s*down|star\s*of|ireland|gaelic|dublin|shamrock|loreena|mckennitt|enya/i;
/** Keywords que sugieren remix/electrónica → boost electronic/edm */
const REMIX_KEYWORDS = /remix|remaster|rework|edit\s*$/i;
/** Keywords 80s synth-pop / new wave → paleta magenta/rosa vibrante, distinta de folk */
const EIGHTIES_POP_KEYWORDS = /out\s*of\s*touch|hall\s*&?\s*oates|maneater|private\s*eyes|duran\s*duran|pet\s*shop|depeche\s*mode|synth\s*pop|new\s*wave|80s|eighties|tears\s*for\s*fears|spandau|talking\s*heads/i;

/**
 * Pipeline completo: detecta género → obtiene paleta → modula
 * @param {Object} semantic
 * @param {Object} context - { fingerprint?, keyHue?, keyConfidence?, metadata?: { trackName? } }
 * @returns {{ hueBase: number, secondaryHue: number, chroma: number, lightness: number, neutralMix: number, genre: string, genreAffinity: Array }}
 */
export function resolveGenrePalette(semantic, context = {}) {
  let affinity = detectGenreAffinity(semantic);
  const trackName = (context.metadata?.trackName ?? '').replace(/[_-]/g, ' ');
  if (CELTIC_FOLK_KEYWORDS.test(trackName)) {
    affinity = affinity.map((a) => {
      const boost = (a.genre === 'folk' || a.genre === 'celtic' || a.genre === 'medieval') ? 0.18 : 0;
      return { ...a, score: a.score + boost };
    });
    affinity.push({ genre: 'irish', score: 0.4 });
    affinity.sort((a, b) => b.score - a.score);
  }
  if (REMIX_KEYWORDS.test(trackName)) {
    affinity = affinity.map((a) => {
      const boost = (a.genre === 'electronic' || a.genre === 'edm' || a.genre === 'house') ? 0.15 : 0;
      return { ...a, score: a.score + boost };
    });
    affinity.push({ genre: 'remix', score: 0.35 });
    affinity.sort((a, b) => b.score - a.score);
  }
  if (EIGHTIES_POP_KEYWORDS.test(trackName)) {
    affinity = affinity.map((a) => {
      const boost = (a.genre === 'pop' || a.genre === 'synthwave' || a.genre === 'electronic') ? 0.2 : 0;
      return { ...a, score: a.score + boost };
    });
    affinity.push({ genre: 'synthwave', score: 0.38 });
    affinity.sort((a, b) => b.score - a.score);
  }
  const top1 = affinity[0];
  const top2 = affinity[1];

  let basePalette;
  let genre;
  const trust1 = /folk|celtic|irish|medieval|acoustic|ambient|classical|blues|cinematic|soundtrack/i.test(top1?.genre ?? '');
  const trust2 = /folk|celtic|irish|medieval|acoustic|ambient|classical|blues|cinematic|soundtrack/i.test(top2?.genre ?? '');
  const scoreGap = (top1?.score ?? 0) - (top2?.score ?? 0);
  let s1 = top1?.score ?? 0;
  let s2 = top2?.score ?? 0;
  if (top2 && s2 > 0.14 && scoreGap < 0.1) {
    if (trust2 && !trust1 && scoreGap < 0.06) {
      s2 = s2 + 0.08;
    } else if (trust1 && !trust2 && scoreGap < 0.06) {
      s1 = s1 + 0.06;
    }
    basePalette = blendGenrePalettes(top1.genre, top2.genre, s1, s2);
    genre = basePalette.genre;
  } else if (top2 && s2 > 0.14 && scoreGap < 0.15 && trust2 && !trust1) {
    s2 = s2 + 0.05;
    basePalette = blendGenrePalettes(top1.genre, top2.genre, s1, s2);
    genre = basePalette.genre;
  } else {
    genre = top1?.genre ?? 'default';
    const spec = getGenrePaletteSpec(genre);
    basePalette = specToPalette({ ...spec, genre }, genre);
  }

  const keyHue = context.keyHue;
  const keyConfidence = context.keyConfidence ?? 0.5;
  const genreStr = String(genre ?? basePalette.genre ?? '');
  const trustPsychology = /folk|celtic|irish|medieval|acoustic|ambient|classical|blues|cinematic|soundtrack/i.test(genreStr);
  if (keyHue != null && keyConfidence > 0.4) {
    let blend = trustPsychology ? (0.08 + keyConfidence * 0.18) : (0.3 + keyConfidence * 0.4);
    const keyH = (keyHue + 360) % 360;
    const isKeyWarm = keyH <= 70 || keyH >= 290;
    if (trustPsychology && isKeyWarm) blend *= 0.35;
    basePalette = { ...basePalette, primary: (basePalette.primary * (1 - blend) + keyHue * blend + 360) % 360 };
  }

  const useHarmony = context.useHarmonyRules !== false;
  const harmonizedSpec = applyHarmonyToSpec(basePalette.genreSpec ?? { ...basePalette, genre }, genre, useHarmony);
  basePalette = {
    ...basePalette,
    secondaryOffset: harmonizedSpec.secondaryOffset ?? basePalette.secondaryOffset,
    tertiaryOffset: harmonizedSpec.tertiaryOffset ?? basePalette.tertiaryOffset,
    genreSpec: { ...(basePalette.genreSpec ?? {}), ...harmonizedSpec },
  };

  const modulated = modulatePalette(basePalette, semantic, genre);

  const trustTop1 = /folk|celtic|irish|medieval|acoustic|ambient|classical|blues|cinematic|soundtrack/i.test(top1?.genre ?? '');
  const trustTop2 = /folk|celtic|irish|medieval|acoustic|ambient|classical|blues|cinematic|soundtrack/i.test(top2?.genre ?? '');
  const genreColorConfidence = trustTop1
    ? (trustTop2 ? 0.95 : clamp(0.5 + scoreGap * 2.5, 0.5, 0.95))
    : 0;

  return {
    ...modulated,
    genreSpec: basePalette.genreSpec,
    genreAffinity: affinity.slice(0, 5),
    genreColorConfidence,
    scoreGap,
  };
}
