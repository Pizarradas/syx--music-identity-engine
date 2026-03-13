/**
 * Escena Three.js — fondo y partículas decorativos (sin reactividad al audio)
 * Cada sistema (bass, voice/mids, highs) tiene color y tamaño propios
 * Config: engine/visual/particle-systems-config.js
 * Modo decorativo: animación suave basada solo en tiempo, evita lag por análisis de audio
 */
const DECORATIVE_MODE = true; // fondo y partículas estáticos/decorativos, no reaccionan a la música
import * as THREE from 'https://esm.sh/three@0.160.0';
import { EffectComposer } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://esm.sh/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js';
import { ChromaticAberrationShader } from './shaders/ChromaticAberrationShader.js';
import { VignetteShader } from './shaders/VignetteShader.js';
import { DistortionShader } from './shaders/DistortionShader.js';
import { PARTICLE_SYSTEMS, BAND_INDEX } from '../engine/visual/particle-systems-config.js';
import { getPerformanceFactor, getWaveMeshSegments, isPageVisible, isLowPerformanceDevice, isDesktopExperimental } from './performance-utils.js';

let scene, camera, renderer, composer, bloomPass;
let chromaticPass, vignettePass, distortionPass;
let waveMesh = null;
let waveMaterial = null;
let particleSystems = [];
let animationId = null;
let lastSemantic = {};
let lastVisual = {};
let settings = { density: 1, motionIntensity: 1 };
let webglAvailable = true;
let fallbackEl = null;
let lastBandData = { bass: 0.33, mids: 0.33, highs: 0.33 };
let useShaderMaterial = false;
let burstValue = 0;
let burstDecay = 0;
let useWaveModel = true;
let resizeHandler = null;

export function setParticleSettings(s) {
  if (s) settings = { ...settings, ...s };
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function createFallbackGradient(container) {
  fallbackEl = document.createElement('div');
  fallbackEl.style.cssText = `
    position:absolute;inset:0;background:radial-gradient(ellipse at center,
      color-mix(in oklch, var(--semantic-color-primary, #6366f1) 12%, #1a1a2e) 0%,
      #0f0f1a 100%);
    pointer-events:none;
  `;
  container.appendChild(fallbackEl);
}

async function loadShader(url) {
  const res = await fetch(new URL(url, import.meta.url));
  if (!res.ok) throw new Error(`Shader ${url} not found`);
  return res.text();
}

function createParticleMaterial(vertShader, fragShader, cfg) {
  const bandIdx = BAND_INDEX[cfg.band] ?? 1;
  return new THREE.ShaderMaterial({
    vertexShader: vertShader,
    fragmentShader: fragShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: 0.5 },
      uTension: { value: 0.5 },
      uOrganic: { value: 0.5 },
      uRhythm: { value: 0.5 },
      uGroove: { value: 0.5 },
      uBrightness: { value: 0.5 },
      uTexture: { value: 0.5 },
      uDynRange: { value: 0.5 },
      uBass: { value: 0.33 },
      uMids: { value: 0.33 },
      uHighs: { value: 0.33 },
      uMotionIntensity: { value: 1 },
      uDensity: { value: 1 },
      uLayerScale: { value: 1 },
      uLayerType: { value: cfg.layerType },
      uBaseOpacity: { value: cfg.baseOpacity },
      uDominantBand: { value: bandIdx },
      uSystemHue: { value: cfg.hue },
      uBurst: { value: 0 },
      uKeyHue: { value: -1 },
      uPercussiveMode: { value: 0 },
      uMelodicMode: { value: 0 },
      uChromaStrength: { value: 0 },
      uChromaHue: { value: -1 },
      uSharpness: { value: 0.5 },
      uSpectralRichness: { value: 0.5 },
    },
  });
}

