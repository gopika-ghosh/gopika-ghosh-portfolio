varying vec3 vColor;
varying float vBright;

void main() {
  // Soft round point with a tight core.
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.0, d);
  float a = core * core;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * vBright, a);
}
