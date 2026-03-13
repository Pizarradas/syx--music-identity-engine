/**
 * Fragment shader — partícula suave con color HSL
 */
varying vec3 vColor;
varying float vAlpha;

void main() {
  float dist = length(gl_PointCoord - 0.5) * 2.0;
  float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
  alpha *= vAlpha;

  vec3 rgb;
  float h = vColor.x;
  float s = vColor.y;
  float l = vColor.z;
  vec3 c = vec3(abs(h * 6.0 - 3.0) - 1.0, 2.0 - abs(h * 6.0 - 2.0), 2.0 - abs(h * 6.0 - 4.0));
  c = clamp(c, 0.0, 1.0);
  rgb = l + s * (c - 0.5) * (1.0 - abs(2.0 * l - 1.0));

  gl_FragColor = vec4(rgb, alpha);
}
