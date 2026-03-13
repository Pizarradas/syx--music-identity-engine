/**
 * Análisis estructural — curva de novedad y detección de secciones
 * docs/25_structural_music_intelligence.md
 * Novelty curve: distancia entre frames consecutivos → picos = cambios de sección
 */

/** Features usados para la curva de novedad (normalizados 0-1) */
const NOVELTY_FEATURE_KEYS = [
  'rms', 'spectralCentroid', 'spectralRolloff', 'spectralFlatness',
  'spectralFlux', 'bandBass', 'bandMids', 'bandHighs',
];

/**
 * Extrae vector normalizado de un frame para comparación
 */
function toFeatureVector(f) {
  return NOVELTY_FEATURE_KEYS.map((k) => {
    const v = f[k];
    if (v == null) return 0.5;
    return Math.min(1, Math.max(0, v));
  });
}

/**
 * Distancia euclidiana entre dos vectores normalizados
 */
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

/**
 * Calcula curva de novedad (distancia entre frames consecutivos)
 * @param {Array<Object>} features - Stream de features
 * @returns {Float32Array} novelty[i] = distancia entre frame i e i+1
 */
export function computeNoveltyCurve(features) {
  if (!features || features.length < 2) return new Float32Array(0);

  const novelty = new Float32Array(features.length - 1);
  let maxNovelty = 0;

  for (let i = 0; i < features.length - 1; i++) {
    const a = toFeatureVector(features[i]);
    const b = toFeatureVector(features[i + 1]);
    const d = euclideanDistance(a, b);
    novelty[i] = d;
    if (d > maxNovelty) maxNovelty = d;
  }

  if (maxNovelty > 0) {
    for (let i = 0; i < novelty.length; i++) novelty[i] /= maxNovelty;
  }
  return novelty;
}

/**
 * Detecta índices donde la novedad supera umbral (picos = boundaries)
 * @param {Float32Array} novelty
 * @param {number} threshold - 0-1, ej. 0.6
 * @param {number} minGap - mínimo número de frames entre boundaries
 * @returns {Array<{index: number, value: number}>}
 */
export function detectSectionBoundaries(novelty, threshold = 0.55, minGap = 15) {
  const boundaries = [];
  for (let i = 1; i < novelty.length - 1; i++) {
    const v = novelty[i];
    if (v < threshold) continue;
    const prev = novelty[i - 1];
    const next = novelty[i + 1];
    if (v >= prev && v >= next) {
      const last = boundaries[boundaries.length - 1];
      if (!last || i - last.index >= minGap) {
        boundaries.push({ index: i, value: v });
      }
    }
  }
  return boundaries;
}

/**
 * Asigna tipo de sección heurístico según posición y energía
 * intro=0, verse=0.25, chorus=0.5, bridge=0.75, outro=1
 */
function assignSectionLabel(boundaryIndex, totalFrames, avgEnergy) {
  const progress = boundaryIndex / Math.max(1, totalFrames);
  if (progress < 0.08) return 0;   // intro
  if (progress > 0.92) return 1;  // outro
  if (progress < 0.25) return 0.25;  // verse
  if (progress < 0.5) return 0.5;     // chorus
  if (progress < 0.75) return 0.25;   // verse
  return 0.75;  // bridge
}

/**
 * Para cada índice de feature, devuelve section_type (0-1) y section_intensity
 * @param {Array<Object>} features
 * @param {Array<{index: number}>} boundaries
 * @returns {Array<{section_type: number, section_intensity: number, is_boundary: boolean}>}
 */
export function assignSectionTypes(features, boundaries) {
  const result = [];
  const totalFrames = features.length;
  const boundarySet = new Set(boundaries.map((b) => b.index));

  let currentSection = 0;
  let nextBoundaryIdx = 0;

  for (let i = 0; i < totalFrames; i++) {
    if (boundarySet.has(i) && nextBoundaryIdx < boundaries.length && boundaries[nextBoundaryIdx].index === i) {
      const b = boundaries[nextBoundaryIdx];
      const avgEnergy = features.slice(Math.max(0, i - 5), Math.min(totalFrames, i + 5))
        .reduce((s, f) => s + (f.rms ?? 0.5), 0) / 10;
      currentSection = assignSectionLabel(i, totalFrames, avgEnergy);
      nextBoundaryIdx++;
    }

    const isBoundary = boundarySet.has(i);
    const sectionIntensity = isBoundary ? 1 : 0.3 + (features[i]?.rms ?? 0.5) * 0.5;

    result.push({
      section_type: currentSection,
      section_intensity: Math.min(1, sectionIntensity),
      is_boundary: isBoundary,
    });
  }
  return result;
}

/**
 * Pipeline completo: features → secciones con section_type por frame
 * @param {Array<Object>} features
 * @param {Object} options - { noveltyThreshold, minGap }
 * @returns {{ novelty: Float32Array, boundaries: Array, sectionTypes: Array }}
 */
export function analyzeStructure(features, options = {}) {
  const { noveltyThreshold = 0.55, minGap = 15 } = options;

  const novelty = computeNoveltyCurve(features);
  const boundaries = detectSectionBoundaries(novelty, noveltyThreshold, minGap);
  const sectionTypes = assignSectionTypes(features, boundaries);

  return { novelty, boundaries, sectionTypes };
}
