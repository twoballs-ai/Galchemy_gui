export function createConeGeometry(
  radius = 1,
  height = 2,
  segments = 32
) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const texCoords: number[] = [];

  // Вершина конуса
  const topIndex = 0;
  positions.push(0, height / 2, 0);
  normals.push(0, 1, 0);
  texCoords.push(0.5, 0);

  // Основание и боковая поверхность
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = -height / 2;

    positions.push(x, y, z);
    texCoords.push(i / segments, 1);

    // Нормаль для боковой поверхности
    const nx = Math.cos(t);
    const nz = Math.sin(t);
    const ny = radius / height;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    normals.push(nx / len, ny / len, nz / len);

    if (i < segments) {
      const currentVertex = i + 1;
      const nextVertex = i + 2;
      // Боковая поверхность
      indices.push(topIndex, currentVertex, nextVertex);
    }
  }

  // Крышка основания
  const baseCenterIndex = positions.length / 3;
  positions.push(0, -height / 2, 0);
  normals.push(0, -1, 0);
  texCoords.push(0.5, 0.5);

  for (let i = 0; i < segments; i++) {
    const currentVertex = i + 1;
    const nextVertex = ((i + 1) % segments) + 1;
    // Основание (треугольники от центра)
    indices.push(baseCenterIndex, currentVertex, nextVertex);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    texCoords: new Float32Array(texCoords),
  };
}
