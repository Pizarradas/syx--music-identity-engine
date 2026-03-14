/**
 * Fondo orgánico — gradientes animados + formas HTML/CSS + partículas sutiles
 * Modo decorativo: animación suave basada solo en tiempo, no reacciona al audio
 */
import { getSuperposedVibration } from '../engine/index.js';

const root = typeof document !== 'undefined' ? document.documentElement : null;

const PARTICLE_COUNT = 48;

export function initOrganicBackground() {
  const container = document.getElementById('organic-particles');
  if (!container) return;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'org-organic-particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.width = p.style.height = `${2 + Math.random() * 3}px`;
    p.style.animationDelay = `${Math.random() * 12}s`;
    p.style.animationDuration = `${18 + Math.random() * 14}s`;
    container.appendChild(p);
  }
}
const DECORATIVE_MODE = true; // fondo decorativo, no reacciona a la música

/** Cache de valores para solo actualizar cuando cambian (reduce reflows) */
const cache = {};
const CACHE_EPS = 0.008;
function setIfChanged(prop, value) {
  const prev = cache[prop];
  const str = String(value);
  const num = parseFloat(str);
  const changed = prev === undefined || prev !== str &&
    (isNaN(num) || Math.abs(parseFloat(prev) - num) > CACHE_EPS);
  if (changed) {
    cache[prop] = str;
    root.style.setProperty(prop, str);
  }
}

/** Intervalos cromáticos (12 semitonos = 30° cada uno) */
const HUE_STEP = 30;

/**
 * Intensidad (0-1) → Temperatura de color
 * Recorre toda la rueda: frío (azul/cian) → cálido (naranja/rojo) → amarillo → verde
 */
function intensityToHue(e) {
  return (220 + e * 200) % 360;
}

/**
 * Agudos (timbral_brightness 0-1) → Estridencia (saturación, luminosidad)
 * Rango ampliado para colores más brillantes y vibrantes
 */
function brightnessToStridency(b) {
  // Suavizar picos de brillo para evitar fondos que restan legibilidad
  const damped = b > 0.8 ? 0.8 + (b - 0.8) * 0.5 : b;
  return {
    chroma: 0.28 + damped * 0.45,
    lightness: 0.38 + damped * 0.38,
  };
}

/**
 * Paleta cromática — variación según música para mayor diferenciación entre tracks.
 * Usa spectral_width y dynamic_range para amplitud; bandData para acentos cálidos/fríos.
 */
function computeChromaticPalette(hueBase, semantic, bandData) {
  const sw = semantic?.spectral_width ?? 0.5;
  const dyn = semantic?.dynamic_range ?? 0.5;
  const tension = semantic?.harmonic_tension ?? 0.5;
  const bass = bandData?.bass ?? 0.33;
  const highs = bandData?.highs ?? 0.33;

  // Variación dinámica: tracks con más espectro/dinámica → paleta más amplia
  const baseVariation = 12;
  const dynamicVariation = (sw * 0.5 + dyn * 0.5) * 48; // hasta +48° en tracks ricos
  const HUE_VARIATION = Math.min(60, baseVariation + dynamicVariation);

  const hues = [];
  for (let i = 0; i < 6; i++) {
    const offset = (i - 2.5) * (HUE_VARIATION / 2.5);
    let h = hueBase + offset;

    // Sesgo por bandas: más bass → tonos cálidos; más highs → tonos fríos
    const bassBias = (bass - 0.33) * 25;
    const highsBias = (highs - 0.33) * -20;
    h += bassBias + highsBias;

    if (h < 0) h += 360;
    if (h >= 360) h -= 360;
    hues.push(h);
  }
  return hues;
}

/**
 * Mapea estado semántico + bandas + visual → variables CSS para gradientes ricos
 * @param {Object} semantic - variables semánticas 0-1
 * @param {Object} bandData - { bass, mids, highs }
 * @param {Object} visual - { hue_base } opcional, tonalidad detectada
 */
