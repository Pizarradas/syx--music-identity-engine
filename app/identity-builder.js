/**
 * Identity Builder — vista de traducción en vivo: Música → Identidad visual
 * Paleta nutrida y dinámica, escala tipográfica, espaciado, formas y motion
 */
let containerEl = null;
const COLOR_HISTORY_MAX = 24;
const colorHistory = [];

export function initIdentityBuilder(container) {
  if (!container) return;
  containerEl = container;
  containerEl.innerHTML = `
    <div class="identity-builder__grid">
      <div class="identity-builder__section identity-builder__colors identity-builder__section--wide">
        <h3 class="identity-builder__section-title">Paleta dinámica</h3>
        <p class="identity-builder__mapping" id="identity-colors-mapping">—</p>
        <div class="identity-builder__color-evolution" id="identity-color-evolution" aria-label="Evolución de colores en el tiempo"></div>
        <div class="identity-builder__swatches identity-builder__swatches--rich identity-builder__swatches--progressive" id="identity-swatches">
          <div class="identity-builder__swatch-wrap" data-swatch-index="0" title="Primary"><div class="identity-builder__swatch" style="background: var(--semantic-color-primary)"></div><span>Primary</span></div>
          <div class="identity-builder__swatch-wrap" data-swatch-index="1" title="Warm"><div class="identity-builder__swatch" style="background: var(--semantic-color-accent-warm)"></div><span>Warm</span></div>
          <div class="identity-builder__swatch-wrap" data-swatch-index="2" title="Cool"><div class="identity-builder__swatch" style="background: var(--semantic-color-accent-cool)"></div><span>Cool</span></div>
          <div class="identity-builder__swatch-wrap" data-swatch-index="3" title="Comp"><div class="identity-builder__swatch" style="background: var(--semantic-color-accent-comp)"></div><span>Comp</span></div>
          <div class="identity-builder__swatch-wrap" data-swatch-index="4" title="Triad 1"><div class="identity-builder__swatch" style="background: var(--semantic-color-accent-triad-1)"></div><span>T1</span></div>
          <div class="identity-builder__swatch-wrap" data-swatch-index="5" title="Triad 2"><div class="identity-builder__swatch" style="background: var(--semantic-color-accent-triad-2)"></div><span>T2</span></div>
          <div class="identity-builder__swatch-wrap" data-swatch-index="6" title="Subtle"><div class="identity-builder__swatch" style="background: var(--semantic-color-primary-subtle)"></div><span>Subtle</span></div>
          <div class="identity-builder__swatch-wrap" data-swatch-index="7" title="Strong"><div class="identity-builder__swatch" style="background: var(--semantic-color-primary-strong)"></div><span>Strong</span></div>
          <div class="identity-builder__swatch-wrap" data-swatch-index="8" title="Muted"><div class="identity-builder__swatch" style="background: var(--semantic-color-primary-muted, var(--semantic-color-primary-subtle))"></div><span>Muted</span></div>
          <div class="identity-builder__swatch-wrap" data-swatch-index="9" title="Vivid"><div class="identity-builder__swatch" style="background: var(--semantic-color-primary-vivid, var(--semantic-color-primary-strong))"></div><span>Vivid</span></div>
        </div>
      </div>
      <div class="identity-builder__section identity-builder__typography">
        <h3 class="identity-builder__section-title">Escala tipográfica</h3>
        <p class="identity-builder__mapping" id="identity-typo-mapping">—</p>
        <div class="identity-builder__type-scale">
          <div class="identity-builder__type-row"><span class="identity-builder__type-label">Display</span><span class="identity-builder__type-sample identity-builder__type--display" style="font-size: var(--music-type-display, 2rem); font-family: var(--music-center-font-family); font-weight: var(--music-center-font-weight); font-style: var(--music-center-font-style, normal); color: var(--semantic-color-primary)">Aa</span><span class="identity-builder__type-value" id="type-display-val">—</span></div>
          <div class="identity-builder__type-row"><span class="identity-builder__type-label">H1</span><span class="identity-builder__type-sample identity-builder__type--h1" style="font-size: var(--music-type-h1, 1.5rem); font-family: var(--music-center-font-family); font-weight: var(--music-center-font-weight); font-style: var(--music-center-font-style, normal); color: var(--semantic-color-primary)">H1</span><span class="identity-builder__type-value" id="type-h1-val">—</span></div>
          <div class="identity-builder__type-row"><span class="identity-builder__type-label">H2</span><span class="identity-builder__type-sample identity-builder__type--h2" style="font-size: var(--music-type-h2, 1.2rem); font-family: var(--music-center-font-family); font-style: var(--music-center-font-style, normal); color: var(--semantic-color-primary)">H2</span><span class="identity-builder__type-value" id="type-h2-val">—</span></div>
          <div class="identity-builder__type-row"><span class="identity-builder__type-label">Body</span><span class="identity-builder__type-sample identity-builder__type--body" style="font-size: var(--music-type-body, 0.9rem); font-family: var(--music-center-font-family); font-style: var(--music-center-font-style, normal); color: var(--semantic-color-primary)">Body</span><span class="identity-builder__type-value" id="type-body-val">—</span></div>
          <div class="identity-builder__type-row"><span class="identity-builder__type-label">Caption</span><span class="identity-builder__type-sample identity-builder__type--caption" style="font-size: var(--music-type-caption, 0.75rem); font-family: var(--music-center-font-family); font-style: var(--music-center-font-style, normal); color: var(--semantic-color-primary)">Cap</span><span class="identity-builder__type-value" id="type-caption-val">—</span></div>
        </div>
      </div>
      <div class="identity-builder__section identity-builder__space">
        <h3 class="identity-builder__section-title">Espaciado</h3>
        <p class="identity-builder__mapping" id="identity-space-mapping">—</p>
        <div class="identity-builder__space-scale">
          <div class="identity-builder__space-bar" style="height: var(--music-center-spacing, 1rem); background: var(--semantic-color-primary)"></div>
          <span class="identity-builder__space-value" id="space-val">—</span>
        </div>
      </div>
      <div class="identity-builder__section identity-builder__shapes">
        <h3 class="identity-builder__section-title">Formas</h3>
        <p class="identity-builder__mapping" id="identity-shapes-mapping">—</p>
        <div class="identity-builder__shape-demos">
          <div class="identity-builder__shape-box" style="border-radius: var(--music-center-radius)"></div>
          <button type="button" class="identity-builder__shape-btn" style="border-radius: var(--music-center-radius)">Botón</button>
          <div class="identity-builder__shape-card" style="border-radius: var(--music-center-radius)"><span>Card</span></div>
        </div>
      </div>
      <div class="identity-builder__section identity-builder__motion">
        <h3 class="identity-builder__section-title">Motion</h3>
        <p class="identity-builder__mapping" id="identity-motion-mapping">—</p>
        <div class="identity-builder__motion-demo" style="transition-duration: var(--syx-music-transition)">
          <span>Transición</span>
        </div>
      </div>
    </div>
  `;
}

