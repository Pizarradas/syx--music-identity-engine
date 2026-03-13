/**
 * Ingestión de audio — validación, decode, buffer
 * docs/02_user_inputs_audio_lyrics.md
 */
import { config } from '../config.js';

const MIME = config.ingestion.audio.mimeTypes;
const MAX_BYTES = config.ingestion.audio.maxSizeMb * 1024 * 1024;

/**
 * @typedef {Object} AudioMetadata
 * @property {number} duration
 * @property {number} sampleRate
 * @property {number} channels
 * @property {number} length - samples
 */

const ALLOWED_EXTENSIONS = /\.(wav|mp3|ogg|webm|m4a)$/i;

/**
 * Valida archivo de audio
 */
export function validateAudioFile(file) {
  const errors = [];
  const extOk = file.name.match(ALLOWED_EXTENSIONS);
  const mimeOk = MIME.includes(file.type) || file.type?.startsWith('audio/');
  if (!extOk && !mimeOk) {
    errors.push(`Formatos admitidos: WAV, MP3, OGG. Recibido: ${file.type || file.name}`);
  }
  if (file.size > MAX_BYTES) {
    errors.push(`Tamaño máximo: ${config.ingestion.audio.maxSizeMb}MB`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Decodifica archivo a AudioBuffer
 * @param {File} file
 * @param {AudioContext} ctx
 * @returns {Promise<{ buffer: AudioBuffer, metadata: AudioMetadata }>}
 */
export async function decodeAudioFile(file, ctx) {
  const { valid, errors } = validateAudioFile(file);
  if (!valid) throw new Error(errors.join('; '));

  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const metadata = {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    length: audioBuffer.length,
  };

  if (metadata.duration > config.ingestion.audio.maxDurationSec) {
    throw new Error(`Duración máxima: ${config.ingestion.audio.maxDurationSec}s`);
  }

  return { buffer: audioBuffer, metadata };
}
