# SYX Music Identity Engine

Motor de identidad visual que traduce música en diseño en tiempo real. Analiza características de audio y genera paletas de colores, tipografía, espacios y componentes dinámicamente.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Características

- **Análisis de audio** — Extrae más de 20 variables semánticas (energía, tensión armónica, brillo tímbrico, groove, organicidad, etc.) con FFT 4096 y ventanas de 45 ms para mayor precisión
- **Paleta cromática dinámica** — Colores derivados del audio (Energía, Tensión, Brillo, Ritmo, Groove) con hues calculados en tiempo real, no predefinidos
- **Tipografía adaptativa** — Pool de ~45 fuentes Google Fonts en 4 categorías (Editorial, Geométrica, Display, Slab) según el carácter musical
- **Sistema de espacios** — Tokens de espaciado (xs–3xl) y colores de fondo derivados de la paleta
- **Exportación** — HTML con identidad visual integrada, informe HTML, JSON tokens, CSS custom properties
- **Gráfico Música → Paleta** — Visualización circular de cómo cada parámetro contribuye al color resultante

## 🚀 Demo

Si el proyecto está desplegado en GitHub Pages:

```
https://[tu-usuario].github.io/syx-music-identity-engine/app/
```

## 📦 Instalación y ejecución local

```bash
# Clonar el repositorio
git clone https://github.com/[tu-usuario]/syx-music-identity-engine.git
cd syx-music-identity-engine

# Instalar dependencias (opcional)
npm install

# Ejecutar (requiere servidor HTTP por ES modules)
npm start
# o: npx serve -l 3000

# Abrir en el navegador
# http://localhost:3000/app/
```

## 📖 Cómo usar

1. **Sube audio** — Arrastra o selecciona un archivo WAV, MP3 u OGG
2. **Analiza** — Pulsa **Ejecutar** para procesar el audio
3. **Reproduce** — Pulsa **Play** para ver la identidad visual en tiempo real
4. **Exporta** — Usa **Exportar** para descargar:
   - **HTML con identidad visual** — Página completa con paleta, tipografía, espacios y componentes
   - **Informe HTML** — Resumen de variables del análisis
   - **JSON tokens** — Tokens de diseño en formato JSON
   - **CSS custom properties** — Variables CSS listas para usar

**Consejo:** Exporta el HTML mientras la canción suena o con el tema congelado para capturar el estado visual exacto.

## 🏗️ Estructura del proyecto

```
syx-music-identity-engine/
├── app/              # Interfaz principal (HTML, JS, widgets)
├── engine/           # Motor: pipeline, análisis, semántica, identidad visual
│   ├── analysis/     # Extracción de features de audio
│   ├── semantic/     # Modelo semántico musical
│   ├── visual/       # Mapeo música → identidad visual
│   └── tokens/       # Token foundations y traducción SYX
├── syx-ui/           # Sistema de diseño (CSS, temas, componentes)
├── docs/             # Documentación técnica
└── package.json
```

## 🎨 Tecnologías

- **Web Audio API** — Decodificación y análisis de audio
- **Meyda** — Features espectrales (chroma, MFCC) para detección de tonalidad
- **web-audio-beat-detector** — Detección de BPM
- **D3.js** — Visualizaciones y gráficos
- **Chart.js** — Gráficos de evolución
- **Three.js** — Escena 3D opcional
- **Google Fonts** — Tipografías para la identidad visual

## 📄 Documentación

- `docs/01_system_architecture.md` — Arquitectura del sistema
- `docs/26_music_to_ui_mapping_v2.md` — Mapeo música → UI
- `docs/31_pipeline_algorithms_index.md` — Índice de algoritmos

## 📜 Licencia

MIT
