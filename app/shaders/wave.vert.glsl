/**
 * Vertex shader — modelo de ondas
 * Superposición de ondas por bandas: bass (lentas), mids (medias), highs (rápidas)
 */
uniform float uTime;
uniform float uEnergy;
uniform float uBass;
uniform float uMids;
uniform float uHighs;
uniform float uAmplitude;

varying float vElevation;
varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 pos = position;

  // Onda grave — lenta, amplia
  float waveBass = sin(pos.x * 1.2 + uTime * 0.8) * cos(pos.y * 1.0 + uTime * 0.6);
  // Onda media — ritmo
  float waveMids = sin(pos.x * 2.5 + uTime * 2.0) * sin(pos.y * 2.5 + uTime * 1.8);
  // Onda aguda — ripples rápidos
  float waveHighs = sin(pos.x * 5.0 + uTime * 4.0) * cos(pos.y * 5.0 + uTime * 3.5);

  float elevation = (uBass * waveBass + uMids * waveMids + uHighs * waveHighs) * uAmplitude * (0.3 + uEnergy * 0.7);

  pos.z += elevation;
  vElevation = elevation;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
