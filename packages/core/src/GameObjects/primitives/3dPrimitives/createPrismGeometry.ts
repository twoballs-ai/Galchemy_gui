export function createPrismGeometry(
  width = 1,
  height = 1,
  depth = 1,
  segments = 6
) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const texCoords: number[] = [];

  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  // Создаем вершины для треугольной призмы
  // Передний треугольник
  const frontCenterY = halfH;
  // Задний треугольник
  const backCenterY = -halfH;

  // Вершины переднего треугольника
  positions.push(
    0, frontCenterY, halfD,      // 0 - вершина
    -halfW, backCenterY, halfD,  // 1 - левый нижний
     halfW, backCenterY, halfD   // 2 - правый нижний
  );

  // Вершины заднего треугольника
  positions.push(
    0, frontCenterY, -halfD,     // 3 - вершина
    -halfW, backCenterY, -halfD, // 4 - левый нижний
     halfW, backCenterY, -halfD  // 5 - правый нижний
  );

  // Нормали
  // Передний и задний треугольники
  for (let i = 0; i < 6; i++) {
    if (i < 3) {
      normals.push(0, 0, 1); // Передняя грань
    } else {
      normals.push(0, 0, -1); // Задняя грань
    }
  }

  // Боковые грани (нормали приближенные)
  const leftNormalLen = Math.sqrt(halfW * halfW + height * height);
  const rightNormalLen = leftNormalLen;
  
  // Левая грань
  normals.push(-height / leftNormalLen, halfW / leftNormalLen, 0);
  normals.push(-height / leftNormalLen, halfW / leftNormalLen, 0);
  normals.push(-height / leftNormalLen, halfW / leftNormalLen, 0);
  
  // Правая грань
  normals.push(height / rightNormalLen, halfW / rightNormalLen, 0);
  normals.push(height / rightNormalLen, halfW / rightNormalLen, 0);
  normals.push(height / rightNormalLen, halfW / rightNormalLen, 0);
  
  // Нижняя грань
  normals.push(0, -1, 0);
  normals.push(0, -1, 0);
  normals.push(0, -1, 0);
  normals.push(0, -1, 0);

  // Текстурные координаты (упрощенные)
  for (let i = 0; i < 6; i++) {
    texCoords.push((i % 3) / 3, i < 3 ? 0 : 1);
  }
  // Для боковых граней
  for (let i = 0; i < 12; i++) {
    texCoords.push((i % 4) / 4, Math.floor(i / 4));
  }

  // Индексы
  // Передний треугольник
  indices.push(0, 1, 2);
  // Задний треугольник
  indices.push(3, 5, 4);

  // Боковые прямоугольники (каждый из двух треугольников)
  // Левая грань (0, 1, 4, 3)
  indices.push(0, 1, 4, 0, 4, 3);
  // Правая грань (0, 2, 5, 3)
  indices.push(0, 5, 2, 0, 3, 5);
  // Нижняя грань (1, 2, 5, 4)
  indices.push(1, 5, 2, 1, 4, 5);

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    texCoords: new Float32Array(texCoords),
  };
}
