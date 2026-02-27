// Z‑up ориентация. Никаких импортов WebGL, только математика.
import { mat4 } from 'gl-matrix';

export function buildGizmoMatrix(
  cam: { yaw?: number; pitch?: number },
  pre: mat4 | null = null,
  scale = 1,
  flipY = false
): mat4 {
  const m = pre ? mat4.clone(pre) : mat4.create();

  const yaw   = -(cam.yaw   ?? 0);
  const pitch = -(cam.pitch ?? 0);

  mat4.rotateY(m, m, yaw);    // Y-up: yaw по Y
  mat4.rotateX(m, m, pitch);  // Y-up: pitch по X

  if (flipY) mat4.scale(m, m, [1, -1, 1]);
  if (scale !== 1) mat4.scale(m, m, [scale, scale, scale]);

  return m;
}