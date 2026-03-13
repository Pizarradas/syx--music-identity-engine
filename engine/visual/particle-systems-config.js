/**
 * Configuración de sistemas de partículas por banda/instrumento
 * Sostenible: añadir/editar sistemas aquí sin tocar scene.js
 *
 * band: 'bass' | 'mids' | 'highs'
 *   - bass: graves (bajo, kick)
 *   - mids: medios (voz, guitarras, teclados)
 *   - highs: agudos (platillos, hi-hats)
 *
 * hue: 0-1 (HSL). Coherente con data-driven-viz: bass~rojo, mids~verde, highs~azul
 * layerType: 0=orgánico, 0.5=híbrido, 1=mecánico
 */
export const PARTICLE_SYSTEMS = [
  {
    id: 'bass',
    band: 'bass',
    label: 'Graves',
    hue: 0.08,        // ~30° rojo/ámbar
    baseSize: 0.065,
    baseOpacity: 1.0,
    density: 1.0,
    speed: 0.5,
    z: -1.2,
    spreadRadius: 3.5,
    zSpread: 1.5,
    layerType: 0,     // orgánico
  },
  {
    id: 'voice',
    band: 'mids',
    label: 'Voz / Medios',
    hue: 0.35,        // ~125° verde/amarillo
    baseSize: 0.048,
    baseOpacity: 0.95,
    density: 1.3,
    speed: 1.2,
    z: 0,
    spreadRadius: 4.2,
    zSpread: 3,
    layerType: 0.5,   // híbrido
  },
  {
    id: 'highs',
    band: 'highs',
    label: 'Agudos',
    hue: 0.68,        // ~245° azul/violeta
    baseSize: 0.038,
    baseOpacity: 0.7,
    density: 1.1,
    speed: 1.8,
    z: 1,
    spreadRadius: 4.8,
    zSpread: 5,
    layerType: 1,     // mecánico
  },
  {
    id: 'ambient',
    band: 'mids',     // ambiente suave, sigue medios
    label: 'Ambiente',
    hue: 0.5,
    baseSize: 0.022,
    baseOpacity: 0.55,
    density: 0.9,
    speed: 0.7,
    z: 2,
    spreadRadius: 5.5,
    zSpread: 7,
    layerType: 0,
  },
];

/** Índice de banda para uniforms (0=bass, 1=mids, 2=highs) */
export const BAND_INDEX = { bass: 0, mids: 1, highs: 2 };
