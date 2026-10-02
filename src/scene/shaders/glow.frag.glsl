// Soft fresnel glow on a shell around a small body (moons, skill rocks).
uniform vec3 uColor;
uniform float uStrength;

varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 V = normalize(cameraPosition - vPosW);
  float f = pow(1.0 - abs(dot(normalize(vNormalW), V)), 3.0);
  gl_FragColor = vec4(uColor * f * uStrength, 1.0);
  #include <colorspace_fragment>
}
