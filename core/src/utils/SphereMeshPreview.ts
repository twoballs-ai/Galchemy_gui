export interface SphereMesh {
  vao: WebGLVertexArrayObject;
  indexCount: number;
  render: (gl: WebGL2RenderingContext, program: WebGLProgram) => void;
}
export function createSphereMesh(
  radius: number,
  segments: number,
  rings: number,
  gl: WebGL2RenderingContext
): SphereMesh {

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= rings; y++) {
    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const v = y / rings;
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;
      const sx = Math.cos(theta) * Math.sin(phi);
      const sy = Math.sin(phi - Math.PI / 2); // <= критическая строчка!
      const sz = Math.sin(theta) * Math.sin(phi);
      positions.push(sx * radius, sy * radius, sz * radius);
      normals.push(sx, sy, sz);
      uvs.push(u, v);
    }
  }
  for (let y = 0; y < rings; y++) {
    for (let x = 0; x < segments; x++) {
      const i = y * (segments + 1) + x;
indices.push(i, i + segments + 1, i + 1);
indices.push(i + 1, i + segments + 1, i + segments + 2);
    }
  }


  // VAO/VBO/IBO
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  // Positions
  const vboPos = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vboPos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  // Normals
  const vboNorm = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vboNorm);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // UVs
  const vboUV = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vboUV);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

  // Indices
  const ibo = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.bindVertexArray(null);

const indexCount = indices.length;
return {
  vao,
  indexCount,
  render: (gl: WebGL2RenderingContext, program: WebGLProgram) => {
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
};
}
