/**
 * Token Visual Inspector — design identity viewer
 * docs/26_token_visual_inspector.md
 * docs/24_token_foundations_schema.md
 * docs/31_token_export_and_inspection.md
 *
 * Muestra cómo la música se traduce en design tokens.
 * Paneles: Color, Typography, Space, Shape, Motion, Surface
 * QA: búsqueda de tokens, lineage (origen de variables)
 */
import { createWidgetBar } from './widgets/index.js';
import { TOKEN_FOUNDATION_KEYS } from '../engine/index.js';

/** Lineage: token → variables semánticas de origen (doc 31) */
const TOKEN_LINEAGE = {
  color_temperature: ['timbral_brightness', 'spectral_width', 'organicity_vs_mechanicality'],
  saturation_intensity: ['energy_level', 'dynamic_range', 'rhythmic_pressure', 'groove'],
  contrast_level: ['emotional_intensity', 'dynamic_range'],
  accent_energy: ['rhythmic_pressure', 'groove'],
  type_weight: ['energy_level', 'emotional_intensity'],
  type_width: ['intimacy_vs_monumentality'],
  type_tension: ['harmonic_tension', 'structural_drama'],
  type_expression: ['melodic_prominence', 'emotional_intensity'],
  spatial_density: ['texture_density', 'spectral_width', 'harmonic_tension'],
  layout_openness: ['structural_openness', 'harmonic_tension'],
  element_spacing: ['texture_density', 'structural_openness'],
  shape_hardness: ['organicity_vs_mechanicality'],
  corner_roundness: ['organicity_vs_mechanicality', 'groove'],
  edge_aggression: ['rhythmic_pressure', 'harmonic_tension'],
  motion_speed: ['energy_level', 'groove'],
  motion_smoothness: ['pulse_stability', 'organicity_vs_mechanicality'],
  motion_aggression: ['rhythmic_pressure', 'emotional_intensity'],
  motion_decay: ['rhythmic_pressure'],
  blur_level: ['timbral_brightness', 'timbral_roughness'],
  grain_level: ['timbral_roughness', 'texture_density'],
  shadow_depth: ['harmonic_tension', 'structural_openness'],
  transparency: ['structural_openness', 'texture_density'],
};

/** Swatches de paleta que usan CSS vars (se actualizan con el tema) */
const PALETTE_SWATCHES = [
  { var: '--semantic-color-primary', label: 'Primary' },
  { var: '--semantic-color-accent-warm', label: 'Warm' },
  { var: '--semantic-color-accent-cool', label: 'Cool' },
];

const PANELS = [
  { id: 'color', label: 'Color', keys: TOKEN_FOUNDATION_KEYS.color },
  { id: 'typography', label: 'Tipografía', keys: TOKEN_FOUNDATION_KEYS.typography },
  { id: 'space', label: 'Espacio', keys: TOKEN_FOUNDATION_KEYS.space },
  { id: 'shape', label: 'Forma', keys: TOKEN_FOUNDATION_KEYS.shape },
  { id: 'motion', label: 'Motion', keys: TOKEN_FOUNDATION_KEYS.motion },
  { id: 'surface', label: 'Superficie', keys: TOKEN_FOUNDATION_KEYS.surface },
];

const KEY_LABELS = {
  color_temperature: 'Temp.',
  saturation_intensity: 'Sat.',
  contrast_level: 'Contraste',
  accent_energy: 'Acento',
  type_weight: 'Peso',
  type_width: 'Ancho',
  type_tension: 'Tensión',
  type_expression: 'Expresión',
  spatial_density: 'Densidad',
  layout_openness: 'Apertura',
  element_spacing: 'Espaciado',
  shape_hardness: 'Dureza',
  corner_roundness: 'Redondez',
  edge_aggression: 'Borde',
  motion_speed: 'Velocidad',
  motion_smoothness: 'Suavidad',
  motion_aggression: 'Agresión',
  motion_decay: 'Decaimiento',
  blur_level: 'Blur',
  grain_level: 'Grano',
  shadow_depth: 'Sombra',
  transparency: 'Transparencia',
};

