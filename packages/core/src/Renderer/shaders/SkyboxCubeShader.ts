/* Вершина */
export const skyboxVertex = `#version 300 es
precision mediump float;
layout(location=0) in vec3 aPos;
uniform mat4 uProj, uViewNoTrans;
out vec3 vDir;
void main(){
  vDir = (uViewNoTrans * vec4(aPos,0.0)).xyz;
  gl_Position = uProj * vec4(aPos*1000.0,1.0);
}`;

/* Фрагмент */
export const skyboxFragmentCube = `#version 300 es
precision mediump float;
in  vec3 vDir;
uniform samplerCube uSkyCube;
out vec4 fragColor;
void main(){ fragColor = texture(uSkyCube, normalize(vDir)); }`;
