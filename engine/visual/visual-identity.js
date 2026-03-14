/**
 * Motor de identidad visual — semantic → parámetros visuales
 * docs/05_visual_identity_engine.md
 * docs/13_theming_engine_integration.md
 * docs/26_music_to_ui_mapping_v2.md
 *
 * Mapeo Music-to-UI v2:
 * - energy_level → motion_speed (low=calm, high=intense)
 * - harmonic_tension → layout (low=open, high=compressed)
 * - rhythmic_pressure → transitions (low=smooth, high=sharp)
 * - timbral_brightness → color palette (low=warm, high=bright)
 * - texture_density → particle density (low=minimal, high=dense)
 * - percussion_presence → particle bursts; vocal_presence → typography emphasis
 */

/**
 * @typedef {Object} VisualIdentityState
 * @property {number} color_temperature - 0 frío, 1 cálido
 * @property {number} saturation_intensity
 * @property {number} contrast_level
 * @property {number} spatial_density
 * @property {number} motion_speed
 * @property {number} motion_elasticity
 * @property {number} geometric_hardness
 * @property {number} blur_vs_sharpness - 0 blur, 1 sharp
 * @property {number} ornamental_richness
 * @property {number} typography_weight_feel
 * @property {number} typography_expansion
 * @property {number} transition_aggressiveness
 * @property {number} ambient_visual_tension
 * @property {number} display_mode - 0 inmersivo, 1 karaoke (automático)
 * @property {number} hue_offset - desplazamiento tonal (-1 a 1)
 * @property {number} spectrum_prominence - prominencia barras (0-1)
 * @property {number} lyric_prominence - prominencia letra (0-1)
 * @property {number} particle_density_factor - factor densidad partículas (0-1)
 * @property {string} typography_font_family - familia tipográfica según energía/emoción
 */

const VISUAL_KEYS = [
  'color_temperature', 'saturation_intensity', 'contrast_level',
  'spatial_density', 'motion_speed', 'motion_elasticity',
  'geometric_hardness', 'blur_vs_sharpness', 'ornamental_richness',
  'typography_weight_feel', 'typography_expansion',
  'transition_aggressiveness', 'ambient_visual_tension',
  'display_mode', 'hue_offset', 'spectrum_prominence',
  'lyric_prominence', 'particle_density_factor',
];

/** Claves de los 5 parámetros que definen la paleta */
const PALETTE_PARAM_KEYS = ['energy_level', 'harmonic_tension', 'timbral_brightness', 'rhythmic_pressure', 'groove'];

/**
 * Hues dinámicos por parámetro — derivados del audio, no predefinidos.
 * Cada parámetro tiene afinidad espectral: bass→cálido, mids→verde, highs→frío.
 * spectral_width y dynamic_range amplían el spread cromático.
 * @param {Object} semantic - estado semántico
 * @param {number} hueBase - hue base del track (fingerprint/key/instrument)
 * @param {Object} bandData - { bass, mids, highs } 0-1
 * @returns {number[]} 5 hues (0-360), uno por parámetro
 */
function computeParamHues(semantic, hueBase, bandData = {}) {
  const bass = bandData.bass ?? semantic.bass_weight ?? 0.33;
  const highs = bandData.highs ?? semantic.treble_weight ?? 0.33;
  const mids = bandData.mids ?? Math.max(0, 1 - bass - highs);
  const sw = semantic.spectral_width ?? 0.5;
  const dyn = semantic.dynamic_range ?? 0.5;
  const chromaStr = semantic.chroma_strength ?? 0.5;
  const pitchClass = semantic.dominant_pitch_class ?? -1;

  const spread = 0.5 + sw * 0.8 + dyn * 0.4;
  const chromaHue = pitchClass >= 0 ? (pitchClass / 12) * 360 : hueBase;

  const mod = (base, bandInfluence, chromaMix = 0) => {
    let h = base + bandInfluence;
    if (chromaStr > 0.3 && chromaMix > 0) {
      h = h * (1 - chromaStr * chromaMix) + chromaHue * chromaStr * chromaMix;
    }
    return (h + 360) % 360;
  };

  return [
    mod(hueBase, (bass - 0.33) * 90 + (1 - highs) * 50, 0.4),
    mod(hueBase + 110, (highs - 0.33) * 100 + (1 - bass) * 30, 0.5),
    mod(hueBase + 220, (highs - 0.33) * 80 + (mids - 0.33) * 40, 0.35),
    mod(hueBase + 280, (mids - 0.33) * 90 + (bass - 0.33) * -30, 0.3),
    mod(hueBase + 340, (bass - 0.33) * 70 + (1 - mids) * 40, 0.45),
  ];
}

