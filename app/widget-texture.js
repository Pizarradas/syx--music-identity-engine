/**
 * Widget Textura — densidad y complejidad de capas
 * docs/29_dashboard_philosophy.md
 * texture_density, layer_complexity
 */
let updateFn = null;

export function initWidgetTexture(container) {
  if (!container) return;
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'dashboard-widget-texture';
  wrap.setAttribute('data-widget', 'texture');

  const labelEl = document.createElement('span');
  labelEl.className = 'dashboard-widget-texture__label';
  labelEl.textContent = 'Textura';

  const barsWrap = document.createElement('div');
  barsWrap.className = 'dashboard-widget-texture__bars';

  const densityRow = document.createElement('div');
  densityRow.className = 'dashboard-widget-texture__row';
  const densityLabel = document.createElement('span');
  densityLabel.className = 'dashboard-widget-texture__row-label';
  densityLabel.textContent = 'Densidad';
  const densityBar = document.createElement('div');
  densityBar.className = 'dashboard-widget-texture__bar';
  densityBar.setAttribute('role', 'progressbar');
  densityBar.setAttribute('aria-label', 'Densidad');
  const densityFill = document.createElement('div');
  densityFill.className = 'dashboard-widget-texture__fill';
  densityBar.appendChild(densityFill);
  densityRow.appendChild(densityLabel);
  densityRow.appendChild(densityBar);

  const complexityRow = document.createElement('div');
  complexityRow.className = 'dashboard-widget-texture__row';
  const complexityLabel = document.createElement('span');
  complexityLabel.className = 'dashboard-widget-texture__row-label';
  complexityLabel.textContent = 'Capas';
  const complexityBar = document.createElement('div');
  complexityBar.className = 'dashboard-widget-texture__bar';
  complexityBar.setAttribute('role', 'progressbar');
  complexityBar.setAttribute('aria-label', 'Capas');
  const complexityFill = document.createElement('div');
  complexityFill.className = 'dashboard-widget-texture__fill';
  complexityBar.appendChild(complexityFill);
  complexityRow.appendChild(complexityLabel);
  complexityRow.appendChild(complexityBar);

  barsWrap.appendChild(densityRow);
  barsWrap.appendChild(complexityRow);

  const valueEl = document.createElement('span');
  valueEl.className = 'dashboard-widget-texture__value';
  valueEl.setAttribute('aria-live', 'polite');

  wrap.appendChild(labelEl);
  wrap.appendChild(barsWrap);
  wrap.appendChild(valueEl);
  container.appendChild(wrap);

  updateFn = (semantic) => {
    const density = semantic?.texture_density ?? 0.5;
    const complexity = semantic?.layer_complexity ?? 0.5;
    densityFill.style.width = `${Math.round(density * 100)}%`;
    complexityFill.style.width = `${Math.round(complexity * 100)}%`;
    densityBar.setAttribute('aria-valuenow', String(Math.round(density * 100)));
    complexityBar.setAttribute('aria-valuenow', String(Math.round(complexity * 100)));
    const label = density < 0.35 ? 'Abierto' : density > 0.65 ? 'Denso' : 'Medio';
    valueEl.textContent = label;
  };

  updateFn({});
}

export function updateWidgetTexture(semantic) {
  if (!updateFn || !semantic) return;
  updateFn(semantic);
}
