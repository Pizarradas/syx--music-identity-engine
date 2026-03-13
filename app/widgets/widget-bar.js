/**
 * WidgetBar — barra de progreso reutilizable para cuadro de mando
 * docs/29_dashboard_philosophy.md
 * @param {Object} opts
 * @param {string} opts.id - Identificador único
 * @param {string} opts.label - Etiqueta visible
 * @param {number} [opts.value=0] - Valor 0–1
 * @param {string} [opts.tooltip] - Texto del tooltip
 * @param {string} [opts.variant='vertical'] - 'vertical' | 'horizontal'
 * @param {boolean} [opts.showValue=true] - Mostrar porcentaje
 * @param {boolean} [opts.peakHold=false] - Mantener pico visual
 * @returns {{ element: HTMLElement, update: (v: number) => void }}
 */
export function createWidgetBar({
  id,
  label,
  value = 0,
  tooltip = '',
  variant = 'vertical',
  showValue = true,
  peakHold = false,
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = `dashboard-widget-bar dashboard-widget-bar--${variant}`;
  wrap.setAttribute('data-widget-bar', id || '');
  if (tooltip) wrap.setAttribute('title', tooltip);

  const labelEl = document.createElement('span');
  labelEl.className = 'dashboard-widget-bar__label';
  labelEl.textContent = label;

  const valueEl = showValue ? document.createElement('span') : null;
  if (valueEl) {
    valueEl.className = 'dashboard-widget-bar__value';
    valueEl.setAttribute('aria-live', 'polite');
  }

  const track = document.createElement('div');
  track.className = 'dashboard-widget-bar__track';
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');

  const fill = document.createElement('div');
  fill.className = 'dashboard-widget-bar__fill';

  const peak = peakHold ? document.createElement('div') : null;
  if (peak) {
    peak.className = 'dashboard-widget-bar__peak';
    peak.setAttribute('aria-hidden', 'true');
  }

  if (peak) track.appendChild(peak);
  track.appendChild(fill);
  wrap.appendChild(labelEl);
  if (valueEl) wrap.appendChild(valueEl);
  wrap.appendChild(track);

  let peakValue = 0;
  const PEAK_DECAY = 0.02;

  function update(v) {
    const val = Math.max(0, Math.min(1, v));
    const pct = Math.round(val * 100);
    if (variant === 'vertical') {
      fill.style.height = `${pct}%`;
      fill.style.width = '100%';
    } else {
      fill.style.height = '100%';
      fill.style.width = `${pct}%`;
    }
    track.setAttribute('aria-valuenow', String(pct));
    track.setAttribute('aria-valuetext', `${pct}%`);
    if (valueEl) valueEl.textContent = `${pct}%`;

    if (peakHold && peak) {
      if (val > peakValue) peakValue = val;
      else peakValue = Math.max(0, peakValue - PEAK_DECAY);
      const peakPct = Math.round(peakValue * 100);
      if (variant === 'vertical') {
        peak.style.height = `${peakPct}%`;
        peak.style.width = '100%';
      } else {
        peak.style.height = '100%';
        peak.style.width = `${peakPct}%`;
      }
    }
  }

  update(value);
  return { element: wrap, update };
}
