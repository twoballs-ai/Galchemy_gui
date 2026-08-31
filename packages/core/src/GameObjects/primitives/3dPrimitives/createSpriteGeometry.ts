import type { Mesh } from "../GameObject3D";

/**
 * Создаёт геометрию спрайта — плоский quad с текстурой.
 * Возвращает объект, совместимый с интерфейсом Mesh из GameObject3D.
 *
 * @param width  - ширина спрайта в мировых единицах
 * @param height - высота спрайта в мировых единицах
 * @param plane  - плоскость ориентации: 'xy' (фронт), 'xz' (пол), 'yz' (бок)
 */
export function createSpriteGeometry({
  width = 1,
  height = 1,
  plane = "xy" as "xy" | "xz" | "yz",
}: {
  width?: number;
  height?: number;
  plane?: "xy" | "xz" | "yz";
} = {}): Mesh {
  const hw = width / 2;
  const hh = height / 2;

  let positions: number[];
  let normals: number[];

  switch (plane) {
    case "xy":
      // Фронтальная плоскость (нормаль вдоль +Z).
      // Вершины идут против часовой стрелки, если смотреть из +Z.
      positions = [
        -hw, -hh, 0,   // 0: нижний-левый
         hw, -hh, 0,   // 1: нижний-правый
         hw,  hh, 0,   // 2: верхний-правый
        -hw,  hh, 0,   // 3: верхний-левый
      ];
      normals = [
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
      ];
      break;

    case "xz":
      // Горизонтальная плоскость / пол (нормаль вдоль +Y).
      positions = [
        -hw, 0, -hh,   // 0
         hw, 0, -hh,   // 1
         hw, 0,  hh,   // 2
        -hw, 0,  hh,   // 3
      ];
      normals = [
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
      ];
      break;

    case "yz":
      // Боковая плоскость (нормаль вдоль +X).
      positions = [
        0, -hh, -hw,   // 0
        0, -hh,  hw,   // 1
        0,  hh,  hw,   // 2
        0,  hh, -hw,   // 3
      ];
      normals = [
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
      ];
      break;
  }

  // UV-координаты: (0,1) = низ-лево, (1,0) = верх-право
  const texCoords = [
    0, 1,   // 0: нижний-левый
    1, 1,   // 1: нижний-правый
    1, 0,   // 2: верхний-правый
    0, 0,   // 3: верхний-левый
  ];

  // Двойной набор индексов: front face + back face.
  // Это делает спрайт видимым с обеих сторон даже без отключения culling.
  // Front face (CCW из стороны нормали):
  //   треугольник 1: 0, 1, 2
  //   треугольник 2: 0, 2, 3
  // Back face (CCW из обратной стороны):
  //   треугольник 1: 0, 2, 1
  //   треугольник 2: 0, 3, 2
  const indices = [
    0, 1, 2,   0, 2, 3,   // front
    0, 2, 1,   0, 3, 2,   // back
  ];

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices),
  };
}