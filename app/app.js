/**
 * SYX Music Identity Engine — Dashboard musical
 * Pipeline, identidad visual, Three.js, multi-theming
 * Fase 5: throttling adaptativo para evitar lags
 */
import { runPipeline } from '../engine/index.js';
import { semanticToVisual, applyVisualToSyx, resetSyxTheme, getSuperposedVibration, computeTrackFingerprint, computeAccumulatedStateUpTo, getGeometricParams } from '../engine/index.js';
import { config } from '../engine/config.js';
import { semanticToTokenFoundations, foundationsToSyxTheme, formatTokenFoundationsOutput } from '../engine/index.js';
import { initSpectrumBars, connectAudio, disconnectAudio, setBarColor, setSpectrumProminence, setBaseHue, onBandData } from './visualizer.js';
import { initOrganicBackground, updateOrganicBackground } from './organic-background.js';
import { initAlgorithmMeters, updateAlgorithmMeters } from './algorithm-meters.js';
import { initWidgetQuickview, updateWidgetQuickview } from './widget-quickview.js';
import { initWidgetRegister, updateWidgetRegister } from './widget-register.js';
import { initWidgetInstruments, updateWidgetInstruments } from './widget-instruments.js';
import { initWidgetTexture, updateWidgetTexture } from './widget-texture.js';
import { initMapProgress, updateMapProgress } from './widget-map-progress.js';
import { initAlgorithmChart, updateAlgorithmChart, updateAlgorithmChartProgressive } from './algorithm-chart.js';
import { initAlgorithmRadar, updateAlgorithmRadar } from './algorithm-radar.js';
import { initEmotionBubbles, updateEmotionBubbles } from './emotion-bubbles.js';
import { initAlgorithmFeedback, updateAlgorithmFeedback } from './algorithm-feedback.js';
import { initWidgetTokenInspector, updateWidgetTokenInspector } from './widget-token-inspector.js';
import { initWidgetAudioAnalysis, updateWidgetAudioAnalysis } from './widget-audio-analysis.js';
import { initWidgetD3Analysis, updateWidgetD3Analysis, initWidgetD3Rhythm, updateWidgetD3Rhythm } from './widget-d3-analysis.js';
import { initLiveThemePreview, updateLiveThemePreview } from './live-theme-preview.js';
import { initCenterDataStage, updateCenterDataStage } from './center-data-stage.js';
import { initDataAnalyticsPanel, updateDataAnalyticsPanel } from './data-analytics-panel.js';
import { initAnalysisProgress, updateAnalysisProgress, hideAnalysisProgress } from './widget-analysis-progress.js';
import { initAlgorithmStats, updateAlgorithmStats } from './widget-algorithm-stats.js';
import { initIdentityBuilder, updateIdentityBuilder } from './identity-builder.js';
import { initCenterAnimations, updateCenterAnimations, triggerBeatPulse } from './center-block-animations.js';
import { initRipple, initFlash, updateRipple, triggerRipple, triggerFlash } from './ripple-effect.js';
import { triggerParticleBurst } from './scene.js';
import { setBPM, onBeat, checkBeat, clearBeatCallbacks, stopTransportSync } from './beat-sync.js';
import { loadWaveform, setWaveformTime, destroyWaveform } from './waveform.js';
import { downloadVisualizationPng, downloadChartPng, downloadReportHtml, downloadReportJson, downloadTokensJson, downloadTokensCss, downloadSyxTheme, openThemePreviewHtml } from './export-utils.js';
import { getAlgorithmChart } from './algorithm-chart.js';
import { getVisualThrottle, isPageVisible } from './performance-utils.js';

let sceneModule = null;
(async () => {
  const container = document.getElementById('scene-container');
  if (container) {
    initRipple(container);
    initFlash(container);
  }
  try {
    sceneModule = await import('./scene.js');
    if (container) {
      await sceneModule.initScene(container);
      sceneModule.startRenderLoop();
    }
  } catch (e) {
    console.warn('Escena 3D no disponible:', e.message);
  }
})();

const spectrumContainer = document.getElementById('spectrum-bars');
if (spectrumContainer) initSpectrumBars(spectrumContainer);


initCenterAnimations();

const metersContainer = document.getElementById('algorithm-meters');
if (metersContainer) initAlgorithmMeters(metersContainer);
const quickviewContainer = document.getElementById('widget-quickview-bars');
if (quickviewContainer) initWidgetQuickview(quickviewContainer);
const centerMaps = document.getElementById('center-maps');
const centerSums = document.getElementById('center-sums');
if (centerMaps || centerSums) initMapProgress(centerMaps, centerSums);

