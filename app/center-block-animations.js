/**
 * Animaciones GSAP del bloque central — espectacularidad reactiva
 * Anillos, pulso, espectro, letras: todo responde a la música
 * Usa CustomEase para curvas orgánicas
 */
const gsap = typeof window !== 'undefined' ? window.gsap : null;
const CustomEase = typeof window !== 'undefined' ? window.CustomEase : null;

let tlRings = null;
let tlPulse = null;
let tlSpectrum = null;
let lastEnergy = 0.5;
let lastTension = 0.5;
let lastBandSum = 0;
let lyricTween = null;

/** Elementos cacheados para evitar queries en cada frame */
let cachedPulse = null;
let cachedRings = null;
let cachedLyricCurrent = null;
let lastRingOpacities = [0.3, 0.25, 0.2];

/** quickTo para updates frecuentes (más performante que gsap.to en cada frame) */
let quickPulse = null;
let quickRings = [];

/** Curva suave para transiciones fluidas — evita sensación de saturación */
const MUSIC_EASE = 'sine.out';

/**
 * Inicializa animaciones del bloque central
 */
export function initCenterAnimations() {
  if (!gsap) return;

  if (CustomEase) {
    CustomEase.create('music-pulse', '0.25, 0.1, 0.25, 1');
    CustomEase.create('music-ring', '0.4, 0, 0.2, 1');
  }

  cachedPulse = document.querySelector('.org-music-dashboard__pulse');
  cachedRings = document.querySelectorAll('.org-music-dashboard__ring');
  cachedLyricCurrent = document.getElementById('lyric-current');

  const ease = CustomEase?.get('music-pulse') || MUSIC_EASE;
  if (cachedPulse) {
    gsap.set(cachedPulse, { scale: 0.9, transformOrigin: 'center center' });
    quickPulse = gsap.quickTo(cachedPulse, 'scale', { duration: 0.48, ease, overwrite: 'auto' });
  }
  if (cachedRings?.length) {
    quickRings = [];
    cachedRings.forEach((ring, i) => {
      lastRingOpacities[i] = 0.3 - i * 0.08;
      gsap.set(ring, { scale: 0.95 + i * 0.02, transformOrigin: 'center center', opacity: lastRingOpacities[i] });
      quickRings[i] = gsap.quickTo(ring, 'opacity', { duration: 0.3, ease: MUSIC_EASE, overwrite: 'auto' });
    });
  }
  const spectrum = document.getElementById('spectrum-bars');
  if (spectrum) {
    gsap.set(spectrum, { scale: 1, transformOrigin: 'center center' });
  }
}

/**
 * Actualiza animaciones según estado semántico y bandas de audio
 * @param {Object} semantic - estado semántico
 * @param {Object} bandData - { bass, mids, highs } normalizados
 */
export function updateCenterAnimations(semantic, bandData = { bass: 0.33, mids: 0.33, highs: 0.33 }) {
  if (!gsap || !semantic) return;

  const e = semantic.energy_level ?? 0.5;
  const tension = semantic?.harmonic_tension ?? 0.5;
  const groove = semantic?.groove ?? 0.5;
  const bandSum = (bandData.bass ?? 0.33) + (bandData.mids ?? 0.33) + (bandData.highs ?? 0.33);
  const bandPeak = Math.max(bandData.bass ?? 0, bandData.mids ?? 0, bandData.highs ?? 0);

  const pulse = cachedPulse;
  const rings = cachedRings;
  const lyricCurrent = cachedLyricCurrent;

  const t = Date.now() / 1000;
  const vibration = 0.5 + 0.15 * Math.sin(t * 2.5) * e + 0.1 * Math.sin(t * 4) * groove;
  const pulseScale = 0.88 + e * 0.35 + groove * 0.08 + bandPeak * 0.12 * vibration;

  if (quickPulse) {
    quickPulse(pulseScale);
  } else if (pulse) {
    gsap.to(pulse, {
      scale: pulseScale,
      duration: 0.48,
      ease: CustomEase?.get('music-pulse') || MUSIC_EASE,
      overwrite: 'auto',
    });
  }

  if (quickRings.length) {
    const targetOpacity = 0.15 + e * 0.5 + tension * 0.2;
    rings.forEach((ring, i) => {
      const opacity = Math.max(0.05, targetOpacity - i * 0.08);
      lastRingOpacities[i] = opacity;
      if (quickRings[i]) quickRings[i](opacity);
    });
  } else if (rings.length) {
    const targetOpacity = 0.15 + e * 0.5 + tension * 0.2;
    rings.forEach((ring, i) => {
      const opacity = Math.max(0.05, targetOpacity - i * 0.08);
      gsap.to(ring, {
        opacity,
        duration: 0.55,
        ease: MUSIC_EASE,
        overwrite: 'auto',
      });
    });
  }

  if (lyricCurrent && lyricCurrent.classList.contains('lyric-just-changed')) {
    lyricTween?.kill();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const words = lyricCurrent.querySelectorAll('.lyric-word');
    if (words.length > 0 && !prefersReduced) {
      lyricTween = gsap.fromTo(
        words,
        { opacity: 0.4, scale: 0.92, y: 6 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.03,
          ease: 'back.out(1.2)',
          overwrite: 'auto',
        }
      );
    } else if (words.length === 0) {
      lyricTween = gsap.fromTo(
        lyricCurrent,
        { scale: 0.97, opacity: 0.7 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: 'back.out(1.4)',
          overwrite: 'auto',
        }
      );
    }
  }

  lastEnergy = e;
  lastTension = tension;
  lastBandSum = bandSum;
}

/**
 * Pulso beat-synced — breve escala del pulso central en cada beat
 * Fase B: efecto visual sincronizado con el ritmo
 */
export function triggerBeatPulse() {
  if (!gsap) return;
  if (cachedPulse) {
    gsap.fromTo(
      cachedPulse,
      { scale: 1.15 },
      { scale: 1, duration: 0.12, ease: 'power2.out', overwrite: 'auto' }
    );
  }
  if (cachedRings?.length) {
    cachedRings.forEach((ring, i) => {
      const baseOpacity = lastRingOpacities[i] ?? 0.3;
      gsap.fromTo(
        ring,
        { opacity: Math.min(1, baseOpacity + 0.2) },
        { opacity: baseOpacity, duration: 0.28, ease: 'sine.out', overwrite: 'auto', delay: i * 0.03 }
      );
    });
  }
}

/**
 * Animación de entrada cuando aparece el pipeline
 */
export function animateCenterIn() {
  if (!gsap) return;

  const dashboard = document.getElementById('visual-stage');
  const center = document.querySelector('.org-music-dashboard__center');
  const pulse = document.querySelector('.org-music-dashboard__pulse');
  const rings = document.querySelectorAll('.org-music-dashboard__ring');

  if (!dashboard?.classList.contains('has-pipeline')) return;

  gsap.fromTo(
    center,
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
  );
  if (pulse) {
    gsap.fromTo(pulse, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: 'back.out(1.2)', delay: 0.1 });
  }
  rings.forEach((ring, i) => {
    gsap.fromTo(
      ring,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 0.3, duration: 0.4, delay: 0.15 + i * 0.08, ease: 'power2.out' }
    );
  });
}
