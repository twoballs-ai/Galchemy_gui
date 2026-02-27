import { drawLines } from '../internal/drawLines';
import { COORD } from '../../core/CoordinateSystem';

/**
 * Рисует сетку на плоскости, перпендикулярной COORD.UP,
 * и оси COORD.RIGHT/COORD.FORWARD.
 */
export function drawGrid(ctx: any) {
  const { gl, gridStep } = ctx;
  const cam = ctx.activeCamera;
  if (!cam) return;

  const size = 500;
  const A = COORD.RIGHT;    // первая базисная ось (X)
  const B = COORD.FORWARD;  // вторая базисная ось (Z)

  const gridLines: number[] = [];
  const xAxis: number[] = [];
  const zAxis: number[] = [];

  for (let i = -size; i <= size; i += gridStep) {
    if (i === 0) {
      // главные оси от -size до +size вдоль A и B
      xAxis.push(
        A[0] * -size, A[1] * -size, A[2] * -size,
        A[0] *  size, A[1] *  size, A[2] *  size
      );
      zAxis.push(
        B[0] * -size, B[1] * -size, B[2] * -size,
        B[0] *  size, B[1] *  size, B[2] *  size
      );
    } else {
      // линия параллельно A, смещённая вдоль B на i
      gridLines.push(
        A[0] * -size + B[0] * i,
        A[1] * -size + B[1] * i,
        A[2] * -size + B[2] * i,

        A[0] *  size + B[0] * i,
        A[1] *  size + B[1] * i,
        A[2] *  size + B[2] * i
      );
      // линия параллельно B, смещённая вдоль A на i
      gridLines.push(
        B[0] * -size + A[0] * i,
        B[1] * -size + A[1] * i,
        B[2] * -size + A[2] * i,

        B[0] *  size + A[0] * i,
        B[1] *  size + A[1] * i,
        B[2] *  size + A[2] * i
      );
    }
  }

  // Основные линии сетки (серые)
  drawLines(gl, -1, null!, new Float32Array(gridLines), [0.4, 0.4, 0.4, 0.4], ctx);

  // Оси
  drawLines(gl, -1, null!, new Float32Array(xAxis), COORD.AXIS_X_COLOR, ctx);
  drawLines(gl, -1, null!, new Float32Array(zAxis), COORD.AXIS_Z_COLOR, ctx);
}
