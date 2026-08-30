// src/utils/rayTriangle.ts
import { vec3 } from "gl-matrix";

/**
 * Möller–Trumbore intersection алгоритм:
 * проверяет, пересекает ли луч origin+dir треугольник v0,v1,v2.
 * @returns { t, u, v } при попадании или null
 */
export function intersectTriangle(
  origin: vec3,
  dir: vec3,
  v0: vec3,
  v1: vec3,
  v2: vec3
): { t: number; u: number; v: number } | null {
  const EPS = 1e-8;
  const edge1 = vec3.sub(vec3.create(), v1, v0);
  const edge2 = vec3.sub(vec3.create(), v2, v0);
  const p = vec3.cross(vec3.create(), dir, edge2);
  const det = vec3.dot(edge1, p);
  if (det > -EPS && det < EPS) return null; // параллельно
  const invDet = 1 / det;
  const T = vec3.sub(vec3.create(), origin, v0);
  const u = vec3.dot(T, p) * invDet;
  if (u < 0 || u > 1) return null;
  const Q = vec3.cross(vec3.create(), T, edge1);
  const v = vec3.dot(dir, Q) * invDet;
  if (v < 0 || u + v > 1) return null;
  const t = vec3.dot(edge2, Q) * invDet;
  return t > EPS ? { t, u, v } : null;
}
