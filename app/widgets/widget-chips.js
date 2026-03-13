/**
 * WidgetChips — chips/tags reutilizables para cuadro de mando
 * docs/29_dashboard_philosophy.md
 * @param {Object} opts
 * @param {string} opts.id - Identificador único
 * @param {string} [opts.label] - Etiqueta del grupo
 * @param {Array<{ label: string, color?: string, active?: boolean }>} [opts.chips=[]]
 * @returns {{ element: HTMLElement, update: (chips: Array) => void }}
 */
export function createWidgetChips({
  id,
  label = '',
  chips = [],
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'dashboard-widget-chips';
  wrap.setAttribute('data-widget-chips', id || '');

  const labelEl = label ? document.createElement('span') : null;
  if (labelEl) {
    labelEl.className = 'dashboard-widget-chips__label';
    labelEl.textContent = label;
    wrap.appendChild(labelEl);
  }

  const chipsWrap = document.createElement('div');
  chipsWrap.className = 'dashboard-widget-chips__list';
  wrap.appendChild(chipsWrap);

  function renderChip(c) {
    const chip = document.createElement('span');
    chip.className = 'dashboard-widget-chips__chip';
    chip.textContent = c.label;
    if (c.active) chip.classList.add('is-active');
    if (c.dominant) chip.classList.add('is-dominant');
    if (c.color) chip.style.setProperty('--chip-color', c.color);
    if (c.title) chip.setAttribute('title', c.title);
    return chip;
  }

  function update(newChips) {
    chipsWrap.innerHTML = '';
    (newChips || []).forEach((c) => {
      chipsWrap.appendChild(renderChip(c));
    });
  }

  update(chips);
  return { element: wrap, update };
}
