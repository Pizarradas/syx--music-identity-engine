/**
 * SYX Music Identity Engine — Punto de entrada
 * Pipeline: audio → analysis → semantic → token foundations → SYX translation → design tokens
 */
export { runPipeline } from './pipeline.js';
export { config } from './config.js';
export * from './ingestion/index.js';
export * from './analysis/index.js';
export * from './semantic/index.js';
export * from './timeline/index.js';
export * from './visual/index.js';
export * from './tokens/index.js';
