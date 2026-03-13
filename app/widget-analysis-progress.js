/**
 * Widget de progreso de análisis — muestra qué parte del pipeline está ejecutándose
 * y qué falta por analizar
 */
let containerEl = null;
let barEl = null;
let percentEl = null;
let stageEl = null;

export function initAnalysisProgress(container) {
  if (!container) return;
  containerEl = container;
  containerEl.innerHTML = `
    <div class="analysis-progress analysis-progress--glass" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Progreso del análisis">
      <div class="analysis-progress__bar-wrap">
        <div class="analysis-progress__bar" id="analysis-progress-bar"></div>
      </div>
      <div class="analysis-progress__meta">
        <span class="analysis-progress__percent" id="analysis-progress-percent">0%</span>
        <span class="analysis-progress__stage" id="analysis-progress-stage">—</span>
      </div>
    </div>
  `;
  barEl = containerEl.querySelector('#analysis-progress-bar');
  percentEl = containerEl.querySelector('#analysis-progress-percent');
  stageEl = containerEl.querySelector('#analysis-progress-stage');
}

export function updateAnalysisProgress(percent, stage = '') {
  if (!containerEl) return;
  containerEl.hidden = false;
  containerEl.setAttribute('aria-valuenow', String(Math.round(percent)));
  if (barEl) barEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  if (percentEl) percentEl.textContent = `${Math.round(percent)}%`;
  if (stageEl) stageEl.textContent = stage || '—';
}

export function hideAnalysisProgress() {
  if (!containerEl) return;
  containerEl.hidden = true;
}
