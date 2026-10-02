// Twinkling point stars. Size is in screen pixels (no distance attenuation),
// so stars stay crisp pin-pricks at any camera position.
uniform float uTime;
uniform float uPixelRatio;

attribute float aSize;
attribute float aSeed;
attribute vec3 aColor;

varying vec3 vColor;
varying float vBright;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;

  // Each star twinkles at its own rate and phase; most only subtly.
  float rate = 0.4 + aSeed * 1.8;
  float depth = 0.15 + 0.35 * step(0.85, fract(aSeed * 13.7));
  float tw = 1.0 - depth + depth * sin(uTime * rate + aSeed * 61.0);

  vColor = aColor;
  vBright = tw;
  gl_PointSize = aSize * uPixelRatio * (0.8 + 0.25 * tw);
}