export async function initScene(container) {
  if (!container) return null;

  const useParticles = webglAvailable && !prefersReducedMotion();

  try {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 6;

    const maxPixelRatio = isLowPerformanceDevice() ? 1.5 : 2;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isLowPerformanceDevice(), failIfMajorPerformanceCaveat: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    container.appendChild(renderer.domElement);

    try {
      composer = new EffectComposer(renderer);
      composer.setSize(container.clientWidth, container.clientHeight);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      composer.addPass(new RenderPass(scene, camera));
      const bloomStrength = isDesktopExperimental() ? 0.85 : 0.5;
      const bloomRadius = isDesktopExperimental() ? 0.6 : 0.5;
      bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), bloomStrength, bloomRadius, 0.2);
      composer.addPass(bloomPass);

      try {
        distortionPass = new ShaderPass(DistortionShader);
        distortionPass.uniforms.amount.value = 0.005;
        composer.addPass(distortionPass);

        chromaticPass = new ShaderPass(ChromaticAberrationShader);
        chromaticPass.uniforms.offset.value = 0.5;
        chromaticPass.uniforms.strength.value = 0.002;
        composer.addPass(chromaticPass);

        vignettePass = new ShaderPass(VignetteShader);
        vignettePass.uniforms.darkness.value = 0.4;
        vignettePass.uniforms.offset.value = 1.0;
        vignettePass.renderToScreen = true;
        composer.addPass(vignettePass);
      } catch (shaderErr) {
        console.warn('Shaders de post-procesado no disponibles:', shaderErr.message);
        bloomPass.renderToScreen = true;
      }
    } catch (bloomErr) {
      console.warn('Bloom post-procesado no disponible, render directo:', bloomErr.message);
      composer = null;
      bloomPass = null;
    }
  } catch (e) {
    webglAvailable = false;
    createFallbackGradient(container);
    return { scene: null, camera: null, renderer: null };
  }

  if (!useParticles) {
    settings.motionIntensity = 0.15;
  }

  let vertShader, fragShader;
  try {
    vertShader = await loadShader('./shaders/particle.vert.glsl');
    fragShader = await loadShader('./shaders/particle.frag.glsl');
  } catch (e) {
    console.warn('Shaders no cargados, usando PointsMaterial fallback:', e.message);
  }

  const createLayer = (count, baseSize, zSpread, spreadRadius = 4.5, speedMul = 1) => {
    const positions = new Float32Array(count * 3);
    const orig = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const types = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.2 + Math.random() * spreadRadius;
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      const z = (Math.random() - 0.5) * zSpread;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      orig[i * 3] = x;
      orig[i * 3 + 1] = y;
      orig[i * 3 + 2] = z;
      sizes[i] = baseSize * (0.4 + Math.random() * 0.8);
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = (0.6 + Math.random() * 0.8) * speedMul;
      types[i] = Math.random();
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    geom.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    geom.setAttribute('type', new THREE.BufferAttribute(types, 1));

    return { geom, orig };
  };

  const perfFactor = getPerformanceFactor();
  const densityMultiplier = isDesktopExperimental() && !DECORATIVE_MODE ? 2.8 : 1;
  const decorativeDensity = DECORATIVE_MODE ? 0.6 : 1;
  const baseDensity = Math.round(350 * settings.density * perfFactor * densityMultiplier * decorativeDensity);
  useShaderMaterial = !!(vertShader && fragShader);

  particleSystems = PARTICLE_SYSTEMS.map((cfg) => {
    const count = Math.round(baseDensity * cfg.density);
    const { geom, orig } = createLayer(count, cfg.baseSize, cfg.zSpread, cfg.spreadRadius, cfg.speed);

    let mat;
    if (useShaderMaterial) {
      mat = createParticleMaterial(vertShader, fragShader, cfg);
    } else {
      const c = new THREE.Color().setHSL(cfg.hue, 0.6, 0.55);
      mat = new THREE.PointsMaterial({
        size: cfg.baseSize * 2,
        color: c,
        transparent: true,
        opacity: cfg.baseOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
    }

    const mesh = new THREE.Points(geom, mat);
    mesh.position.z = cfg.z;
    scene.add(mesh);

    return { mesh, geom, mat, orig, config: cfg };
  });

  // Modelo de ondas (más visible que partículas)
  if (useWaveModel && useParticles) {
    try {
      const waveVert = await loadShader('./shaders/wave.vert.glsl');
      const waveFrag = await loadShader('./shaders/wave.frag.glsl');
      waveMaterial = new THREE.ShaderMaterial({
        vertexShader: waveVert,
        fragmentShader: waveFrag,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uEnergy: { value: 0.5 },
          uBass: { value: 0.33 },
          uMids: { value: 0.33 },
          uHighs: { value: 0.33 },
          uAmplitude: { value: 0.4 },
          uHue: { value: 0.6 },
          uSaturation: { value: 0.6 },
          uOpacity: { value: 0.7 },
        },
      });
      const segs = getWaveMeshSegments();
      const waveGeom = new THREE.PlaneGeometry(12, 12, segs, segs);
      waveMesh = new THREE.Mesh(waveGeom, waveMaterial);
      waveMesh.position.z = -2.5;
      waveMesh.renderOrder = -1;
      scene.add(waveMesh);
    } catch (e) {
      console.warn('Shader de ondas no cargado:', e.message);
    }
  }

  resizeHandler = () => {
    if (resizeHandler._timer) clearTimeout(resizeHandler._timer);
    resizeHandler._timer = setTimeout(() => {
      resizeHandler._timer = null;
      onResize();
    }, 150);
  };
  window.addEventListener('resize', resizeHandler);

  return { scene, camera, renderer };
}

