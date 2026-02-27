// src/Renderer/helpers/GizmoHelper.ts
import { mat4, vec3 } from "gl-matrix";
import type { WebGLRenderer } from "../renderers/WebGLRenderer";
import { drawLines } from "../internal/drawLines";
import { COORD } from "../../core/CoordinateSystem";
import { buildGizmoMatrix } from "./GizmoMatrix";

export function drawGizmo(ctx: WebGLRenderer): void {
  const { gl, aPos, uModel, uView, uProj, uColor, activeCamera } = ctx;
  if (!activeCamera) return;

  const LEN = 2.5, H = 0.35, W = 0.25;

  // 1) build the three axis shafts in X, Y, Z order
  const shafts: number[] = [];
  ([ COORD.RIGHT, COORD.UP, COORD.FORWARD ] as vec3[]).forEach(dir => {
    shafts.push(0,0,0, dir[0]*LEN, dir[1]*LEN, dir[2]*LEN);
  });
  const shaftBuf = new Float32Array(shafts);

  // 2) build the three arrowheads
  const heads: number[] = [];
  // X arrowhead orthogonal → Y
  // Y arrowhead orthogonal → X
  // Z arrowhead orthogonal → Y
  const orthos: vec3[] = [ COORD.UP, COORD.RIGHT, COORD.UP ];
  ([ COORD.RIGHT, COORD.UP, COORD.FORWARD ] as vec3[]).forEach((dir, i) => {
    const tip  = vec3.scale(vec3.create(), dir, LEN);
    const base = vec3.scale(vec3.create(), dir, LEN - H);
    const l    = vec3.scaleAndAdd(vec3.create(), base, orthos[i],  W);
    const r    = vec3.scaleAndAdd(vec3.create(), base, orthos[i], -W);
    heads.push(...tip, ...l, ...r);
  });
  const headsBuf = new Float32Array(heads);

  // 3) set up simple ortho and view
  const proj = mat4.create(), view = mat4.create();
  mat4.ortho(proj, -5,5, -5,5, -10,10);
  const model = buildGizmoMatrix(activeCamera);

  gl.useProgram(ctx.shaderProgram);
  gl.uniformMatrix4fv(uProj,  false, proj);
  gl.uniformMatrix4fv(uView,  false, view);
  gl.uniformMatrix4fv(uModel, false, model);
  gl.depthFunc(gl.ALWAYS);

  // 4) draw the shafts
  drawLines(gl, aPos, uColor, shaftBuf.subarray(  0,   6), COORD.AXIS_X_COLOR, ctx);
  drawLines(gl, aPos, uColor, shaftBuf.subarray(  6,  12), COORD.AXIS_Y_COLOR, ctx);
  drawLines(gl, aPos, uColor, shaftBuf.subarray( 12,  18), COORD.AXIS_Z_COLOR, ctx);

  // 5) draw the heads
  const drawHead = (off: number, color: number[]) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, headsBuf.subarray(off, off+9), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPos);
    gl.uniform4fv(uColor, color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.deleteBuffer(b);
  };
  drawHead(  0, COORD.AXIS_X_COLOR);
  drawHead(  9, COORD.AXIS_Y_COLOR);
  drawHead( 18, COORD.AXIS_Z_COLOR);

  gl.depthFunc(gl.LESS);
}