const chartContainer = document.getElementById('algorithm-chart');
if (chartContainer) initAlgorithmChart(chartContainer);

const radarContainer = document.getElementById('algorithm-radar');
if (radarContainer) initAlgorithmRadar(radarContainer);

const emotionBubblesEl = document.getElementById('emotion-bubbles');
const emotionMetricsEl = document.getElementById('emotion-metrics');
if (emotionBubblesEl) initEmotionBubbles(emotionBubblesEl, emotionMetricsEl);

const feedbackContainer = document.getElementById('algorithm-feedback');
if (feedbackContainer) initAlgorithmFeedback(feedbackContainer);

const tokenInspectorContainer = document.getElementById('widget-token-inspector');
if (tokenInspectorContainer) initWidgetTokenInspector(tokenInspectorContainer);

const audioAnalysisContainer = document.getElementById('widget-audio-analysis');
if (audioAnalysisContainer) initWidgetAudioAnalysis(audioAnalysisContainer);

const widgetD3El = document.getElementById('widget-d3-analysis');
if (widgetD3El) initWidgetD3Analysis(widgetD3El);
const widgetD3RhythmEl = document.getElementById('widget-d3-rhythm');
if (widgetD3RhythmEl) initWidgetD3Rhythm(widgetD3RhythmEl);

const liveThemePreviewEl = document.getElementById('live-theme-preview');
if (liveThemePreviewEl) initLiveThemePreview(liveThemePreviewEl);

const centerDataStageEl = document.getElementById('center-data-stage');
if (centerDataStageEl) initCenterDataStage(centerDataStageEl);

const dataAnalyticsPanelEl = document.getElementById('data-analytics-panel');
if (dataAnalyticsPanelEl) initDataAnalyticsPanel(dataAnalyticsPanelEl);

const analysisProgressEl = document.getElementById('analysis-progress');
if (analysisProgressEl) initAnalysisProgress(analysisProgressEl);

const algorithmStatsEl = document.getElementById('widget-algorithm-stats');
if (algorithmStatsEl) initAlgorithmStats(algorithmStatsEl);

const identityBuilderEl = document.getElementById('identity-builder-content');
if (identityBuilderEl) initIdentityBuilder(identityBuilderEl);

const audioInput = document.getElementById('audio-input');
const audioName = document.getElementById('audio-name');
const btnRun = document.getElementById('btn-run');
const statusEl = document.getElementById('status');
const trackName = document.getElementById('track-name');
const headerBpm = document.getElementById('header-bpm');
const headerKey = document.getElementById('header-key');
const headerTime = document.getElementById('header-time');
const progressFill = document.getElementById('progress-fill');
const centerHint = document.getElementById('center-hint');
const audioEl = document.getElementById('audio-el');
const timeDisplay = document.getElementById('time-display');
const durationDisplay = document.getElementById('duration-display');
const timelineFill = document.getElementById('timeline-fill');
const btnPlay = document.getElementById('btn-play');
const btnPlaySidebar = document.getElementById('btn-play-sidebar');
const onboardingEl = document.getElementById('onboarding');
const visualStage = document.getElementById('visual-stage');
let pipelineResult = null;
let pipelineRunning = false;
let lastSemanticState = null;
let lastVisualState = null;
let lastTokenFoundations = null;
let visualRefreshId = null;
let trackFingerprint = null;
let lastBandData = { bass: 0.33, mids: 0.33, highs: 0.33 };
let currentDuration = 0;
let lastStateUpdateTime = 0;
let lastTransientBurstTime = 0;
let lastDominantPitchClass = -1;
let lastChromaFlashTime = 0;
const TRANSIENT_BURST_COOLDOWN_MS = 400;
const CHROMA_FLASH_COOLDOWN_MS = 1200;
let cachedPrimaryColor = '';
let cachedBaseHue = 260;
let styleCacheCounter = 0;
const STATE_UPDATE_INTERVAL_MS = 100;
let playerAbortController = null;
let lastPlayerUrl = null;
let themeFrozen = false;

function togglePlay() {
  if (!audioEl.src) return;
  if (audioEl.paused) {
    audioEl.play().catch((e) => console.warn('Play:', e.message));
  } else {
    audioEl.pause();
  }
}

