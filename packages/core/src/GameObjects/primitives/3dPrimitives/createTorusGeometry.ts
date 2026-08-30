export function createTorusGeometry(
  outerRadius = 1,
  innerRadius = 0.3,
  segmentsOuter = 32,
  segmentsInner = 16
) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const texCoords: number[] = [];

  for (let i = 0; i <= segmentsOuter; i++) {
    const u = i / segmentsOuter;
    const theta = u * Math.PI * 2;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let j = 0; j <= segmentsInner; j++) {
      const v = j / segmentsInner;
      const phi = v * Math.PI * 2;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      // Позиция точки на торе
      const px = (outerRadius + innerRadius * cosPhi) * cosTheta;
      const py = innerRadius * sinPhi;
      const pz = (outerRadius + innerRadius * cosPhi) * sinTheta;

      positions.push(px, py, pz);

      // Нормаль направлена от центра трубы
      const nx = cosPhi * cosTheta;
      const ny = sinPhi;
      const nz = cosPhi * sinTheta;
      normals.push(nx, ny, nz);

      // Текстурные координаты
      texCoords.push(u, v);
    }
  }

  // Индексы для треугольников
  for (let i = 0; i < segmentsOuter; i++) {
    for (let j = 0; j < segmentsInner; j++) {
      const current = i * (segmentsInner + 1) + j;
      const nextRow = ((i + 1) % (segmentsOuter + 1)) * (segmentsInner + 1) + j;
      const nextCol = i * (segmentsInner + 1) + ((j + 1) % (segmentsInner + 1));
      const nextBoth = ((i + 1) % (segmentsOuter + 1)) * (segmentsInner + 1) + ((j + 1) % (segmentsInner + 1));

      indices.push(current, nextRow, nextCol);
      indices.push(nextCol, nextRow, nextBoth);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    texCoords: new Float32Array(texCoords),
  };
}
