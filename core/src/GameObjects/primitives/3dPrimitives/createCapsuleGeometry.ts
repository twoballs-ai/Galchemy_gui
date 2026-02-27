export function createCapsuleGeometry(
  radius = 1,
  cylinderHeight = 2,
  segments = 16
) {
  const positions: number[] = [];
  const normals: number[]   = [];
  const indices: number[]   = [];
  const texCoords: number[] = [];

  // 1) Полусфера сверху (центр в y = +cylinderHeight/2)
  //    т. е. от полярного угла θ=0 до θ=π/2
  for (let y = 0; y <= segments / 2; y++) {
    const v = y / segments;            // v ∈ [0, 0.5]
    const theta = v * Math.PI;         // θ ∈ [0, π/2]
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let x = 0; x <= segments; x++) {
      const u = x / segments;          // u ∈ [0, 1]
      const phi = u * Math.PI * 2;     // φ ∈ [0, 2π]
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      // точка на полусфере радиуса=radius, поднятой вверх на cylinderHeight/2:
      const px = radius * cosPhi * sinTheta;
      const py = radius * cosTheta + cylinderHeight / 2;
      const pz = radius * sinPhi * sinTheta;
      positions.push(px, py, pz);

      // нормаль = нормализованный вектор (px, py - (cylinderHeight/2), pz)
      const ny = py - cylinderHeight / 2;
      const len = Math.hypot(px, ny, pz);
      normals.push(px / len, ny / len, pz / len);

      // текстурные координаты (не критично для helper-капсулы)
      texCoords.push(u, 1 - v);
    }
  }

  // 2) Цилиндрическая часть (на высоте от y = +cylinderHeight/2 до y = −cylinderHeight/2)
  //    Здесь мы просто берем «кольцо» на θ=π/2 и опускаем его вниз.
  const hemiVertexCount = (segments / 2 + 1) * (segments + 1);
  for (let y = 0; y <= 1; y++) {
    const tY = 1 - 2 * y;             // tY = +1 (вверху) или −1 (внизу)
    const worldY = (cylinderHeight / 2) * tY;
    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const phi = u * Math.PI * 2;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const px = radius * cosPhi;
      const py = worldY;
      const pz = radius * sinPhi;
      positions.push(px, py, pz);

      // нормаль для боковой поверхности цилиндра
      normals.push(cosPhi, 0, sinPhi);

      texCoords.push(u, y); // y=0 (сверху цилиндра) или y=1 (снизу)
    }
  }

  // 3) Полусфера снизу (центр в y = −cylinderHeight/2), θ ∈ [π/2, π]
  for (let y = 0; y <= segments / 2; y++) {
    const v = y / segments;            // v ∈ [0, 0.5]
    const theta = Math.PI - v * Math.PI; // θ ∈ [π, π/2]
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const phi = u * Math.PI * 2;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      // точка на полусфере радиуса=radius, опущенной вниз на cylinderHeight/2:
      const px = radius * cosPhi * sinTheta;
      const py = radius * cosTheta - cylinderHeight / 2;
      const pz = radius * sinPhi * sinTheta;
      positions.push(px, py, pz);

      // нормаль = нормализованный вектор (px, py + (cylinderHeight/2), pz)
      const ny = py + cylinderHeight / 2;
      const len = Math.hypot(px, ny, pz);
      normals.push(px / len, ny / len, pz / len);

      texCoords.push(u, v);
    }
  }

  // Считаем, сколько вершин в каждой из трёх частей:
  const topSphereCount   = (segments / 2 + 1) * (segments + 1);
  const cylinderRingCount = 2 * (segments + 1);
  const bottomSphereCount = topSphereCount;

  // 4) Индексы для полусферы сверху:
  //    мы идём по «рёбрам» двух вложенных полукругов (каждое кольцо — segments+1 вершин).
  for (let y = 0; y < segments / 2; y++) {
    for (let x = 0; x < segments; x++) {
      const row1 = y * (segments + 1) + x;
      const row2 = row1 + (segments + 1);
      indices.push(
        row1, row2,     row1 + 1,
        row2, row2 + 1, row1 + 1
      );
    }
  }

  // 5) Индексы для цилиндра:
  //    верхнее кольцо цилиндра начинается сразу после вершин верхней полусферы:
  const cylStart = topSphereCount;
  for (let x = 0; x < segments; x++) {
    const topIdx    = cylStart + x;
    const bottomIdx = cylStart + x + (segments + 1);
    indices.push(
      topIdx, bottomIdx,   topIdx + 1,
      bottomIdx, bottomIdx + 1, topIdx + 1
    );
  }

  // 6) Индексы для полусферы снизу:
  const bottomStart = topSphereCount + cylinderRingCount;
  for (let y = 0; y < segments / 2; y++) {
    for (let x = 0; x < segments; x++) {
      const row1 = bottomStart + y * (segments + 1) + x;
      const row2 = row1 + (segments + 1);
      indices.push(
        row1,     row2,      row1 + 1,
        row2,     row2 + 1,  row1 + 1
      );
    }
  }

  return {
    positions: new Float32Array(positions),
    normals:   new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
    indices:   new Uint16Array(indices),
  };
}