[btnPlay, btnPlaySidebar].forEach((btn) => {
  if (!btn) return;
  btn.disabled = true;
  btn.setAttribute('aria-label', 'Reproducir (carga audio primero)');
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    togglePlay();
  });
});

// Atajo teclado: Space para play/pause (evita scroll)
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space') return;
  const active = document.activeElement;
  if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.getAttribute('contenteditable') === 'true') return;
  e.preventDefault();
  if (audioEl.src && !btnPlay?.disabled) togglePlay();
});

// Pantalla completa: F para alternar
function toggleFullscreen() {
  const app = document.querySelector('.org-app');
  if (!app) return;
  const isFull = app.classList.toggle('org-app--fullscreen');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

const btnFullscreen = document.getElementById('btn-fullscreen');
const btnFullscreenExit = document.getElementById('btn-fullscreen-exit');
[btnFullscreen, btnFullscreenExit].forEach((btn) => {
  if (btn) btn.addEventListener('click', toggleFullscreen);
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const active = document.activeElement;
    if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;
    e.preventDefault();
    toggleFullscreen();
  }
});

function setStatus(msg, type = 'ok') {
  if (!statusEl) return;
  statusEl.className = `mol-status ${type}`;
  statusEl.textContent = msg;
  statusEl.style.display = msg ? 'block' : 'none';
}

let visualFrameCount = 0;
const getVisualThrottleFrames = () => getVisualThrottle();

function startVisualRefreshLoop() {
  if (visualRefreshId) return;
  function refresh() {
    visualRefreshId = requestAnimationFrame(refresh);
    if (!isPageVisible()) return;
    if (audioEl?.src && !audioEl.paused && currentDuration > 0) {
      checkBeat(audioEl.currentTime, currentDuration);
    }
    visualFrameCount++;
    const throttle = getVisualThrottleFrames();
    if (lastVisualState && (visualFrameCount % (throttle + 1) === 0) && !themeFrozen) {
      applyVisualToSyx(lastVisualState);
      updateCenterAnimations(lastSemanticState, lastBandData);
      if (document.getElementById('organic-bg')) updateOrganicBackground(lastSemanticState, lastBandData, lastVisualState);
      const t = audioEl?.currentTime ?? 0;
      const d = currentDuration || 1;
      updateIdentityBuilder(lastSemanticState, lastVisualState, Math.min(1, t / d));
      try {
        sceneModule?.updateScene?.(lastSemanticState, lastVisualState, lastBandData);
      } catch (_) {}
    }
  }
  refresh();
}

function stopVisualRefreshLoop() {
  if (visualRefreshId) {
    cancelAnimationFrame(visualRefreshId);
    visualRefreshId = null;
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Actualiza indicadores del flujo: completado, activo, bloqueado; habilita Ver HTML cuando hay pipeline */
function updateFlowSteps() {
  const hasFile = !!audioInput?.files?.[0];
  const hasPipeline = !!pipelineResult;
  const isPlaying = audioEl?.src && !audioEl?.paused;
  const outputPanel = document.getElementById('output-panel');
  const btnPreviewHtml = document.getElementById('btn-preview-html');

  [1, 2, 3].forEach((n) => {
    const el = document.getElementById(`flow-step-${n}`);
    const wrap = document.querySelector(`[data-flow-step="${n}"]`);
    if (!el) return;
    el.classList.remove('is-complete', 'is-active', 'is-blocked');
    if (wrap) wrap.classList.remove('is-complete', 'is-active', 'is-blocked');

    if (n === 1) {
      if (hasFile) {
        el.classList.add('is-complete');
        if (wrap) wrap.classList.add('is-complete');
      } else {
        el.classList.add('is-active');
        if (wrap) wrap.classList.add('is-active');
      }
    } else if (n === 2) {
      if (hasPipeline) {
        el.classList.add('is-complete');
        if (wrap) wrap.classList.add('is-complete');
      } else if (hasFile) {
        el.classList.add('is-active');
        if (wrap) wrap.classList.add('is-active');
      } else {
        el.classList.add('is-blocked');
        if (wrap) wrap.classList.add('is-blocked');
      }
    } else if (n === 3) {
      if (isPlaying) {
        el.classList.add('is-complete');
        if (wrap) wrap.classList.add('is-complete');
      } else if (hasPipeline) {
        el.classList.add('is-active');
        if (wrap) wrap.classList.add('is-active');
      } else {
        el.classList.add('is-blocked');
        if (wrap) wrap.classList.add('is-blocked');
      }
    }
  });

  if (btnPreviewHtml) {
    btnPreviewHtml.disabled = !hasPipeline;
    btnPreviewHtml.setAttribute('aria-disabled', String(!hasPipeline));
    btnPreviewHtml.title = hasPipeline ? 'Abre una página HTML con todos los tokens aplicados' : 'Analiza primero para ver el HTML con tokens';
  }
  const btnExportEl = document.getElementById('btn-export');
  if (btnExportEl) {
    btnExportEl.disabled = !hasPipeline;
    btnExportEl.setAttribute('aria-disabled', String(!hasPipeline));
    btnExportEl.title = hasPipeline ? 'Exportar identidad (PNG, JSON, informe, tokens)' : 'Analiza primero para exportar';
  }
  const btnRunEl = document.getElementById('btn-run');
  if (btnRunEl && !pipelineRunning) btnRunEl.disabled = !hasFile;
  if (outputPanel) {
    outputPanel.classList.toggle('output-available', hasPipeline);
    outputPanel.setAttribute('aria-label', hasPipeline ? 'Output disponible: reproduce para ver el tema en vivo' : 'Output disponible tras analizar');
  }
}

audioInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  const card = audioInput.closest('.mol-upload-card');
  if (f) {
    card?.classList.add('has-file');
    audioName.textContent = f.name;
  } else {
    card?.classList.remove('has-file');
    audioName.textContent = 'Arrastra o haz clic (.wav, .mp3)';
  }
  updateFlowSteps();
});

