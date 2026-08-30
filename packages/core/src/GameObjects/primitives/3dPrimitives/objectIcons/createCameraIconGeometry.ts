// src/core/primitives/3dPrimitives/createCameraIconGeometry.js
export function createCameraIconGeometry() {
  const positions = new Float32Array([
    0, 0, 0,        // Центр
    0, 0.5,  0.2,   // Вверх-вперёд
    0, 0.5, -0.2,   // Вверх-назад
    0.2, 0.5, 0,    // Вверх-вправо
   -0.2, 0.5, 0     // Вверх-влево
  ]);

  const indices = new Uint16Array([
    0, 1, 2, 0, 1, 3, 0, 1, 4,
    0, 2, 3, 0, 2, 4,
    0, 3, 4
  ]);

  return { positions, indices };
}