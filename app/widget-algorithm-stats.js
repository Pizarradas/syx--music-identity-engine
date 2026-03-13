/**
 * Panel de estadísticas de algoritmos — métricas del pipeline
 * Muestra qué se ha extraído del audio para afinar la identidad visual
 */
let containerEl = null;

export function initAlgorithmStats(container) {
  if (!container) return;
  containerEl = container;
  containerEl.innerHTML = `
    <div class="algorithm-stats algorithm-stats--glass" aria-label="Estadísticas de algoritmos">
      <div class="algorithm-stats__row">
        <span class="algorithm-stats__label">Frames</span>
        <span class="algorithm-stats__value" id="algo-frames">—</span>
      </div>
      <div class="algorithm-stats__row">
        <span class="algorithm-stats__label">BPM</span>
        <span class="algorithm-stats__value" id="algo-bpm">—</span>
      </div>
      <div class="algorithm-stats__row">
        <span class="algorithm-stats__label">Tonalidad</span>
        <span class="algorithm-stats__value" id="algo-key">—</span>
      </div>
      <div class="algorithm-stats__row">
        <span class="algorithm-stats__label">Secciones</span>
        <span class="algorithm-stats__value" id="algo-sections">—</span>
      </div>
      <div class="algorithm-stats__row">
        <span class="algorithm-stats__label">Conf. tonalidad</span>
        <span class="algorithm-stats__value" id="algo-key-conf">—</span>
      </div>
      <div class="algorithm-stats__row">
        <span class="algorithm-stats__label">Sample rate</span>
        <span class="algorithm-stats__value" id="algo-sr">—</span>
      </div>
      <details class="algorithm-stats__details">
        <summary class="algorithm-stats__summary">Algoritmos activos</summary>
        <ul class="algorithm-stats__list" aria-label="Lista de algoritmos del pipeline">
          <li>decodeAudioFile</li>
          <li>extractFeatures (RMS, centroid, rolloff, flatness, flux, chroma, MFCC)</li>
          <li>detectBPM</li>
          <li>detectKey</li>
          <li>analyzeStructure (novelty, boundaries)</li>
          <li>processFeatureStream → semántica</li>
          <li>buildSemanticTimeline</li>
        </ul>
      </details>
    </div>
  `;
}

export function updateAlgorithmStats(pipelineResult) {
  if (!containerEl || !pipelineResult) return;
  const meta = pipelineResult.metadata || {};
  const summary = pipelineResult.analysisSummary || {};
  const states = pipelineResult.semantic?.states || [];

  const set = (id, val) => {
    const el = containerEl.querySelector(`#${id}`);
    if (el) el.textContent = val ?? '—';
  };

  set('algo-frames', states.length?.toLocaleString?.() ?? states.length);
  set('algo-bpm', meta.bpm ?? summary.bpm ?? '—');
  set('algo-key', meta.key ? `${meta.key} ${meta.keyMode || ''}`.trim() : summary.key ? `${summary.key} ${summary.keyMode || ''}`.trim() : '—');
  set('algo-sections', summary.sectionCount ?? meta.sectionCount ?? '—');
  const conf = meta.keyConfidence ?? summary.keyConfidence;
  set('algo-key-conf', typeof conf === 'number' ? `${Math.round(conf * 100)}%` : '—');
  set('algo-sr', meta.sampleRate ? `${(meta.sampleRate / 1000).toFixed(1)} kHz` : '—');
}
