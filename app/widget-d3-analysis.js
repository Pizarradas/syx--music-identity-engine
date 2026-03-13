/**
 * Gráficos D3.js en movimiento — sidebar derecho
 * Evolución de energía, tensión, brillo + ritmo, groove, pulso
 */
const d3 = typeof window !== 'undefined' ? window.d3 : null;
const MAX_POINTS = 80;
const DURATION_MS = 400;

const CHART_CONFIGS = {
  analysis: {
    keys: [
      { key: 'energy_level', label: 'Energía', color: 'var(--semantic-color-primary, #6366f1)' },
      { key: 'harmonic_tension', label: 'Tensión', color: 'var(--semantic-color-accent-warm, #ec4899)' },
      { key: 'timbral_brightness', label: 'Brillo', color: 'var(--semantic-color-accent-cool, #22d3ee)' },
    ],
    label: 'Energía · Tensión · Brillo',
    placeholder: 'Analiza y reproduce para ver los gráficos',
  },
  rhythm: {
    keys: [
      { key: 'rhythmic_pressure', label: 'Presión rítmica', color: 'var(--semantic-color-primary, #6366f1)' },
      { key: 'groove', label: 'Groove', color: 'var(--semantic-color-accent-warm, #f59e0b)' },
      { key: 'pulse_stability', label: 'Estabilidad del pulso', color: 'var(--semantic-color-accent-cool, #22d3ee)' },
    ],
    label: 'Ritmo · Groove · Pulso',
    placeholder: 'Analiza y reproduce para ver los gráficos',
  },
};

function getColor(cssVar) {
  if (typeof document === 'undefined') return '#6366f1';
  const el = document.createElement('span');
  el.style.cssText = `position:absolute;left:-9999px;color:${cssVar}`;
  document.body.appendChild(el);
  const col = getComputedStyle(el).color;
  document.body.removeChild(el);
  return col || '#6366f1';
}

function createD3ChartWidget(config) {
  const { keys, placeholder } = config;
  let containerEl = null;
  let svg = null;
  let xScale = null;
  let yScale = null;
  let pathEls = {};
  let cursorLine = null;
  let defs = null;
  let gradientIds = {};
  let resizeObserver = null;
  let lastSemantic = null;
  let lastTime = null;
  let lastResult = null;

  function sampleData(states, duration, currentTime) {
    if (!states?.length || !duration) return null;
    const progress = Math.min(1, Math.max(0, currentTime / duration));
    const lastIdx = Math.floor(progress * (states.length - 1));
    const slice = states.slice(0, lastIdx + 1);
    if (slice.length === 0) return null;
    const step = Math.max(1, Math.floor(slice.length / MAX_POINTS));
    const sampled = slice.filter((_, i) => i % step === 0 || i === slice.length - 1);
    return {
      series: keys.reduce((acc, { key }) => {
        acc[key] = sampled.map(s => s[key] ?? 0.5);
        return acc;
      }, {}),
      progress,
      len: sampled.length,
    };
  }

  function ensureSvg() {
    if (!containerEl || !d3) return;
    if (svg) return;
    const w = Math.max(200, containerEl.clientWidth || 280);
    const h = 100;
    containerEl.innerHTML = '';
    svg = d3.select(containerEl)
      .append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', 'auto')
      .style('min-height', '80px');
    defs = svg.append('defs');
    keys.forEach(({ key, color }) => {
      const id = `grad-${key}-${Math.random().toString(36).slice(2)}`;
      gradientIds[key] = id;
      defs.append('linearGradient')
        .attr('id', id)
        .attr('x1', 0).attr('y1', 1).attr('x2', 0).attr('y2', 0)
        .selectAll('stop')
        .data([{ offset: '0%', opacity: 0.25 }, { offset: '100%', opacity: 0.02 }])
        .join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-opacity', d => d.opacity)
        .attr('stop-color', () => getColor(color));
    });
    const g = svg.append('g').attr('class', 'chart-main');
    xScale = d3.scaleLinear().domain([0, 1]).range([8, w - 8]);
    yScale = d3.scaleLinear().domain([0, 1]).range([h - 12, 12]);
    keys.forEach(({ key }) => {
      pathEls[key] = g.append('path')
        .attr('class', `line-${key}`)
        .attr('fill', 'none')
        .attr('stroke', () => getColor(keys.find(k => k.key === key).color))
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');
    });
    cursorLine = g.append('line')
      .attr('class', 'cursor-line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y1', 12)
      .attr('y2', h - 12)
      .attr('stroke', 'rgba(255,255,255,0.5)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 2')
      .style('opacity', 0);
  }

  function update(semantic, currentTime, result) {
    if (!containerEl || !d3) return;
    lastSemantic = semantic;
    lastTime = currentTime;
    lastResult = result;
    ensureSvg();
    const w = Math.max(200, containerEl.clientWidth || 280);
    const h = 100;
    xScale?.range([8, w - 8]);
    yScale?.range([h - 12, 12]);

    let data = null;
    let progress = 0;

    if (result?.semantic?.states?.length && result?.metadata?.duration) {
      const sampled = sampleData(result.semantic.states, result.metadata.duration, currentTime ?? 0);
      if (sampled) {
        data = sampled.series;
        progress = sampled.progress;
      }
    }

    if (!data && semantic) {
      data = keys.reduce((acc, { key }) => {
        acc[key] = [semantic[key] ?? 0.5];
        return acc;
      }, {});
    }

    if (!data) {
      containerEl.classList.add('is-empty');
      containerEl.setAttribute('data-placeholder', placeholder);
      keys.forEach(({ key }) => {
        pathEls[key]?.attr('d', null);
      });
      if (cursorLine) cursorLine.style('opacity', 0);
      return;
    }

    containerEl.classList.remove('is-empty');
    containerEl.removeAttribute('data-placeholder');

    keys.forEach(({ key }) => {
      let arr = data[key];
      if (!arr?.length) return;
      if (arr.length === 1) arr = [arr[0], arr[0]];
      const pathGen = d3.line()
        .x((_, i) => xScale(i / Math.max(1, arr.length - 1)))
        .y(d => yScale(d))
        .curve(d3.curveMonotoneX);
      const pathD = pathGen(arr);
      pathEls[key]?.attr('d', pathD)
        .transition()
        .duration(DURATION_MS)
        .ease(d3.easeCubicInOut);
    });

    cursorLine
      .attr('x1', xScale(progress))
      .attr('x2', xScale(progress))
      .attr('y1', 12)
      .attr('y2', h - 12)
      .style('opacity', progress > 0 && progress < 1 ? 1 : 0)
      .transition()
      .duration(120)
      .ease(d3.easeCubicOut);
  }

  return {
    init(container) {
      if (!container || !d3) return;
      containerEl = container;
      ensureSvg();
      containerEl.dataset.ready = 'true';
      update(null, 0, null);
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => update(lastSemantic, lastTime, lastResult));
        resizeObserver.observe(containerEl);
      }
    },
    update,
  };
}

const analysisWidget = createD3ChartWidget(CHART_CONFIGS.analysis);
const rhythmWidget = createD3ChartWidget(CHART_CONFIGS.rhythm);

export function initWidgetD3Analysis(container) {
  analysisWidget.init(container);
}

export function updateWidgetD3Analysis(semantic, currentTime, result) {
  analysisWidget.update(semantic, currentTime, result);
}

export function initWidgetD3Rhythm(container) {
  rhythmWidget.init(container);
}

export function updateWidgetD3Rhythm(semantic, currentTime, result) {
  rhythmWidget.update(semantic, currentTime, result);
}
