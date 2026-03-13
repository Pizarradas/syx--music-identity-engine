/**
 * Timeline unificada — audio, lyrics, semantic state
 * docs/07_timeline_synchronization.md
 */
import { config } from '../config.js';

/**
 * @typedef {Object} TimelineState
 * @property {number} currentTime
 * @property {Object} semantic
 * @property {Object|null} currentLyricLine
 * @property {Object|null} nextLyricLine
 */

/**
 * Convierte índice de feature a tiempo (segundos)
 */
export function featureIndexToTime(index) {
  const hopMs = config.analysis.shortWindowMs;
  return (index * hopMs) / 1000;
}

/**
 * Encuentra índice de feature para un tiempo dado
 */
export function timeToFeatureIndex(time) {
  const hopMs = config.analysis.shortWindowMs;
  return Math.floor((time * 1000) / hopMs);
}

/**
 * Tiempo efectivo para lookup de letras.
 * switchDelayMs > 0: retrasa el cambio. < 0: adelanta (muestra letra antes de que suene).
 * videoIntroOffsetSec: offset de intro en audio de vídeo (las letras LRC suelen estar para versión álbum).
 * pauseSegments: durante puentes instrumentales, congela el tiempo para no avanzar letras.
 * @param {number} time - tiempo actual del audio
 * @param {number} videoIntroOffsetSec - offset de intro
 * @param {Array<{start:number,end:number}>} [pauseSegments] - segmentos detectados o override; si no se pasa, usa config
 */
function getEffectiveLyricTime(time, videoIntroOffsetSec = 0, pauseSegments = null) {
  let lyricTime = Math.max(0, time - videoIntroOffsetSec);
  const offsetMs = config.lyrics?.switchDelayMs ?? 0;
  lyricTime = Math.max(0, lyricTime - offsetMs / 1000);

  const segments = pauseSegments ?? config.lyrics?.pauseSegments ?? [];
  for (const seg of segments) {
    if (lyricTime >= seg.start && lyricTime < seg.end) {
      lyricTime = seg.start;
      break;
    }
  }
  return Math.max(0, lyricTime);
}

/**
 * Obtiene palabra activa y mapa de acentos para una línea en un tiempo dado.
 * @param {Object} line - línea con words[]
 * @param {number} time - tiempo en segundos
 * @returns {{ activeWordIndex: number, wordAccentMap: Object, activeWords: number[] }}
 */
function getWordStateAtTime(line, time) {
  const words = line?.words || [];
  if (words.length === 0) {
    return { activeWordIndex: -1, wordAccentMap: {}, activeWords: [] };
  }

  let activeWordIndex = -1;
  const wordAccentMap = {};
  const activeWords = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (time >= w.startTime && time < w.endTime) {
      activeWordIndex = i;
      wordAccentMap[i] = 1;
      activeWords.push(i);
    } else if (time >= w.endTime) {
      wordAccentMap[i] = 0.75;
      activeWords.push(i);
    } else {
      wordAccentMap[i] = 0.4;
    }
  }
  return { activeWordIndex, wordAccentMap, activeWords };
}

/**
 * Obtiene línea de letra activa para un tiempo
 * Aplica switchDelayMs para que la siguiente línea no entre demasiado pronto
 * Incluye activeWords y wordAccentMap para sincronización palabra a palabra
 * @param {Array} lines - Líneas de letra
 * @param {number} time - Tiempo actual del audio (reproductor)
 * @param {number} [videoIntroOffsetSec=0] - Offset de intro si el audio es de vídeo musical
 * @param {Array<{start:number,end:number}>} [pauseSegments] - Segmentos de pausa (detectados o override)
 */
export function getLyricLineAtTime(lines, time, videoIntroOffsetSec = 0, pauseSegments = null) {
  const effectiveTime = getEffectiveLyricTime(time, videoIntroOffsetSec, pauseSegments);

  for (let i = 0; i < lines.length; i++) {
    if (effectiveTime >= lines[i].startTime && effectiveTime < lines[i].endTime) {
      const wordState = getWordStateAtTime(lines[i], effectiveTime);
      return {
        line: lines[i],
        index: i,
        next: lines[i + 1] || null,
        ...wordState,
      };
    }
  }
  const nextIdx = lines.findIndex((l) => l.startTime > effectiveTime);
  return {
    line: null,
    index: -1,
    next: nextIdx >= 0 ? lines[nextIdx] : null,
    activeWordIndex: -1,
    wordAccentMap: {},
    activeWords: [],
  };
}

/**
 * Construye timeline de estados semánticos indexada por tiempo
 */
export function buildSemanticTimeline(semanticStates) {
  return semanticStates.map((state, i) => ({
    time: featureIndexToTime(i),
    ...state,
  }));
}
