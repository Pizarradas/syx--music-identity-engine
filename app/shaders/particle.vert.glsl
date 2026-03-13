/**
 * Vertex shader para partículas — lógica en GPU, uniforms semánticos
 * Recibe: orig position, phase, speed, type
 * Uniforms: energía, tensión, bandas, tiempo, modo de capa
 */
attribute float size;
attribute float phase;
attribute float speed;
attribute float type;

uniform float uTime;
uniform float uEnergy;
uniform float uTension;
uniform float uOrganic;
uniform float uRhythm;
uniform float uGroove;
uniform float uBrightness;
uniform float uTexture;
uniform float uDynRange;
uniform float uBass;
uniform float uMids;
uniform float uHighs;
uniform float uMotionIntensity;
uniform float uDensity;
uniform float uLayerScale;
uniform float uLayerType; // 0=organic, 0.5=hybrid, 1=mechanical
uniform float uBaseOpacity;
uniform float uDominantBand; // 0=bass, 1=mids, 2=highs. -1=mixed (legacy)
uniform float uSystemHue;    // hue 0-1 para este sistema
uniform float uBurst;        // 0-1 burst radial en transientes
uniform float uKeyHue;       // hue tonalidad 0-1, -1=no usar
uniform float uPercussiveMode;  // 0-1: bias hacia grid/burst
uniform float uMelodicMode;    // 0-1: bias hacia ondas concéntricas
uniform float uChromaStrength; // 0-1: fuerza del chroma
uniform float uChromaHue;     // 0-1 hue por nota, -1=no usar
uniform float uSharpness;     // 0-1: alto=partículas más pequeñas
uniform float uSpectralRichness; // 0-1: más variación

varying vec3 vColor;
varying float vAlpha;

// Hash para pseudo-noise en GPU
float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float valueNoise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash(i);
  float n100 = hash(i + vec3(1,0,0));
  float n010 = hash(i + vec3(0,1,0));
  float n110 = hash(i + vec3(1,1,0));
  float n001 = hash(i + vec3(0,0,1));
  float n101 = hash(i + vec3(1,0,1));
  float n011 = hash(i + vec3(0,1,1));
  float n111 = hash(i + vec3(1,1,1));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z) * 2.0 - 1.0;
}

