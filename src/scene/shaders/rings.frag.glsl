// Saturn's rings: radial texture lookup, the planet's shadow (analytic ray-sphere test),
// and a gentle forward-scattering glow when backlit.
uniform sampler2D uMap;
uniform vec3 uCenter;
uniform float uRadius;
uniform vec2 uRange; // inner, outer (planet radii)
uniform float uSunIntensity;

varying float vR;
varying vec3 vPosW;
varying vec3 vNormalW;

void main() {
  float u = (vR - uRange.x) / (uRange.y - uRange.x);
  if (u < 0.0 || u > 1.0) discard;
  vec4 tex = texture2D(uMap, vec2(u, 0.5));
  if (tex.a < 0.01) discard;

  vec3 L = normalize(-vPosW);
  vec3 V = normalize(cameraPosition - vPosW);
  vec3 N = normalize(vNormalW);

  // Planet shadow: does the ray toward the Sun hit the planet?
  vec3 oc = vPosW - uCenter;
  float b = dot(oc, L);
  float c = dot(oc, oc) - uRadius * uRadius;
  float h = b * b - c;
  float shadow = 1.0;
  if (h > 0.0 && b < 0.0) {
    // Soft edge using how deep the ray passes inside the sphere.
    shadow = 1.0 - smoothstep(0.0, uRadius * uRadius * 0.08, h);
    shadow = mix(0.06, 1.0, shadow);
  }

  // Lit face vs. seen through from the dark side.
  float sameSide = step(0.0, dot(N, L) * dot(N, V));
  float direct = 0.35 + 0.65 * abs(dot(N, L));
  float through = (1.0 - tex.a) * 0.6 + 0.15;
  float light = mix(through, direct, sameSide);
  // Forward scattering: rings glow when the Sun is behind them.
  light += pow(max(dot(-V, L), 0.0), 8.0) * 0.8;

  vec3 col = tex.rgb * light * shadow * uSunIntensity;
  gl_FragColor = vec4(col, tex.a * 0.95);
  #include <colorspace_fragment>
}