/**
 * Mapeo tonal → hue
 * tonal_stability alto + tension bajo ≈ mayor/más cálido
 * tension alto ≈ menor/cooler
 */
function tonalToHueOffset(tonalStability, harmonicTension) {
  const warmth = tonalStability * (1 - harmonicTension);
  const coolness = harmonicTension * (1 - tonalStability * 0.5);
  return clamp((warmth - coolness) * 1.2, -1, 1);
}

/**
 * Perfiles de género musical → hue base (0-360)
 * Cobertura amplia de categorías:
 * Rock, Metal, Punk | Electrónica, EDM, House, Techno | Hip-hop, Trap
 * Pop | R&B, Soul | Jazz | Clásica, Ópera | Folk, Acústico, Country
 * Ambient | Reggae | Latin | Blues | Indie | Funk | Disco | World
 *
 * Cada perfil combina variables semánticas típicas del género.
 */
function instrumentToHueBase(semantic) {
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

  // Scores por categoría (heurísticas basadas en características típicas)
  const metalRock = e * 0.3 + rhythm * 0.25 + (1 - org) * 0.25 + tension * 0.2;
  const electronic = (1 - org) * 0.4 + b * 0.25 + perc * 0.2 + rhythm * 0.15;
  const hipHop = groove * 0.35 + perc * 0.3 + (bassW > 0.4 ? 0.25 : 0) + rhythm * 0.2;
  const pop = vocal * 0.35 + melodic * 0.35 + groove * 0.2 + (1 - tension) * 0.1;
  const rnbSoul = vocal * 0.3 + melodic * 0.25 + i * 0.25 + org * 0.2;
  const jazz = org * 0.3 + groove * 0.25 + melodic * 0.25 + dyn * 0.2;
  const classical = org * 0.35 + melodic * 0.3 + tonal * 0.2 + (1 - e) * 0.15;
  const folkAcoustic = org * 0.4 + vocal * 0.25 + melodic * 0.2 + mon * 0.15;
  const ambient = (1 - e) * 0.4 + org * 0.25 + d * 0.2 + (1 - rhythm) * 0.15;
  const reggae = groove * 0.35 + (bassW > 0.35 ? 0.3 : 0) + org * 0.2 + (1 - tension) * 0.15;
  const latin = rhythm * 0.35 + perc * 0.3 + groove * 0.2 + e * 0.15;
  const blues = org * 0.3 + i * 0.3 + groove * 0.2 + (1 - b) * 0.2;
  const punk = e * 0.4 + rhythm * 0.3 + (1 - org) * 0.2 + tension * 0.1;
  const country = org * 0.35 + vocal * 0.3 + melodic * 0.2 + mon * 0.15;
  const indie = (vocal + melodic + org) * 0.25 + (1 - tension) * 0.15;
  const funk = groove * 0.4 + perc * 0.3 + (bassW > 0.35 ? 0.25 : 0) + org * 0.15;
  const disco = groove * 0.3 + b * 0.25 + (1 - org) * 0.2 + e * 0.2;
  const world = org * 0.35 + perc * 0.25 + melodic * 0.2 + dyn * 0.15;
  const opera = vocal * 0.4 + melodic * 0.3 + mon * 0.2 + i * 0.15;
  const houseTechno = (1 - org) * 0.35 + groove * 0.3 + rhythm * 0.2 + b * 0.15;

  const profiles = [
    { score: metalRock, hue: 15 },
    { score: electronic, hue: 210 },
    { score: hipHop, hue: 320 },
    { score: pop, hue: 355 },
    { score: rnbSoul, hue: 25 },
    { score: jazz, hue: 50 },
    { score: classical, hue: 40 },
    { score: folkAcoustic, hue: 35 },
    { score: ambient, hue: 260 },
    { score: reggae, hue: 95 },
    { score: latin, hue: 30 },
    { score: blues, hue: 250 },
    { score: punk, hue: 0 },
    { score: country, hue: 45 },
    { score: indie, hue: 280 },
    { score: funk, hue: 55 },
    { score: disco, hue: 300 },
    { score: world, hue: 75 },
    { score: opera, hue: 20 },
    { score: houseTechno, hue: 195 },
    { score: clamp(d * (1.3 - b * 0.4), 0, 1), hue: 145 },
  ];
  profiles.sort((a, b) => b.score - a.score);
  const dominant = profiles[0];
  const secondary = profiles[1];
  const tertiary = profiles[2];

  let hue = dominant.score > 0.1 ? dominant.hue : 200;
  if (secondary && secondary.score > 0.15) {
    const blend = clamp(secondary.score * 0.5, 0, 0.45);
    hue = hue * (1 - blend) + secondary.hue * blend;
  }
  if (tertiary && tertiary.score > 0.12 && Math.abs(hue - tertiary.hue) > 30) {
    const blend = clamp(tertiary.score * 0.25, 0, 0.2);
    hue = hue * (1 - blend) + tertiary.hue * blend;
  }

  const spectralBias = (bassW - trebleW) * 70;
  hue = (hue + spectralBias + 360) % 360;

  return hue;
}

