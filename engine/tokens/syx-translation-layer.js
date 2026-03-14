/**
 * SYX Translation Layer — token foundations → SYX design tokens
 * docs/# SYX Translation Layer.md
 *
 * Convierte foundations abstractas en tokens válidos para SYX.
 * No manipula CSS/UI directamente; produce tokens que SYX interpreta.
 */

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

const BASE_HUE = 200;

/**
 * Traduce token foundations a tema SYX
 * @param {Object} foundations - Token foundations (color_temperature, motion_speed, etc.)
 * @param {Object} options - { hueBase, hueOffset, keyHue }
 * @returns {Object} SYX theme tokens (valores listos para CSS)
 */
export function foundationsToSyxTheme(foundations, options = {}) {
  const temp = foundations.color_temperature ?? 0.5;
  const sat = foundations.saturation_intensity ?? 0.5;
  const contrast = foundations.contrast_level ?? 0.5;
  const accent = foundations.accent_energy ?? 0.5;

  const typeWeight = foundations.type_weight ?? 0.5;
  const typeWidth = foundations.type_width ?? 0.5;
  const typeTension = foundations.type_tension ?? 0.5;

  const spatialDensity = foundations.spatial_density ?? 0.5;
  const layoutOpenness = foundations.layout_openness ?? 0.5;
  const elementSpacing = foundations.element_spacing ?? 0.5;

  const shapeHardness = foundations.shape_hardness ?? 0.5;
  const cornerRoundness = foundations.corner_roundness ?? 0.5;
  const edgeAggression = foundations.edge_aggression ?? 0.5;

  const motionSpeed = foundations.motion_speed ?? 0.5;
  const motionSmoothness = foundations.motion_smoothness ?? 0.5;
  const motionAggression = foundations.motion_aggression ?? 0.5;
  const motionDecay = foundations.motion_decay ?? 0.5;

  const blurLevel = foundations.blur_level ?? 0.5;
  const grainLevel = foundations.grain_level ?? 0.5;
  const shadowDepth = foundations.shadow_depth ?? 0.5;
  const transparency = foundations.transparency ?? 0.5;

  const hueBase = options.hueBase ?? options.keyHue ?? BASE_HUE;
  const hueOffset = options.hueOffset ?? 0;

  // color_temperature → SYX color palette
  const hue = (hueBase + hueOffset * 80 + (temp - 0.5) * 120 + 360) % 360;
  const chroma = 0.2 + sat * 0.45;
  const lightness = 0.52 + (contrast - 0.5) * 0.22;
  const hueWarm = (hue + 60 + 360) % 360;
  const hueCool = (hue - 60 + 360) % 360;
  const hueComp = (hue + 180 + 360) % 360;

  // motion_speed → SYX motion tokens
  const transitionDuration = 320 + motionSpeed * 180;
  const transitionEasing = motionSmoothness > 0.6 ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'cubic-bezier(0.2, 0, 0, 1)';

  // shape_hardness → SYX border radius tokens
  const radiusSm = 2 + (1 - shapeHardness) * 4;
  const radiusMd = 4 + (1 - shapeHardness) * 8;
  const radiusLg = 8 + (1 - shapeHardness) * 16;

  // surface_depth → SYX elevation tokens
  const shadowBlur = 4 + shadowDepth * 20;
  const shadowOpacity = 0.1 + shadowDepth * 0.25;

  return {
    // Color palette
    color: {
      primary: `oklch(${lightness} ${chroma} ${hue})`,
      primarySubtle: `oklch(${lightness + 0.08} ${chroma * 0.5} ${hue})`,
      primaryStrong: `oklch(${Math.max(0.3, lightness - 0.1)} ${chroma * 1.2} ${hue})`,
      accentWarm: `oklch(${lightness} ${chroma * (1 + accent * 0.2)} ${hueWarm})`,
      accentCool: `oklch(${lightness} ${chroma * (1 + accent * 0.2)} ${hueCool})`,
      accentComp: `oklch(${lightness * 0.95} ${chroma * 0.7} ${hueComp})`,
      hue,
      chroma,
      lightness,
    },

    // Typography
    typography: {
      weight: 400 + Math.round(typeWeight * 300),
      letterSpacing: `${-0.02 + typeWidth * 0.08}em`,
      tension: typeTension,
      expression: typeTension,
    },

    // Space
    space: {
      density: spatialDensity,
      openness: layoutOpenness,
      spacing: `${0.5 + elementSpacing * 1.5}rem`,
      spacingSm: `${0.25 + elementSpacing * 0.5}rem`,
      spacingMd: `${0.5 + elementSpacing * 1}rem`,
      spacingLg: `${1 + elementSpacing * 2}rem`,
    },

    // Shape
    shape: {
      hardness: shapeHardness,
      radiusSm: `${radiusSm}px`,
      radiusMd: `${radiusMd}px`,
      radiusLg: `${radiusLg}px`,
      cornerRoundness,
      edgeAggression,
    },

    // Motion
    motion: {
      speed: motionSpeed,
      duration: `${transitionDuration}ms`,
      easing: transitionEasing,
      aggression: motionAggression,
      decay: motionDecay,
    },

    // Surface
    surface: {
      blur: blurLevel,
      grain: grainLevel,
      shadowBlur: `${shadowBlur}px`,
      shadowOpacity,
      transparency,
    },
  };
}

