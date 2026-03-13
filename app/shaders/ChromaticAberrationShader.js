/**
 * Chromatic Aberration — separación cromática radial
 * strength: 0 = sin efecto, 1 = máximo
 */
export const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.003 },
    offset: { value: 0.5 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform float offset;

    varying vec2 vUv;

    void main() {
      vec2 uv = vUv - offset;
      float dist = length(uv);
      vec2 dir = dist > 0.001 ? normalize(uv) : vec2(0.0, 0.0);

      float s = strength * dist;
      float r = texture2D(tDiffuse, vUv + dir * s).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - dir * s).b;

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};