function setupDragDrop(inputEl, isAudio) {
  const card = inputEl.closest('.mol-upload-card');
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((ev) => {
    card?.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); });
  });
  ['dragenter', 'dragover'].forEach((ev) => {
    card?.addEventListener(ev, () => card?.classList.add('is-dragover'));
  });
  ['dragleave', 'drop'].forEach((ev) => {
    card?.addEventListener(ev, () => card?.classList.remove('is-dragover'));
  });
  card?.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files[0];
    if (!f) return;
    const ok = isAudio
      ? /\.wav$/i.test(f.name) || f.type === 'audio/wav' || f.type === 'audio/x-wav'
      : /\.(lrc|txt|json)$/i.test(f.name) || f.type.startsWith('text/');
    if (ok) {
      const dt = new DataTransfer();
      dt.items.add(f);
      inputEl.files = dt.files;
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

setupDragDrop(audioInput, true);

const btnPreviewHtml = document.getElementById('btn-preview-html');
if (btnPreviewHtml) {
  btnPreviewHtml.addEventListener('click', () => {
    const foundations = lastTokenFoundations ?? (pipelineResult ? semanticToTokenFoundations(pipelineResult.getStateAtTime(0)?.semantic ?? {}, { keyHue: pipelineResult?.metadata?.keyHue }) : null);
    const opts = pipelineResult ? { keyHue: pipelineResult?.metadata?.keyHue } : {};
    const ok = openThemePreviewHtml(foundations, opts);
    if (ok) setStatus('Vista previa HTML abierta.', 'ok');
    else setStatus('Permite ventanas emergentes o analiza primero.', 'error');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

const btnFreezeTheme = document.getElementById('btn-freeze-theme');
if (btnFreezeTheme) {
  btnFreezeTheme.addEventListener('click', () => {
    themeFrozen = !themeFrozen;
    btnFreezeTheme.setAttribute('aria-pressed', String(themeFrozen));
    btnFreezeTheme.classList.toggle('is-active', themeFrozen);
    btnFreezeTheme.querySelector('[data-lucide]')?.setAttribute('data-lucide', themeFrozen ? 'sun' : 'snowflake');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setStatus(themeFrozen ? 'Tema congelado. Inspecciona o exporta.' : 'Tema en vivo.', 'ok');
  });
}

const btnExport = document.getElementById('btn-export');
const exportMenu = document.getElementById('export-menu');
if (btnExport && exportMenu) {
  btnExport.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = exportMenu.hidden;
    exportMenu.hidden = !willOpen;
    btnExport.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) {
      document.addEventListener('click', closeExportMenu, { once: true });
    }
  });
  exportMenu.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const action = e.currentTarget.dataset.export;
      exportMenu.hidden = true;
      if (action === 'png') {
        const ok = await downloadVisualizationPng();
        setStatus(ok ? 'Captura PNG descargada.' : 'Export no disponible.', ok ? 'ok' : 'error');
      } else if (action === 'chart') {
        const chart = getAlgorithmChart();
        const ok = downloadChartPng(chart);
        setStatus(ok ? 'Gráfico PNG descargado.' : 'Sin gráfico.', ok ? 'ok' : 'error');
      } else if (action === 'report') {
        const meta = pipelineResult?.metadata || {};
        downloadReportHtml(lastSemanticState || {}, {
          trackName: trackName?.textContent || '—',
          duration: meta.duration,
        });
        setStatus('Informe HTML descargado.', 'ok');
      } else if (action === 'json') {
        if (pipelineResult) {
          downloadReportJson(pipelineResult, trackName?.textContent || '—');
          setStatus('JSON mapa de la canción descargado.', 'ok');
        } else {
          setStatus('Ejecuta el análisis primero.', 'error');
        }
      } else if (action === 'tokens-json') {
        const foundations = lastTokenFoundations ?? (pipelineResult ? semanticToTokenFoundations(pipelineResult.getStateAtTime(0)?.semantic ?? {}, { keyHue: pipelineResult?.metadata?.keyHue }) : null);
        if (foundations) {
          downloadTokensJson(foundations, trackName?.textContent || '—');
          setStatus('JSON tokens descargado.', 'ok');
        } else {
          setStatus('Ejecuta el análisis primero.', 'error');
        }
      } else if (action === 'tokens-css') {
        const foundations = lastTokenFoundations ?? (pipelineResult ? semanticToTokenFoundations(pipelineResult.getStateAtTime(0)?.semantic ?? {}, { keyHue: pipelineResult?.metadata?.keyHue }) : null);
        if (foundations) {
          const keyHue = pipelineResult?.metadata?.keyHue;
          downloadTokensCss(foundations, { keyHue }, trackName?.textContent || '—');
          setStatus('CSS custom properties descargado.', 'ok');
        } else {
          setStatus('Ejecuta el análisis primero.', 'error');
        }
      } else if (action === 'syx-theme') {
        const foundations = lastTokenFoundations ?? (pipelineResult ? semanticToTokenFoundations(pipelineResult.getStateAtTime(0)?.semantic ?? {}, { keyHue: pipelineResult?.metadata?.keyHue }) : null);
        if (foundations) {
          const keyHue = pipelineResult?.metadata?.keyHue;
          downloadSyxTheme(foundations, { keyHue }, trackName?.textContent || '—');
          setStatus('SYX theme config descargado.', 'ok');
        } else {
          setStatus('Ejecuta el análisis primero.', 'error');
        }
      }
    });
  });
}
function closeExportMenu() {
  if (exportMenu) exportMenu.hidden = true;
  if (btnExport) btnExport.setAttribute('aria-expanded', 'false');
}