function onResize() {
  if (!camera || !renderer) return;
  const container = renderer.domElement.parentElement;
  if (!container) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const maxPixelRatio = isLowPerformanceDevice() ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  renderer.setSize(w, h);
  if (composer) {
    composer.setSize(w, h);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    if (bloomPass) bloomPass.resolution.set(w, h);
  }
}

function smoothNoise(x, y, t) {
  const ix = Math.floor(x * 3) % 7;
  const iy = Math.floor(y * 3) % 7;
  const it = Math.floor(t * 2) % 5;
  const h = (ix * 17 + iy * 31 + it * 47) % 1000 / 1000;
  return h * 2 - 1;
}

const NOISE_OCTAVES = isLowPerformanceDevice() ? 2 : 3;
function fractalNoise(x, y, t, octaves = NOISE_OCTAVES) {
  let v = 0, f = 1, a = 1;
  for (let i = 0; i < octaves; i++) {
    v += a * smoothNoise(x * f, y * f, t * f);
    f *= 2;
    a *= 0.5;
  }
  return v;
}

function updateLayerCPU(geom, orig, layerScale, layerType) {
  const e = DECORATIVE_MODE ? 0.5 : (lastSemantic?.energy_level ?? 0.5);
  const tension = DECORATIVE_MODE ? 0.5 : (lastSemantic?.harmonic_tension ?? 0.5);
  const org = DECORATIVE_MODE ? 0.6 : (lastSemantic?.organicity_vs_mechanicality ?? 0.5);
  const rhythm = DECORATIVE_MODE ? 0.5 : (lastSemantic?.rhythmic_pressure ?? 0.5);
  const groove = DECORATIVE_MODE ? 0.5 : (lastSemantic?.groove ?? 0.5);
  const bright = DECORATIVE_MODE ? 0.5 : (lastSemantic?.timbral_brightness ?? 0.5);
  const texture = DECORATIVE_MODE ? 0.5 : (lastSemantic?.texture_density ?? 0.5);
  const dyn = DECORATIVE_MODE ? 0.5 : (lastSemantic?.dynamic_range ?? 0.5);

  const time = Date.now() * 0.001 * (DECORATIVE_MODE ? 0.4 : settings.motionIntensity);
  const positions = geom.attributes.position.array;
  const phases = geom.attributes.phase?.array;
  const speeds = geom.attributes.speed?.array;
  const types = geom.attributes.type?.array;
  const count = positions.length / 3;

  const bandBass = DECORATIVE_MODE ? 0.33 : (lastBandData?.bass ?? 0.33);
  const bandMids = DECORATIVE_MODE ? 0.33 : (lastBandData?.mids ?? 0.33);
  const bandHighs = DECORATIVE_MODE ? 0.33 : (lastBandData?.highs ?? 0.33);
  const bandBoost = DECORATIVE_MODE ? 1.2 : (1 + (bandBass * 0.4 + bandMids * 0.3 + bandHighs * 0.5) * 0.5);

  const waveAmp = (0.06 + e * 0.25 + dyn * 0.05) * settings.density * bandBoost * (DECORATIVE_MODE ? 0.6 : 1);
  const tensionPull = tension * 0.18 * (DECORATIVE_MODE ? 0.5 : settings.motionIntensity) * (1 + bandMids * 0.3);
  const vortexStr = (0.3 + org * 0.5 + bandBass * 0.2) * waveAmp;
  const flowStr = (0.2 + rhythm * 0.35 + groove * 0.15 + bandHighs * 0.25) * waveAmp;
  const noiseStr = (0.1 + texture * 0.2 + bandMids * 0.15) * waveAmp;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const phase = phases ? phases[i] : i * 0.1;
    const spd = speeds ? speeds[i] : 1;
    const typ = types ? types[i] : 0.5;
    const ox = orig[i3];
    const oy = orig[i3 + 1];
    const oz = orig[i3 + 2];

    const t = time * spd + phase;
    const dist = Math.sqrt(ox * ox + oy * oy) || 0.001;
    const angle = Math.atan2(oy, ox);

    let dx = 0, dy = 0, dz = 0;

    if (layerType === 'organic' || (layerType === 'hybrid' && org > 0.5)) {
      const n1 = fractalNoise(ox * 0.5, oy * 0.5, t * 0.3);
      const n2 = fractalNoise(ox * 0.3 + 10, oy * 0.3, t * 0.25);
      const n3 = fractalNoise(ox, oy, t * 0.2 + 5);

      dx = (n1 * flowStr + n2 * noiseStr) * Math.cos(angle);
      dy = (n1 * flowStr + n2 * noiseStr) * Math.sin(angle);

      const vortex = vortexStr * (1 + 0.3 * Math.sin(t * 0.8));
      dx += (-oy / dist) * vortex;
      dy += (ox / dist) * vortex;

      dz = n3 * 0.04 * (1 + bright * 0.5);
    } else if (layerType === 'mechanical' || (layerType === 'hybrid' && org <= 0.5)) {
      const gridX = Math.sin(t * 2.5 + Math.floor(ox * 1.5) * 0.7) * flowStr * 0.6;
      const gridY = Math.cos(t * 2.2 + Math.floor(oy * 1.5) * 0.7) * flowStr * 0.6;
      const pulse = Math.sin(t * 4 + rhythm * 12) * waveAmp * 0.4;

      dx = gridX + pulse * (typ > 0.5 ? 1 : -0.5);
      dy = gridY + pulse * (typ > 0.3 ? -0.5 : 1);
      dz = Math.sin(t * 1.5 + i * 0.05) * 0.02;
    } else {
      const blend = org;
      const n = fractalNoise(ox * 0.4, oy * 0.4, t * 0.2);
      const swirl = Math.cos(t * 0.4 + phase) * vortexStr * 0.6;
      const grid = Math.sin(t * 2 + Math.floor(ox) * 0.5) * flowStr * 0.4;

      dx = (n * blend + grid * (1 - blend)) * 0.8 + swirl * (-oy / dist);
      dy = (n * blend + grid * (1 - blend)) * 0.8 + swirl * (ox / dist);
      dz = Math.sin(t * 0.3 + i * 0.15) * 0.03;
    }

    const towardCenter = Math.max(0, 1 - dist / 5.5);
    const pull = towardCenter * tensionPull * (1 + Math.sin(t * 1.5) * 0.4);
    const pullX = (ox / dist) * pull * 0.6;
    const pullY = (oy / dist) * pull * 0.6;

    const px = (ox + dx - pullX) * layerScale;
    const py = (oy + dy - pullY) * layerScale;
    const pz = oz + dz;

    positions[i3] = px;
    positions[i3 + 1] = py;
    positions[i3 + 2] = pz;
  }

  geom.attributes.position.needsUpdate = true;
}

