// A faint line that fades toward the moon, with bright pulses flowing along it.
uniform vec3 uColor;
uniform float uTime;
uniform float uOpacity;
varying float vT;

void main() {
  float base = 0.32 * (1.0 - vT * 0.55);
  float pulse = smoothstep(0.86, 1.0, fract(vT * 3.0 - uTime * 0.7));
  vec3 col = uColor * (base + pulse * 1.6) * uOpacity;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
