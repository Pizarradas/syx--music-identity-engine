/**
 * Psicología del color aplicada a géneros musicales
 * Basado en: emoción como mediador entre música y color (Palmer et al., PNAS 2013)
 *
 * Pipeline: género → rasgos emocionales → dimensiones cromáticas → hue + chroma + neutralMix
 *
 * Dimensiones cromáticas (hue 0-360):
 * - Energía/pasión/agresión → 0-30° (rojo-naranja)
 * - Calidez/creatividad → 30-60° (naranja-amarillo)
 * - Naturaleza/crecimiento → 90-150° (verde)
 * - Frescura/claridad → 150-200° (teal)
 * - Calma/profundidad/melancolía → 200-250° (azul)
 * - Misterio/espiritualidad → 250-300° (violeta)
 * - Bold/creativo → 300-330° (magenta)
 * - Intensidad → 330-360° (rojo-púrpura)
 */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Perfil psicológico por género: rasgos emocionales típicos → pesos para dimensiones cromáticas
 * Cada género tiene { primaryHues: [{ hue, weight }], neutralBias, chromaBias }
 * primaryHues: combinación ponderada para el hue primario
 * neutralBias: 0-1, tendencia a neutros (blanco/gris/negro)
 * chromaBias: 0-1, tendencia a saturación (0=muted, 1=vibrant)
 */
