// Animated solar surface: domain-warped plasma, fine granulation and limb darkening.
// Output is HDR (> 1) so the bloom pass picks it up.
uniform float uTime;
uniform float uIntensity;

varying vec3 vObjPos;
varying vec3 vNormalW;
varying vec3 vPosW;

// #include noise.glsl (prepended in JS)

void main() {
  vec3 p = vObjPos * 2.4;
  float t = uTime;

  // Domain warp: noise displaced by noise gives the slow, swirling convection look.
  vec3 q = vec3(
    fbm3(p + vec3(0.0, t * 0.035, 0.0)),
    fbm3(p + vec3(5.2, 1.3, 2.8) - t * 0.025),
    0.0
  );
  float plasma = fbm4(p * 1.4 + q * 2.0 + vec3(0.0, 0.0, t * 0.02));

  // Granulation: small bright cells with dark lanes.
  float gran = 1.0 - abs(snoise(vObjPos * 34.0 + t * 0.22));
  gran = pow(gran, 3.0);

  float heat = clamp(0.45 + plasma * 0.95 + gran * 0.18, 0.0, 1.0);

  vec3 deep = vec3(0.55, 0.08, 0.0);
  vec3 mid = vec3(1.0, 0.36, 0.03);
  vec3 hot = vec3(1.0, 0.74, 0.32);
  vec3 col = mix(deep, mid, smoothstep(0.15, 0.6, heat));
  col = mix(col, hot, smoothstep(0.55, 0.95, heat));

  // Limb darkening: the edge of a star is cooler and dimmer than its centre.
  vec3 V = normalize(cameraPosition - vPosW);
  float mu = clamp(dot(normalize(vNormalW), V), 0.0, 1.0);
  col *= mix(0.45, 1.0, pow(mu, 0.5));
  // Faint warm rim where the corona takes over.
  col += vec3(1.0, 0.45, 0.1) * pow(1.0 - mu, 4.0) * 0.2;

  gl_FragColor = vec4(col * uIntensity, 1.0);
  #include <colorspace_fragment>
}
