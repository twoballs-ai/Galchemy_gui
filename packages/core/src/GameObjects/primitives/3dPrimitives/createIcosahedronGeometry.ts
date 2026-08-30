export function createIcosahedronGeometry(radius = 1) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const texCoords: number[] = [];

  // Золотое сечение
  const phi = (1 + Math.sqrt(5)) / 2;

  // 12 вершин икосаэдра
  const vertices = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];

  // Нормализуем и масштабируем вершины
  for (const v of vertices) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    positions.push((v[0] / len) * radius, (v[1] * radius) / len, (v[2] * radius) / len);
    normals.push(v[0] / len, v[1] / len, v[2] / len);
    // Простые текстурные координаты на основе сферической проекции
    const u = 0.5 + Math.atan2(v[2], v[0]) / (2 * Math.PI);
    const vCoord = 0.5 - Math.asin(v[1] / len) / Math.PI;
    texCoords.push(u, vCoord);
  }

  // 20 треугольных граней икосаэдра
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  for (const face of faces) {
    indices.push(face[0], face[1], face[2]);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    texCoords: new Float32Array(texCoords),
  };
}
