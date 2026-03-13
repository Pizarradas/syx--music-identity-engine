/**
 * Panel de análisis de datos — inspirado en CSS Stats y Project Wallace
 * https://cssstats.com/ | https://www.projectwallace.com/
 *
 * Visualizaciones potentes con Apache ECharts.
 * Enfoque: datos en tiempo real, métricas cuantitativas, composición.
 */
const SEMANTIC_KEYS = [
  'energy_level', 'harmonic_tension', 'timbral_brightness',
  'rhythmic_pressure', 'emotional_intensity', 'spectral_register',
  'organicity_vs_mechanicality', 'texture_density',
];
const SEMANTIC_LABELS = {
  energy_level: 'Energía',
  harmonic_tension: 'Tensión',
  timbral_brightness: 'Brillo',
  rhythmic_pressure: 'Ritmo',
  emotional_intensity: 'Emoción',
  spectral_register: 'Registro',
  organicity_vs_mechanicality: 'Orgánico',
  texture_density: 'Textura',
};

let statsEl = null;
let compositionEl = null;
let chartMain = null;
let chartHistogram = null;
let chartSunburst = null;
let aggregatedStats = null;
let valueHistory = [];

const BIN_COUNT = 12;
const HISTORY_FOR_HISTOGRAM = 200;

function computeHistogram(values, bins = BIN_COUNT) {
  const hist = new Array(bins).fill(0);
  if (!values.length) return hist;
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor(v * bins));
    hist[idx]++;
  }
  return hist;
}

function computeAggregates(states) {
  if (!states?.length) return null;
  const n = states.length;
  const avg = (k) => states.reduce((s, st) => s + (st[k] ?? 0.5), 0) / n;
  const max = (k) => Math.max(...states.map((st) => st[k] ?? 0.5));
  const min = (k) => Math.min(...states.map((st) => st[k] ?? 0.5));
  return {
    frames: n,
    avgEnergy: avg('energy_level'),
    avgTension: avg('harmonic_tension'),
    avgBrightness: avg('timbral_brightness'),
    avgRhythm: avg('rhythmic_pressure'),
    avgEmotion: avg('emotional_intensity'),
    peakEnergy: max('energy_level'),
    peakTension: max('harmonic_tension'),
    peakBrightness: max('timbral_brightness'),
    peakRhythm: max('rhythmic_pressure'),
    peakEmotion: max('emotional_intensity'),
    minEnergy: min('energy_level'),
    dynamicRange: max('energy_level') - min('energy_level'),
  };
}

