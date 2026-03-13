/**
 * Pitch / melodía — pitch class dominante por ventana
 * Fase C: mapeo melodía → posición/color para visualización
 * Usa chroma de Meyda cuando disponible; fallback a spectral centroid como proxy
 */

/**
 * Índice de pitch class (0-11) → hue (0-360)
 * C=0→0°, C#=1→30°, ...
 */
export function pitchClassToHue(pc) {
  if (pc == null || pc < 0 || pc > 11) return 260;
  return (pc * 30) % 360;
}

/**
 * Índice de pitch class → posición vertical normalizada (0-1)
 * Graves abajo, agudos arriba
 */
export function pitchClassToPosition(pc) {
  if (pc == null || pc < 0 || pc > 11) return 0.5;
  return pc / 11;
}

/**
 * Obtiene pitch class dominante desde chroma (12 valores)
 * @param {number[]|null} chroma
 * @returns {number|null} 0-11 o null
 */
export function dominantPitchClass(chroma) {
  if (!chroma || chroma.length < 12) return null;
  let maxVal = 0;
  let maxIdx = 0;
  for (let i = 0; i < 12; i++) {
    const v = chroma[i] ?? 0;
    if (v > maxVal) {
      maxVal = v;
      maxIdx = i;
    }
  }
  return maxVal > 0.01 ? maxIdx : null;
}

/**
 * Spectral centroid (0-1) como proxy de altura melódica
 * Más agudo → valor más alto
 */
export function centroidToPosition(centroid) {
  return Math.max(0, Math.min(1, centroid ?? 0.5));
}