btnRun.addEventListener('click', async () => {
  const audioFile = audioInput.files[0];

  if (!audioFile) {
    setStatus('Selecciona un archivo de audio (WAV, MP3 u OGG).', 'error');
    return;
  }

  setStatus('Procesando...', 'loading');
  pipelineRunning = true;
  btnRun.disabled = true;
  updateAnalysisProgress(0, 'Iniciando…');

  try {
    pipelineResult = await runPipeline(audioFile, '', 'auto', {
      onProgress: (p) => updateAnalysisProgress(p.percent, p.stage),
    });
    setStatus('Listo.', 'ok');
    trackName.textContent = audioFile.name;
    durationDisplay.textContent = formatTime(pipelineResult.metadata.duration);
    updateAlgorithmStats(pipelineResult);
    setupPlayer(audioFile, pipelineResult);
    updateWidgetD3Analysis(null, 0, pipelineResult);
    updateWidgetD3Rhythm(null, 0, pipelineResult);
    const initState = pipelineResult.getStateAtTime(0);
    const initSemantic = initState?.semantic ?? {};
    const keyHue = pipelineResult?.metadata?.keyHue;
    const keyConfidence = pipelineResult?.metadata?.keyConfidence ?? 0.5;
    const initVisual = semanticToVisual(initSemantic, {
      keyHue,
      keyConfidence,
      fingerprint: trackFingerprint,
    });
    updateLiveThemePreview(initSemantic, initVisual, 1);
    applyVisualToSyx(initVisual);
    lastVisualState = initVisual;
    lastSemanticState = initSemantic;
    lastTokenFoundations = semanticToTokenFoundations(initSemantic, { keyHue, fingerprint: trackFingerprint });
    updateFlowSteps();
  } catch (err) {
    setStatus(`Error: ${err.message}`, 'error');
    console.error(err);
  } finally {
    pipelineRunning = false;
    hideAnalysisProgress();
    btnRun.disabled = !audioInput?.files?.[0];
  }
});

