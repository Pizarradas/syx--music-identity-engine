/**
 * Live Theme Preview — SYX Design Output Layer
 * Vista previa dinámica que muta al compás de la música.
 * Elementos que aparecen, se revelan y transforman en tiempo real.
 */
let wrapEl = null;
let blocksSection = null;
let canvasSection = null;
let gradientBar = null;
let tokenBadges = null;
let typoSamples = null;
let componentCards = null;
let orbsContainer = null;
let statusText = null;

const TOKEN_BADGES = ['Primary', 'Accent', 'Radius', 'Spacing', 'Font', 'Motion', 'Surface', 'Contrast', 'Shadow', 'Border'];
const TYPO_SAMPLES = ['Display', 'H1', 'H2', 'Body', 'Caption'];
const COMPONENT_LABELS = ['Button', 'Badge', 'Input', 'Card', 'Surface', 'Token'];

function getRootVar(name) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name)?.trim() || '';
}

export function initLiveThemePreview(containerEl) {
  if (!containerEl) return;
  wrapEl = containerEl;
  let container = wrapEl.querySelector('.live-theme-preview');
  if (!container) {
    container = document.createElement('div');
    container.className = 'live-theme-preview';
    wrapEl.appendChild(container);
  }
  container.innerHTML = '';
  container.className = 'live-theme-preview live-theme-preview--enhanced';

  // Layout: bloques a la izquierda, canvas a la derecha
  const grid = document.createElement('div');
  grid.className = 'live-theme-preview__grid';

  // Columna izquierda: bloques estáticos
  blocksSection = document.createElement('div');
  blocksSection.className = 'live-theme-preview__blocks live-theme-preview__blocks--cards';
  blocksSection.innerHTML = `
    <div class="live-theme-preview__block live-theme-preview__card live-theme-preview__colors" data-reveal-index="0">
      <h3 class="live-theme-preview__block-title">Paleta</h3>
      <div class="live-theme-preview__swatches live-theme-preview__swatches--extended live-theme-preview__swatches--progressive">
        <div class="live-theme-preview__swatch" data-swatch-index="0" style="background: var(--semantic-color-primary)" title="Primary"></div>
        <div class="live-theme-preview__swatch" data-swatch-index="1" style="background: var(--semantic-color-primary-subtle)" title="Subtle"></div>
        <div class="live-theme-preview__swatch" data-swatch-index="2" style="background: var(--semantic-color-primary-strong)" title="Strong"></div>
        <div class="live-theme-preview__swatch" data-swatch-index="3" style="background: var(--semantic-color-primary-muted, var(--semantic-color-primary-subtle))" title="Muted"></div>
        <div class="live-theme-preview__swatch" data-swatch-index="4" style="background: var(--semantic-color-primary-vivid, var(--semantic-color-primary-strong))" title="Vivid"></div>
        <div class="live-theme-preview__swatch" data-swatch-index="5" style="background: var(--semantic-color-accent-warm)" title="Warm"></div>
        <div class="live-theme-preview__swatch" data-swatch-index="6" style="background: var(--semantic-color-accent-cool)" title="Cool"></div>
        <div class="live-theme-preview__swatch" data-swatch-index="7" style="background: var(--semantic-color-accent-comp)" title="Comp"></div>
        <div class="live-theme-preview__swatch" data-swatch-index="8" style="background: var(--semantic-color-accent-triad-1)" title="Triad 1"></div>
        <div class="live-theme-preview__swatch" data-swatch-index="9" style="background: var(--semantic-color-accent-triad-2)" title="Triad 2"></div>
      </div>
    </div>
    <div class="live-theme-preview__block live-theme-preview__card live-theme-preview__typography" data-reveal-index="1">
      <h3 class="live-theme-preview__block-title">Tipografía</h3>
      <div class="live-theme-preview__type-scale">
        <p class="live-theme-preview__sample live-theme-preview__sample--display" style="font-family: var(--music-center-font-family); font-weight: var(--music-center-font-weight); letter-spacing: var(--music-center-letter-spacing)">Display</p>
        <p class="live-theme-preview__sample live-theme-preview__sample--h1" style="font-family: var(--music-center-font-family); font-weight: var(--music-center-font-weight); font-size: var(--music-type-h1, 1.5rem)">H1 Headline</p>
        <p class="live-theme-preview__sample live-theme-preview__sample--h2" style="font-family: var(--music-center-font-family); font-weight: 600; font-size: var(--music-type-h2, 1.2rem)">H2 Subheading</p>
        <p class="live-theme-preview__sample live-theme-preview__sample--h3" style="font-family: var(--music-center-font-family); font-weight: 500; font-size: var(--music-type-h3, 1rem)">H3 Section</p>
        <p class="live-theme-preview__sample live-theme-preview__sample--body" style="font-family: var(--music-center-font-family); font-size: var(--music-type-body, 0.9rem)">Body text — Música → Tokens en tiempo real.</p>
        <p class="live-theme-preview__sample live-theme-preview__sample--caption" style="font-family: var(--music-center-font-family); font-size: var(--music-type-caption, 0.75rem)">Caption · Overline · Labels</p>
      </div>
    </div>
    <div class="live-theme-preview__block live-theme-preview__buttons" data-reveal-index="2">
      <h3 class="live-theme-preview__block-title">Botones</h3>
      <div class="live-theme-preview__btn-row">
        <button type="button" class="live-theme-preview__btn live-theme-preview__btn--primary">Primary</button>
        <button type="button" class="live-theme-preview__btn live-theme-preview__btn--outline">Outline</button>
        <button type="button" class="live-theme-preview__btn live-theme-preview__btn--ghost">Ghost</button>
      </div>
    </div>
    <div class="live-theme-preview__block live-theme-preview__card live-theme-preview__badges" data-reveal-index="3">
      <h3 class="live-theme-preview__block-title">Badges</h3>
      <div class="live-theme-preview__badge-row">
        <span class="live-theme-preview__badge live-theme-preview__badge--filled">Filled</span>
        <span class="live-theme-preview__badge live-theme-preview__badge--outline">Outline</span>
        <span class="live-theme-preview__badge live-theme-preview__badge--soft">Soft</span>
      </div>
    </div>
    <div class="live-theme-preview__block live-theme-preview__card live-theme-preview__input" data-reveal-index="4">
      <h3 class="live-theme-preview__block-title">Input</h3>
      <div class="live-theme-preview__input-wrap">
        <input type="text" class="live-theme-preview__input-field" placeholder="Placeholder con tokens" readonly>
      </div>
    </div>
  `;

  // Columna derecha: canvas dinámico con mockup de identidad
  canvasSection = document.createElement('div');
  canvasSection.className = 'live-theme-preview__canvas live-theme-preview__card';
  canvasSection.innerHTML = `
    <div class="live-theme-preview__canvas-inner">
      <div class="live-theme-preview__token-badges" id="live-preview-tokens" aria-label="Tokens generados"></div>
      <div class="live-theme-preview__mockup" id="live-preview-mockup" aria-label="Vista previa de identidad aplicada">
        <div class="live-theme-preview__mockup-header">
          <span class="live-theme-preview__mockup-logo">Brand</span>
          <nav class="live-theme-preview__mockup-nav">
            <span>Inicio</span>
            <span>Productos</span>
            <span>Contacto</span>
          </nav>
        </div>
        <div class="live-theme-preview__mockup-hero">
          <h2 class="live-theme-preview__mockup-headline">Identidad en vivo</h2>
          <p class="live-theme-preview__mockup-sub">Tokens y componentes generados al compás de la música.</p>
          <div class="live-theme-preview__mockup-cta">
            <span class="live-theme-preview__mockup-btn">Primary</span>
            <span class="live-theme-preview__mockup-btn live-theme-preview__mockup-btn--outline">Outline</span>
          </div>
        </div>
      </div>
      <div class="live-theme-preview__typo-samples" id="live-preview-typo" aria-label="Muestra tipográfica"></div>
      <div class="live-theme-preview__component-stack" id="live-preview-components" aria-label="Componentes"></div>
      <div class="live-theme-preview__orbs" id="live-preview-orbs" aria-hidden="true"></div>
    </div>
  `;

  gradientBar = document.getElementById('identity-generator-bar');
  statusText = document.getElementById('identity-generator-status');
  tokenBadges = canvasSection.querySelector('#live-preview-tokens');
  typoSamples = canvasSection.querySelector('#live-preview-typo');
  componentCards = canvasSection.querySelector('#live-preview-components');
  orbsContainer = canvasSection.querySelector('#live-preview-orbs');
  const mockupEl = canvasSection.querySelector('#live-preview-mockup');
  if (mockupEl) mockupEl.setAttribute('data-reveal-progress', '0');

  grid.appendChild(blocksSection);
  grid.appendChild(canvasSection);
  container.appendChild(grid);

  updateLiveThemePreview(null, null, 0);
}