function updateUniforms(mat, layerScale, layerType) {
  if (!mat.uniforms) return;
  const e = DECORATIVE_MODE ? 0.5 : (lastSemantic?.energy_level ?? 0.5);
  const tension = DECORATIVE_MODE ? 0.5 : (lastSemantic?.harmonic_tension ?? 0.5);
  const org = DECORATIVE_MODE ? 0.6 : (lastSemantic?.organicity_vs_mechanicality ?? 0.5);
  const rhythm = DECORATIVE_MODE ? 0.5 : (lastSemantic?.rhythmic_pressure ?? 0.5);
  const groove = DECORATIVE_MODE ? 0.5 : (lastSemantic?.groove ?? 0.5);
  const bright = DECORATIVE_MODE ? 0.5 : (lastSemantic?.timbral_brightness ?? 0.5);
  const texture = DECORATIVE_MODE ? 0.5 : (lastSemantic?.texture_density ?? 0.5);
  const dyn = DECORATIVE_MODE ? 0.5 : (lastSemantic?.dynamic_range ?? 0.5);
  const bass = DECORATIVE_MODE ? 0.33 : (lastBandData?.bass ?? 0.33);
  const mids = DECORATIVE_MODE ? 0.33 : (lastBandData?.mids ?? 0.33);
  const highs = DECORATIVE_MODE ? 0.33 : (lastBandData?.highs ?? 0.33);

  mat.uniforms.uTime.value = Date.now() * 0.001;
  mat.uniforms.uEnergy.value = e;
  mat.uniforms.uTension.value = tension;
  mat.uniforms.uOrganic.value = org;
  mat.uniforms.uRhythm.value = rhythm;
  mat.uniforms.uGroove.value = groove;
  mat.uniforms.uBrightness.value = bright;
  mat.uniforms.uTexture.value = texture;
  mat.uniforms.uDynRange.value = dyn;
  mat.uniforms.uBass.value = bass;
  mat.uniforms.uMids.value = mids;
  mat.uniforms.uHighs.value = highs;
  mat.uniforms.uMotionIntensity.value = DECORATIVE_MODE ? 0.35 : settings.motionIntensity;
  mat.uniforms.uDensity.value = settings.density;
  mat.uniforms.uLayerScale.value = layerScale;
  mat.uniforms.uLayerType.value = layerType;
  const visualMode = lastVisual?.visual_mode ?? 0.5;
  const burstMod = visualMode < 0.3 ? 0.25 : visualMode > 0.7 ? 0.5 : 0.35;
  if (mat.uniforms.uBurst) mat.uniforms.uBurst.value = burstValue * burstMod;
  const hueBase = DECORATIVE_MODE ? 280 : lastVisual?.hue_base;
  if (mat.uniforms.uKeyHue) mat.uniforms.uKeyHue.value = hueBase != null ? hueBase / 360 : -1;
  if (mat.uniforms.uPercussiveMode) mat.uniforms.uPercussiveMode.value = DECORATIVE_MODE ? 0.5 : (lastVisual?.particle_mode_percussive ?? 0);
  if (mat.uniforms.uMelodicMode) mat.uniforms.uMelodicMode.value = DECORATIVE_MODE ? 0.5 : (lastVisual?.particle_mode_melodic ?? 0);
  if (mat.uniforms.uChromaStrength) mat.uniforms.uChromaStrength.value = DECORATIVE_MODE ? 0.3 : (lastVisual?.particle_chroma_strength ?? 0);
  if (mat.uniforms.uChromaHue) mat.uniforms.uChromaHue.value = DECORATIVE_MODE ? -1 : (lastVisual?.particle_chroma_hue ?? -1);
  if (mat.uniforms.uSharpness) mat.uniforms.uSharpness.value = DECORATIVE_MODE ? 0.5 : (lastSemantic?.sharpness ?? 0.5);
  if (mat.uniforms.uSpectralRichness) mat.uniforms.uSpectralRichness.value = DECORATIVE_MODE ? 0.5 : (lastSemantic?.spectral_richness ?? 0.5);
}

