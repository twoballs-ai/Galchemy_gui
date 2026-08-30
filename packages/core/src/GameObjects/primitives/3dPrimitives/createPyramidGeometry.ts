export function createPyramidGeometry(baseSize = 1, height = 1) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const texCoords: number[] = [];

  const halfBase = baseSize / 2;

  // Вершины пирамиды
  // 0-3: основание (квадрат)
  // 4: вершина
  positions.push(
    // Основание (против часовой стрелки, если смотреть снизу)
    -halfBase, -height / 2, -halfBase,  // 0
     halfBase, -height / 2, -halfBase,  // 1
     halfBase, -height / 2,  halfBase,  // 2
    -halfBase, -height / 2,  halfBase,  // 3
    // Вершина
    0, height / 2, 0                     // 4
  );

  // Нормали для основания (вниз)
  normals.push(0, -1, 0);
  normals.push(0, -1, 0);
  normals.push(0, -1, 0);
  normals.push(0, -1, 0);

  // Вычисляем нормали для боковых граней
  const sideNormalLen = Math.sqrt(height * height + halfBase * halfBase);
  const frontNormal = [0, halfBase / sideNormalLen, height / sideNormalLen];
  const backNormal = [0, halfBase / sideNormalLen, -height / sideNormalLen];
  const rightNormal = [height / sideNormalLen, halfBase / sideNormalLen, 0];
  const leftNormal = [-height / sideNormalLen, halfBase / sideNormalLen, 0];

  normals.push(...frontNormal);   // 5 - передняя грань
  normals.push(...backNormal);    // 6 - задняя грань
  normals.push(...rightNormal);   // 7 - правая грань
  normals.push(...leftNormal);    // 8 - левая грань

  // Текстурные координаты
  texCoords.push(0, 1, 1, 1, 1, 0, 0, 0); // Основание
  texCoords.push(0.5, 0, 0, 1, 1, 1);     // Передняя грань
  texCoords.push(0.5, 0, 0, 1, 1, 1);     // Задняя грань
  texCoords.push(0.5, 0, 0, 1, 1, 1);     // Правая грань
  texCoords.push(0.5, 0, 0, 1, 1, 1);     // Левая грань

  // Индексы
  // Основание (два треугольника)
  indices.push(0, 2, 1, 0, 3, 2);

  // Боковые грани
  indices.push(
    // Передняя грань (вершины 3, 2, 4)
    3, 2, 4,
    // Правая грань (вершины 1, 2, 4)
    1, 2, 4,
    // Задняя грань (вершины 0, 1, 4)
    0, 1, 4,
    // Левая грань (вершины 3, 0, 4)
    3, 0, 4
  );

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    texCoords: new Float32Array(texCoords),
  };
}
