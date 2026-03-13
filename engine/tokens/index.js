/**
 * Token pipeline — foundations + SYX translation
 * docs/24_token_foundations_schema.md
 * docs/# SYX Translation Layer.md
 */
export {
  semanticToTokenFoundations,
  createEmptyFoundations,
  formatTokenFoundationsOutput,
  TOKEN_FOUNDATION_KEYS,
  ALL_FOUNDATION_KEYS,
} from './token-foundations.js';

export {
  foundationsToSyxTheme,
  syxThemeToCssVars,
  applySyxThemeToDom,
} from './syx-translation-layer.js';
