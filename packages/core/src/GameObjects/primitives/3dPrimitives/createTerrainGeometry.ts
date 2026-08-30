// src/primitives/3dPrimitives/createTerrainGeometry.js
import { COORD } from '../../../core/CoordinateSystem.js';

export interface TerrainOptions {
  width?: number;
  depth?: number;
  seg?: number;
  /** heightFn(u, v) возвращает высоту вдоль COORD.UP */
  heightFn?: (u: number, v: number) => number;
  /** базисные векторы в плоскости «горизонта» */
  axisA?: [number, number, number];
  axisB?: [number, number, number];
}

/**
 * Генерирует плоскость террейна в базисе (axisA, axisB, UP).
 */
export function createTerrainGeometry({
  width    = 10,
  depth    = 10,
  seg      = 64,
  heightFn = () => 0,
  axisA    = COORD.RIGHT,
  axisB    = COORD.FORWARD
}: TerrainOptions = {}) {

  const positions: number[] = [];
  const normals:   number[] = [];
  const texCoords: number[] = [];
  const indices:   number[] = [];

  const cols = seg + 1;
  const rows = seg + 1;

  // 1) Построим вершины
  for (let j = 0; j < rows; j++) {
    const v = j / seg;
    const coordV = (v - 0.5) * depth;

    for (let i = 0; i < cols; i++) {
      const u = i / seg;
      const coordU = (u - 0.5) * width;
      const h = heightFn(coordU, coordV);

      // P = axisA * coordU + axisB * coordV + UP * h
      positions.push(
        axisA[0] * coordU + axisB[0] * coordV + COORD.UP[0] * h,
        axisA[1] * coordU + axisB[1] * coordV + COORD.UP[1] * h,
        axisA[2] * coordU + axisB[2] * coordV + COORD.UP[2] * h
      );
      texCoords.push(u, 1 - v);
      // временный нормаль, пересчитаем ниже
      normals.push(0, 0, 0);
    }
  }

  // 2) Индексы треугольников
  for (let j = 0; j < seg; j++) {
    for (let i = 0; i < seg; i++) {
      const idx = j * cols + i;
      indices.push(
        idx, idx + 1,     idx + cols,
        idx + 1, idx + cols + 1, idx + cols
      );
    }
  }

  // 3) Пересчёт нормалей по площадям соседних треугольников
  // обнулим сначала
  for (let k = 0; k < normals.length; k++) normals[k] = 0;

  for (let k = 0; k < indices.length; k += 3) {
    const i0 = indices[k + 0] * 3;
    const i1 = indices[k + 1] * 3;
    const i2 = indices[k + 2] * 3;

    // три вершины треугольника
    const v0 = positions.slice(i0, i0 + 3) as [number,number,number];
    const v1 = positions.slice(i1, i1 + 3) as [number,number,number];
    const v2 = positions.slice(i2, i2 + 3) as [number,number,number];

    // нормаль = (v1 - v0) × (v2 - v0)
   const ux = v2[0] - v0[0], uy = v2[1] - v0[1], uz = v2[2] - v0[2];
   const vx = v1[0] - v0[0], vy = v1[1] - v0[1], vz = v1[2] - v0[2];
   const nx = uy * vz - uz * vy;   // новая ориентация даёт нормаль вверх
   const ny = uz * vx - ux * vz;
   const nz = ux * vy - uy * vx;
    // аккумулируем
    normals[i0 + 0] += nx; normals[i0 + 1] += ny; normals[i0 + 2] += nz;
    normals[i1 + 0] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz;
    normals[i2 + 0] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz;
  }

  // нормализуем все нормали
  for (let k = 0; k < normals.length; k += 3) {
    const x = normals[k], y = normals[k + 1], z = normals[k + 2];
    const len = Math.hypot(x, y, z) || 1;
    normals[k    ] = x / len;
    normals[k + 1] = y / len;
    normals[k + 2] = z / len;
  }

  return {
    positions: new Float32Array(positions),
    normals:   new Float32Array(normals),
    indices:   new Uint16Array(indices),
    texCoords: new Float32Array(texCoords),
  };
}