export function updateOrganicBackground(semantic, bandData = { bass: 0.33, mids: 0.33, highs: 0.33 }, visual = null) {
  if (!root) return;

  const e = DECORATIVE_MODE ? 0.5 : (semantic?.energy_level ?? 0.5);
  const tension = DECORATIVE_MODE ? 0.5 : (semantic?.harmonic_tension ?? 0.5);
  const b = DECORATIVE_MODE ? 0.5 : (semantic?.timbral_brightness ?? 0.5);
  const org = DECORATIVE_MODE ? 0.6 : (semantic?.organicity_vs_mechanicality ?? 0.5);
  const rhythm = DECORATIVE_MODE ? 0.5 : (semantic?.rhythmic_pressure ?? 0.5);
  const groove = DECORATIVE_MODE ? 0.5 : (semantic?.groove ?? 0.5);
  const sw = DECORATIVE_MODE ? 0.5 : (semantic?.spectral_width ?? 0.5);

  const bass = DECORATIVE_MODE ? 0.33 : (bandData.bass ?? 0.33);
  const mids = DECORATIVE_MODE ? 0.33 : (bandData.mids ?? 0.33);
  const highs = DECORATIVE_MODE ? 0.33 : (bandData.highs ?? 0.33);

  const t = Date.now() / 1000;
  const vibration = DECORATIVE_MODE ? 0.15 * Math.sin(t * 0.4) : getSuperposedVibration(t, bass, mids, highs);

  // Hue base: tonalidad detectada (visual) o azul/violeta fijo — sin deriva arcoíris
  let hueBase = (visual?.hue_base != null)
    ? visual.hue_base
    : 265;
  if (hueBase < 0) hueBase += 360;
  if (hueBase >= 360) hueBase -= 360;

  const stridency = brightnessToStridency(b);

  // Fase 3: paleta de 6 hues que recorre el círculo cromático
  const palette = computeChromaticPalette(hueBase, semantic, bandData);

  // Saturación y luminosidad por stop — rango ampliado para colores brillantes
  const sat1 = stridency.chroma;
  const sat2 = 0.22 + tension * 0.45 + b * 0.25;
  const sat3 = 0.18 + (1 - tension) * 0.35 + sw * 0.2;
  const lum1 = stridency.lightness;
  const lum2 = 0.32 + (1 - tension) * 0.28 + b * 0.18;
  const lum3 = 0.25 + tension * 0.25 + b * 0.15;

  // Intensidad — líquidos y fluidos que cambian con el algoritmo
  let intensity = 0.5 + e * 0.4 + tension * 0.2 + b * 0.25;
  const visualMode = visual?.visual_mode ?? 0.5;
  const intensityMod = visualMode < 0.3 ? 0.75 : visualMode > 0.7 ? 1.1 : 0.95;
  intensity *= intensityMod;
  // Evitar fondos demasiado brillantes que restan legibilidad al centro
  if (b > 0.75 || (e > 0.8 && tension > 0.6)) intensity *= 0.82;

  // Variables para gradiente de 6 stops (setIfChanged evita reflows innecesarios)
  setIfChanged('--organic-bg-hue-1', palette[0]);
  setIfChanged('--organic-bg-hue-2', palette[1]);
  setIfChanged('--organic-bg-hue-3', palette[2]);
  setIfChanged('--organic-bg-hue-4', palette[3]);
  setIfChanged('--organic-bg-hue-5', palette[4]);
  setIfChanged('--organic-bg-hue-6', palette[5]);
  setIfChanged('--organic-bg-sat-1', sat1);
  setIfChanged('--organic-bg-sat-2', sat2);
  setIfChanged('--organic-bg-sat-3', sat3);
  setIfChanged('--organic-bg-lum-1', lum1);
  setIfChanged('--organic-bg-lum-2', lum2);
  setIfChanged('--organic-bg-lum-3', lum3);
  setIfChanged('--organic-bg-intensity', Math.min(1.25, intensity));
  setIfChanged('--organic-bg-position', `${50 + vibration * 22}% ${50 + rhythm * 14}%`);
  setIfChanged('--organic-bg-scale', 1.1 + e * 0.5 + groove * 0.25);

  // Blobs: cada uno toma un hue de la paleta (más variedad cromática)
  const blob1Scale = 0.8 + e * 0.6;
  const blob2Scale = 0.6 + tension * 0.5;
  const blob3Scale = 0.5 + org * 0.5;
  const blob4Scale = 0.4 + rhythm * 0.4;

  setIfChanged('--organic-blob-1-scale', blob1Scale);
  setIfChanged('--organic-blob-2-scale', blob2Scale);
  setIfChanged('--organic-blob-3-scale', blob3Scale);
  setIfChanged('--organic-blob-4-scale', blob4Scale);

  setIfChanged('--organic-blob-1-hue', palette[0]);
  setIfChanged('--organic-blob-2-hue', palette[2]);
  setIfChanged('--organic-blob-3-hue', palette[4]);
  setIfChanged('--organic-blob-4-hue', palette[1]);

  const preset = visual?.visual_preset ?? 'minimal';
  const blobMod = preset === 'minimal' ? 0.7 : preset === 'ambient' ? 1.0 : 0.85;
  setIfChanged('--organic-blob-1-opacity', (0.2 + e * 0.35) * blobMod);
  setIfChanged('--organic-blob-2-opacity', (0.16 + tension * 0.28) * blobMod);
  setIfChanged('--organic-blob-3-opacity', (0.12 + org * 0.22) * blobMod);
  setIfChanged('--organic-blob-4-opacity', (0.1 + rhythm * 0.2) * blobMod);
  setIfChanged('--organic-blob-chroma', 0.25 + b * 0.4 + e * 0.15);
  setIfChanged('--organic-blob-lum', 0.5 + b * 0.22 + tension * 0.12);

  const radiusVar = org;
  setIfChanged('--organic-blob-1-radius', `${30 + radiusVar * 40}% ${70 - radiusVar * 30}% ${60 + radiusVar * 20}% ${40 - radiusVar * 20}%`);
  setIfChanged('--organic-blob-2-radius', `${60 - radiusVar * 25}% ${40 + radiusVar * 35}% ${50 + radiusVar * 25}% ${50 - radiusVar * 25}%`);
  setIfChanged('--organic-blob-3-radius', `${45 + radiusVar * 30}% ${55 - radiusVar * 25}% ${70 + radiusVar * 20}% ${30 - radiusVar * 15}%`);
  setIfChanged('--organic-blob-4-radius', `${55 - radiusVar * 20}% ${45 + radiusVar * 30}% ${35 + radiusVar * 40}% ${65 - radiusVar * 30}%`);

  const offsetX = vibration * 12 + Math.sin(t * 0.3) * 4;
  const offsetY = Math.sin(t * 0.5) * 8 + rhythm * 6;
  setIfChanged('--organic-blob-1-pos-x', `${50 + offsetX}%`);
  setIfChanged('--organic-blob-1-pos-y', `${40 + offsetY}%`);
  setIfChanged('--organic-blob-2-pos-x', `${20 - offsetX * 0.5}%`);
  setIfChanged('--organic-blob-2-pos-y', `${70 + offsetY * 0.8}%`);
  setIfChanged('--organic-blob-3-pos-x', `${80 + offsetX * 0.6}%`);
  setIfChanged('--organic-blob-3-pos-y', `${60 - offsetY * 0.6}%`);
  setIfChanged('--organic-blob-4-pos-x', `${35 + offsetX * 0.3}%`);
  setIfChanged('--organic-blob-4-pos-y', `${25 - offsetY * 0.4}%`);

  const transitionBase = 580 + rhythm * 220;
  const transitionMod = visualMode < 0.3 ? 1.4 : visualMode > 0.7 ? 0.8 : 1.1;
  setIfChanged('--organic-transition', `${Math.round(transitionBase * transitionMod)}ms`);
}
