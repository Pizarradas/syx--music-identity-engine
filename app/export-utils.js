/**
 * Exportar visualización — PNG, informe HTML, JSON, tokens, CSS, SYX theme
 * docs/26_token_visual_inspector.md, docs/27_real_time_music_to_design_observer.md
 */
import { toExportableJson, formatTokenFoundationsOutput, foundationsToSyxTheme, syxThemeToCssVars } from '../engine/index.js';

/**
 * Descarga un blob como archivo
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Captura el área central con html2canvas (carga bajo demanda)
 * @returns {Promise<Blob|null>}
 */
export async function exportVisualizationPng() {
  try {
    const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');
    const target = document.querySelector('.org-music-dashboard') || document.querySelector('.org-app-center');
    if (!target) return null;
    const canvas = await html2canvas(target, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f0f1a',
      scale: 2,
      logging: false,
    });
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  } catch (e) {
    console.warn('Export PNG no disponible:', e.message);
    return null;
  }
}

/**
 * Exporta captura PNG de la visualización
 */
export async function downloadVisualizationPng() {
  const blob = await exportVisualizationPng();
  if (!blob) return false;
  const name = document.getElementById('track-name')?.textContent || 'syx-visualization';
  const base = (name.replace(/\.[^.]+$/, '') || 'syx').replace(/[^\w\-]/g, '_');
  downloadBlob(blob, `${base}-visualization.png`);
  return true;
}

/**
 * Exporta el gráfico Chart.js como PNG (sin dependencias externas)
 * @param {Chart} chart - Instancia de Chart.js
 */
export function downloadChartPng(chart) {
  if (!chart?.canvas) return false;
  const url = chart.canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'syx-evolucion.png';
  a.click();
  return true;
}

/**
 * Genera informe HTML con estado actual
 * @param {Object} semantic - Estado semántico
 * @param {Object} metadata - Metadatos (track, duration, etc.)
 */