float fractalNoise(vec3 p, int octaves) {
  float v = 0.0;
  float f = 1.0;
  float a = 1.0;
  for (int i = 0; i < 3; i++) {
    v += a * valueNoise3(p * f);
    f *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 orig = position;
  float t = uTime * speed + phase;
  float dist = length(orig.xy) + 0.001;
  float angle = atan(orig.y, orig.x);

  float bandBoost = 1.0 + (uBass * 0.4 + uMids * 0.3 + uHighs * 0.5) * 0.5;
  float waveAmp = (0.06 + uEnergy * 0.25 + uDynRange * 0.05) * uDensity * bandBoost;
  float tensionPull = uTension * 0.18 * uMotionIntensity * (1.0 + uMids * 0.3);
  float vortexStr = (0.3 + uOrganic * 0.5 + uBass * 0.2) * waveAmp;
  float flowStr = (0.2 + uRhythm * 0.35 + uGroove * 0.15 + uHighs * 0.25) * waveAmp;
  float noiseStr = (0.1 + uTexture * 0.2 + uMids * 0.15) * waveAmp;

  vec3 pNoise = orig * 0.5;
  pNoise.z += t * 0.3;
  float n1 = fractalNoise(pNoise, 3);
  float n2 = fractalNoise(pNoise + vec3(10.0, 0.0, t * 0.25), 3);
  float n3 = fractalNoise(orig + vec3(0.0, 0.0, t * 0.2 + 5.0), 3);

  float vortex = vortexStr * (1.0 + 0.3 * sin(t * 0.8));
  float swirl = cos(t * 0.4 + phase) * vortexStr * 0.6;
  float gridX = sin(t * 2.5 + floor(orig.x * 1.5) * 0.7) * flowStr * 0.6;
  float gridY = cos(t * 2.2 + floor(orig.y * 1.5) * 0.7) * flowStr * 0.6;
  float pulse = sin(t * 4.0 + uRhythm * 12.0) * waveAmp * 0.4;

  vec3 disp = vec3(0.0);

  float effectiveLayerType = uLayerType;
  effectiveLayerType += uPercussiveMode * 0.4 * (1.0 - uLayerType);
  effectiveLayerType -= uMelodicMode * 0.35 * uLayerType;
  effectiveLayerType = clamp(effectiveLayerType, 0.0, 1.0);

  if (effectiveLayerType < 0.3) {
    // Organic / Melodic
    float dx = (n1 * flowStr + n2 * noiseStr) * cos(angle);
    float dy = (n1 * flowStr + n2 * noiseStr) * sin(angle);
    dx += (-orig.y / dist) * vortex;
    dy += (orig.x / dist) * vortex;
    disp.xy = vec2(dx, dy);
    disp.z = n3 * 0.04 * (1.0 + uBrightness * 0.5);
  } else if (effectiveLayerType > 0.7) {
    // Mechanical / Percussive
    disp.x = gridX + pulse * (type > 0.5 ? 1.0 : -0.5);
    disp.y = gridY + pulse * (type > 0.3 ? -0.5 : 1.0);
    disp.z = sin(t * 1.5 + float(gl_VertexID) * 0.05) * 0.02;
  } else {
    // Hybrid
    float blend = uOrganic;
    float n = fractalNoise(orig * 0.4 + vec3(0.0, 0.0, t * 0.2), 3);
    float grid = sin(t * 2.0 + floor(orig.x) * 0.5) * flowStr * 0.4;
    float scalar = (n * blend + grid * (1.0 - blend)) * 0.8;
    disp.x = scalar * (orig.x / dist) + swirl * (-orig.y / dist);
    disp.y = scalar * (orig.y / dist) + swirl * (orig.x / dist);
    disp.z = sin(t * 0.3 + float(gl_VertexID) * 0.15) * 0.03;
  }

  float towardCenter = max(0.0, 1.0 - dist / 5.5);
  float pull = towardCenter * tensionPull * (1.0 + sin(t * 1.5) * 0.4);
  vec2 pullVec = (orig.xy / dist) * pull * 0.6;
  disp.xy -= pullVec;

  vec3 pos = (orig + disp) * uLayerScale;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float sizeMod = 1.0 - uSharpness * 0.25;
  gl_PointSize = size * (0.85 + uEnergy * 0.65) * sizeMod * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;

  // Band drive: nivel de la banda dominante para este sistema
  float bandDrive = uBass;
  if (uDominantBand > 0.5) bandDrive = uDominantBand > 1.5 ? uHighs : uMids;

  float sat = 0.35 + uEnergy * 0.55;
  float lum = 0.48 + uTension * 0.25;

  float hue;
  if (uDominantBand >= 0.0) {
    hue = uSystemHue;
    if (uKeyHue >= 0.0) hue = mix(hue, uKeyHue, 0.55);
    if (uChromaHue >= 0.0 && uChromaStrength > 0.3) {
      hue = mix(hue, uChromaHue, uChromaStrength * 0.5);
    }
    float hueVar = (type - 0.5) * 0.03 * (1.0 + uSpectralRichness * 0.5);
    hue = fract(hue + hueVar);
  } else {
    hue = (280.0 + (uBrightness - 0.5) * 90.0) / 360.0;
    float hueShift = (uBass - 0.33) * 0.05 * type + (uHighs - 0.33) * 0.03 * (1.0 - type);
    hue = fract(hue + hueShift);
  }

  vColor = vec3(hue, sat, lum);
  float bandBoostAlpha = uDominantBand >= 0.0 ? (0.35 + bandDrive * 0.65) : 1.0;
  vAlpha = uBaseOpacity * (0.7 + uEnergy * 0.3) * bandBoostAlpha;
}
