// Planet surface lit by the Sun at the world origin.
// Optional features via defines:
//   EARTH  — night lights, clouds (with cloud shadows) and ocean specular
//   RINGS  — analytic shadow of the ring system on the planet (Saturn)
uniform sampler2D uMap;
uniform vec3 uAtmoColor;
uniform float uAtmoStrength;
uniform float uSunIntensity;
uniform float uAmbient;

#ifdef EARTH
uniform sampler2D uNight;
uniform sampler2D uClouds;
uniform sampler2D uSpecular;
uniform float uCloudOffset;
#endif

#ifdef RINGS
uniform sampler2D uRingMap;
uniform vec3 uCenter;
uniform vec3 uRingNormal;
uniform float uRadius;
uniform vec2 uRingRange; // inner, outer (in planet radii)
#endif

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(-vPosW); // the Sun sits at the origin
  vec3 V = normalize(cameraPosition - vPosW);
  float ndl = dot(N, L);

  // Slightly soft terminator, like light scattering through a thin atmosphere.
  float light = smoothstep(-0.05, 0.25, ndl) * max(ndl, 0.0) * 0.35 + max(ndl, 0.0) * 0.65;

  vec3 albedo = texture2D(uMap, vUv).rgb;

  #ifdef EARTH
    vec2 cloudUv = vUv + vec2(uCloudOffset, 0.0);
    float cloud = texture2D(uClouds, cloudUv).r;
    // Cloud shadow: sample the clouds slightly towards the Sun.
    float cloudShadow = texture2D(uClouds, cloudUv + vec2(0.0015, 0.0)).r;
    albedo *= 1.0 - cloudShadow * 0.45 * (1.0 - cloud);
    albedo = mix(albedo, vec3(0.95), cloud * 0.92);
  #endif

  vec3 col = albedo * (light * uSunIntensity + uAmbient);

  #ifdef RINGS
  {
    // Ray from this point toward the Sun; where it crosses the ring plane, read the ring's opacity.
    float denom = dot(L, uRingNormal);
    if (abs(denom) > 1e-4) {
      float t = dot(uCenter - vPosW, uRingNormal) / denom;
      if (t > 0.0) {
        float r = length(vPosW + L * t - uCenter) / uRadius;
        float u = (r - uRingRange.x) / (uRingRange.y - uRingRange.x);
        if (u > 0.0 && u < 1.0) col *= 1.0 - texture2D(uRingMap, vec2(u, 0.5)).a * 0.85;
      }
    }
  }
  #endif

  #ifdef EARTH
    // City lights on the night side, hidden by clouds.
    float night = 1.0 - smoothstep(-0.18, 0.08, ndl);
    col += texture2D(uNight, vUv).rgb * night * (1.0 - cloud) * vec3(1.0, 0.82, 0.58) * 1.6;
    // Sun glint on oceans.
    float spec = texture2D(uSpecular, vUv).r;
    vec3 H = normalize(L + V);
    col += vec3(1.0, 0.92, 0.8) * pow(max(dot(N, H), 0.0), 160.0) * spec * (1.0 - cloud) * max(ndl, 0.0) * 0.55;
  #endif

  // Atmospheric rim, only where sunlight reaches.
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += uAtmoColor * fres * uAtmoStrength * smoothstep(-0.25, 0.4, ndl);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
