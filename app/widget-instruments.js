/**
 * Widget Instrumentación — presencia de instrumentos
 * docs/29_dashboard_philosophy.md
 * percussion_presence, vocal_presence, bass_presence, pad_presence, lead_presence
 */
import { createWidgetBar } from './widgets/index.js';

const KEYS = [
  { id: 'percussion_presence', label: 'Perc' },
  { id: 'vocal_presence', label: 'Voz' },
  { id: 'bass_presence', label: 'Bass' },
  { id: 'pad_presence', label: 'Pad' },
  { id: 'lead_presence', label: 'Lead' },
];

let bars = [];

export function initWidgetInstruments(container) {
  if (!container) return;
  container.innerHTML = '';
  container.classList.add('dashboard-widget-instruments');
  bars = [];
  KEYS.forEach(({ id, label }) => {
    const { element, update } = createWidgetBar({
      id,
      label,
      value: 0.5,
      variant: 'horizontal',
      showValue: false,
      peakHold: false,
    });
    container.appendChild(element);
    bars.push({ key: id, update });
  });
}

export function updateWidgetInstruments(semantic) {
  if (!semantic) return;
  bars.forEach(({ key, update }) => {
    update(semantic[key] ?? 0.5);
  });
}