export function initDataAnalyticsPanel(container) {
  if (!container) return;

  container.innerHTML = '';
  container.className = 'data-analytics-panel';

  const statsSection = document.createElement('div');
  statsSection.className = 'data-analytics__stats';
  statsSection.innerHTML = `
    <div class="data-analytics__stat" data-stat="frames">
      <span class="data-analytics__stat-value" id="stat-frames">0</span>
      <span class="data-analytics__stat-label">Frames</span>
    </div>
    <div class="data-analytics__stat" data-stat="avgEnergy">
      <span class="data-analytics__stat-value" id="stat-avgEnergy">—</span>
      <span class="data-analytics__stat-label">E. media</span>
    </div>
    <div class="data-analytics__stat" data-stat="peakEnergy">
      <span class="data-analytics__stat-value" id="stat-peakEnergy">—</span>
      <span class="data-analytics__stat-label">E. pico</span>
    </div>
    <div class="data-analytics__stat" data-stat="avgTension">
      <span class="data-analytics__stat-value" id="stat-avgTension">—</span>
      <span class="data-analytics__stat-label">T. media</span>
    </div>
    <div class="data-analytics__stat" data-stat="dynamicRange">
      <span class="data-analytics__stat-value" id="stat-dynamicRange">—</span>
      <span class="data-analytics__stat-label">Rango dinámico</span>
    </div>
  `;
  container.appendChild(statsSection);

  const compositionSection = document.createElement('div');
  compositionSection.className = 'data-analytics__composition';
  compositionSection.innerHTML = `
    <h3 class="data-analytics__section-title">Composición semántica</h3>
    <div class="data-analytics__composition-bars" id="composition-bars"></div>
  `;
  container.appendChild(compositionSection);

  const chartsWrap = document.createElement('div');
  chartsWrap.className = 'data-analytics__charts';
  const chartMainEl = document.createElement('div');
  chartMainEl.className = 'data-analytics__chart data-analytics__chart--main';
  chartMainEl.id = 'echarts-main';
  const chartHistogramEl = document.createElement('div');
  chartHistogramEl.className = 'data-analytics__chart data-analytics__chart--histogram';
  chartHistogramEl.id = 'echarts-histogram';
  const chartSunburstEl = document.createElement('div');
  chartSunburstEl.className = 'data-analytics__chart data-analytics__chart--sunburst';
  chartSunburstEl.id = 'echarts-sunburst';
  chartsWrap.appendChild(chartMainEl);
  chartsWrap.appendChild(chartHistogramEl);
  chartsWrap.appendChild(chartSunburstEl);
  container.appendChild(chartsWrap);

  statsEl = statsSection;
  compositionEl = document.getElementById('composition-bars');

  if (typeof echarts !== 'undefined') {
    chartMain = echarts.init(chartMainEl, 'dark');
    chartHistogram = echarts.init(chartHistogramEl, 'dark');
    chartSunburst = echarts.init(chartSunburstEl, 'dark');

    chartMain.setOption({
      animation: false,
      grid: { left: 55, right: 25, top: 15, bottom: 45 },
      xAxis: { type: 'category', show: false },
      yAxis: {
        type: 'value',
        min: 0,
        max: 1,
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
      },
      series: SEMANTIC_KEYS.slice(0, 5).map((k) => ({
        name: SEMANTIC_LABELS[k],
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.2 },
        data: [],
      })),
      legend: { bottom: 2, textStyle: { color: 'rgba(255,255,255,0.9)', fontSize: 10 }, itemWidth: 12 },
    });

    chartHistogram.setOption({
      animation: false,
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: Array.from({ length: BIN_COUNT }, (_, i) => ((i + 0.5) / BIN_COUNT * 100).toFixed(0) + '%'),
        axisLabel: { color: 'rgba(255,255,255,0.7)' },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: 'rgba(255,255,255,0.7)' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      series: [{
        type: 'bar',
        data: [],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 1, x2: 0, y2: 0,
            colorStops: [
              { offset: 0, color: 'rgba(99,102,241,0.3)' },
              { offset: 1, color: 'rgba(99,102,241,0.9)' },
            ],
          },
        },
      }],
      title: { text: 'Distribución de energía', left: 'center', top: 0, textStyle: { fontSize: 11, color: 'rgba(255,255,255,0.8)' } },
    });

    chartSunburst.setOption({
      animation: false,
      series: [{
        type: 'sunburst',
        data: [],
        radius: [0, '95%'],
        label: { fontSize: 10 },
        itemStyle: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)' },
      }],
    });

    window.addEventListener('resize', () => {
      chartMain?.resize();
      chartHistogram?.resize();
      chartSunburst?.resize();
    });
  }

  SEMANTIC_KEYS.forEach((key) => {
    const bar = document.createElement('div');
    bar.className = 'data-analytics__composition-bar';
    bar.setAttribute('data-key', key);
    bar.innerHTML = `
      <span class="data-analytics__composition-label">${SEMANTIC_LABELS[key]}</span>
      <div class="data-analytics__composition-track">
        <div class="data-analytics__composition-fill"></div>
      </div>
      <span class="data-analytics__composition-value">—</span>
    `;
    compositionEl?.appendChild(bar);
  });
}

