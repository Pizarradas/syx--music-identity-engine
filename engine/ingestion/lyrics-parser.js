/**
 * Parser de letras — LRC, TXT, JSON
 * docs/02_user_inputs_audio_lyrics.md
 */

/**
 * @typedef {Object} LyricWord
 * @property {string} text
 * @property {number} startTime - segundos
 * @property {number} endTime - segundos
 * @property {number} index - índice en la línea
 */

/**
 * @typedef {Object} LyricLine
 * @property {string} text
 * @property {number} startTime - segundos
 * @property {number} endTime - segundos
 * @property {LyricWord[]} [words] - palabras con timestamps estimados (sincronización palabra a palabra)
 */

/**
 * Parsea timestamp LRC [mm:ss.xx] a segundos
 */
function parseLrcTimestamp(str) {
  const m = str.match(/\[(\d+):(\d+)\.?(\d*)\]/);
  if (!m) return null;
  const min = parseInt(m[1], 10);
  const sec = parseInt(m[2], 10);
  const cent = m[3] ? parseInt(m[3].padEnd(2, '0').slice(0, 2), 10) : 0;
  return min * 60 + sec + cent / 100;
}

/**
 * Parsea [offset:±XXX] del LRC (ms). Positivo = letras llegan tarde, se suma a timestamps.
 */
function parseLrcOffset(raw) {
  const m = raw.match(/\[offset:\s*([+-]?\d+)\]/i);
  return m ? parseInt(m[1], 10) / 1000 : 0;
}

/**
 * Parsea formato LRC
 * @param {string} raw
 * @returns {{ lines: LyricLine[], mode: 'line_synced', warnings: string[] }}
 */
export function parseLrc(raw) {
  const warnings = [];
  const lines = [];
  const offsetSec = parseLrcOffset(raw) || 0;
  const regex = /\[(\d+:\d+\.?\d*)\]\s*(.+)/g;
  let match;
  const entries = [];

  while ((match = regex.exec(raw)) !== null) {
    const time = parseLrcTimestamp(`[${match[1]}]`);
    const text = match[2].trim();
    if (time !== null && text) entries.push({ time, text });
  }

  entries.sort((a, b) => a.time - b.time);

  for (let i = 0; i < entries.length; i++) {
    const startTime = entries[i].time + offsetSec;
    const endTime = i < entries.length - 1 ? entries[i + 1].time + offsetSec : startTime + 5;
    lines.push({ text: entries[i].text, startTime, endTime });
  }

  if (offsetSec !== 0) warnings.push(`Offset LRC aplicado: ${offsetSec > 0 ? '+' : ''}${offsetSec.toFixed(2)}s`);

  return { lines, mode: 'line_synced', warnings };
}

/**
 * Parsea TXT plano — sin sincronización
 * @param {string} raw
 * @param {number} [totalDurationSec] - si se proporciona, reparte heurísticamente
 */
export function parseTxt(raw, totalDurationSec = 0) {
  const lines = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => ({ text, startTime: 0, endTime: 0 }));

  if (totalDurationSec > 0 && lines.length > 0) {
    const step = totalDurationSec / lines.length;
    lines.forEach((l, i) => {
      l.startTime = i * step;
      l.endTime = (i + 1) * step;
    });
  }

  return { lines, mode: 'plain_text', warnings: [] };
}

/**
 * Parsea JSON estructurado
 * @param {string} raw
 */
export function parseJson(raw) {
  const warnings = [];
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { lines: [], mode: 'plain_text', warnings: ['JSON inválido'] };
  }

  const lines = (data.lines || []).map((l) => ({
    text: l.text || '',
    startTime: Number(l.startTime) || 0,
    endTime: Number(l.endTime) || l.startTime || 0,
  }));

  return { lines, mode: 'line_synced', warnings };
}

/**
 * Estima sílabas por palabra (heurística: grupos vocálicos en español/inglés).
 * Mejora la sincronización palabra a palabra vs. solo longitud de caracteres.
 */
function estimateSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-zàáâãäåèéêëìíîïòóôõöùúûüýÿæœçñ]/g, '');
  if (!w) return 1;
  const vowels = w.match(/[aeiouyàáâãäåèéêëìíîïòóôõöùúûüýÿæœ]/g);
  const count = vowels ? vowels.length : 1;
  const diphthongs = (w.match(/[aeiouy]{2,}/gi) || []).length;
  return Math.max(1, count - Math.floor(diphthongs * 0.5));
}

/**
 * Enriquece líneas con palabras y timestamps estimados (sincronización palabra a palabra).
 * Distribuye la duración por sílabas (más natural que por caracteres).
 */
export function enrichLinesWithWords(lines) {
  for (const line of lines) {
    const tokens = line.text.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      line.words = [];
      continue;
    }
    const duration = line.endTime - line.startTime;
    const syllables = tokens.map(estimateSyllables);
    const totalSyllables = syllables.reduce((s, n) => s + n, 0) || 1;
    let t = line.startTime;
    line.words = tokens.map((text, i) => {
      const frac = syllables[i] / totalSyllables;
      const wordDuration = duration * frac;
      const startTime = t;
      t += wordDuration;
      return { text, startTime, endTime: t, index: i };
    });
  }
  return lines;
}

/**
 * Detecta formato y parsea
 */
export function parseLyrics(raw, format = 'auto', totalDurationSec = 0) {
  let result;
  if (format === 'json') result = parseJson(raw);
  else if (format === 'txt') result = parseTxt(raw, totalDurationSec);
  else if (format === 'lrc' || (format === 'auto' && /\[\d+:\d+/.test(raw))) result = parseLrc(raw);
  else result = parseTxt(raw, totalDurationSec);
  enrichLinesWithWords(result.lines);
  return result;
}