export const GENRE_PSYCHOLOGY = {
  // Rock & derivados — energía, rebelión, poder
  metal: {
    primaryHues: [{ hue: 0, weight: 0.6 }, { hue: 270, weight: 0.3 }, { hue: 180, weight: 0.1 }],
    neutralBias: 0.4,
    chromaBias: 0.5,
    lightnessBias: 0.4,
  },
  rock: {
    primaryHues: [{ hue: 15, weight: 0.55 }, { hue: 0, weight: 0.3 }, { hue: 200, weight: 0.15 }],
    neutralBias: 0.3,
    chromaBias: 0.55,
    lightnessBias: 0.5,
  },
  punk: {
    primaryHues: [{ hue: 0, weight: 0.7 }, { hue: 60, weight: 0.2 }, { hue: 330, weight: 0.1 }],
    neutralBias: 0.25,
    chromaBias: 0.65,
    lightnessBias: 0.48,
  },
  grunge: {
    primaryHues: [{ hue: 25, weight: 0.4 }, { hue: 180, weight: 0.35 }, { hue: 0, weight: 0.25 }],
    neutralBias: 0.5,
    chromaBias: 0.35,
    lightnessBias: 0.4,
  },

  // Electrónica — sintético, futurista, espacial
  electronic: {
    primaryHues: [{ hue: 260, weight: 0.5 }, { hue: 320, weight: 0.3 }, { hue: 200, weight: 0.2 }],
    neutralBias: 0.2,
    chromaBias: 0.6,
    lightnessBias: 0.52,
  },
  house: {
    primaryHues: [{ hue: 300, weight: 0.45 }, { hue: 60, weight: 0.35 }, { hue: 200, weight: 0.2 }],
    neutralBias: 0.25,
    chromaBias: 0.65,
    lightnessBias: 0.55,
  },
  techno: {
    primaryHues: [{ hue: 220, weight: 0.5 }, { hue: 280, weight: 0.35 }, { hue: 180, weight: 0.15 }],
    neutralBias: 0.35,
    chromaBias: 0.5,
    lightnessBias: 0.48,
  },
  ambient: {
    primaryHues: [{ hue: 205, weight: 0.5 }, { hue: 270, weight: 0.3 }, { hue: 170, weight: 0.2 }],
    neutralBias: 0.55,
    chromaBias: 0.25,
    lightnessBias: 0.52,
  },
  edm: {
    primaryHues: [{ hue: 320, weight: 0.45 }, { hue: 180, weight: 0.3 }, { hue: 60, weight: 0.25 }],
    neutralBias: 0.15,
    chromaBias: 0.7,
    lightnessBias: 0.58,
  },
  synthwave: {
    primaryHues: [{ hue: 300, weight: 0.45 }, { hue: 200, weight: 0.35 }, { hue: 60, weight: 0.2 }],
    neutralBias: 0.25,
    chromaBias: 0.6,
    lightnessBias: 0.52,
  },

  // Hip-hop & urban — bold, confianza, urbano
  hiphop: {
    primaryHues: [{ hue: 320, weight: 0.4 }, { hue: 50, weight: 0.3 }, { hue: 0, weight: 0.2 }],
    neutralBias: 0.35,
    chromaBias: 0.6,
    lightnessBias: 0.48,
  },
  trap: {
    primaryHues: [{ hue: 280, weight: 0.45 }, { hue: 340, weight: 0.35 }, { hue: 200, weight: 0.2 }],
    neutralBias: 0.4,
    chromaBias: 0.5,
    lightnessBias: 0.45,
  },
  rnb: {
    primaryHues: [{ hue: 330, weight: 0.45 }, { hue: 30, weight: 0.3 }, { hue: 250, weight: 0.25 }],
    neutralBias: 0.25,
    chromaBias: 0.55,
    lightnessBias: 0.52,
  },
  soul: {
    primaryHues: [{ hue: 25, weight: 0.4 }, { hue: 200, weight: 0.35 }, { hue: 330, weight: 0.25 }],
    neutralBias: 0.3,
    chromaBias: 0.5,
    lightnessBias: 0.5,
  },

  // Pop & mainstream — brillante, alegre, accesible
  pop: {
    primaryHues: [{ hue: 340, weight: 0.45 }, { hue: 60, weight: 0.35 }, { hue: 300, weight: 0.2 }],
    neutralBias: 0.2,
    chromaBias: 0.7,
    lightnessBias: 0.58,
  },
  indie: {
    primaryHues: [{ hue: 280, weight: 0.4 }, { hue: 120, weight: 0.3 }, { hue: 50, weight: 0.3 }],
    neutralBias: 0.3,
    chromaBias: 0.45,
    lightnessBias: 0.52,
  },
  alternative: {
    primaryHues: [{ hue: 200, weight: 0.4 }, { hue: 50, weight: 0.35 }, { hue: 280, weight: 0.25 }],
    neutralBias: 0.35,
    chromaBias: 0.5,
    lightnessBias: 0.5,
  },

  // Jazz & clásica — sofisticación, profundidad, elegancia
  jazz: {
    primaryHues: [{ hue: 50, weight: 0.4 }, { hue: 250, weight: 0.4 }, { hue: 30, weight: 0.2 }],
    neutralBias: 0.45,
    chromaBias: 0.4,
    lightnessBias: 0.48,
  },
  classical: {
    primaryHues: [{ hue: 40, weight: 0.35 }, { hue: 220, weight: 0.45 }, { hue: 270, weight: 0.2 }],
    neutralBias: 0.5,
    chromaBias: 0.3,
    lightnessBias: 0.52,
  },
  opera: {
    primaryHues: [{ hue: 20, weight: 0.4 }, { hue: 280, weight: 0.35 }, { hue: 0, weight: 0.25 }],
    neutralBias: 0.4,
    chromaBias: 0.5,
    lightnessBias: 0.5,
  },
  baroque: {
    primaryHues: [{ hue: 35, weight: 0.4 }, { hue: 250, weight: 0.4 }, { hue: 60, weight: 0.2 }],
    neutralBias: 0.5,
    chromaBias: 0.35,
    lightnessBias: 0.48,
  },

  // Folk & acústico — naturaleza, calma, tradición, autenticidad
  folk: {
    primaryHues: [{ hue: 140, weight: 0.4 }, { hue: 205, weight: 0.35 }, { hue: 50, weight: 0.25 }],
    neutralBias: 0.45,
    chromaBias: 0.4,
    lightnessBias: 0.54,
  },
  celtic: {
    primaryHues: [{ hue: 205, weight: 0.45 }, { hue: 140, weight: 0.35 }, { hue: 270, weight: 0.2 }],
    neutralBias: 0.5,
    chromaBias: 0.35,
    lightnessBias: 0.54,
  },
  acoustic: {
    primaryHues: [{ hue: 130, weight: 0.35 }, { hue: 200, weight: 0.35 }, { hue: 45, weight: 0.3 }],
    neutralBias: 0.5,
    chromaBias: 0.35,
    lightnessBias: 0.56,
  },
  country: {
    primaryHues: [{ hue: 50, weight: 0.45 }, { hue: 100, weight: 0.35 }, { hue: 30, weight: 0.2 }],
    neutralBias: 0.4,
    chromaBias: 0.5,
    lightnessBias: 0.52,
  },
  bluegrass: {
    primaryHues: [{ hue: 55, weight: 0.4 }, { hue: 130, weight: 0.4 }, { hue: 40, weight: 0.2 }],
    neutralBias: 0.35,
    chromaBias: 0.55,
    lightnessBias: 0.5,
  },

  // Blues & roots — melancolía, alma, profundidad
  blues: {
    primaryHues: [{ hue: 250, weight: 0.6 }, { hue: 30, weight: 0.25 }, { hue: 200, weight: 0.15 }],
    neutralBias: 0.45,
    chromaBias: 0.4,
    lightnessBias: 0.45,
  },
  gospel: {
    primaryHues: [{ hue: 30, weight: 0.4 }, { hue: 200, weight: 0.35 }, { hue: 330, weight: 0.25 }],
    neutralBias: 0.35,
    chromaBias: 0.55,
    lightnessBias: 0.52,
  },

  // Latin & world — energía, calor, ritmo
  latin: {
    primaryHues: [{ hue: 30, weight: 0.45 }, { hue: 150, weight: 0.35 }, { hue: 15, weight: 0.2 }],
    neutralBias: 0.25,
    chromaBias: 0.65,
    lightnessBias: 0.54,
  },
  reggae: {
    primaryHues: [{ hue: 95, weight: 0.5 }, { hue: 30, weight: 0.3 }, { hue: 140, weight: 0.2 }],
    neutralBias: 0.3,
    chromaBias: 0.6,
    lightnessBias: 0.52,
  },
  salsa: {
    primaryHues: [{ hue: 15, weight: 0.5 }, { hue: 180, weight: 0.3 }, { hue: 330, weight: 0.2 }],
    neutralBias: 0.2,
    chromaBias: 0.7,
    lightnessBias: 0.55,
  },
  bossa: {
    primaryHues: [{ hue: 55, weight: 0.4 }, { hue: 200, weight: 0.4 }, { hue: 140, weight: 0.2 }],
    neutralBias: 0.5,
    chromaBias: 0.35,
    lightnessBias: 0.52,
  },
  world: {
    primaryHues: [{ hue: 75, weight: 0.35 }, { hue: 270, weight: 0.35 }, { hue: 140, weight: 0.3 }],
    neutralBias: 0.4,
    chromaBias: 0.5,
    lightnessBias: 0.5,
  },
  flamenco: {
    primaryHues: [{ hue: 10, weight: 0.5 }, { hue: 200, weight: 0.3 }, { hue: 330, weight: 0.2 }],
    neutralBias: 0.35,
    chromaBias: 0.6,
    lightnessBias: 0.48,
  },

  // Funk & disco — groove, diversión, brillo
  funk: {
    primaryHues: [{ hue: 55, weight: 0.4 }, { hue: 300, weight: 0.4 }, { hue: 180, weight: 0.2 }],
    neutralBias: 0.2,
    chromaBias: 0.7,
    lightnessBias: 0.54,
  },
  disco: {
    primaryHues: [{ hue: 300, weight: 0.45 }, { hue: 60, weight: 0.35 }, { hue: 340, weight: 0.2 }],
    neutralBias: 0.15,
    chromaBias: 0.75,
    lightnessBias: 0.58,
  },

  // Otros
  drone: {
    primaryHues: [{ hue: 180, weight: 0.5 }, { hue: 260, weight: 0.35 }, { hue: 200, weight: 0.15 }],
    neutralBias: 0.65,
    chromaBias: 0.2,
    lightnessBias: 0.45,
  },
  noise: {
    primaryHues: [{ hue: 0, weight: 0.5 }, { hue: 180, weight: 0.35 }, { hue: 270, weight: 0.15 }],
    neutralBias: 0.55,
    chromaBias: 0.3,
    lightnessBias: 0.4,
  },
  minimal: {
    primaryHues: [{ hue: 220, weight: 0.5 }, { hue: 280, weight: 0.35 }, { hue: 180, weight: 0.15 }],
    neutralBias: 0.65,
    chromaBias: 0.2,
    lightnessBias: 0.52,
  },
  default: {
    primaryHues: [{ hue: 200, weight: 0.4 }, { hue: 120, weight: 0.35 }, { hue: 280, weight: 0.25 }],
    neutralBias: 0.35,
    chromaBias: 0.45,
    lightnessBias: 0.52,
  },
};

