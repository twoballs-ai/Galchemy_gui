import { mat4 } from 'gl-matrix';
import { COORD } from '../../core/CoordinateSystem';

export class GridHelper {
  private gl: WebGL2RenderingContext;
  private gridBuffer: WebGLBuffer | null = null;
  private xBuffer: WebGLBuffer | null = null;
  private zBuffer: WebGLBuffer | null = null;
  
  private gridCount: number = 0;
  private xCount: number = 0;
  private zCount: number = 0;

  constructor(gl: WebGL2RenderingContext, gridStep: number = 1) {
    this.gl = gl;
    this.init(gridStep);
  }

  private init(gridStep: number) {
    const size = 500;
    const A = COORD.RIGHT;    // X
    const B = COORD.FORWARD;  // Z

    const gridLines: number[] = [];
    const xAxis: number[] = [];
    const zAxis: number[] = [];

    for (let i = -size; i <= size; i += gridStep) {
      if (i === 0) {
        xAxis.push(
          A[0] * -size, A[1] * -size, A[2] * -size,
          A[0] *  size, A[1] *  size, A[2] *  size
        );
        zAxis.push(
          B[0] * -size, B[1] * -size, B[2] * -size,
          B[0] *  size, B[1] *  size, B[2] *  size
        );
      } else {
        gridLines.push(
          A[0] * -size + B[0] * i, A[1] * -size + B[1] * i, A[2] * -size + B[2] * i,
          A[0] *  size + B[0] * i, A[1] *  size + B[1] * i, A[2] *  size + B[2] * i
        );
        gridLines.push(
          B[0] * -size + A[0] * i, B[1] * -size + A[1] * i, B[2] * -size + A[2] * i,
          B[0] *  size + A[0] * i, B[1] *  size + A[1] * i, B[2] *  size + A[2] * i
        );
      }
    }

    this.gridBuffer = this._createBuffer(new Float32Array(gridLines));
    this.gridCount = gridLines.length / 3;

    this.xBuffer = this._createBuffer(new Float32Array(xAxis));
    this.xCount = xAxis.length / 3;

    this.zBuffer = this._createBuffer(new Float32Array(zAxis));
    this.zCount = zAxis.length / 3;
  }

  private _createBuffer(data: Float32Array): WebGLBuffer {
    const gl = this.gl;
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buf;
  }

  public render(ctx: any) {
    const gl = this.gl;
    const { plainShaderProgram, plain_aPos, plain_uModel, plain_uView, plain_uProj, plain_uColor, activeCamera } = ctx;

    // ЗАЩИТА 1: Проверяем, что шейдер и атрибут валидны
    if (!plainShaderProgram || !activeCamera || plain_aPos < 0) {
      console.warn("GridHelper: Пропуск отрисовки. Проверьте, что plain_aPos >= 0 (имя атрибута в шейдере должно быть 'aVertexPosition')");
      return;
    }

    gl.useProgram(plainShaderProgram);

    const identity = mat4.create();
    gl.uniformMatrix4fv(plain_uModel, false, identity);
    gl.uniformMatrix4fv(plain_uView, false, activeCamera.getView());
    gl.uniformMatrix4fv(plain_uProj, false, activeCamera.getProjection());

    // ЗАЩИТА 2: Явно отключаем "мусорные" атрибуты, которые могли остаться от 3D-рендера
    const texLoc = gl.getAttribLocation(plainShaderProgram, "aTexCoord");
    if (texLoc >= 0) gl.disableVertexAttribArray(texLoc);

    const normLoc = gl.getAttribLocation(plainShaderProgram, "aVertexNormal");
    if (normLoc >= 0) gl.disableVertexAttribArray(normLoc);

    // Теперь безопасно включаем только нужный атрибут
    gl.enableVertexAttribArray(plain_aPos);

    // 1. Основная сетка (серая)
    if (this.gridBuffer && this.gridCount > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
      gl.vertexAttribPointer(plain_aPos, 3, gl.FLOAT, false, 0, 0);
      gl.uniform4fv(plain_uColor, [0.4, 0.4, 0.4, 0.4]);
      gl.drawArrays(gl.LINES, 0, this.gridCount);
    }

    // 2. Ось X (красная)
    if (this.xBuffer && this.xCount > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.xBuffer);
      gl.vertexAttribPointer(plain_aPos, 3, gl.FLOAT, false, 0, 0);
      gl.uniform4fv(plain_uColor, COORD.AXIS_X_COLOR);
      gl.drawArrays(gl.LINES, 0, this.xCount);
    }

    // 3. Ось Z (синяя)
    if (this.zBuffer && this.zCount > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.zBuffer);
      gl.vertexAttribPointer(plain_aPos, 3, gl.FLOAT, false, 0, 0);
      gl.uniform4fv(plain_uColor, COORD.AXIS_Z_COLOR);
      gl.drawArrays(gl.LINES, 0, this.zCount);
    }

    // Очистка состояния после отрисовки
    gl.disableVertexAttribArray(plain_aPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  public dispose() {
    const gl = this.gl;
    if (this.gridBuffer) gl.deleteBuffer(this.gridBuffer);
    if (this.xBuffer) gl.deleteBuffer(this.xBuffer);
    if (this.zBuffer) gl.deleteBuffer(this.zBuffer);
    this.gridBuffer = null;
    this.xBuffer = null;
    this.zBuffer = null;
  }
}