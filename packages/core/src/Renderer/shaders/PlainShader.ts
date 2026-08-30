// vertex shader
export const plainVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aVertexPosition;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aVertexPosition, 1.0);
}
`;

// fragment shader
export const plainFragmentShader = `#version 300 es
precision highp float;

uniform vec4 uColor;
out vec4 fragColor;

void main() {
  fragColor = uColor;
}
`;
