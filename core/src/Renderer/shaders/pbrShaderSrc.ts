export function createPBRShaderProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vert = `#version 300 es
    precision mediump float;
    layout(location=0) in vec3 aPosition;
    layout(location=1) in vec3 aNormal;
    layout(location=2) in vec2 aUV;

    uniform mat4 uModel, uView, uProj;
    out vec3 vNormal, vPos;
    out vec2 vUV;

    void main() {
      vNormal = mat3(uModel) * aNormal;
      vPos = vec3(uModel * vec4(aPosition, 1.0));
      vUV = aUV;
      gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
    }`;

  const frag = `#version 300 es
    precision mediump float;
    in vec3 vNormal, vPos;
    in vec2 vUV;
    out vec4 outColor;

    uniform sampler2D uColorMap;
    uniform sampler2D uNormalMap;
    uniform sampler2D uRoughnessMap;
    uniform sampler2D uMetalnessMap;
    uniform float uMetallic, uRoughness;
    uniform vec3 uLightDir, uCameraPos;

    vec3 getNormal() {
      vec3 n = texture(uNormalMap, vUV).xyz * 2.0 - 1.0;
      return normalize(n);
    }

    void main() {
      vec3 N = getNormal();
      vec3 V = normalize(uCameraPos - vPos);
      vec3 L = normalize(uLightDir);

      vec3 baseColor = texture(uColorMap, vUV).rgb;
      float rough = texture(uRoughnessMap, vUV).r * uRoughness;
      float metal = texture(uMetalnessMap, vUV).r * uMetallic;

      // Cook-Torrance PBR (очень простая реализация)
      vec3 F0 = mix(vec3(0.04), baseColor, metal);
      vec3 H = normalize(L + V);
      float NDF = pow(max(dot(N, H), 0.0), 64.0/(rough*rough+1e-4));
      float G = 1.0;
      vec3 F = F0 + (1.0 - F0) * pow(1.0 - dot(H, V), 5.0);

      float NdotL = max(dot(N, L), 0.0);
      vec3 diffuse = (1.0 - metal) * baseColor / 3.1415;
      vec3 spec = NDF * G * F / max(4.0 * max(dot(N,V),0.01) * max(dot(N,L),0.01), 0.001);

      vec3 color    = (diffuse + spec) * NdotL;
      vec3 ambient  = baseColor * 0.15;          // +15 % «окружающего» света
      outColor = vec4( pow(color + ambient, vec3(1.0/2.2)), 1.0 );
    }`;

  function compile(src: string, type: number): WebGLShader {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh)!);
    }
    return sh;
  }

  const vs = compile(vert, gl.VERTEX_SHADER);
  const fs = compile(frag, gl.FRAGMENT_SHADER);

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program)!);
  }
  return program;
}