let lastWasBoundary = false;

function updateStateAtTime(t, result) {
  if (!result) return;
  const state = result.getStateAtTime(t);
  const semantic = state.semantic || {};
  lastSemanticState = semantic;

  const keyHue = result?.metadata?.keyHue;
  const keyConfidence = result?.metadata?.keyConfidence ?? 0.5;

  const states = result.semantic?.states;
  const hopMs = config.analysis?.shortWindowMs ?? 50;
  const idx = Math.min(
    Math.floor((t * 1000) / hopMs),
    states?.length ? states.length - 1 : 0
  );
  const accumulated = states?.length ? computeAccumulatedStateUpTo(states, idx) : null;

  const visual = semanticToVisual(semantic, {
    hasLyrics: false,
    fingerprint: trackFingerprint,
    keyHue,
    keyConfidence,
    accumulated: accumulated ? { mean: accumulated.mean } : null,
  });
  lastVisualState = visual;
  lastTokenFoundations = semanticToTokenFoundations(semantic, {
    keyHue,
    fingerprint: trackFingerprint,
    accumulated: accumulated ? { mean: accumulated.mean } : null,
  });

  const isPlaying = !audioEl?.paused;
  if (isPlaying && !themeFrozen) {
    applyVisualToSyx(visual);
  }

  const e = semantic.energy_level ?? 0.5;
  const isBoundary = semantic.is_boundary === true;
  if (isBoundary && !lastWasBoundary && e > 0.5) {
    lastWasBoundary = true;
  } else if (!isBoundary) {
    lastWasBoundary = false;
  }

  const transient = semantic.transient_strength ?? 0;
  if (transient > 0.92 && Date.now() - lastTransientBurstTime > TRANSIENT_BURST_COOLDOWN_MS) {
    lastTransientBurstTime = Date.now();
    triggerParticleBurst();
  }
  const dominantPitch = semantic.dominant_pitch_class ?? -1;
  const chromaStrength = semantic.chroma_strength ?? 0;
  if (dominantPitch >= 0 && chromaStrength > 0.5 && dominantPitch !== lastDominantPitchClass &&
      Date.now() - lastChromaFlashTime > CHROMA_FLASH_COOLDOWN_MS) {
    lastDominantPitchClass = dominantPitch;
    lastChromaFlashTime = Date.now();
  } else if (dominantPitch >= 0) {
    lastDominantPitchClass = dominantPitch;
  }
  const root = document.documentElement;
  if (isPlaying && !themeFrozen) {
    updateRipple(e);
    const tension = semantic.harmonic_tension ?? 0.5;
    const b = semantic.timbral_brightness ?? 0.5;
    const groove = semantic.groove ?? 0.5;
    const now = Date.now() / 1000;
    const vibration = getSuperposedVibration(now, lastBandData.bass, lastBandData.mids, lastBandData.highs);
    root.style.setProperty('--music-dashboard-pulse-scale', String(0.78 + e * 0.5 + groove * 0.15 + vibration * 0.12));
    root.style.setProperty('--music-groove-pulse', String(groove));
    const geom = getGeometricParams(semantic);
    root.style.setProperty('--music-dashboard-ring-energy-opacity', String(0.3 + e * 0.6));
    root.style.setProperty('--music-dashboard-ring-tension-opacity', String(0.2 + tension * 0.5));
    root.style.setProperty('--music-dashboard-ring-timbral-opacity', String(0.15 + b * 0.4));
    geom.radii.slice(0, 3).forEach((r, i) => {
      root.style.setProperty(`--music-ring-radius-${i + 1}`, `${r}px`);
    });

    styleCacheCounter++;
    if (styleCacheCounter % 5 === 0) {
      cachedPrimaryColor = getComputedStyle(root).getPropertyValue('--semantic-color-primary').trim();
      cachedBaseHue = parseFloat(getComputedStyle(root).getPropertyValue('--syx-music-hue') || '260');
    }
    if (cachedPrimaryColor) setBarColor(cachedPrimaryColor);
    setBaseHue(cachedBaseHue);

    setSpectrumProminence(visual.spectrum_prominence ?? 0.7);
  }

  updateAlgorithmMeters(semantic);
  updateWidgetQuickview(semantic);
  updateWidgetRegister(semantic);
  updateWidgetInstruments(semantic);
  updateWidgetTexture(semantic);
  if (result?.semantic?.states?.length && result?.metadata?.duration) {
    updateAlgorithmChartProgressive(t, result);
  } else {
    updateAlgorithmChart(semantic);
  }
  updateAlgorithmRadar(semantic);
  updateEmotionBubbles(semantic, cachedBaseHue);
  updateAlgorithmFeedback(semantic);
  updateWidgetTokenInspector(lastTokenFoundations);
  updateWidgetAudioAnalysis(lastBandData);
  updateWidgetD3Analysis(semantic, t, result);
  updateWidgetD3Rhythm(semantic, t, result);
  const progress = result?.metadata?.duration ? Math.min(1, Math.max(0, t / result.metadata.duration)) : 1;
  updateIdentityBuilder(semantic, visual, progress);
  updateLiveThemePreview(semantic, visual, progress);
  updateCenterDataStage(semantic, t, result);
  updateDataAnalyticsPanel(semantic, t, result);
  updateMapProgress(t, result);

  try {
    sceneModule?.updateScene?.(semantic, visual, lastBandData);
  } catch (_) {}
}

