# SYX Music Identity Engine

Motor de identidad visual que traduce música en diseño en tiempo real. Analiza características de audio (energía, espectro, ritmo) y genera paletas de colores, tipografía y tokens de diseño dinámicamente usando la arquitectura SYX.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Características

- **Análisis de audio en tiempo real** — Extrae más de 20 variables semánticas (energía, tensión armónica, brillo tímbrico, groove, organicidad, etc.)
- **Identidad visual dinámica** — Colores, tipografía y componentes que reaccionan al compás de la música
- **Diferenciación por género** — Resultados distintos según el estilo: metal, pop, clásica, jazz, hip-hop, electrónica, R&B, folk, reggae, latin, blues, ambient y más
- **Exportación** — PNG, JSON, informe HTML, tokens CSS, configuración SYX
- **Vista previa HTML** — Genera una página con la identidad aplicada para inspección o uso en otros proyectos

## 🚀 Demo

Si el proyecto está desplegado en GitHub Pages:

```
https://[tu-usuario].github.io/syx--music-identity-engine/app/
```

## 📦 Instalación y ejecución local

```bash
# Clonar el repositorio
git clone https://github.com/[tu-usuario]/syx--music-identity-engine.git
cd syx--music-identity-engine

# Instalar dependencias (opcional, para desarrollo)
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
4. **Exporta** — Usa **Ver HTML** o **Exportar** para guardar la identidad generada (PNG, JSON, tokens, etc.)

## 🏗️ Estructura del proyecto

```
syx--music-identity-engine/
├── app/              # Interfaz principal (HTML, JS, widgets)
├── engine/           # Motor: pipeline, análisis, semántica, identidad visual
│   ├── analysis/     # Extracción de features de audio
│   ├── semantic/     # Modelo semántico musical
│   ├── visual/       # Mapeo música → identidad visual
│   └── tokens/       # Token foundations y traducción SYX
├── syx-ui/           # Sistema de diseño (CSS, temas, componentes)
├── docs/             # Documentación técnica
├── data/             # Archivos de prueba (audio, letras)
└── package.json
```

## 🎨 Tecnologías

- **Meyda** — Extracción de features de audio (espectro, MFCC, etc.)
- **D3.js** — Visualizaciones
- **Chart.js** — Gráficos de evolución
- **GSAP** — Animaciones
- **Three.js** — Escena 3D opcional
- **Lucide** — Iconos

## 📄 Documentación

- `docs/01_system_architecture.md` — Arquitectura del sistema
- `docs/26_music_to_ui_mapping_v2.md` — Mapeo música → UI
- `docs/31_pipeline_algorithms_index.md` — Índice de algoritmos

## 📜 Licencia

MIT
