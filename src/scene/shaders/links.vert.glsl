attribute float aT; // 0 at the tool, 1 at the project's moon
varying float vT;

void main() {
  vT = aT;
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
}