let panels = [];
let searchInput = null;
let lastFoundations = null;

export function initWidgetTokenInspector(container) {
  if (!container) return;
  container.innerHTML = '';
  panels = [];

  const searchWrap = document.createElement('div');
  searchWrap.className = 'widget-token-inspector__search';
  searchWrap.setAttribute('role', 'search');
  searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Buscar tokens (ej: motion, color)';
  searchInput.className = 'widget-token-inspector__search-input';
  searchInput.setAttribute('aria-label', 'Buscar tokens por nombre');
  searchInput.addEventListener('input', () => filterPanelsBySearch(searchInput.value.trim().toLowerCase()));
  searchWrap.appendChild(searchInput);
  container.appendChild(searchWrap);

  const panelsWrap = document.createElement('div');
  panelsWrap.className = 'widget-token-inspector__panels';

  PANELS.forEach(({ id, label, keys }) => {
    const section = document.createElement('div');
    section.className = 'widget-token-inspector__panel';
    section.setAttribute('data-panel', id);
    const title = document.createElement('h3');
    title.className = 'widget-token-inspector__title';
    title.textContent = label;
    section.appendChild(title);

    if (id === 'color') {
      const swatchRow = document.createElement('div');
      swatchRow.className = 'widget-token-inspector__palette';
      PALETTE_SWATCHES.forEach(({ var: cssVar, label: l }) => {
        const sw = document.createElement('div');
        sw.className = 'widget-token-inspector__palette-swatch';
        sw.style.background = `var(${cssVar})`;
        sw.title = l;
        swatchRow.appendChild(sw);
      });
      section.appendChild(swatchRow);
    }

    const barsWrap = document.createElement('div');
    barsWrap.className = 'widget-token-inspector__bars';

    const barUpdates = [];
    keys.forEach((key) => {
      const { element, update } = createWidgetBar({
        id: key,
        label: KEY_LABELS[key] || key.replace(/_/g, ' '),
        value: 0.5,
        variant: 'horizontal',
        showValue: false,
        peakHold: false,
      });
      barsWrap.appendChild(element);
      barUpdates.push({ key, update });
    });

    section.appendChild(barsWrap);
    panelsWrap.appendChild(section);
    panels.push({ id, label, keys: barUpdates, section });
  });

  container.appendChild(panelsWrap);
}

function filterPanelsBySearch(query) {
  if (!query) {
    panels.forEach(({ section }) => {
      section.hidden = false;
      section.querySelectorAll('[data-token-key]').forEach((el) => { el.hidden = false; });
    });
    return;
  }
  panels.forEach(({ label, keys, section }) => {
    const labelMatch = label.toLowerCase().includes(query);
    const hasMatch = labelMatch || keys.some(({ key }) =>
      key.toLowerCase().includes(query) ||
      (TOKEN_LINEAGE[key] || []).some((orig) => orig.toLowerCase().includes(query))
    );
    section.hidden = !hasMatch;
    if (hasMatch) {
      keys.forEach(({ key, element }) => {
        const keyMatch = key.toLowerCase().includes(query);
        const lineageMatch = (TOKEN_LINEAGE[key] || []).some((orig) => orig.toLowerCase().includes(query));
        element.hidden = !keyMatch && !lineageMatch && !labelMatch;
      });
    }
  });
}

export function updateWidgetTokenInspector(foundations) {
  if (!foundations) return;
  lastFoundations = foundations;
  panels.forEach(({ keys }) => {
    keys.forEach(({ key, update }) => {
      update(foundations[key] ?? 0.5);
    });
  });
}

/** Obtiene foundations actuales para export (doc 31) */
export function getCurrentTokenFoundations() {
  return lastFoundations;
}
