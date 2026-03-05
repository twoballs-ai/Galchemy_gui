import { SELECTION_COLOR } from '../../constants/CoordSystem';

export function drawMeshOutline({
  gl,
  mesh,
  vertexBuffer,
  uniforms: { uUseTexture, uColor },
  attribs: { aPos, aTexCoord },
  state
}: {
  gl: WebGLRenderingContext,
  mesh: { indices: Uint16Array | Uint32Array },
  vertexBuffer: WebGLBuffer,
  uniforms: { uUseTexture: WebGLUniformLocation, uColor: WebGLUniformLocation },
  attribs: { aPos: number, aTexCoord: number },
  state: any
}) {
  const depthWasEnabled = gl.isEnabled(gl.DEPTH_TEST);

  gl.uniform1i(uUseTexture, false);
  gl.uniform4fv(uColor, SELECTION_COLOR);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPos);
  gl.disableVertexAttribArray(aTexCoord);

  if (!state._lineBuffer) {
    const tri = mesh.indices;
    const lines: number[] = [];
    for (let i = 0; i < tri.length; i += 3) {
      lines.push(tri[i], tri[i + 1], tri[i + 1], tri[i + 2], tri[i + 2], tri[i]);
    }

    const lineIdx = tri.BYTES_PER_ELEMENT === 2 ? new Uint16Array(lines) : new Uint32Array(lines);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineIdx, gl.STATIC_DRAW);

    state._lineBuffer = buf;
    state._lineCount = lineIdx.length;
    state._lineType = tri.BYTES_PER_ELEMENT === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
  } else {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state._lineBuffer);
  }

  // 1) обычная обводка по видимым рёбрам
  gl.drawElements(gl.LINES, state._lineCount, state._lineType, 0);

  // 2) X-Ray проход, чтобы были видны все грани/рёбра даже через меш
  gl.disable(gl.DEPTH_TEST);
  gl.uniform4fv(uColor, [SELECTION_COLOR[0], SELECTION_COLOR[1], SELECTION_COLOR[2], 0.35]);
  gl.drawElements(gl.LINES, state._lineCount, state._lineType, 0);

  if (depthWasEnabled) {
    gl.enable(gl.DEPTH_TEST);
  }
}
