/**
 * Fase 5: Utilidades de rendimiento — evitar lags, saltos y stuttering
 * Detección de dispositivo, throttling adaptativo, frame budget
 */

/** Detecta si el dispositivo es de bajo rendimiento */
export function isLowPerformanceDevice() {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = navigator.deviceMemory ?? 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return cores <= 4 || memory <= 4 || isMobile;
}

/** Factor de calidad 0.5–1 según dispositivo */
export function getPerformanceFactor() {
  if (isLowPerformanceDevice()) return 0.6;
  const cores = navigator.hardwareConcurrency ?? 8;
  return Math.min(1, 0.5 + cores * 0.06);
}

/** Throttle de frames: 1 = cada frame, 2 = cada 2 frames, etc. */
export function getVisualThrottle() {
  return isLowPerformanceDevice() ? 5 : 3;
}

/** Resolución del wave mesh: menor = menos vértices */
export function getWaveMeshSegments() {
  return isLowPerformanceDevice() ? 40 : 60;
}

/** Densidad base de partículas (0.5–1) */
export function getParticleDensityFactor() {
  return getPerformanceFactor();
}

/** Pausa loops cuando la pestaña no es visible */
export function isPageVisible() {
  return typeof document === 'undefined' || !document.hidden;
}

/** Número de barras del espectro (menos = más fluido en dispositivos lentos) */
export function getSpectrumBarCount() {
  return isLowPerformanceDevice() ? 48 : 64;
}

/** Proyecto experimental desktop: máxima calidad, partículas protagonistas */
export function isDesktopExperimental() {
  if (typeof navigator === 'undefined') return false;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return !isMobile;
}