function updateCompositionBars(semantic) {
  if (!semantic || !compositionEl) return;
  compositionEl.querySelectorAll('.data-analytics__composition-bar').forEach((bar) => {
    const key = bar.getAttribute('data-key');
    const v = semantic[key] ?? 0.5;
    const fill = bar.querySelector('.data-analytics__composition-fill');
    const valueEl = bar.querySelector('.data-analytics__composition-value');
    if (fill) fill.style.width = `${Math.round(v * 100)}%`;
    if (valueEl) valueEl.textContent = `${Math.round(v * 100)}%`;
  });
}

let hasResized = false;

export function updateDataAnalyticsPanel(semantic, currentTime, result) {
  if (!semantic) return;

  if (!hasResized && (chartMain || chartHistogram || chartSunburst)) {
    hasResized = true;
    requestAnimationFrame(() => {
      chartMain?.resize();
      chartHistogram?.resize();
      chartSunburst?.resize();
    });
  }

  updateCompositionBars(semantic);

  const states = result?.semantic?.states;
  const duration = result?.metadata?.duration;

  if (states?.length && duration) {
    const progress = Math.min(1, currentTime / duration);
    const lastIdx = Math.floor(progress * (states.length - 1));
    const slice = states.slice(0, lastIdx + 1);
    aggregatedStats = computeAggregates(slice);

    const setStat = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setStat('stat-frames', aggregatedStats.frames.toLocaleString());
    setStat('stat-avgEnergy', (aggregatedStats.avgEnergy * 100).toFixed(0) + '%');
    setStat('stat-peakEnergy', (aggregatedStats.peakEnergy * 100).toFixed(0) + '%');
    setStat('stat-avgTension', (aggregatedStats.avgTension * 100).toFixed(0) + '%');
    setStat('stat-dynamicRange', (aggregatedStats.dynamicRange * 100).toFixed(0) + '%');

    if (chartMain) {
      const step = Math.max(1, Math.floor(slice.length / 120));
      const sampled = slice.filter((_, i) => i % step === 0 || i === slice.length - 1);
      const seriesData = SEMANTIC_KEYS.slice(0, 5).map((k) => ({
        data: sampled.map((s) => s[k] ?? 0.5),
      }));
      chartMain.setOption({ series: seriesData });
    }

    const energyValues = slice.map((s) => s.energy_level ?? 0.5);
    valueHistory = valueHistory.concat(energyValues).slice(-HISTORY_FOR_HISTOGRAM);
    const hist = computeHistogram(valueHistory);
    if (chartHistogram) {
      chartHistogram.setOption({ series: [{ data: hist }] });
    }

    const avgByKey = SEMANTIC_KEYS.reduce((acc, k) => {
      acc[k] = slice.reduce((s, st) => s + (st[k] ?? 0.5), 0) / slice.length;
      return acc;
    }, {});
    const sunburstData = [
      {
        name: 'Análisis',
        children: SEMANTIC_KEYS.map((k) => ({
          name: SEMANTIC_LABELS[k],
          value: Math.max(1, Math.round(avgByKey[k] * 100)),
        })),
      },
    ];
    if (chartSunburst) {
      chartSunburst.setOption({
        series: [{
          data: sunburstData,
          emphasis: { focus: 'ancestor' },
          levels: [
            {},
            { r0: '20%', r: '45%', label: { fontSize: 10 } },
            { r0: '45%', r: '95%', label: { fontSize: 9 } },
          ],
        }],
      });
    }
  } else {
    valueHistory.push(semantic.energy_level ?? 0.5);
    if (valueHistory.length > HISTORY_FOR_HISTOGRAM) valueHistory.shift();
    const hist = computeHistogram(valueHistory);
    if (chartHistogram) chartHistogram.setOption({ series: [{ data: hist }] });

    if (chartMain) {
      const opt = chartMain.getOption();
      const series = opt.series || [];
      const keys = SEMANTIC_KEYS.slice(0, 5);
      const newSeries = keys.map((k, i) => {
        const arr = [...(series[i]?.data || [])];
        arr.push(semantic[k] ?? 0.5);
        if (arr.length > 80) arr.shift();
        return { ...series[i], data: arr };
      });
      chartMain.setOption({ series: newSeries });
    }
  }
}
