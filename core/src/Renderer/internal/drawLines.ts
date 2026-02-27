import { mat4 } from 'gl-matrix';
import type { WebGLRenderer } from '../renderers/WebGLRenderer';
import {
  AXIS_X_COLOR,
  AXIS_Y_COLOR,
  AXIS_Z_COLOR,
  SELECTION_COLOR
} from '../../constants/CoordSystem';

const COLORS = {
  x: AXIS_X_COLOR,
  y: AXIS_Y_COLOR,
  z: AXIS_Z_COLOR,
  selection: SELECTION_COLOR
};

/**
 * Универсальный рендерер линий. Если передан ctx — использует plainShaderProgram.
 */
export function drawLines(
  gl: WebGL2RenderingContext,
  attribLoc: number,
  colorLoc: WebGLUniformLocation,
  vertices: Float32Array,
  color: [number, number, number, number] | keyof typeof COLORS,
  ctx?: WebGLRenderer,
  modelMat: mat4 = mat4.create()
) {
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const resolvedColor =
    typeof color === 'string' ? COLORS[color] : color;

  if (ctx) {
    gl.useProgram(ctx.plainShaderProgram);
    gl.vertexAttribPointer(ctx.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(ctx.aPos);

    gl.uniformMatrix4fv(ctx.plain_uModel, false, modelMat);
    gl.uniformMatrix4fv(ctx.plain_uView, false, ctx.activeCamera.getView());
    gl.uniformMatrix4fv(ctx.plain_uProj, false, ctx.activeCamera.getProjection());
    gl.uniform4fv(ctx.plain_uColor, resolvedColor);
  } else {
    gl.vertexAttribPointer(attribLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribLoc);
    gl.uniform4fv(colorLoc, resolvedColor);
  }

  gl.drawArrays(gl.LINES, 0, vertices.length / 3);
  gl.deleteBuffer(buf);
}
