/**
 * Widget Registro — espectro tonal (graves ↔ agudos)
 * docs/29_dashboard_philosophy.md
 * spectral_register: 0 = graves, 0.5 = equilibrado, 1 = agudos
 * Franja de color azul → amarillo
 */
let updateFn = null;

export function initWidgetRegister(container) {
  if (!container) return;
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'dashboard-widget-register';
  wrap.setAttribute('data-widget', 'register');

  const labelEl = document.createElement('span');
  labelEl.className = 'dashboard-widget-register__label';
  labelEl.textContent = 'Registro';

  const track = document.createElement('div');
  track.className = 'dashboard-widget-register__track';
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');
  track.setAttribute('aria-label', 'Registro espectral: graves a agudos');

  const fill = document.createElement('div');
  fill.className = 'dashboard-widget-register__fill';

  const valueEl = document.createElement('span');
  valueEl.className = 'dashboard-widget-register__value';
  valueEl.setAttribute('aria-live', 'polite');

  track.appendChild(fill);
  wrap.appendChild(labelEl);
  wrap.appendChild(track);
  wrap.appendChild(valueEl);
  container.appendChild(wrap);

  updateFn = (v) => {
    const val = Math.max(0, Math.min(1, v));
    const pct = Math.round(val * 100);
    fill.style.width = `${pct}%`;
    track.setAttribute('aria-valuenow', String(pct));
    const label = val < 0.35 ? 'Graves' : val > 0.65 ? 'Agudos' : 'Medios';
    valueEl.textContent = label;
  };

  updateFn(0.5);
}

export function updateWidgetRegister(semantic) {
  if (!updateFn || !semantic) return;
  updateFn(semantic.spectral_register ?? 0.5);
}
