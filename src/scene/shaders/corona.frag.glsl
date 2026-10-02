// Corona + glow on a camera-facing quad centred on the Sun.
// The Sun's sphere occludes the middle, so only the halo outside the disc shows.
uniform float uTime;
uniform float uScale; // quad half-size in Sun radii
uniform float uIntensity;

varying vec2 vUv;

// #include noise.glsl (prepended in JS)

void main() {
  vec2 c = (vUv - 0.5) * 2.0 * uScale; // in Sun radii
  float r = length(c);
  if (r < 0.98) discard;
  float a = atan(c.y, c.x);

  // Streamers: angular noise, drifting slowly outward.
  vec2 dir = vec2(cos(a), sin(a));
  float rays = fbm3(vec3(dir * 3.0, r * 0.35 - uTime * 0.04)) * 0.5 + 0.5;
  rays = mix(0.55, 1.35, smoothstep(0.25, 0.85, rays));

  float d = r - 1.0;
  float inner = exp(-d * 5.5);          // bright, tight edge
  float corona = exp(-d * 1.4) * rays;  // structured mid halo
  float haze = 0.3 / (1.0 + d * d * 2.5); // wide soft glow, visible from far away

  vec3 col = vec3(1.0, 0.62, 0.25) * inner * 1.6
           + vec3(1.0, 0.5, 0.18) * corona * 0.55
           + vec3(1.0, 0.55, 0.25) * haze * 0.35;

  // Fade to zero at the quad edge so it never shows a border.
  col *= smoothstep(uScale, uScale * 0.6, r);

  gl_FragColor = vec4(col * uIntensity, 1.0);
  #include <colorspace_fragment>
}
