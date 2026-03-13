/**
 * Vignette — oscurece los bordes
 * darkness: 0 = sin efecto, 1 = bordes negros
 * offset: 0 = vignette suave, 1 = más concentrado en centro
 */
export const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    darkness: { value: 0.5 },
    offset: { value: 1.0 },
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
    uniform float darkness;
    uniform float offset;

    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - 0.5) * 2.0;
      float dist = length(uv);
      float vignette = 1.0 - smoothstep(offset * 0.5, offset * 1.2, dist) * darkness;
      gl_FragColor = vec4(texel.rgb * vignette, texel.a);
    }
  `,
};