const SWATCH_COUNT = 10;

export function updateIdentityBuilder(semantic, visual, progress = 1) {
  if (!containerEl) return;

  const swatchesEl = containerEl.querySelector('#identity-swatches');
  if (swatchesEl) {
    const visibleCount = Math.min(SWATCH_COUNT, Math.max(1, Math.floor(progress * (SWATCH_COUNT + 2))));
    swatchesEl.querySelectorAll('.identity-builder__swatch-wrap').forEach((wrap) => {
      const idx = parseInt(wrap.dataset.swatchIndex ?? '0', 10);
      wrap.classList.toggle('is-revealed', idx < visibleCount);
    });
  }

  const mappingEl = containerEl.querySelector('#identity-colors-mapping');
  const typoMappingEl = containerEl.querySelector('#identity-typo-mapping');
  const shapesMappingEl = containerEl.querySelector('#identity-shapes-mapping');
  const spaceMappingEl = containerEl.querySelector('#identity-space-mapping');
  const motionMappingEl = containerEl.querySelector('#identity-motion-mapping');

  const e = semantic?.energy_level ?? 0.5;
  const brightness = semantic?.timbral_brightness ?? 0.5;
  const rhythm = semantic?.rhythmic_pressure ?? 0.5;
  const groove = semantic?.groove ?? 0.5;

  const root = document.documentElement;
  const primaryColor = getComputedStyle(root).getPropertyValue('--semantic-color-primary').trim();
  if (primaryColor) {
    colorHistory.push(primaryColor);
    if (colorHistory.length > COLOR_HISTORY_MAX) colorHistory.shift();
  }

  const evolutionEl = containerEl.querySelector('#identity-color-evolution');
  if (evolutionEl && colorHistory.length > 0) {
    evolutionEl.innerHTML = colorHistory.map((c) =>
      `<div class="identity-builder__evolution-swatch" style="background: ${c}" title="${c}"></div>`
    ).join('');
  }

  if (mappingEl) {
    const hue = Math.round(parseFloat(getComputedStyle(root).getPropertyValue('--syx-music-hue') || '260'));
    mappingEl.textContent = `Energía ${(e * 100).toFixed(0)}% · Brillo ${(brightness * 100).toFixed(0)}% · Ritmo ${(rhythm * 100).toFixed(0)}% → Hue ${hue}°`;
  }

  if (typoMappingEl) {
    const center = document.querySelector('.org-app-center');
    const weight = center ? getComputedStyle(center).getPropertyValue('--music-center-font-weight')?.trim() || '400' : '400';
    const style = center ? getComputedStyle(center).getPropertyValue('--music-center-font-style')?.trim() || 'normal' : 'normal';
    const category = center ? getComputedStyle(center).getPropertyValue('--music-center-font-category')?.trim() || 'Serifa' : 'Serifa';
    typoMappingEl.textContent = `${category} · ${weight}${style === 'italic' ? ' italic' : ''}`;
  }

  const center = document.querySelector('.org-app-center');
  if (center) {
    ['display', 'h1', 'h2', 'body', 'caption'].forEach((size) => {
      const val = getComputedStyle(center).getPropertyValue(`--music-type-${size}`)?.trim();
      const el = containerEl.querySelector(`#type-${size}-val`);
      if (el && val) el.textContent = val;
    });
    const spacing = getComputedStyle(center).getPropertyValue('--music-center-spacing')?.trim();
    const spaceValEl = containerEl.querySelector('#space-val');
    if (spaceValEl && spacing) spaceValEl.textContent = spacing;
  }

  if (shapesMappingEl) {
    const radius = getComputedStyle(root).getPropertyValue('--music-center-radius') || '8px';
    const hardness = visual?.geometric_hardness ?? 0.5;
    shapesMappingEl.textContent = `Dureza ${(hardness * 100).toFixed(0)}% → radius ${radius}`;
  }

  if (spaceMappingEl) {
    const density = visual?.spatial_density ?? 0.5;
    spaceMappingEl.textContent = `Densidad ${(density * 100).toFixed(0)}% → espaciado`;
  }

  if (motionMappingEl) {
    const duration = getComputedStyle(root).getPropertyValue('--syx-music-transition') || '320ms';
    const motion = visual?.motion_speed ?? 0.5;
    motionMappingEl.textContent = `Velocidad ${(motion * 100).toFixed(0)}% → ${duration}`;
  }
}
