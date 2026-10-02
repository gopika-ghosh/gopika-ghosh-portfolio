uniform float uRadius;

varying float vR;
varying vec3 vPosW;
varying vec3 vNormalW;

void main() {
  // Distance from the planet centre in planet radii (RingGeometry lies in local XY).
  vR = length(position.xy) / uRadius;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
  gl_Position = projectionMatrix * viewMatrix * world;
}