function setupPlayer(audioFile, result) {
  if (playerAbortController) playerAbortController.abort();
  playerAbortController = new AbortController();
  const signal = playerAbortController.signal;

  if (lastPlayerUrl) URL.revokeObjectURL(lastPlayerUrl);
  lastDominantPitchClass = -1;
  lastWasBoundary = false;
  lastChromaFlashTime = 0;
  styleCacheCounter = 0;
  const url = URL.createObjectURL(audioFile);
  lastPlayerUrl = url;
  audioEl.src = url;
  audioEl.controls = true;
  audioEl.style.display = '';

  const waveformContainer = document.getElementById('waveform-container');
  if (waveformContainer) {
    loadWaveform(waveformContainer, url, audioEl, (time) => {
      if (audioEl?.src) audioEl.currentTime = time;
    });
  }

  [btnPlay, btnPlaySidebar].forEach((btn) => {
    if (btn) {
      btn.disabled = false;
      btn.setAttribute('aria-label', 'Reproducir');
    }
  });
  updateFlowSteps();
  visualStage?.classList.add('has-pipeline');
  document.body.classList.add('org-app--data-focus');
  onboardingEl?.classList.add('is-hidden');
  centerHint?.classList.add('is-hidden');

  const identityBuilder = document.getElementById('identity-builder');
  const liveThemePreviewWrap = document.getElementById('live-theme-preview')?.closest('.live-theme-preview-wrap');
  [identityBuilder, liveThemePreviewWrap].forEach((el) => {
    if (el) el.setAttribute('data-reveal-on-play', '');
  });

  import('./center-block-animations.js').then((m) => m.animateCenterIn?.()).catch(() => {});

  connectAudio(audioEl);
  onBandData((data) => { lastBandData = data; });

  trackFingerprint = computeTrackFingerprint(result.semantic?.states, 'all');

  if (headerBpm) {
    headerBpm.textContent = result.metadata.bpm ? `${result.metadata.bpm} BPM` : '';
    headerBpm.style.display = result.metadata.bpm ? '' : 'none';
  }
  if (headerKey) {
    const k = result.metadata.key;
    const m = result.metadata.keyMode;
    headerKey.textContent = k ? `${k} ${m || ''}`.trim() : '';
    headerKey.style.display = k ? '' : 'none';
  }

  const duration = result.metadata.duration;
  currentDuration = duration;
  const bpm = result.metadata.bpm ?? 120;
  const beatOffset = result.metadata.beatOffset ?? 0;
  clearBeatCallbacks();
  setBPM(bpm, beatOffset);
  onBeat((beatIndex, time) => {
    triggerRipple();
    triggerBeatPulse();
    triggerParticleBurst();
  });

  const playerBar = document.getElementById('player-bar');
  const updateSliderAria = (t) => {
    const pct = (t / duration) * 100;
    if (playerBar) {
      playerBar.setAttribute('aria-valuenow', String(Math.round(pct)));
      playerBar.setAttribute('aria-valuetext', formatTime(t));
    }
  };

  audioEl.addEventListener('timeupdate', () => {
    const t = audioEl.currentTime;
    setWaveformTime(t);
    headerTime.textContent = formatTime(t);
    timeDisplay.textContent = formatTime(t);
    const pct = (t / duration) * 100;
    progressFill.style.width = `${pct}%`;
    timelineFill.style.width = `${pct}%`;
    updateSliderAria(t);

    const now = Date.now();
    if (now - lastStateUpdateTime >= STATE_UPDATE_INTERVAL_MS) {
      lastStateUpdateTime = now;
      updateStateAtTime(t, result);
    }
  }, { signal });

  if (playerBar) {
    playerBar.addEventListener('keydown', (e) => {
      if (!audioEl.src) return;
      const step = e.shiftKey ? 10 : 5;
      let t = audioEl.currentTime;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        t = Math.min(duration, t + step);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        t = Math.max(0, t - step);
      } else if (e.key === 'Home') {
        e.preventDefault();
        t = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        t = duration;
      } else return;
      audioEl.currentTime = t;
      updateSliderAria(t);
    }, { signal });
  }

  audioEl.addEventListener('play', () => {
    btnPlay?.classList.add('is-playing');
    btnPlay?.setAttribute('aria-label', 'Pausar');
    btnPlaySidebar?.classList.add('is-playing');
    btnPlaySidebar?.setAttribute('aria-label', 'Pausar');
    startVisualRefreshLoop();
    updateFlowSteps();

    const identityBuilder = document.getElementById('identity-builder');
    const liveThemePreviewWrap = document.getElementById('live-theme-preview')?.closest('.live-theme-preview-wrap');
    [identityBuilder, liveThemePreviewWrap].forEach((el) => {
      if (el?.hasAttribute('data-reveal-on-play')) {
        el.removeAttribute('data-reveal-on-play');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
        }
      }
    });
  }, { signal });
  audioEl.addEventListener('pause', () => {
    stopTransportSync();
    btnPlay?.classList.remove('is-playing');
    btnPlay?.setAttribute('aria-label', 'Reproducir');
    btnPlaySidebar?.classList.remove('is-playing');
    btnPlaySidebar?.setAttribute('aria-label', 'Reproducir');
    stopVisualRefreshLoop();
    updateFlowSteps();
  }, { signal });
  audioEl.addEventListener('ended', () => {
    btnPlay?.classList.remove('is-playing');
    btnPlay?.setAttribute('aria-label', 'Reproducir');
    btnPlaySidebar?.classList.remove('is-playing');
    btnPlaySidebar?.setAttribute('aria-label', 'Reproducir');
    stopVisualRefreshLoop();
    disconnectAudio();
    onBandData(null);
    trackFingerprint = null;
    lastBandData = { bass: 0.33, mids: 0.33, highs: 0.33 };
    currentDuration = 0;
    styleCacheCounter = 0;
    resetSyxTheme();
    themeFrozen = false;
    btnFreezeTheme?.setAttribute('aria-pressed', 'false');
    btnFreezeTheme?.classList.remove('is-active');
    btnFreezeTheme?.querySelector('[data-lucide]')?.setAttribute('data-lucide', 'snowflake');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    [document.getElementById('identity-builder'), document.getElementById('live-theme-preview')?.closest('.live-theme-preview-wrap')].forEach((el) => {
      if (el) el.setAttribute('data-reveal-on-play', '');
    });
    updateFlowSteps();
    updateAlgorithmFeedback(null);
    onboardingEl?.classList.remove('is-hidden');
    visualStage?.classList.remove('has-pipeline');
    document.body.classList.remove('org-app--data-focus');
    centerHint?.classList.remove('is-hidden');
    if (headerBpm) {
      headerBpm.textContent = '';
      headerBpm.style.display = 'none';
    }
    if (headerKey) {
      headerKey.textContent = '';
      headerKey.style.display = 'none';
    }
  }, { signal });

  updateStateAtTime(0, result);
  updateSliderAria(0);

  const seek = (el, d) => {
    el?.addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audioEl.currentTime = pct * d;
    }, { signal });
  };
  seek(document.getElementById('player-bar'), duration);
  seek(progressFill?.closest('.org-app-header__progress'), duration);
}

// Estado inicial del flujo al cargar
updateFlowSteps();

// Fondo orgánico: partículas + estado decorativo inicial
const organicBgEl = document.getElementById('organic-bg');
if (organicBgEl) {
  initOrganicBackground();
  updateOrganicBackground(null, lastBandData, null);
  setInterval(() => {
    if (!audioEl?.src || audioEl.paused) {
      updateOrganicBackground(lastSemanticState, lastBandData, lastVisualState);
    }
  }, 400);
}