const LERP_BASE = 0.12;
let LERP = LERP_BASE;

const LAYER_TYPE_STR = { 0: 'organic', 0.5: 'hybrid', 1: 'mechanical' };

function blendLayerType(configLayerType) {
  const percussive = DECORATIVE_MODE ? 0.5 : (lastVisual?.particle_mode_percussive ?? 0);
  const melodic = DECORATIVE_MODE ? 0.5 : (lastVisual?.particle_mode_melodic ?? 0);
  let t = configLayerType;
  t = t + percussive * 0.4 * (1 - t);
  t = t - melodic * 0.35 * t;
  return Math.max(0, Math.min(1, t));
}

export function updateScene(semantic, visual, bandData) {
  if (semantic) lastSemantic = semantic;
  if (visual) lastVisual = visual;
  if (bandData) lastBandData = bandData;
  if (burstValue > 0) {
    burstValue = Math.max(0, burstValue - burstDecay);
  }
  if (!webglAvailable || !particleSystems.length) return;

  const e = DECORATIVE_MODE ? 0.5 : (lastSemantic?.energy_level ?? 0.5);
  const tension = DECORATIVE_MODE ? 0.5 : (lastSemantic?.harmonic_tension ?? 0.5);
  const b = DECORATIVE_MODE ? 0.5 : (lastSemantic?.timbral_brightness ?? 0.5);
  const motion = DECORATIVE_MODE ? 0.5 : (lastVisual?.motion_speed ?? 0.5);
  const particleFactor = DECORATIVE_MODE ? 0.85 : (lastVisual?.particle_density_factor ?? 1);

  const bandPeak = DECORATIVE_MODE ? 0.33 : Math.max(lastBandData.bass ?? 0, lastBandData.mids ?? 0, lastBandData.highs ?? 0);
  LERP = DECORATIVE_MODE ? LERP_BASE * 0.9 : (LERP_BASE * (0.7 + motion * 0.6) + bandPeak * 0.08);

  const hasOrganicBg = typeof document !== 'undefined' && document.getElementById('organic-bg');
  const spreadScale = DECORATIVE_MODE ? 0.9 : Math.max(0.5, Math.min(1.5, 0.6 + e * 0.5 - tension * 0.5));

  if (useShaderMaterial) {
    const particleScale = (waveMesh ? 0.65 : 1) * (hasOrganicBg ? 1.2 : 1);
    const sizeFactor = (lastVisual?.particle_size_factor ?? 1) * spreadScale;
    const densityBoost = lastVisual?.particle_density_boost ?? 0;
    particleSystems.forEach((ps) => {
      if (ps.mat.uniforms?.uBaseOpacity) {
        ps.mat.uniforms.uBaseOpacity.value = ps.config.baseOpacity * particleScale * (1 + densityBoost * 0.2);
      }
      const effectiveLayerType = blendLayerType(ps.config.layerType);
      updateUniforms(ps.mat, sizeFactor, effectiveLayerType);
    });
  }

  // Modelo de ondas — decorativo, valores fijos
  if (waveMaterial) {
    const bass = DECORATIVE_MODE ? 0.33 : (lastBandData?.bass ?? 0.33);
    const mids = DECORATIVE_MODE ? 0.33 : (lastBandData?.mids ?? 0.33);
    const highs = DECORATIVE_MODE ? 0.33 : (lastBandData?.highs ?? 0.33);
    const hue = (280 + (b - 0.5) * 90) / 360;
    const waveOpacity = hasOrganicBg ? 0.18 + e * 0.2 : 0.25 + e * 0.25;
    waveMaterial.uniforms.uTime.value = Date.now() * 0.001 * (DECORATIVE_MODE ? 0.35 : settings.motionIntensity);
    waveMaterial.uniforms.uEnergy.value = e;
    waveMaterial.uniforms.uBass.value = bass;
    waveMaterial.uniforms.uMids.value = mids;
    waveMaterial.uniforms.uHighs.value = highs;
    waveMaterial.uniforms.uAmplitude.value = DECORATIVE_MODE ? 0.4 : (0.35 + e * 0.35);
    waveMaterial.uniforms.uHue.value = hue;
    waveMaterial.uniforms.uSaturation.value = 0.5 + tension * 0.3;
    waveMaterial.uniforms.uOpacity.value = DECORATIVE_MODE ? 0.35 : waveOpacity;
  }

  if (chromaticPass) {
    chromaticPass.uniforms.strength.value = DECORATIVE_MODE ? 0.002 : (0.001 + (e * 0.004) + (tension * 0.002));
  }
  if (vignettePass) {
    vignettePass.uniforms.darkness.value = DECORATIVE_MODE ? 0.4 : (0.3 + (lastSemantic?.rhythmic_pressure ?? 0.5) * 0.25);
  }
  if (distortionPass) {
    distortionPass.uniforms.time.value = Date.now() * 0.001;
    distortionPass.uniforms.bass.value = DECORATIVE_MODE ? 0.33 : (lastBandData?.bass ?? 0.33);
    distortionPass.uniforms.amount.value = DECORATIVE_MODE ? 0.006 : (0.003 + (lastBandData?.bass ?? 0.33) * 0.012);
  }

  if (!useShaderMaterial) {
    const bass = DECORATIVE_MODE ? 0.33 : (lastBandData?.bass ?? 0.33);
    const mids = DECORATIVE_MODE ? 0.33 : (lastBandData?.mids ?? 0.33);
    const highs = DECORATIVE_MODE ? 0.33 : (lastBandData?.highs ?? 0.33);
    const sizeFactor = lastVisual?.particle_size_factor ?? 1;
    const sizeScale = (0.85 + e * 0.65) * sizeFactor;

    particleSystems.forEach((ps) => {
      const bandDrive = ps.config.band === 'bass' ? bass : ps.config.band === 'highs' ? highs : mids;
      const baseOpacity = ps.config.baseOpacity * (0.4 + bandDrive * 0.6) * particleFactor;
      ps.mat.opacity += (baseOpacity - ps.mat.opacity) * LERP;
      ps.mat.size += (ps.config.baseSize * 2 * sizeScale - ps.mat.size) * LERP;
      const effectiveType = blendLayerType(ps.config.layerType);
      const layerStr = effectiveType < 0.3 ? 'organic' : effectiveType > 0.7 ? 'mechanical' : 'hybrid';
      updateLayerCPU(ps.geom, ps.orig, spreadScale, layerStr);
    });
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);
  if (!isPageVisible()) return;
  updateScene();
  if (webglAvailable && scene && camera) {
    if (composer) composer.render();
    else if (renderer) renderer.render(scene, camera);
  }
}

export function startRenderLoop() {
  animate();
}

/** Burst radial en partículas (desactivado en modo decorativo) */
export function triggerParticleBurst() {
  if (DECORATIVE_MODE) return;
  burstValue = 0.6;
  const visualMode = lastVisual?.visual_mode ?? 0.5;
  burstDecay = visualMode < 0.3 ? 0.18 : visualMode > 0.7 ? 0.35 : 0.25;
}

export function stopRenderLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

export function dispose() {
  stopRenderLoop();
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    if (resizeHandler._timer) clearTimeout(resizeHandler._timer);
    resizeHandler = null;
  }
  if (webglAvailable && scene) {
    particleSystems.forEach((ps) => {
      scene.remove(ps.mesh);
      ps.geom?.dispose();
      ps.mat?.dispose();
    });
    particleSystems = [];
    if (renderer?.domElement?.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
    composer = null;
    bloomPass = null;
    renderer?.dispose();
  }
  if (fallbackEl?.parentElement) fallbackEl.parentElement.removeChild(fallbackEl);
  fallbackEl = null;
}