export function generateReportHtml(semantic = {}, metadata = {}) {
  const track = metadata.trackName || 'Sin título';
  const duration = metadata.duration ? `${Math.floor(metadata.duration / 60)}:${String(Math.floor(metadata.duration % 60)).padStart(2, '0')}` : '—';
  const date = new Date().toLocaleString('es');

  const vars = [
    { key: 'energy_level', label: 'Energía' },
    { key: 'harmonic_tension', label: 'Tensión armónica' },
    { key: 'timbral_brightness', label: 'Brillo tímbrico' },
    { key: 'rhythmic_pressure', label: 'Presión rítmica' },
    { key: 'emotional_intensity', label: 'Intensidad emocional' },
    { key: 'organicity_vs_mechanicality', label: 'Organicidad' },
    { key: 'groove', label: 'Groove' },
    { key: 'spectral_width', label: 'Ancho espectral' },
    { key: 'dynamic_range', label: 'Rango dinámico' },
  ];

  const rows = vars
    .map(
      (v) =>
        `<tr><td>${v.label}</td><td>${Math.round((semantic[v.key] ?? 0.5) * 100)}%</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe SYX — ${track}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 1rem; }
    h1 { font-size: 1.2rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.4rem; text-align: left; border-bottom: 1px solid #eee; }
    .meta { color: #666; font-size: 0.85rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>SYX Music Identity Engine</h1>
  <p class="meta">${track} · ${duration} · ${date}</p>
  <table>
    <thead><tr><th>Variable</th><th>Valor</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

/**
 * Descarga informe HTML
 */
export function downloadReportHtml(semantic, metadata) {
  const html = generateReportHtml(semantic, metadata);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const name = (metadata.trackName || 'syx-report').replace(/\.[^.]+$/, '') || 'syx-report';
  downloadBlob(blob, `${name}-informe.html`);
}

/**
 * Descarga timeline semántico como JSON (schema documentado)
 * @param {Object} pipelineResult - Resultado de runPipeline
 * @param {string} trackName - Nombre del track
 */
export function downloadReportJson(pipelineResult, trackName = '—') {
  const json = toExportableJson(pipelineResult, { trackName, includeMoments: true });
  const str = JSON.stringify(json, null, 2);
  const blob = new Blob([str], { type: 'application/json;charset=utf-8' });
  const base = (trackName.replace(/\.[^.]+$/, '') || 'syx').replace(/[^\w\-]/g, '_');
  downloadBlob(blob, `${base}-timeline.json`);
}

/**
 * Descarga token foundations como JSON (schema doc 24)
 * @param {Object} foundations - Token foundations actuales
 * @param {string} trackName - Nombre del track
 */
export function downloadTokensJson(foundations, trackName = '—') {
  if (!foundations) return false;
  const output = formatTokenFoundationsOutput(foundations);
  const json = {
    version: '1.0',
    description: 'Token foundations — design identity derived from music',
    metadata: { trackName, exportedAt: new Date().toISOString() },
    foundations: output,
  };
  const str = JSON.stringify(json, null, 2);
  const blob = new Blob([str], { type: 'application/json;charset=utf-8' });
  const base = (trackName.replace(/\.[^.]+$/, '') || 'syx').replace(/[^\w\-]/g, '_');
  downloadBlob(blob, `${base}-tokens.json`);
  return true;
}

/**
 * Descarga token foundations como CSS custom properties
 * @param {Object} foundations - Token foundations actuales
 * @param {Object} options - { hueBase, keyHue }
 * @param {string} trackName - Nombre del track
 */
export function downloadTokensCss(foundations, options = {}, trackName = '—') {
  if (!foundations) return false;
  const syxTheme = foundationsToSyxTheme(foundations, options);
  const { root, center } = syxThemeToCssVars(syxTheme, { fontFamily: options.fontFamily });
  const lines = ['/* SYX Music Identity Engine — CSS Custom Properties */', '/* Generated from token foundations */', '', ':root {'];
  for (const [k, v] of Object.entries(root)) lines.push(`  ${k}: ${v};`);
  lines.push('}');
  if (Object.keys(center).length) {
    lines.push('', '.org-app-center {');
    for (const [k, v] of Object.entries(center)) lines.push(`  ${k}: ${v};`);
    lines.push('}');
  }
  const css = lines.join('\n');
  const blob = new Blob([css], { type: 'text/css;charset=utf-8' });
  const base = (trackName.replace(/\.[^.]+$/, '') || 'syx').replace(/[^\w\-]/g, '_');
  downloadBlob(blob, `${base}-tokens.css`);
  return true;
}

/**
 * Obtiene las CSS variables actuales del documento (tokens aplicados).
 * Incluye paleta completa y tipografía para reflejar exactamente el análisis.
 */
function getCurrentCssVars() {
  const root = document.documentElement;
  const center = document.querySelector('.org-app-center');
  const rootVars = [
    '--semantic-color-primary', '--semantic-color-primary-subtle', '--semantic-color-primary-strong',
    '--semantic-color-primary-muted', '--semantic-color-primary-vivid',
    '--semantic-color-accent-warm', '--semantic-color-accent-cool', '--semantic-color-accent-comp',
    '--semantic-color-accent-triad-1', '--semantic-color-accent-triad-2',
    '--semantic-color-accent-split-1', '--semantic-color-accent-split-2', '--semantic-color-accent-tetrad',
    '--semantic-color-type-display', '--semantic-color-type-h1', '--semantic-color-type-h2',
    '--semantic-color-type-h3', '--semantic-color-type-body', '--semantic-color-type-caption',
    '--semantic-color-btn-outline', '--semantic-color-btn-ghost', '--semantic-color-badge-outline', '--semantic-color-badge-soft',
    '--surface-bg', '--surface-bg-elevated', '--surface-bg-subtle', '--surface-bg-accent',
    '--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-2xl', '--space-3xl',
    '--line-height-tight', '--line-height-normal', '--line-height-relaxed',
    '--syx-music-transition', '--music-center-radius', '--music-center-spacing',
  ];
  const centerVars = [
    '--music-center-font-family', '--music-center-font-weight', '--music-center-font-style',
    '--music-center-letter-spacing',
    '--music-type-display', '--music-type-h1', '--music-type-h2', '--music-type-body', '--music-type-caption',
  ];
  const out = {};
  for (const k of rootVars) {
    const v = getComputedStyle(root).getPropertyValue(k)?.trim();
    if (v) out[k] = v;
  }
  if (center) {
    for (const k of centerVars) {
      const v = getComputedStyle(center).getPropertyValue(k)?.trim();
      if (v) out[k] = v;
    }
  }
  return out;
}

/** Google Fonts ampliado — pool de ~40 fuentes para identidad más característica */
const GOOGLE_FONTS_LINK = 'https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,600;1,400&family=Anton&family=Archivo+Black&family=Audiowide&family=Black+Ops+One&family=Archivo+Narrow:wght@400;600&family=Barlow+Condensed:wght@400;600&family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Encode+Sans+Condensed:wght@400;600&family=Exo+2:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Josefin+Slab:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Poppins:wght@400;500;600;700&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Rajdhani:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Righteous&family=Roboto+Slab:wght@400;500;600;700&family=Russo+One&family=Source+Serif+Pro:ital,wght@0,400;0,600;1,400&family=Space+Grotesk:wght@400;500;600;700&family=Staatliches&family=Syne:wght@400;500;600;700;800&family=Titillium+Web:wght@400;600;700&family=Work+Sans:wght@400;500;600;700&family=Zilla+Slab:wght@400;500;600;700&display=swap';

/**
 * Genera HTML de vista previa con todos los tokens aplicados
 * Página básica con textos, botones, cards, formularios, etc.
 * Incluye Google Fonts para que Roboto Slab, Cormorant, etc. carguen correctamente.
 */
function generateThemePreviewHtml(cssVars) {
  const varsCss = Object.entries(cssVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  const primary = cssVars['--semantic-color-primary'] || 'oklch(0.55 0.2 260)';
  const radius = cssVars['--music-center-radius'] || '8px';
  const transition = cssVars['--syx-music-transition'] || '320ms';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SYX Design — Vista previa de tokens</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${GOOGLE_FONTS_LINK}" rel="stylesheet">
  <style>
    :root { ${varsCss} }
    * { box-sizing: border-box; }
    body {
      font-family: var(--music-center-font-family, system-ui);
      font-weight: var(--music-center-font-weight, 400);
      font-style: var(--music-center-font-style, normal);
      letter-spacing: var(--music-center-letter-spacing, 0);
      color: color-mix(in oklch, var(--semantic-color-primary) 40%, #fff);
      background: linear-gradient(135deg, var(--surface-bg, #0f0f1a) 0%, var(--surface-bg-subtle, #1a1a2e) 50%, var(--surface-bg-accent, #0f0f1a) 100%);
      min-height: 100vh;
      margin: 0;
      padding: var(--space-xl, 2rem);
      line-height: var(--line-height-normal, 1.5);
    }
    .container { max-width: 640px; margin: 0 auto; }
    .space-demo { display: flex; flex-wrap: wrap; gap: var(--space-sm, 0.5rem); align-items: center; margin: var(--space-md, 1rem) 0; }
    .space-demo span { padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem); background: color-mix(in oklch, var(--semantic-color-primary) 0.2, transparent); border-radius: ${radius}; font-size: 0.75rem; }
    h1 { font-size: var(--music-type-display, 2.5rem); color: var(--semantic-color-type-display, var(--semantic-color-primary)); margin: 0 0 0.5rem 0; }
    h2 { font-size: var(--music-type-h1, 1.5rem); color: var(--semantic-color-type-h1, var(--semantic-color-primary)); margin: 2rem 0 0.75rem 0; border-bottom: 1px solid color-mix(in oklch, var(--semantic-color-primary) 0.2, transparent); padding-bottom: 0.5rem; }
    h3 { font-size: var(--music-type-h2, 1.2rem); color: var(--semantic-color-type-h2, var(--semantic-color-primary)); margin: 1.5rem 0 0.5rem 0; }
    p { font-size: var(--music-type-body, 0.95rem); margin: 0 0 1rem 0; opacity: 0.9; }
    .caption { font-size: var(--music-type-caption, 0.8rem); opacity: 0.75; margin-top: -0.5rem; }
    .palette { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
    .palette span { width: 2.5rem; height: 2.5rem; border-radius: ${radius}; border: 1px solid rgba(255,255,255,0.2); }
    .typo-sample { font-family: inherit; font-weight: inherit; font-style: inherit; letter-spacing: inherit; }
    .btn { display: inline-block; padding: 0.5rem 1rem; border-radius: ${radius}; font-weight: 500; cursor: pointer; transition: all ${transition} ease; border: 1px solid transparent; font-size: 0.9rem; }
    .btn--primary { background: var(--semantic-color-primary); color: white; border-color: var(--semantic-color-primary); }
    .btn--primary:hover { filter: brightness(1.15); }
    .btn--outline { background: transparent; color: var(--semantic-color-primary); border-color: color-mix(in oklch, var(--semantic-color-primary) 50%, transparent); }
    .btn--outline:hover { background: color-mix(in oklch, var(--semantic-color-primary) 0.15, transparent); }
    .btn + .btn { margin-left: 0.5rem; }
    .card { background: var(--surface-bg-elevated, color-mix(in oklch, var(--semantic-color-primary) 0.08, rgba(0,0,0,0.5))); border: 1px solid color-mix(in oklch, var(--semantic-color-primary) 0.2, transparent); border-radius: ${radius}; padding: var(--space-lg, 1.25rem); margin: var(--space-md, 1rem) 0; }
    .card h3 { margin-top: 0; }
    input, textarea { font-family: inherit; font-size: 0.95rem; padding: 0.5rem 0.75rem; border-radius: calc(${radius} * 0.75); background: rgba(0,0,0,0.3); border: 1px solid color-mix(in oklch, var(--semantic-color-primary) 0.25, transparent); color: inherit; width: 100%; transition: border-color ${transition}; }
    input:focus, textarea:focus { outline: none; border-color: var(--semantic-color-primary); }
    label { display: block; font-size: 0.85rem; margin-bottom: 0.35rem; opacity: 0.9; }
    .form-group { margin-bottom: 1rem; }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: calc(${radius} * 0.5); font-size: 0.75rem; background: color-mix(in oklch, var(--semantic-color-primary) 0.2, transparent); color: var(--semantic-color-primary); margin-right: 0.35rem; margin-bottom: 0.35rem; }
    .typo-sample { margin: 0.5rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>SYX Design Preview</h1>
    <p class="caption">Todos los tokens aplicados en una página de ejemplo. Generado desde SYX Music Identity Engine.</p>

    <h2>Paleta de colores</h2>
    <div class="palette">
      <span style="background: var(--semantic-color-primary)" title="Primary"></span>
      <span style="background: var(--semantic-color-primary-subtle)" title="Subtle"></span>
      <span style="background: var(--semantic-color-primary-strong)" title="Strong"></span>
      <span style="background: var(--semantic-color-primary-muted, var(--semantic-color-primary-subtle))" title="Muted"></span>
      <span style="background: var(--semantic-color-primary-vivid, var(--semantic-color-primary-strong))" title="Vivid"></span>
      <span style="background: var(--semantic-color-accent-warm)" title="Warm"></span>
      <span style="background: var(--semantic-color-accent-cool)" title="Cool"></span>
      <span style="background: var(--semantic-color-accent-comp)" title="Comp"></span>
      <span style="background: var(--semantic-color-accent-triad-1)" title="Triad 1"></span>
      <span style="background: var(--semantic-color-accent-triad-2)" title="Triad 2"></span>
    </div>

    <h2>Escala tipográfica</h2>
    <div class="typo-sample" style="font-size: var(--music-type-display); line-height: var(--line-height-tight, 1.2); color: var(--semantic-color-type-display, var(--semantic-color-primary))">Display — Aa Bb Cc</div>
    <div class="typo-sample" style="font-size: var(--music-type-h1); line-height: var(--line-height-tight, 1.2); color: var(--semantic-color-type-h1, var(--semantic-color-accent-warm))">H1 — Encabezado principal</div>
    <div class="typo-sample" style="font-size: var(--music-type-h2); line-height: var(--line-height-normal, 1.5); color: var(--semantic-color-type-h2, var(--semantic-color-accent-cool))">H2 — Subtítulo</div>
    <div class="typo-sample" style="font-size: var(--music-type-body); line-height: var(--line-height-relaxed, 1.65); color: var(--semantic-color-type-body, rgba(255,255,255,0.9))">Body — Texto de párrafo con suficiente longitud para ver cómo fluye la tipografía en bloques de contenido.</div>
    <div class="typo-sample caption" style="color: var(--semantic-color-type-caption, rgba(255,255,255,0.65))">Caption — Texto secundario o pie de foto</div>

    <h2>Sistema de espacios</h2>
    <p class="caption">Tokens de espaciado derivados del análisis (xs, sm, md, lg, xl, 2xl, 3xl)</p>
    <div class="space-demo">
      <span style="padding: var(--space-xs)">xs</span>
      <span style="padding: var(--space-sm)">sm</span>
      <span style="padding: var(--space-md)">md</span>
      <span style="padding: var(--space-lg)">lg</span>
      <span style="padding: var(--space-xl)">xl</span>
      <span style="padding: var(--space-2xl)">2xl</span>
      <span style="padding: var(--space-3xl)">3xl</span>
    </div>

    <h2>Botones</h2>
    <p>
      <button class="btn btn--primary">Primary</button>
      <button class="btn btn--outline">Outline</button>
      <button class="btn btn--primary">Acción</button>
    </p>

    <h2>Cards</h2>
    <div class="card">
      <h3>Título de la card</h3>
      <p>Contenido de ejemplo con los tokens de color, tipografía y bordes aplicados. La card usa el radio definido por el tema.</p>
      <button class="btn btn--outline">Ver más</button>
    </div>
    <div class="card">
      <h3>Otra card</h3>
      <p>Las cards heredan la paleta semántica y se integran con el diseño generado por la música.</p>
    </div>

    <h2>Formulario</h2>
    <form>
      <div class="form-group">
        <label for="name">Nombre</label>
        <input type="text" id="name" placeholder="Tu nombre">
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="tu@email.com">
      </div>
      <div class="form-group">
        <label for="msg">Mensaje</label>
        <textarea id="msg" rows="3" placeholder="Escribe aquí..."></textarea>
      </div>
      <button type="submit" class="btn btn--primary">Enviar</button>
    </form>

    <h2>Badges y etiquetas</h2>
    <p>
      <span class="badge">Token</span>
      <span class="badge">Música</span>
      <span class="badge">Design</span>
      <span class="badge">SYX</span>
    </p>

    <p class="caption" style="margin-top: 2rem;">Generado por SYX Music Identity Engine — Los tokens se actualizan en tiempo real según el análisis musical.</p>
  </div>
</body>
</html>`;
}

/**
 * Descarga HTML con la identidad visual integrada (paleta, tipografía, componentes).
 * Prioriza el estado actual del DOM (cuando hay tema aplicado) para reflejar exactamente el análisis.
 * @param {Object} [foundations] - Token foundations (fallback si no hay tema en DOM)
 * @param {Object} [options] - { keyHue, fontFamily }
 * @param {string} [trackName] - Nombre del track para el archivo
 * @returns {boolean}
 */
export function downloadThemePreviewHtml(foundations = null, options = {}, trackName = '—') {
  let cssVars;
  const liveVars = getCurrentCssVars();
  const hasLiveTheme = document.body?.getAttribute('data-music-active') === 'true' && Object.keys(liveVars).length >= 8;
  if (hasLiveTheme) {
    cssVars = liveVars;
  } else if (foundations && Object.keys(foundations).length > 0) {
    const syxTheme = foundationsToSyxTheme(foundations, { keyHue: options.keyHue });
    const { root, center } = syxThemeToCssVars(syxTheme, { fontFamily: options.fontFamily });
    cssVars = { ...root, ...center };
  } else {
    cssVars = liveVars;
    if (Object.keys(cssVars).length < 3) {
      const syxTheme = foundationsToSyxTheme({}, {});
      const { root, center } = syxThemeToCssVars(syxTheme, { fontFamily: options.fontFamily });
      cssVars = { ...root, ...center };
    }
  }
  const html = generateThemePreviewHtml(cssVars);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const base = (String(trackName).replace(/\.[^.]+$/, '') || 'syx-identidad').replace(/[^\w\-]/g, '_');
  downloadBlob(blob, `${base}.html`);
  return true;
}

/**
 * Abre una ventana con la vista previa HTML de todos los tokens aplicados.
 * Prioridad: 1) foundations si se pasan, 2) vars del documento, 3) tema por defecto.
 * Así funciona aunque la canción haya terminado y resetSyxTheme haya limpiado el DOM.
 * @param {Object} [foundations] - Token foundations (lastTokenFoundations)
 * @param {Object} [options] - { keyHue } para el tema
 */
export function openThemePreviewHtml(foundations = null, options = {}) {
  let cssVars;
  if (foundations && Object.keys(foundations).length > 0) {
    const syxTheme = foundationsToSyxTheme(foundations, { keyHue: options.keyHue });
    const { root, center } = syxThemeToCssVars(syxTheme, { fontFamily: options.fontFamily });
    cssVars = { ...root, ...center };
  } else {
    cssVars = getCurrentCssVars();
    if (Object.keys(cssVars).length < 3) {
      const syxTheme = foundationsToSyxTheme({}, {});
      const { root, center } = syxThemeToCssVars(syxTheme, { fontFamily: options.fontFamily });
      cssVars = { ...root, ...center };
    }
  }
  const html = generateThemePreviewHtml(cssVars);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, 'syx-theme-preview', 'width=720,height=900,scrollbars=yes,resizable=yes');
  if (w) URL.revokeObjectURL(url);
  return !!w;
}

/**
 * Descarga SYX theme configuration (JSON)
 * @param {Object} foundations - Token foundations actuales
 * @param {Object} options - { hueBase, keyHue }
 * @param {string} trackName - Nombre del track
 */
export function downloadSyxTheme(foundations, options = {}, trackName = '—') {
  if (!foundations) return false;
  const syxTheme = foundationsToSyxTheme(foundations, options);
  const json = {
    version: '1.0',
    description: 'SYX theme configuration — derived from music',
    metadata: { trackName, exportedAt: new Date().toISOString() },
    theme: syxTheme,
  };
  const str = JSON.stringify(json, null, 2);
  const blob = new Blob([str], { type: 'application/json;charset=utf-8' });
  const base = (trackName.replace(/\.[^.]+$/, '') || 'syx').replace(/[^\w\-]/g, '_');
  downloadBlob(blob, `${base}-syx-theme.json`);
  return true;
}
