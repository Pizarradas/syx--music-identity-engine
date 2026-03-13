/**
 * Fragment shader — ondas con color por elevación
 */
uniform float uHue;
uniform float uSaturation;
uniform float uEnergy;
uniform float uOpacity;

varying float vElevation;
varying vec2 vUv;

void main() {
  float n = (vElevation + 1.0) * 0.5;
  float alpha = 0.25 + uEnergy * 0.45 + n * 0.25;
  alpha *= uOpacity;

  float h = uHue + n * 0.05;
  float s = uSaturation;
  float l = 0.5 + n * 0.15;

  vec3 c = vec3(abs(h * 6.0 - 3.0) - 1.0, 2.0 - abs(h * 6.0 - 2.0), 2.0 - abs(h * 6.0 - 4.0));
  c = clamp(c, 0.0, 1.0);
  vec3 rgb = l + s * (c - 0.5) * (1.0 - abs(2.0 * l - 1.0));

  gl_FragColor = vec4(rgb, alpha);
}
