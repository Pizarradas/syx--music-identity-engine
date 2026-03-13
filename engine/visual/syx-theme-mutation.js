/**
 * Mutación de tema SYX — visual identity → CSS variables
 * La interfaz completa debe reaccionar a los cálculos del algoritmo.
 * docs/13_theming_engine_integration.md
 */
const root = typeof document !== 'undefined' ? document.documentElement : null;
const body = typeof document !== 'undefined' ? document.body : null;

const BASE_HUE = 200;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Oscilación suave para hue (ritmo)
 */
function hueWithOscillation(baseHue, oscillation, t = Date.now() / 1000) {
  const wave = Math.sin(t * 0.8) * oscillation;
  return (baseHue + wave + 360) % 360;
}

/**
 * Aplica estado visual al tema — toda la UI consume estas variables
 * Colores dinámicos por instrumentos, ritmo, tono
 * @param {Object} visual - VisualIdentityState (0-1)
 */
export function applyVisualToSyx(visual) {
  if (!root || !body) return;

  const temp = visual.color_temperature ?? 0.5;
  const sat = visual.saturation_intensity ?? 0.5;
  const contrast = visual.contrast_level ?? 0.5;
  const density = visual.spatial_density ?? 0.5;
  const motion = visual.motion_speed ?? 0.5;
  const hardness = visual.geometric_hardness ?? 0.5;
  const weight = visual.typography_weight_feel ?? 0.5;
  const expansion = visual.typography_expansion ?? 0.5;
  const tension = visual.ambient_visual_tension ?? 0.5;
  const hueOffset = visual.hue_offset ?? 0;
  const hueBase = visual.hue_base ?? BASE_HUE;
  const accentHueShift = visual.accent_hue_shift ?? 0;
  const hueOscillation = visual.hue_oscillation ?? 0;
  const displayMode = visual.display_mode ?? 0.5;
  const spectrumProminence = visual.spectrum_prominence ?? 0.7;
  const lyricProminence = visual.lyric_prominence ?? 0.7;
  const fontFamily = visual.typography_font_family ?? '"Cormorant Garamond", serif';
  const fontCategory = visual.typography_font_category ?? 'Serifa';
  const fontItalic = visual.typography_font_italic ?? 0;
  const fontStyle = fontItalic > 0.5 ? 'italic' : 'normal';
  const visualMode = visual.visual_mode ?? 0.5;
  const visualPreset = visual.visual_preset ?? 'minimal';

  const t = Date.now() / 1000;
  const hue = hueWithOscillation(hueBase + hueOffset * 80 + (temp - 0.5) * 120, hueOscillation, t);
  // Acentos que recorren toda la rueda: warm→naranja/rojo, cool→cian/verde
  const hueWarm = (hue + 60 + accentHueShift + 360) % 360;
  const hueCool = (hue - 60 + accentHueShift + 360) % 360;
  const hueComp = (hue + 180 + 360) % 360;
  const hueTriad1 = (hue + 120 + 360) % 360;
  const hueTriad2 = (hue + 240 + 360) % 360;

  // Croma amplificado: canciones distintas → paletas más diferenciadas (muted vs vivid)
  const chromaPulse = Math.sin(t * 2.5) * 0.03 * motion;
  const lightnessPulse = Math.sin(t * 1.8) * 0.02 * tension;
  const chroma = clamp(0.12 + sat * 0.6 + chromaPulse, 0.1, 0.7);
  const lightness = clamp(0.48 + (contrast - 0.5) * 0.32 + lightnessPulse, 0.32, 0.78);

  const motionMod = visualMode < 0.3 ? 0.5 : visualMode > 0.7 ? 1.35 : 0.9;
  root.style.setProperty('--syx-music-transition', `${320 + motion * 180 * motionMod}ms`);
  root.style.setProperty('--music-visual-mode', String(visualMode));
  root.style.setProperty('--syx-music-hue', String(hue));
  root.style.setProperty('--syx-music-chroma', String(chroma));
  root.style.setProperty('--syx-music-lightness', String(lightness));
  root.style.setProperty('--syx-music-primary', `oklch(${lightness} ${chroma} ${hue})`);
  root.style.setProperty('--syx-music-primary-subtle', `oklch(${lightness + 0.08} ${chroma * 0.5} ${hue})`);
  root.style.setProperty('--syx-music-primary-strong', `oklch(${Math.max(0.3, lightness - 0.1)} ${chroma * 1.2} ${hue})`);

  const intensityMod = visualMode < 0.3 ? 0.8 : visualMode > 0.7 ? 1.2 : 1.0;
  const ambientIntensity = (0.06 + tension * 0.35) * intensityMod;
  root.style.setProperty('--music-ambient-intensity', String(ambientIntensity));
  root.style.setProperty('--music-stage-intensity', String((0.1 + tension * 0.45) * intensityMod));
  root.style.setProperty('--ripple-intensity', String(visualMode < 0.3 ? 0.4 : visualMode > 0.7 ? 0.7 : 0.55));

  const bgIntensity = 0.06 + sat * 0.25 + tension * 0.12;
  root.style.setProperty('--music-bg-hue', String(hue));
  root.style.setProperty('--music-bg-intensity', String(bgIntensity));

  root.style.setProperty('--semantic-color-primary', `oklch(${lightness} ${chroma} ${hue})`);
  root.style.setProperty('--semantic-color-primary-subtle', `oklch(${lightness + 0.08} ${chroma * 0.6} ${hue})`);
  root.style.setProperty('--semantic-color-accent-warm', `oklch(${lightness} ${chroma * 1.1} ${hueWarm})`);
  root.style.setProperty('--semantic-color-accent-cool', `oklch(${lightness} ${chroma * 1.1} ${hueCool})`);
  root.style.setProperty('--semantic-color-accent-comp', `oklch(${lightness * 0.95} ${chroma * 0.7} ${hueComp})`);
  root.style.setProperty('--semantic-color-accent-triad-1', `oklch(${lightness + 0.04} ${chroma * 0.85} ${hueTriad1})`);
  root.style.setProperty('--semantic-color-accent-triad-2', `oklch(${lightness + 0.04} ${chroma * 0.85} ${hueTriad2})`);
  // Paleta extendida: variantes de luminosidad para más riqueza
  root.style.setProperty('--semantic-color-primary-muted', `oklch(${lightness + 0.12} ${chroma * 0.4} ${hue})`);
  root.style.setProperty('--semantic-color-primary-vivid', `oklch(${Math.max(0.25, lightness - 0.08)} ${chroma * 1.3} ${hue})`);
  root.style.setProperty('--semantic-color-accent-warm-muted', `oklch(${lightness + 0.1} ${chroma * 0.6} ${hueWarm})`);
  root.style.setProperty('--semantic-color-accent-cool-muted', `oklch(${lightness + 0.1} ${chroma * 0.6} ${hueCool})`);

  const center = typeof document !== 'undefined' ? document.querySelector('.org-app-center') : null;
  if (center) {
    /* Scrim adaptativo: más oscuro cuando el fondo es intenso (brightness, tension) */
    const scrim = Math.min(100, Math.round((0.5 + tension * 0.35 + sat * 0.4) * 100));
    center.style.setProperty('--music-center-scrim', String(scrim));
    center.style.setProperty('--music-center-spacing', `${0.75 + density * 0.75}rem`);
    center.style.setProperty('--music-center-radius', `${4 + (1 - hardness) * 12}px`);
    center.style.setProperty('--music-center-transition-duration', `${380 + motion * 180}ms`);
    center.style.setProperty('--music-center-font-weight', String(400 + Math.round(weight * 300)));
    center.style.setProperty('--music-center-font-style', fontStyle);
    center.style.setProperty('--music-center-letter-spacing', `${-0.02 + expansion * 0.08}em`);
    center.style.setProperty('--music-center-font-family', fontFamily);
    center.style.setProperty('--music-center-font-category', fontCategory);
    // También en root para que el Output en el sidebar herede las vars
    root.style.setProperty('--music-center-font-family', fontFamily);
    root.style.setProperty('--music-center-font-category', fontCategory);
    root.style.setProperty('--music-center-font-weight', String(400 + Math.round(weight * 300)));
    root.style.setProperty('--music-center-font-style', fontStyle);
    root.style.setProperty('--music-center-letter-spacing', `${-0.02 + expansion * 0.08}em`);
    // Escala tipográfica derivada de weight y expansion
    const typeScale = 0.85 + weight * 0.35 + expansion * 0.2;
    center.style.setProperty('--music-type-display', `${1.8 + typeScale * 1.2}rem`);
    center.style.setProperty('--music-type-h1', `${1.35 + typeScale * 0.6}rem`);
    center.style.setProperty('--music-type-h2', `${1.1 + typeScale * 0.35}rem`);
    center.style.setProperty('--music-type-h3', `${0.95 + typeScale * 0.2}rem`);
    center.style.setProperty('--music-type-body', `${0.875 + typeScale * 0.15}rem`);
    center.style.setProperty('--music-type-caption', `${0.7 + typeScale * 0.1}rem`);
    center.style.setProperty('--music-display-mode', String(displayMode));
    center.style.setProperty('--music-spectrum-prominence', String(spectrumProminence));
    center.style.setProperty('--music-lyric-prominence', String(lyricProminence));
  }

  body.setAttribute('data-music-active', 'true');
  body.setAttribute('data-visual-preset', visualPreset);
}