/**
 * Obtiene el perfil psicológico de un género (o default)
 */
export function getGenrePsychology(genre) {
  return GENRE_PSYCHOLOGY[genre] ?? GENRE_PSYCHOLOGY.default;
}

/**
 * Combina paletas derivadas de psicología para dos géneros
 */
export function blendPsychologyPalettes(genre1, genre2, score1, score2, semantic = {}) {
  const p1 = derivePaletteFromPsychology(genre1, semantic);
  const p2 = derivePaletteFromPsychology(genre2, semantic);
  const total = score1 + score2 || 1;
  const w1 = score1 / total;
  const w2 = score2 / total;
  const primary = (p1.primary * w1 + p2.primary * w2 + 360) % 360;
  return {
    primary,
    secondaryOffset: p1.secondaryOffset * w1 + p2.secondaryOffset * w2,
    neutralMix: p1.neutralMix * w1 + p2.neutralMix * w2,
    chroma: p1.chroma * w1 + p2.chroma * w2,
    lightness: p1.lightness * w1 + p2.lightness * w2,
    genre: score1 > score2 * 1.5 ? genre1 : `${genre1}/${genre2}`,
  };
}

/**
 * Calcula el hue primario a partir del perfil psicológico (combinación ponderada)
 * @param {Object} profile - { primaryHues: [{ hue, weight }], ... }
 * @returns {number} hue 0-360
 */