/**
 * Ritmo → modulación de saturación y hue de acento
 */
function rhythmToAccent(semantic) {
  const rhythm = semantic.rhythmic_pressure ?? 0.5;
  const groove = semantic.groove ?? 0.5;
  const e = semantic.energy_level ?? 0.5;
  const pulse = semantic.pulse_stability ?? 0.5;
  const dyn = semantic.dynamic_range ?? 0.5;

  const drive = rhythm * 0.6 + groove * 0.4;
  const saturationBoost = drive * e * 0.4;
  const accentHueShift = (groove - 0.5) * 60;
  const hueOscillation = (1 - pulse) * drive * 15;

  return {
    saturationBoost: clamp(saturationBoost, 0, 0.45),
    accentHueShift,
    hueOscillation,
  };
}

/**
 * Fase 4: Modo visual (ambient / club / minimal)
 * visual_mode 0-1: 0=ambient, 0.5=minimal/balanced, 1=club
 * visual_preset: 'ambient'|'club'|'minimal' para data-attr y CSS
 */
function computeVisualMode(semantic) {
  const e = semantic.energy_level ?? 0.5;
  const rhythm = semantic.rhythmic_pressure ?? 0.5;
  const groove = semantic.groove ?? 0.5;
  const org = semantic.organicity_vs_mechanicality ?? 0.5;
  const tension = semantic.harmonic_tension ?? 0.5;
  const texture = semantic.texture_density ?? 0.5;

  const ambientScore = (1 - e) * org * (0.5 + groove * 0.5);
  const clubScore = e * (0.5 + rhythm * 0.5) * (0.5 + groove * 0.5);
  const minimalScore = tension * (1 - texture) * (1 - org) * 0.8;

  const total = ambientScore + clubScore + minimalScore + 0.01;
  const club = clubScore / total;
  const ambient = ambientScore / total;
  const minimal = minimalScore / total;

  if (minimal > ambient && minimal > club) return { mode: 0.5, preset: 'minimal' };
  if (ambient >= club) return { mode: Math.max(0, Math.min(0.45, ambient * 0.6)), preset: 'ambient' };
  return { mode: Math.max(0.55, Math.min(1, 0.55 + club * 0.45)), preset: 'club' };
}

/**
 * Modo de visualización automático
 * 0 = inmersivo (abstracto, partículas, menos letra)
 * 1 = karaoke (letra protagonista, más legible)
 * Derivado de: hay letra + energía media + textura (vocal) vs instrumental denso
 */
function computeDisplayMode(semantic, hasLyrics) {
  const e = semantic.energy_level ?? 0.5;
  const d = semantic.texture_density ?? 0.5;
  const mon = semantic.intimacy_vs_monumentality ?? 0.5;
  const org = semantic.organicity_vs_mechanicality ?? 0.5;

  if (!hasLyrics) return 0;

  const vocalLikelihood = e * 0.4 + d * 0.4 + mon * 0.2;
  const instrumentalWall = d > 0.8 && e > 0.7 ? 1 : 0;
  const karaoke = clamp(vocalLikelihood * (1 - instrumentalWall * 0.6), 0, 1);
  return karaoke;
}

const ACCUMULATED_VISUAL_WEIGHT = 0.6;

function blendForVisual(semantic, accumulated, key) {
  if (!accumulated?.mean || accumulated.mean[key] == null) return semantic[key] ?? 0.5;
  const acc = accumulated.mean[key] ?? 0.5;
  const inst = semantic[key] ?? 0.5;
  return acc * ACCUMULATED_VISUAL_WEIGHT + inst * (1 - ACCUMULATED_VISUAL_WEIGHT);
}