export function updateLiveThemePreview(semantic, visual, progress = 0) {
  if (!wrapEl) return;

  const e = semantic?.energy_level ?? 0.5;
  const tension = semantic?.harmonic_tension ?? 0.5;
  const brightness = semantic?.timbral_brightness ?? 0.5;
  const rhythm = semantic?.rhythmic_pressure ?? 0.5;
  const groove = semantic?.groove ?? 0.5;

  const primary = getRootVar('--semantic-color-primary') || 'oklch(0.6 0.2 260)';
  const warm = getRootVar('--semantic-color-accent-warm') || 'oklch(0.7 0.2 20)';
  const cool = getRootVar('--semantic-color-accent-cool') || 'oklch(0.7 0.15 200)';

  // Estado: sin pipeline, con pipeline sin reproducir, reproduciendo
  const hasData = semantic != null;
  const isPlaying = hasData && progress > 0 && progress < 1;

  if (statusText) {
    if (!hasData) {
      statusText.textContent = 'Sube audio y reproduce para generar la identidad';
      statusText.className = 'identity-generator-overlay__status identity-generator-overlay__status--idle';
    } else if (!isPlaying) {
      statusText.textContent = 'Listo. Reproduce para ver la identidad en vivo';
      statusText.className = 'identity-generator-overlay__status identity-generator-overlay__status--ready';
    } else {
      const pct = Math.round(progress * 100);
      statusText.textContent = `Generando identidad… ${pct}%`;
      statusText.className = 'identity-generator-overlay__status identity-generator-overlay__status--active';
    }
  }

  // Barra de gradiente que muta con energía/tensión/brillo
  if (gradientBar) {
    const mix = (e * 0.4 + tension * 0.3 + brightness * 0.3);
    gradientBar.style.background = `linear-gradient(90deg, ${primary} 0%, ${warm} ${mix * 50}%, ${cool} 100%)`;
    gradientBar.style.opacity = hasData ? 0.6 + mix * 0.3 : '0';
    gradientBar.style.transform = `scaleX(${0.3 + progress * 0.7})`;
  }

  // Swatches progresivos
  const swatchesWrap = wrapEl.querySelector('.live-theme-preview__swatches--progressive');
  if (swatchesWrap) {
    const visibleCount = Math.min(10, Math.max(0, Math.floor(progress * 12)));
    swatchesWrap.querySelectorAll('[data-swatch-index]').forEach((el) => {
      const idx = parseInt(el.dataset.swatchIndex ?? '0', 10);
      el.classList.toggle('is-revealed', idx < visibleCount);
    });
  }

  // Bloques: visibles cuando hay datos (análisis completado o reproduciendo)
  wrapEl.querySelectorAll('[data-reveal-index]').forEach((el) => {
    const idx = parseInt(el.dataset.revealIndex ?? '0', 10);
    const threshold = 0.12 + idx * 0.12;
    el.classList.toggle('is-revealed', progress >= threshold || hasData);
  });

  // Mockup: vista previa de identidad aplicada (header → hero)
  const mockupEl = wrapEl?.querySelector('#live-preview-mockup');
  if (mockupEl) {
    const mockupVisible = hasData;
    const revealProgress = isPlaying ? progress : 1;
    mockupEl.classList.toggle('is-visible', mockupVisible);
    mockupEl.classList.toggle('is-playing', isPlaying);
    const headerEl = mockupEl.querySelector('.live-theme-preview__mockup-header');
    const heroEl = mockupEl.querySelector('.live-theme-preview__mockup-hero');
    if (headerEl) headerEl.classList.toggle('is-revealed', mockupVisible && revealProgress > 0.2);
    if (heroEl) heroEl.classList.toggle('is-revealed', mockupVisible && revealProgress > 0.35);
  }

  // Token badges que aparecen uno a uno
  if (tokenBadges) {
    const badgeCount = Math.min(TOKEN_BADGES.length, Math.floor(progress * (TOKEN_BADGES.length + 2)));
    if (badgeCount > tokenBadges.children.length) {
      for (let i = tokenBadges.children.length; i < badgeCount; i++) {
        const badge = document.createElement('span');
        badge.className = 'live-theme-preview__token-badge';
        badge.textContent = TOKEN_BADGES[i];
        badge.style.background = 'var(--semantic-color-primary)';
        badge.style.borderColor = 'var(--semantic-color-primary)';
        tokenBadges.appendChild(badge);
      }
    }
    tokenBadges.querySelectorAll('.live-theme-preview__token-badge').forEach((b, i) => {
      b.classList.toggle('is-visible', i < badgeCount);
    });
  }

  // Muestra tipográfica
  if (typoSamples) {
    const typoCount = Math.min(TYPO_SAMPLES.length, Math.floor(progress * (TYPO_SAMPLES.length + 2)));
    if (typoSamples.children.length === 0 && typoCount > 0) {
      TYPO_SAMPLES.forEach((label, i) => {
        const p = document.createElement('p');
        p.className = 'live-theme-preview__typo-line';
        p.setAttribute('data-typo-index', String(i));
        p.style.fontFamily = getRootVar('--music-center-font-family') || 'inherit';
        p.style.fontWeight = getRootVar('--music-center-font-weight') || '500';
        p.style.color = 'var(--semantic-color-primary)';
        p.textContent = label;
        typoSamples.appendChild(p);
      });
    }
    typoSamples.querySelectorAll('.live-theme-preview__typo-line').forEach((el, i) => {
      el.classList.toggle('is-visible', i < typoCount);
    });
  }

  // Componentes que se apilan
  if (componentCards) {
    const compCount = Math.min(COMPONENT_LABELS.length, Math.floor(progress * (COMPONENT_LABELS.length + 2)));
    if (compCount > componentCards.children.length) {
      for (let i = componentCards.children.length; i < compCount; i++) {
        const card = document.createElement('div');
        card.className = 'live-theme-preview__comp-card';
        card.innerHTML = `<span>${COMPONENT_LABELS[i]}</span>`;
        card.style.borderColor = 'var(--semantic-color-primary)';
        card.style.background = 'color-mix(in oklch, var(--semantic-color-primary) 15%, transparent)';
        componentCards.appendChild(card);
      }
    }
    componentCards.querySelectorAll('.live-theme-preview__comp-card').forEach((c, i) => {
      c.classList.toggle('is-visible', i < compCount);
    });
  }

  // Orbes flotantes que pulsan con el ritmo
  if (orbsContainer && hasData) {
    const orbCount = Math.min(5, Math.floor(2 + rhythm * 3 + groove * 2));
    while (orbsContainer.children.length < orbCount) {
      const orb = document.createElement('div');
      orb.className = 'live-theme-preview__orb';
      orb.style.background = 'var(--semantic-color-primary)';
      orb.style.animationDelay = `${Math.random() * 2}s`;
      orb.style.left = `${Math.random() * 80 + 10}%`;
      orb.style.top = `${Math.random() * 70 + 15}%`;
      orb.style.width = orb.style.height = `${12 + Math.random() * 16}px`;
      orbsContainer.appendChild(orb);
    }
    orbsContainer.querySelectorAll('.live-theme-preview__orb').forEach((orb, i) => {
      orb.classList.toggle('is-visible', i < orbCount);
      orb.style.background = i % 2 === 0 ? 'var(--semantic-color-primary)' : 'var(--semantic-color-accent-warm)';
      orb.style.opacity = 0.2 + (e * 0.3 + rhythm * 0.2);
    });
  }
}
