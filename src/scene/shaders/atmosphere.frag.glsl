// Outer atmospheric halo, drawn on the back faces of a slightly larger shell.
// Brightest just outside the planet's silhouette, fading to nothing at the shell edge,
// and only on the side facing the Sun.
uniform vec3 uColor;
uniform float uStrength;
uniform float uEdge; // planet radius / shell radius, as seen through the shell

varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 toFrag = normalize(vPosW - cameraPosition);
  // 0 at the shell silhouette, rising toward the planet's limb.
  float e = clamp(dot(N, toFrag), 0.0, 1.0);
  float limb = sqrt(max(1.0 - uEdge * uEdge, 0.0));
  float glow = smoothstep(0.0, limb, e);
  glow = pow(glow, 1.6);

  float sun = smoothstep(-0.35, 0.55, dot(N, normalize(-vPosW)));
  gl_FragColor = vec4(uColor * glow * sun * uStrength, 1.0);
  #include <colorspace_fragment>
}