function weightedHueMean(primaryHues) {
  if (!primaryHues?.length) return 200;
  const totalW = primaryHues.reduce((s, p) => s + p.weight, 0) || 1;
  let x = 0, y = 0;
  for (const { hue, weight } of primaryHues) {
    const rad = (hue * Math.PI) / 180;
    x += Math.cos(rad) * (weight / totalW);
    y += Math.sin(rad) * (weight / totalW);
  }
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg < 0 ? deg + 360 : deg);
}

/**
 * Deriva paleta desde psicología del color
 * @param {string} genre
 * @param {Object} [semantic] - para modulación por emoción (energía, tensión, etc.)
 * @returns {{ primary: number, secondaryOffset: number, neutralMix: number, chroma: number, lightness: number }}
 */
export function derivePaletteFromPsychology(genre, semantic = {}) {
  const profile = getGenrePsychology(genre);
  const e = semantic.energy_level ?? 0.5;
  const tension = semantic.harmonic_tension ?? 0.5;
  const b = semantic.timbral_brightness ?? 0.5;

  const primary = weightedHueMean(profile.primaryHues);
  const secondaryOffset = 120;
  const neutralMix = clamp(
    (profile.neutralBias ?? 0.35) + (1 - e) * 0.1 - tension * 0.05,
    0.05,
    0.6
  );
  const chroma = clamp(
    (profile.chromaBias ?? 0.45) * (0.85 + e * 0.25) + tension * 0.03,
    0.08,
    0.4
  );
  const lightness = clamp(
    (profile.lightnessBias ?? 0.5) + (b - 0.5) * 0.12 + (e - 0.5) * 0.06,
    0.35,
    0.7
  );

  return {
    primary,
    secondaryOffset,
    neutralMix,
    chroma,
    lightness,
    genre,
  };
}