/**
 * Mapea estado semántico a identidad visual.
 * Si context.accumulated está presente, la identidad es acumulativa: refleja
 * el desarrollo de la canción desde el inicio hasta el momento actual.
 * @param {Object} semantic - variables semánticas 0-1 (estado instantáneo)
 * @param {Object} context - { hasLyrics, fingerprint?, keyHue?, accumulated?: { mean } }
 * @returns {VisualIdentityState}
 */
export function semanticToVisual(semantic, context = {}) {
  const acc = context.accumulated;
  const e = blendForVisual(semantic, acc, 'energy_level');
  const b = blendForVisual(semantic, acc, 'timbral_brightness');
  const t = blendForVisual(semantic, acc, 'harmonic_tension');
  const d = blendForVisual(semantic, acc, 'texture_density');
  const o = blendForVisual(semantic, acc, 'structural_openness');
  const i = blendForVisual(semantic, acc, 'emotional_intensity');
  const mon = blendForVisual(semantic, acc, 'intimacy_vs_monumentality');
  const org = blendForVisual(semantic, acc, 'organicity_vs_mechanicality');
  const tonal = blendForVisual(semantic, acc, 'tonal_stability');
  const groove = blendForVisual(semantic, acc, 'groove');
  const pulse = blendForVisual(semantic, acc, 'pulse_stability');
  const rhythm = blendForVisual(semantic, acc, 'rhythmic_pressure');
  const sw = blendForVisual(semantic, acc, 'spectral_width');
  const dyn = blendForVisual(semantic, acc, 'dynamic_range');

  const blended = acc ? Object.fromEntries(
    Object.keys(semantic).map((k) => [k, blendForVisual(semantic, acc, k)])
  ) : semantic;
  const hasLyrics = !!context.hasLyrics;
  const displayMode = computeDisplayMode(blended, hasLyrics);
  const { mode: visualMode, preset: visualPreset } = computeVisualMode(blended);
  const hueOffset = tonalToHueOffset(tonal, t);

  const fp = context.fingerprint;
  const keyHue = context.keyHue;
  const instrumentHue = instrumentToHueBase(blended);
  const keyConfidence = context.keyConfidence ?? 0.5;
  let hueBase;
  if (keyHue != null && keyConfidence > 0.3) {
    const keyWeight = 0.5 + keyConfidence * 0.4;
    const charWeight = 1 - keyWeight;
    hueBase = (keyHue * keyWeight + instrumentHue * charWeight + 360) % 360;
  } else {
    hueBase = fp?.hueBase ?? instrumentHue;
  }
  const rhythmAccent = rhythmToAccent(blended);
  // Mayor sensibilidad: groove y ritmo amplifican la modulación de acentos
  rhythmAccent.saturationBoost = clamp(rhythmAccent.saturationBoost + groove * 0.15 + rhythm * 0.1, 0, 0.5);
  rhythmAccent.hueOscillation = clamp(rhythmAccent.hueOscillation + (1 - pulse) * 8, 0, 25);

  const lyricProminence = hasLyrics ? displayMode * 0.5 + 0.5 : 0.4;
  const spectrumProminence = clamp(0.25 + e * 0.35 - displayMode * 0.1 + sw * 0.1, 0.15, 0.65);
  // harmonic_tension → layout compression (doc 26: high tension = compressed)
  const layoutCompression = t;
  const vocalPresence = blended.vocal_presence ?? 0.5;
  const isBoundary = !!semantic.is_boundary;
  const sectionIntensity = semantic.section_intensity ?? 0.5;

  const percussiveVsPitched = blended.percussive_vs_pitched ?? 0.5;
  const chromaStrength = semantic.chroma_strength ?? 0.5;
  const dominantPitchClass = semantic.dominant_pitch_class ?? -1;
  const sharpness = semantic.sharpness ?? 0.5;
  const spectralRichness = blended.spectral_richness ?? 0.5;
  const melodicProminence = blended.melodic_prominence ?? 0.5;
  const bassProminence = semantic.bass_prominence ?? 0.5;
  const vocalLikelihood = semantic.vocal_likelihood ?? 0.5;

  const particleModePercussive = percussiveVsPitched;
  const particleModeMelodic = melodicProminence * 0.7 + chromaStrength * 0.3;
  const particleModeOrganic = org * (1 - particleModePercussive * 0.6);
  const particleModeMechanical = (1 - org) * (1 - particleModeMelodic * 0.5);
  const particleChromaHue = dominantPitchClass >= 0 ? (dominantPitchClass / 12) : -1;
  const particleChromaStrength = chromaStrength;
  const particleSizeFactor = 1 - sharpness * 0.25;
  const particleDensityBoost = spectralRichness * 0.3;
  const particleDensityFactor = clamp(d * 0.5 + (1 - displayMode) * 0.4 + groove * 0.2 + particleDensityBoost, 0.3, 1);

  if (particleChromaHue >= 0 && particleChromaStrength > 0.3) {
    const chromaHueDeg = particleChromaHue * 360;
    hueBase = hueBase * (1 - particleChromaStrength * 0.6) + chromaHueDeg * particleChromaStrength * 0.6;
  }

  const bandData = context.bandData ?? {};
  const paramHues = computeParamHues(blended, hueBase, bandData);
  const paramWeights = PALETTE_PARAM_KEYS.map((k) => blended[k] ?? 0.5);
  const totalW = paramWeights.reduce((a, b) => a + b, 0) || 1;
  const weights = paramWeights.map((w) => w / totalW);
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x = weights.reduce((acc, w, i) => acc + Math.cos(toRad(paramHues[i])) * w, 0);
  const y = weights.reduce((acc, w, i) => acc + Math.sin(toRad(paramHues[i])) * w, 0);
  hueBase = (Math.atan2(y, x) * 180) / Math.PI;
  if (hueBase < 0) hueBase += 360;

  /**
   * Familia tipográfica según carácter musical — 4 categorías con amplio pool.
   * Cada categoría tiene varias opciones; se elige por índice derivado del fingerprint.
   */
  const fontPools = {
    editorial: ['Cormorant Garamond', 'Lora', 'Playfair Display', 'Libre Baskerville', 'EB Garamond', 'Merriweather', 'Source Serif Pro', 'Alegreya', 'Crimson Text', 'PT Serif'],
    geometric: ['Space Grotesk', 'DM Sans', 'Outfit', 'Inter', 'Nunito', 'Work Sans', 'Manrope', 'Plus Jakarta Sans', 'Figtree', 'Poppins', 'Raleway', 'Montserrat'],
    display: ['Bebas Neue', 'Syne', 'Archivo Black', 'Oswald', 'Russo One', 'Righteous', 'Titillium Web', 'Black Ops One', 'Orbitron', 'Audiowide', 'Rajdhani', 'Exo 2'],
    slab: ['Roboto Slab', 'Zilla Slab', 'Josefin Slab', 'Encode Sans Condensed', 'Anton', 'Barlow Condensed', 'Oswald', 'Staatliches', 'Bebas Neue', 'Archivo Narrow'],
  };
  const pickFont = (pool, seed) => pool[Math.floor(seed * pool.length) % pool.length];
  const fontSeed = ((blended.spectral_width ?? 0.5) * 7 + (blended.dynamic_range ?? 0.5) * 11 + (blended.groove ?? 0.5) * 13) % 1;
  const fontFamilies = {
    editorial: `"${pickFont(fontPools.editorial, fontSeed)}", "Lora", Georgia, serif`,
    geometric: `"${pickFont(fontPools.geometric, fontSeed + 0.3)}", "DM Sans", system-ui, sans-serif`,
    display: `"${pickFont(fontPools.display, fontSeed + 0.6)}", "Syne", system-ui, sans-serif`,
    slab: `"${pickFont(fontPools.slab, fontSeed + 0.9)}", "Roboto Slab", system-ui, serif`,
  };
  const fontCategoryLabels = { editorial: 'Serifa', geometric: 'Sans-serif', display: 'Display', slab: 'Slab' };
  const perc = blended.percussion_presence ?? 0.5;
  const aggressiveChar = e * 0.3 + rhythm * 0.25 + (1 - org) * 0.25 + t * 0.15;
  const electronicChar = (1 - org) * 0.4 + b * 0.25 + perc * 0.2;
  const hipHopLatinChar = groove * 0.4 + perc * 0.35 + rhythm * 0.25;
  const organicVocalChar = org * 0.35 + vocalPresence * 0.3 + melodicProminence * 0.25;
  const industrialSlabChar = (1 - org) * 0.35 + perc * 0.3 + t * 0.2 + d * 0.15;
  const displayScore = (aggressiveChar > 0.55 ? 0.5 : 0) + (hipHopLatinChar > 0.5 ? 0.35 : 0) + (e > 0.8 && i > 0.6 ? 0.4 : 0);
  const geometricScore = electronicChar * 0.5 + (1 - org) * 0.2 + percussiveVsPitched * 0.2 - (industrialSlabChar > 0.5 ? 0.15 : 0);
  const slabScore = industrialSlabChar * 0.8 + (b > 0.6 && perc > 0.5 ? 0.25 : 0);
  const editorialScore = organicVocalChar + (org > 0.55 ? 0.3 : 0) + (melodicProminence > 0.5 ? 0.25 : 0);
  const scores = { display: displayScore, geometric: geometricScore, slab: slabScore, editorial: editorialScore };
  const familyKey = Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const fontFamily = fontFamilies[familyKey];
  const typography_font_category = fontCategoryLabels[familyKey];
  const fontItalic = clamp(i * 0.6 + melodicProminence * 0.3 + (1 - org) * 0.2, 0, 1);

  // Modulación por género: alta energía/ritmo → más saturación; orgánico/melódico → más suave
  const highEnergyGenres = e * 0.35 + rhythm * 0.25 + (1 - org) * 0.25 + t * 0.15;
  const softGenres = org * 0.4 + melodicProminence * 0.3 + (1 - t) * 0.2 + (1 - e) * 0.1;
  const satGenreBoost = highEnergyGenres > 0.5 ? 0.1 : 0;
  const satGenreSoft = softGenres > 0.55 ? -0.07 : 0;
  const contrastGenreBoost = highEnergyGenres > 0.5 ? 0.08 : 0;

  const baseSat = fp?.satBase ?? (0.4 + e * 0.4 + dyn * 0.2);
  return {
    color_temperature: clamp(0.2 + b * 0.5 + (1 - org) * 0.2 + (1 - sw) * 0.15, 0, 1),
    saturation_intensity: clamp(baseSat * 0.9 + rhythmAccent.saturationBoost + (1 - t) * 0.15 + satGenreBoost + satGenreSoft, 0.25, 1),
    hue_base: hueBase,
    accent_hue_shift: rhythmAccent.accentHueShift,
    hue_oscillation: rhythmAccent.hueOscillation,
    contrast_level: clamp(0.5 + i * 0.4 + dyn * 0.15 + contrastGenreBoost, 0, 1),
    spatial_density: clamp(d * 0.8 + sw * 0.2 + layoutCompression * 0.3, 0, 1),
    motion_speed: clamp(0.2 + e * 0.5 + groove * 0.2, 0, 1),
    motion_elasticity: clamp(org * 0.8 + groove * 0.2, 0, 1),
    geometric_hardness: clamp(1 - org, 0, 1),
    blur_vs_sharpness: clamp(b, 0, 1),
    ornamental_richness: clamp(0.2 + t * 0.4 + o * 0.2, 0, 1),
    typography_weight_feel: clamp(0.4 + e * 0.5 + displayMode * 0.2 + dyn * 0.1 + vocalPresence * 0.15, 0, 1),
    typography_expansion: clamp(0.3 + mon * 0.5, 0, 1),
    transition_aggressiveness: clamp(0.2 + i * 0.5 + dyn * 0.2 + rhythm * 0.25 + (isBoundary ? 0.35 : 0) + sectionIntensity * 0.1, 0, 1),
    ambient_visual_tension: clamp(t * 0.7 + e * 0.2 + o * 0.15, 0, 1),
    display_mode: displayMode,
    visual_mode: visualMode,
    visual_preset: visualPreset,
    hue_offset: hueOffset,
    spectrum_prominence: spectrumProminence,
    lyric_prominence: lyricProminence,
    particle_density_factor: particleDensityFactor,
    typography_font_family: fontFamily,
    typography_font_category: typography_font_category,
    typography_font_italic: fontItalic,
    particle_mode_percussive: particleModePercussive,
    particle_mode_melodic: particleModeMelodic,
    particle_mode_organic: particleModeOrganic,
    particle_mode_mechanical: particleModeMechanical,
    particle_chroma_hue: particleChromaHue >= 0 ? particleChromaHue : -1,
    particle_chroma_strength: particleChromaStrength,
    particle_size_factor: particleSizeFactor,
    particle_density_boost: particleDensityBoost,
    param_hues: paramHues,
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export { VISUAL_KEYS };
