/**
 * Widget Visión rápida — 4 barras compactas con createWidgetBar
 * docs/29_dashboard_philosophy.md
 */
import { createWidgetBar } from './widgets/index.js';

const KEYS = [
  { id: 'energy_level', label: 'Energía' },
  { id: 'harmonic_tension', label: 'Tensión' },
  { id: 'timbral_brightness', label: 'Brillo' },
  { id: 'rhythmic_pressure', label: 'Ritmo' },
];

let bars = [];

export function initWidgetQuickview(container) {
  if (!container) return;
  container.innerHTML = '';
  bars = [];
  KEYS.forEach(({ id, label }) => {
    const { element, update } = createWidgetBar({
      id,
      label,
      value: 0.5,
      variant: 'vertical',
      showValue: false,
      peakHold: true,
    });
    container.appendChild(element);
    bars.push({ key: id, update });
  });
}

export function updateWidgetQuickview(semantic) {
  if (!semantic) return;
  bars.forEach(({ key, update }) => {
    update(semantic[key] ?? 0.5);
  });
}
