/**
 * Mutación de tema SYX — visual identity → CSS variables
 * La interfaz completa debe reaccionar a los cálculos del algoritmo.
 * docs/13_theming_engine_integration.md
 * Usa culori para gamut mapping (colores mostrables en sRGB)
 */
import { formatOklchCss } from './color-utils.js';

const root = typeof document !== 'undefined' ? document.documentElement : null;
const body = typeof document !== 'undefined' ? document.body : null;

const BASE_HUE = 200;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function chromaForWarmHue(hue, baseChroma, minWarm = 0.3) {
  const h = ((hue % 360) + 360) % 360;
  return (h <= 60 || h >= 330) ? Math.max(baseChroma, minWarm) : baseChroma;
}

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
  let hueBaseFinal = hueBase + hueOffset * 80 + (temp - 0.5) * 120;
  const genreDetected = String(visual.genre_detected ?? '');
  const isFolkCeltic = /folk|celtic|irish|medieval|acoustic/i.test(genreDetected);
  const hueNorm = (hueBaseFinal + 360) % 360;
  if (isFolkCeltic && (hueNorm <= 85 || hueNorm >= 295)) {
    hueBaseFinal = hueBaseFinal * 0.35 + 172 * 0.65;
  }
  const hue = hueWithOscillation(hueBaseFinal, hueOscillation, t);
  // Folk/celtic: acentos solo en gama fría (azules, verdes, blancos) — sin rojos ni magentas
  let hueWarm, hueCool, hueTriad1, hueTriad2, hueSplit1, hueSplit2, hueTetrad;
  if (isFolkCeltic) {
    hueWarm = (hue + 45 + accentHueShift + 360) % 360;   // cyan/azul en vez de magenta
    hueCool = (hue + 95 + accentHueShift + 360) % 360;   // azul en vez de amarillo
    hueTriad1 = hueWarm;
    hueTriad2 = hueCool;
    hueSplit1 = (hue + 65 + 360) % 360;
    hueSplit2 = (hue + 125 + 360) % 360;
    hueTetrad = (hue + 70 + 360) % 360;
  } else {
    hueWarm = (hue + 120 + accentHueShift + 360) % 360;
    hueCool = (hue + 240 + accentHueShift + 360) % 360;
    hueTriad1 = (hue + 120 + 360) % 360;
    hueTriad2 = (hue + 240 + 360) % 360;
    hueSplit1 = (hue + 150 + 360) % 360;
    hueSplit2 = (hue + 210 + 360) % 360;
    hueTetrad = (hue + 90 + 360) % 360;
  }
  const hueComp = isFolkCeltic ? (hue + 88 + 360) % 360 : (hue + 180 + 360) % 360;  // folk: azul en vez de rojo

  // OKLCH: L y C independientes — variación perceptualmente uniforme
  const chromaBias = visual.chroma_bias ?? 0.5;
  const chromaPulse = Math.sin(t * 2.5) * 0.03 * motion;
  const lightnessPulse = Math.sin(t * 1.8) * 0.02 * tension;
  const chromaRaw = 0.12 + sat * 0.65 + chromaPulse;
  const chromaMod = 0.5 + chromaBias;
  const chromaMin = chromaBias < 0.4 ? 0.08 : 0.12;
  const chromaMax = chromaBias > 0.7 ? 0.48 : 0.42;
  const chroma = clamp(chromaRaw * chromaMod, chromaMin, chromaMax);
  const lightness = clamp(0.48 + (contrast - 0.5) * 0.35 + lightnessPulse, 0.28, 0.82);
  const chromaMuted = chroma * 0.35;
  const chromaVivid = Math.min(0.45, chroma * 1.4);
  const lightnessDark = Math.max(0.2, lightness - 0.15);
  const lightnessLight = Math.min(0.92, lightness + 0.18);
  const sharpness = visual.blur_vs_sharpness ?? 0.5;
  const colorWeights = visual.color_weights ?? {};
  const neutralLightRatio = colorWeights.neutralLightRatio ?? 0.5;
  const neutralChroma = (sharpness > 0.6 && tension < 0.5) ? 0.02 : clamp(chroma * 0.2, 0.015, 0.08);
  const neutralLightness = 0.52 + (contrast - 0.5) * 0.2;
  const lightL = 0.85 + neutralLightRatio * 0.12;
  const darkL = 0.22 - (1 - neutralLightRatio) * 0.08;
  const neutralLight = `oklch(${lightL} ${neutralChroma} ${hue})`;
  const neutralDark = `oklch(${darkL} ${neutralChroma} ${hue})`;
  const hueSecondary = (visual.secondary_hue != null ? visual.secondary_hue : (hue + 120 + 360) % 360);

  const motionMod = visualMode < 0.3 ? 0.5 : visualMode > 0.7 ? 1.35 : 0.9;
  root.style.setProperty('--syx-music-transition', `${320 + motion * 180 * motionMod}ms`);
  root.style.setProperty('--music-visual-mode', String(visualMode));
  root.style.setProperty('--syx-music-hue', String(hue));
  root.style.setProperty('--syx-music-chroma', String(chroma));
  root.style.setProperty('--syx-music-lightness', String(lightness));
  root.style.setProperty('--oklch-primary-l', String(lightness));
  root.style.setProperty('--oklch-primary-c', String(chroma));
  root.style.setProperty('--oklch-primary-h', `${hue}`);
  root.style.setProperty('--syx-music-primary', `oklch(${lightness} ${chroma} ${hue})`);
  root.style.setProperty('--syx-music-primary-subtle', `oklch(${lightness + 0.08} ${chromaMuted} ${hue})`);
  root.style.setProperty('--syx-music-primary-strong', `oklch(${lightnessDark} ${chromaVivid} ${hue})`);

  const intensityMod = visualMode < 0.3 ? 0.8 : visualMode > 0.7 ? 1.2 : 1.0;
  const ambientIntensity = (0.06 + tension * 0.35) * intensityMod;
  root.style.setProperty('--music-ambient-intensity', String(ambientIntensity));
  root.style.setProperty('--music-stage-intensity', String((0.1 + tension * 0.45) * intensityMod));
  root.style.setProperty('--ripple-intensity', String(visualMode < 0.3 ? 0.4 : visualMode > 0.7 ? 0.7 : 0.55));

  const bgIntensity = 0.06 + sat * 0.25 + tension * 0.12;
  root.style.setProperty('--music-bg-hue', String(hue));
  root.style.setProperty('--music-bg-intensity', String(bgIntensity));

  // Colores de fondo derivados de la paleta — variación cromática sutil
  const bgBase = `oklch(0.12 ${chroma * 0.15} ${hue})`;
  const bgElevated = `oklch(0.16 ${chroma * 0.12} ${hue})`;
  const bgSubtle = `oklch(0.14 ${chroma * 0.2} ${(hue + 30) % 360})`;
  const bgAccent = `oklch(0.1 ${chroma * 0.08} ${hueCool})`;
  root.style.setProperty('--surface-bg', bgBase);
  root.style.setProperty('--surface-bg-elevated', bgElevated);
  root.style.setProperty('--surface-bg-subtle', bgSubtle);
  root.style.setProperty('--surface-bg-accent', bgAccent);

  // Sistema de espacios — derivado de spatial_density (density ya declarado arriba)
  const spaceBase = 0.25 + (1 - density) * 0.5;
  root.style.setProperty('--space-xs', `${spaceBase * 0.5}rem`);
  root.style.setProperty('--space-sm', `${spaceBase}rem`);
  root.style.setProperty('--space-md', `${spaceBase * 1.5}rem`);
  root.style.setProperty('--space-lg', `${spaceBase * 2.5}rem`);
  root.style.setProperty('--space-xl', `${spaceBase * 4}rem`);
  root.style.setProperty('--space-2xl', `${spaceBase * 6}rem`);
  root.style.setProperty('--space-3xl', `${spaceBase * 8}rem`);

  // Line-height para escala tipográfica
  const typeScale = 0.85 + weight * 0.35 + expansion * 0.2;
  root.style.setProperty('--line-height-tight', '1.2');
  root.style.setProperty('--line-height-normal', '1.5');
  root.style.setProperty('--line-height-relaxed', '1.65');

  root.style.setProperty('--semantic-color-primary', formatOklchCss(lightness, chroma, hue));
  root.style.setProperty('--semantic-color-primary-ryb', formatOklchCss(lightness, chromaVivid, hue));
  root.style.setProperty('--semantic-color-primary-subtle', `oklch(${lightness + 0.08} ${chroma * 0.6} ${hue})`);
  root.style.setProperty('--semantic-color-secondary-1', `oklch(${lightness + 0.04} ${chromaForWarmHue(hueSecondary, chroma * 0.9, 0.28)} ${hueSecondary})`);
  root.style.setProperty('--semantic-color-neutral', `oklch(${neutralLightness} ${neutralChroma} ${hue})`);
  root.style.setProperty('--semantic-color-neutral-light', neutralLight);
  root.style.setProperty('--semantic-color-neutral-dark', neutralDark);
  root.style.setProperty('--semantic-color-white', 'oklch(0.98 0 0)');
  root.style.setProperty('--semantic-color-black', 'oklch(0.06 0 0)');
  root.style.setProperty('--semantic-color-accent-warm', formatOklchCss(lightness, chromaForWarmHue(hueWarm, chromaVivid, 0.32), hueWarm));
  root.style.setProperty('--semantic-color-accent-cool', formatOklchCss(lightness, chromaForWarmHue(hueCool, chromaVivid, 0.32), hueCool));
  root.style.setProperty('--semantic-color-accent-comp', `oklch(${lightness * 0.95} ${chromaForWarmHue(hueComp, chroma * 0.95, 0.3)} ${hueComp})`);
  root.style.setProperty('--semantic-color-accent-triad-1', `oklch(${lightness + 0.04} ${chromaForWarmHue(hueTriad1, chromaVivid, 0.32)} ${hueTriad1})`);
  root.style.setProperty('--semantic-color-accent-triad-2', `oklch(${lightness + 0.04} ${chromaForWarmHue(hueTriad2, chromaVivid, 0.32)} ${hueTriad2})`);
  root.style.setProperty('--semantic-color-accent-split-1', `oklch(${lightness + 0.06} ${chroma * 0.9} ${hueSplit1})`);
  root.style.setProperty('--semantic-color-accent-split-2', `oklch(${lightness + 0.06} ${chroma * 0.9} ${hueSplit2})`);
  root.style.setProperty('--semantic-color-accent-tetrad', `oklch(${lightnessLight * 0.9} ${chroma * 0.85} ${hueTetrad})`);
  root.style.setProperty('--semantic-color-primary-muted', `oklch(${lightnessLight} ${chromaMuted} ${hue})`);
  root.style.setProperty('--semantic-color-primary-vivid', `oklch(${lightnessDark} ${chromaVivid} ${hue})`);
  root.style.setProperty('--semantic-color-accent-warm-muted', `oklch(${lightnessLight} ${chroma * 0.55} ${hueWarm})`);
  root.style.setProperty('--semantic-color-accent-cool-muted', `oklch(${lightnessLight} ${chroma * 0.55} ${hueCool})`);

  // Tokens tipográficos — cada nivel usa un tono distinto de la paleta para riqueza cromática
  root.style.setProperty('--semantic-color-type-display', `oklch(${lightness} ${chromaVivid} ${hue})`);
  root.style.setProperty('--semantic-color-type-h1', `oklch(${lightness} ${chromaVivid} ${hueWarm})`);
  root.style.setProperty('--semantic-color-type-h2', `oklch(${lightness + 0.04} ${chroma * 0.9} ${hueCool})`);
  root.style.setProperty('--semantic-color-type-h3', `oklch(${lightness + 0.04} ${chromaVivid} ${hueTriad1})`);
  root.style.setProperty('--semantic-color-type-body', `oklch(${lightnessLight} ${chromaMuted} ${hue})`);
  root.style.setProperty('--semantic-color-type-caption', `oklch(${lightnessLight} ${chroma * 0.5} ${hueCool})`);
  // Tokens para botones/badges secundarios
  root.style.setProperty('--semantic-color-btn-outline', `oklch(${lightness} ${chromaVivid} ${hueWarm})`);
  root.style.setProperty('--semantic-color-btn-ghost', `oklch(${lightness + 0.06} ${chroma * 0.9} ${hueCool})`);
  root.style.setProperty('--semantic-color-badge-outline', `oklch(${lightness} ${chromaVivid} ${hueTriad1})`);
  root.style.setProperty('--semantic-color-badge-soft', `oklch(${lightnessLight} ${chroma * 0.55} ${hueCool})`);

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
  root.style.removeProperty('--semantic-color-primary-ryb');
  root.style.removeProperty('--semantic-color-primary-subtle');
  root.style.removeProperty('--semantic-color-secondary-1');
  root.style.removeProperty('--semantic-color-neutral');
  root.style.removeProperty('--semantic-color-neutral-light');
  root.style.removeProperty('--semantic-color-neutral-dark');
  root.style.removeProperty('--semantic-color-white');
  root.style.removeProperty('--semantic-color-black');
  root.style.removeProperty('--semantic-color-accent-warm');
  root.style.removeProperty('--semantic-color-accent-cool');
  root.style.removeProperty('--semantic-color-accent-comp');
  root.style.removeProperty('--semantic-color-accent-triad-1');
  root.style.removeProperty('--semantic-color-accent-triad-2');
  root.style.removeProperty('--semantic-color-primary-muted');
  root.style.removeProperty('--semantic-color-primary-vivid');
  root.style.removeProperty('--semantic-color-accent-warm-muted');
  root.style.removeProperty('--semantic-color-accent-cool-muted');
  root.style.removeProperty('--semantic-color-accent-split-1');
  root.style.removeProperty('--semantic-color-accent-split-2');
  root.style.removeProperty('--semantic-color-accent-tetrad');
  root.style.removeProperty('--semantic-color-type-display');
  root.style.removeProperty('--semantic-color-type-h1');
  root.style.removeProperty('--semantic-color-type-h2');
  root.style.removeProperty('--semantic-color-type-h3');
  root.style.removeProperty('--semantic-color-type-body');
  root.style.removeProperty('--semantic-color-type-caption');
  root.style.removeProperty('--semantic-color-btn-outline');
  root.style.removeProperty('--semantic-color-btn-ghost');
  root.style.removeProperty('--semantic-color-badge-outline');
  root.style.removeProperty('--semantic-color-badge-soft');
  root.style.removeProperty('--surface-bg');
  root.style.removeProperty('--surface-bg-elevated');
  root.style.removeProperty('--surface-bg-subtle');
  root.style.removeProperty('--surface-bg-accent');
  root.style.removeProperty('--space-xs');
  root.style.removeProperty('--space-sm');
  root.style.removeProperty('--space-md');
  root.style.removeProperty('--space-lg');
  root.style.removeProperty('--space-xl');
  root.style.removeProperty('--space-2xl');
  root.style.removeProperty('--space-3xl');
  root.style.removeProperty('--line-height-tight');
  root.style.removeProperty('--line-height-normal');
  root.style.removeProperty('--line-height-relaxed');
  root.style.removeProperty('--oklch-primary-l');
  root.style.removeProperty('--oklch-primary-c');
  root.style.removeProperty('--oklch-primary-h');
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
