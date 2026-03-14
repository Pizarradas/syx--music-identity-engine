/**
 * Utilidades de color con culori — interpolación OKLCH, distancia perceptual, gamut
 * Mejora la diferenciación de paletas y garantiza colores mostrables.
 */
import {
  converter,
  interpolate,
  differenceCiede2000,
  clampChroma,
  formatCss,
  inGamut,
} from 'culori';

const toOklch = converter('oklch');
const toRgb = converter('rgb');
const deltaE = differenceCiede2000();
const displayable = inGamut('rgb');

/**
 * Crea objeto OKLCH para culori (l 0-1, c 0-0.4, h 0-360)
 */
export function oklch(l, c, h) {
  return { mode: 'oklch', l, c: Math.min(c, 0.4), h: ((h % 360) + 360) % 360 };
}

/**
 * Interpola entre dos colores en espacio OKLCH (mejor que mezclar solo hue)
 * @param {Object} c1 - { l, c, h } o string oklch()
 * @param {Object} c2 - idem
 * @param {number} t - 0-1
 * @returns {{ l: number, c: number, h: number }}
 */
export function interpolateOklch(c1, c2, t) {
  const a = typeof c1 === 'object' && c1.l != null ? c1 : toOklch(c1);
  const b = typeof c2 === 'object' && c2.l != null ? c2 : toOklch(c2);
  if (!a || !b) return a || b || { l: 0.5, c: 0.2, h: 0 };
  const colors = [
    { mode: 'oklch', l: a.l ?? 0.5, c: a.c ?? 0.2, h: a.h ?? 0 },
    { mode: 'oklch', l: b.l ?? 0.5, c: b.c ?? 0.2, h: b.h ?? 0 },
  ];
  const fn = interpolate(colors, 'oklch');
  const result = fn(t);
  return result ? { l: result.l, c: result.c, h: result.h } : a;
}

/**
 * Distancia perceptual entre dos colores (deltaE 2000)
 * @returns {number} ~0 = idénticos, >20 = muy diferentes
 */
export function colorDistance(c1, c2) {
  const a = typeof c1 === 'object' ? (c1.mode ? c1 : oklch(c1.l, c1.c, c1.h)) : toOklch(c1);
  const b = typeof c2 === 'object' ? (c2.mode ? c2 : oklch(c2.l, c2.c, c2.h)) : toOklch(c2);
  if (!a || !b) return 0;
  return deltaE(a, b);
}

/**
 * Asegura que un color sea mostrable en sRGB (reduce chroma si hace falta)
 * @param {Object|string} color
 * @returns {Object} color en gamut
 */
export function ensureGamut(color) {
  if (!color) return color;
  const c = typeof color === 'object' && color.l != null ? { mode: 'oklch', ...color } : toOklch(color);
  if (!c) return color;
  if (displayable(toRgb(c))) return c;
  const clamped = clampChroma(c, 'oklch', 'rgb');
  return clamped || c;
}

/**
 * Formatea color OKLCH a string CSS
 */
export function formatOklchCss(l, c, h, alpha = 1) {
  const color = oklch(l, c, h);
  if (alpha < 1) color.alpha = alpha;
  const inGamutColor = ensureGamut(color);
  return formatCss(inGamutColor) || `oklch(${l} ${c} ${h})`;
}

/**
 * Separa colores que están demasiado cerca perceptualmente
 * Ajusta el hue del secundario/terciario si están a menos de minDeltaE del primario
 * @param {Array<{ l, c, h }>} colors - [primary, secondary, tertiary, ...]
 * @param {number} minDeltaE - mínimo deltaE entre colores (default 15)
 * @returns {Array<{ l, c, h }>}
 */
export function ensureMinDistance(colors, minDeltaE = 15) {
  if (!colors || colors.length < 2) return colors;
  const result = [...colors.map((c) => ({ ...c }))];
  for (let i = 1; i < result.length; i++) {
    const curr = result[i];
    let d = colorDistance(result[0], curr);
    if (d >= minDeltaE) continue;
    const step = 30;
    let bestH = curr.h;
    let bestD = d;
    for (let offset = step; offset <= 180; offset += step) {
      for (const sign of [1, -1]) {
        const h2 = (curr.h + sign * offset + 360) % 360;
        const c2 = { l: curr.l, c: curr.c, h: h2 };
        const d2 = colorDistance(result[0], c2);
        if (d2 > bestD && d2 >= minDeltaE) {
          bestD = d2;
          bestH = h2;
        }
      }
    }
    result[i].h = bestH;
  }
  return result;
}
