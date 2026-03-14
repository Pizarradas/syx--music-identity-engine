/**
 * Reglas de armonía cromática inspiradas en Adobe Kuler/Color
 *
 * Cada regla define offsets explícitos para secundario y terciario respecto al primario.
 * El complementario (primary + 180°) se usa siempre como contraste adicional.
 *
 * Referencia: https://color.adobe.com
 */

export const HARMONY_MODES = {
  /** Colores adyacentes en la rueda (±30°): paletas suaves, coherentes */
  analogous:  { secondaryOffset: 30,  tertiaryOffset: 60,  label: 'Análogo' },
  /** Primario vs complemento (180°): máximo contraste */
  complementary: { secondaryOffset: 180, tertiaryOffset: 150, label: 'Complementario' },
  /** 120° equiespaciados: equilibrado, vibrante */
  triadic:     { secondaryOffset: 120, tertiaryOffset: 240, label: 'Triádico' },
  /** Complemento ±30°: contraste moderado */
  splitComplementary: { secondaryOffset: 150, tertiaryOffset: 210, label: 'Complementario dividido' },
  /** Rectángulo 90°: cuatro acentos distintos */
  tetradic:    { secondaryOffset: 90,  tertiaryOffset: 270, label: 'Tetrádico' },
  /** Cuadrado 90°: variante del tetrádico */
  square:      { secondaryOffset: 90,  tertiaryOffset: 270, label: 'Cuadrado' },
};

/** Mapeo género → modo de armonía preferido */
export const GENRE_HARMONY_MAP = {
  metal: 'complementary',
  rock: 'complementary',
  punk: 'complementary',
  grunge: 'splitComplementary',

  electronic: 'triadic',
  house: 'triadic',
  techno: 'triadic',
  ambient: 'analogous',
  edm: 'triadic',
  synthwave: 'triadic',

  hiphop: 'complementary',
  trap: 'splitComplementary',
  rnb: 'analogous',
  soul: 'complementary',

  pop: 'triadic',
  indie: 'splitComplementary',
  alternative: 'complementary',

  jazz: 'analogous',
  classical: 'analogous',
  opera: 'complementary',
  baroque: 'analogous',

  folk: 'triadic',
  celtic: 'analogous',
  irish: 'analogous',
  medieval: 'analogous',
  remix: 'triadic',
  acoustic: 'analogous',
  country: 'analogous',
  bluegrass: 'triadic',

  blues: 'complementary',
  gospel: 'complementary',

  latin: 'complementary',
  reggae: 'triadic',
  salsa: 'complementary',
  bossa: 'analogous',
  world: 'triadic',
  flamenco: 'complementary',

  funk: 'triadic',
  disco: 'triadic',

  drone: 'analogous',
  noise: 'complementary',
  minimal: 'analogous',

  cinematic: 'analogous',
  soundtrack: 'analogous',

  default: 'triadic',
};

/**
 * Obtiene los offsets de armonía para un género
 * @param {string} genre - género (puede ser "folk/rock" para blends)
 * @returns {{ secondaryOffset: number, tertiaryOffset: number, mode: string }}
 */
const GENRE_ALIASES = { irish: 'celtic' };

export function getHarmonyForGenre(genre) {
  const g = String(genre ?? '').toLowerCase();
  const parts = g.split(/[/\s,]+/).filter(Boolean);
  const primaryGenre = GENRE_ALIASES[parts[0]] ?? parts[0] ?? 'default';
  const mode = GENRE_HARMONY_MAP[primaryGenre] ?? GENRE_HARMONY_MAP.default;
  const rule = HARMONY_MODES[mode] ?? HARMONY_MODES.triadic;
  return {
    secondaryOffset: rule.secondaryOffset,
    tertiaryOffset: rule.tertiaryOffset,
    mode,
    label: rule.label,
  };
}

/**
 * Aplica regla de armonía a una spec (sobrescribe secondaryOffset y tertiaryOffset)
 * @param {Object} spec - spec con primaryHue, secondaryOffset, tertiaryOffset
 * @param {string} genre - género para elegir modo
 * @param {boolean} [enabled=true] - si false, devuelve spec sin cambios
 * @returns {Object} spec con offsets de armonía aplicados
 */
export function applyHarmonyToSpec(spec, genre, enabled = true) {
  if (!spec || !enabled) return spec;
  const harmony = getHarmonyForGenre(genre ?? spec.genre);
  return {
    ...spec,
    secondaryOffset: harmony.secondaryOffset,
    tertiaryOffset: harmony.tertiaryOffset,
    harmonyMode: harmony.mode,
    harmonyLabel: harmony.label,
  };
}
