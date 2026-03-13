/**
 * Audio Analysis Layer — Capa 1 del Observer
 * docs/27_real_time_music_to_design_observer.md
 *
 * Muestra features crudos del audio: RMS, centroid, bandas.
 */
import { createWidgetBar } from './widgets/index.js';

let bars = [];

export function initWidgetAudioAnalysis(container) {
  if (!container) return;
  container.innerHTML = '';
  bars = [];
  const metrics = [
    { id: 'rms', label: 'RMS' },
    { id: 'centroid', label: 'Centroide' },
    { id: 'bass', label: 'Graves' },
    { id: 'mids', label: 'Medios' },
    { id: 'highs', label: 'Agudos' },
  ];
  metrics.forEach(({ id, label }) => {
    const { element, update } = createWidgetBar({
      id,
      label,
      value: 0,
      variant: 'horizontal',
      showValue: false,
      peakHold: true,
    });
    container.appendChild(element);
    bars.push({ key: id, update });
  });
}

export function updateWidgetAudioAnalysis(bandData) {
  if (!bandData) return;
  bars.forEach(({ key, update }) => {
    update(bandData[key] ?? 0);
  });
}