/**
 * Resetea mutaciones al estado base (cuando no hay reproducción)
 */
export function resetSyxTheme() {
  if (!root || !body) return;

  body.removeAttribute('data-music-active');

  [
    '--syx-music-transition', '--syx-music-hue', '--syx-music-chroma', '--syx-music-lightness',
    '--syx-music-primary', '--syx-music-primary-subtle', '--syx-music-primary-strong',
    '--music-ambient-intensity', '--music-stage-intensity',
    '--music-dashboard-pulse-scale', '--music-dashboard-ring-energy-opacity',
    '--music-dashboard-ring-tension-opacity', '--music-dashboard-ring-timbral-opacity',
    '--music-ring-radius-1', '--music-ring-radius-2', '--music-ring-radius-3',
  ].forEach((prop) => root.style.removeProperty(prop));

  root.style.removeProperty('--semantic-color-primary');
  root.style.removeProperty('--semantic-color-primary-subtle');
  root.style.removeProperty('--semantic-color-accent-warm');
  root.style.removeProperty('--semantic-color-accent-cool');
  root.style.removeProperty('--semantic-color-accent-comp');
  root.style.removeProperty('--semantic-color-accent-triad-1');
  root.style.removeProperty('--semantic-color-accent-triad-2');
  root.style.removeProperty('--semantic-color-primary-muted');
  root.style.removeProperty('--semantic-color-primary-vivid');
  root.style.removeProperty('--semantic-color-accent-warm-muted');
  root.style.removeProperty('--semantic-color-accent-cool-muted');
  root.style.removeProperty('--music-visual-mode');
  root.style.removeProperty('--ripple-intensity');
  body.removeAttribute('data-visual-preset');

  const center = typeof document !== 'undefined' ? document.querySelector('.org-app-center') : null;
  if (center) {
    ['--music-center-scrim', '--music-center-spacing', '--music-center-radius', '--music-center-transition-duration',
     '--music-center-font-weight', '--music-center-font-style', '--music-center-letter-spacing', '--music-center-font-family', '--music-center-font-category',
     '--music-type-display', '--music-type-h1', '--music-type-h2', '--music-type-h3', '--music-type-body', '--music-type-caption',
     '--music-display-mode', '--music-spectrum-prominence', '--music-lyric-prominence'].forEach((p) => center.style.removeProperty(p));
  }
  ['--music-center-font-family', '--music-center-font-category', '--music-center-font-weight', '--music-center-font-style', '--music-center-letter-spacing'].forEach((p) => root.style.removeProperty(p));
}