/**
 * Convierte tema SYX a CSS custom properties (para inyección en :root)
 * @param {Object} syxTheme - Salida de foundationsToSyxTheme
 * @param {Object} options - { fontFamily } para tipografía (cuando viene de visual identity)
 * @returns {Object} { root: { '--syx-*': value }, center?: { '--music-*': value } }
 */
export function syxThemeToCssVars(syxTheme, options = {}) {
  const c = syxTheme.color;
  const t = syxTheme.typography;
  const s = syxTheme.space;
  const sh = syxTheme.shape;
  const m = syxTheme.motion;
  const sf = syxTheme.surface;

  const hueTriad1 = (c.hue + 120 + 360) % 360;
  const hueTriad2 = (c.hue + 240 + 360) % 360;
  const chromaNum = typeof c.chroma === 'string' ? parseFloat(c.chroma) : c.chroma;
  const lightnessNum = typeof c.lightness === 'string' ? parseFloat(c.lightness) : c.lightness;
  const primaryMuted = `oklch(${lightnessNum + 0.12} ${chromaNum * 0.4} ${c.hue})`;
  const primaryVivid = `oklch(${Math.max(0.25, lightnessNum - 0.08)} ${chromaNum * 1.3} ${c.hue})`;
  const accentTriad1 = `oklch(${lightnessNum + 0.04} ${chromaNum * 0.85} ${hueTriad1})`;
  const accentTriad2 = `oklch(${lightnessNum + 0.04} ${chromaNum * 0.85} ${hueTriad2})`;

  const hueCool = (c.hue - 60 + 360) % 360;
  const bgBase = `oklch(0.12 ${chromaNum * 0.15} ${c.hue})`;
  const bgElevated = `oklch(0.16 ${chromaNum * 0.12} ${c.hue})`;
  const bgSubtle = `oklch(0.14 ${chromaNum * 0.2} ${(c.hue + 30) % 360})`;
  const bgAccent = `oklch(0.1 ${chromaNum * 0.08} ${hueCool})`;
  const root = {
    '--syx-music-hue': String(c.hue),
    '--syx-music-chroma': String(c.chroma),
    '--syx-music-lightness': String(c.lightness),
    '--syx-music-primary': c.primary,
    '--syx-music-primary-subtle': c.primarySubtle,
    '--syx-music-primary-strong': c.primaryStrong,
    '--syx-music-transition': m.duration,
    '--semantic-color-primary': c.primary,
    '--semantic-color-primary-subtle': c.primarySubtle,
    '--semantic-color-primary-strong': c.primaryStrong,
    '--semantic-color-primary-muted': primaryMuted,
    '--semantic-color-primary-vivid': primaryVivid,
    '--semantic-color-accent-warm': c.accentWarm,
    '--semantic-color-accent-cool': c.accentCool,
    '--semantic-color-accent-comp': c.accentComp,
    '--semantic-color-accent-triad-1': accentTriad1,
    '--semantic-color-accent-triad-2': accentTriad2,
    '--surface-bg': bgBase,
    '--surface-bg-elevated': bgElevated,
    '--surface-bg-subtle': bgSubtle,
    '--surface-bg-accent': bgAccent,
    '--space-xs': '0.25rem',
    '--space-sm': s.spacingSm || '0.5rem',
    '--space-md': s.spacingMd || '0.75rem',
    '--space-lg': s.spacingLg || '1.25rem',
    '--space-xl': '2rem',
    '--space-2xl': '3rem',
    '--space-3xl': '4rem',
    '--line-height-tight': '1.2',
    '--line-height-normal': '1.5',
    '--line-height-relaxed': '1.65',
    '--music-bg-hue': String(c.hue),
    '--music-bg-intensity': String(0.06 + chromaNum * 0.3),
    '--music-ambient-intensity': String(0.06 + sf.shadowOpacity * 0.5),
    '--music-stage-intensity': String(0.1 + sf.shadowOpacity * 0.4),
  };

  const fontFamily = options.fontFamily ?? '"DM Sans", system-ui, sans-serif';
  const center = {
    '--music-center-spacing': s.spacing,
    '--music-center-radius': sh.radiusMd,
    '--music-center-transition-duration': m.duration,
    '--music-center-font-weight': String(t.weight),
    '--music-center-font-family': fontFamily,
    '--music-center-letter-spacing': t.letterSpacing,
    '--music-type-display': '2rem',
    '--music-type-h1': '1.5rem',
    '--music-type-h2': '1.2rem',
    '--music-type-body': '0.95rem',
    '--music-type-caption': '0.8rem',
  };

  return { root, center };
}

/**
 * Aplica tema SYX al DOM (document.documentElement y .org-app-center)
 */
export function applySyxThemeToDom(syxTheme, options = {}) {
  if (typeof document === 'undefined') return;
  const { root, center } = syxThemeToCssVars(syxTheme, options);
  const el = document.documentElement;
  const centerEl = document.querySelector('.org-app-center');
  for (const [k, v] of Object.entries(root)) el.style.setProperty(k, v);
  if (centerEl) for (const [k, v] of Object.entries(center)) centerEl.style.setProperty(k, v);
  document.body?.setAttribute('data-music-active', 'true');
}
