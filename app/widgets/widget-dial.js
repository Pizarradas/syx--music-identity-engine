/**
 * WidgetDial — indicador tipo dial/semi-círculo para cuadro de mando
 * docs/29_dashboard_philosophy.md
 * @param {Object} opts
 * @param {string} opts.id - Identificador único
 * @param {string} opts.label - Etiqueta visible
 * @param {number} [opts.value=0.5] - Valor 0–1
 * @param {string} [opts.tooltip] - Texto del tooltip
 * @returns {{ element: HTMLElement, update: (v: number) => void }}
 */
export function createWidgetDial({
  id,
  label,
  value = 0.5,
  tooltip = '',
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'dashboard-widget-dial';
  wrap.setAttribute('data-widget-dial', id || '');
  if (tooltip) wrap.setAttribute('title', tooltip);

  const labelEl = document.createElement('span');
  labelEl.className = 'dashboard-widget-dial__label';
  labelEl.textContent = label;

  const dial = document.createElement('div');
  dial.className = 'dashboard-widget-dial__ring';
  dial.setAttribute('role', 'img');
  dial.setAttribute('aria-label', `${label}: ${Math.round(value * 100)}%`);

  const valueEl = document.createElement('span');
  valueEl.className = 'dashboard-widget-dial__value';
  valueEl.setAttribute('aria-live', 'polite');

  wrap.appendChild(labelEl);
  wrap.appendChild(dial);
  wrap.appendChild(valueEl);

  function update(v) {
    const val = Math.max(0, Math.min(1, v));
    const pct = Math.round(val * 100);
    dial.style.setProperty('--dial-value', val);
    dial.setAttribute('aria-label', `${label}: ${pct}%`);
    valueEl.textContent = `${pct}%`;
  }

  update(value);
  return { element: wrap, update };
}
