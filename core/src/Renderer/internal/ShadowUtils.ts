/*  ShadowUtils.ts
    ----------------
    Полная копия трёх методов, которые раньше сидели внутри
    WebGLRenderer.  Никаких правок в логике не делали.
*/
import { mat4 } from "gl-matrix";

export function initShadowMap(ctx: any): void {
  const gl   = ctx.gl;
  const size = 2048;

  ctx.shadowTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, ctx.shadowTex);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24,
    size, size, 0,
    gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  ctx.shadowFBO = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.shadowFBO);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D, ctx.shadowTex, 0
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

export function initDepthProgram(ctx: any): void {
  const gl = ctx.gl;

  const depthVS = `
    attribute vec3 aVertexPosition;
    uniform   mat4 uModel;
    uniform   mat4 uLightVP;
    void main() {
      gl_Position = uLightVP * uModel * vec4(aVertexPosition, 1.0);
    }
  `;
  const depthFS = `precision mediump float; void main() { }`;

  const vs = ctx._loadShader(gl.VERTEX_SHADER, depthVS);
  const fs = ctx._loadShader(gl.FRAGMENT_SHADER, depthFS);

  ctx.depthProgram = gl.createProgram()!;
  gl.attachShader(ctx.depthProgram, vs);
  gl.attachShader(ctx.depthProgram, fs);
  gl.linkProgram (ctx.depthProgram);

  ctx.uDepthModel   = gl.getUniformLocation(ctx.depthProgram, "uModel")!;
  ctx.uDepthLightVP = gl.getUniformLocation(ctx.depthProgram, "uLightVP")!;
}

export function calcLightVP(light: any): mat4 {
  const view = mat4.create();
  const proj = mat4.create();
                               
    mat4.lookAt(view, light.position, [0, 0, 0], [0, 1, 0]); 

  const size = 10;
  mat4.ortho(proj, -size, size, -size, size, 0.1, 40);

  const vp = mat4.create();
  mat4.multiply(vp, proj, view);
  return vp;
}
