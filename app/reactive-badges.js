/**
 * Badges reactivos — elementos HTML que reaccionan a la música
 * Usa GSAP para transiciones fluidas
 */
const gsap = typeof window !== 'undefined' ? window.gsap : null;

const BADGES = [
  { key: 'energy_level', label: 'Energía', class: 'reactive-badge--energy' },
  { key: 'harmonic_tension', label: 'Tensión', class: 'reactive-badge--tension' },
  { key: 'emotional_intensity', label: 'Emoción', class: 'reactive-badge--emotion' },
  { key: 'rhythmic_pressure', label: 'Ritmo', class: 'reactive-badge--rhythm' },
  { key: 'organicity_vs_mechanicality', label: 'Orgánico', class: 'reactive-badge--organic' },
];

let container = null;
let badgeEls = [];
let lastDominantKey = null;
let lastBadgeValues = {};
const BADGE_UPDATE_THRESHOLD = 0.04;

export function initReactiveBadges(el) {
  if (!el) return;
  container = el;
  container.innerHTML = '';

  BADGES.forEach((b) => {
    const span = document.createElement('span');
    span.className = `org-music-reactive-badge ${b.class}`;
    span.setAttribute('data-key', b.key);
    span.textContent = b.label;
    container.appendChild(span);
    badgeEls.push({ el: span, key: b.key });
  });
}

export function updateReactiveBadges(semantic) {
  if (!semantic) return;
  let maxDev = 0;
  let dominantKey = null;
  badgeEls.forEach(({ key }) => {
    const v = semantic[key] ?? 0.5;
    const dev = Math.abs(v - 0.5);
    if (dev > maxDev) {
      maxDev = dev;
      dominantKey = key;
    }
  });

  const dominantChanged = dominantKey !== lastDominantKey && (dominantKey || lastDominantKey);
  lastDominantKey = dominantKey;

  badgeEls.forEach(({ el, key }) => {
    const v = semantic[key] ?? 0.5;
    const isDominant = key === dominantKey && maxDev > 0.15;
    const targetScale = isDominant ? 1.05 + v * 0.15 : 0.88 + v * 0.12;
    const targetOpacity = isDominant ? 1 : 0.35 + v * 0.3;

    const prev = lastBadgeValues[key];
    const needsUpdate = !prev || Math.abs(prev.scale - targetScale) > BADGE_UPDATE_THRESHOLD ||
      Math.abs(prev.opacity - targetOpacity) > BADGE_UPDATE_THRESHOLD || prev.isDominant !== isDominant;

    if (!needsUpdate) return;

    lastBadgeValues[key] = { scale: targetScale, opacity: targetOpacity, isDominant };

    el.style.setProperty('--badge-intensity', String(v));
    el.classList.toggle('is-dominant', isDominant);

    if (gsap) {
      const justBecameDominant = dominantChanged && isDominant;
      gsap.to(el, {
        scale: targetScale,
        opacity: targetOpacity,
        duration: justBecameDominant ? 0.35 : 0.22,
        ease: justBecameDominant ? 'back.out(1.4)' : 'power2.out',
        overwrite: 'auto',
      });
    } else {
      el.style.opacity = String(targetOpacity);
      el.style.transform = `scale(${targetScale})`;
    }
  });
}
