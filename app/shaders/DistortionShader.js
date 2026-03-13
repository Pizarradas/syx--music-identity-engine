/**
 * Distorsión reactiva — ondulación tipo fluido/calor
 * amount: 0 = sin efecto, 0.02+ = visible
 * bass: modula la intensidad
 */
export const DistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.008 },
    time: { value: 0 },
    bass: { value: 0.33 },
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
    uniform float amount;
    uniform float time;
    uniform float bass;

    varying vec2 vUv;

    void main() {
      vec2 uv = vUv - 0.5;
      float dist = length(uv);
      float wave = sin(dist * 20.0 - time * 3.0) * 0.5 + 0.5;
      float amp = amount * (0.5 + bass * 1.5) * (1.0 + wave * 0.5);
      vec2 offset = normalize(uv) * amp * sin(time * 2.0 + dist * 8.0);
      vec4 texel = texture2D(tDiffuse, vUv + offset);
      gl_FragColor = texel;
    }
  `,
};
