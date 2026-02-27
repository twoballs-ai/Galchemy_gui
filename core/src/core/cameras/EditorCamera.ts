import { BaseCamera } from './BaseCamera';
import { mat4, vec3, quat } from 'gl-matrix';
import { COORD } from "../../core/CoordinateSystem";

export class EditorCamera extends BaseCamera {
  // Новые поля трансформации
  position: vec3 = [0, 0, 10];
  rotation: quat = quat.create();    // кватернион для поворота камеры (по умолчанию без поворота)
  scale:    vec3 = [1, 1, 1];        // масштаб (обычно 1,1,1)
  worldMatrix: mat4 = mat4.create(); // итоговая мировая матрица камеры

  yaw = 0;
  pitch = 0.6;
  distance = 10;
  target: vec3 = [0, 0, 0];

  isOrthographic = false;
  orthoSize = 10;

  constructor(w: number, h: number) {
    super(w, h);
    this.updateProjection();
    this.updateWorldMatrix();
  }

  /** Обновляет локальную матрицу (Position+Rotation+Scale) */
  updateLocalMatrix(): mat4 {
    const m = mat4.create();
    mat4.fromRotationTranslationScale(
      m,
      this.rotation,
      this.position,
      this.scale
    );
    return m;
  }

  /** Обновляет мировую матрицу камеры (для совместимости) */
  updateWorldMatrix(parentMatrix: mat4 = mat4.create()): void {
    const local = this.updateLocalMatrix();
    mat4.multiply(this.worldMatrix, parentMatrix, local);
  }

  updateProjection() {
    const aspect = this.width / this.height;
    if (this.isOrthographic) {
      const size = this.orthoSize;
      mat4.ortho(this.projection, -size * aspect, size * aspect, -size, size, 0.1, 1000);
    } else {
      mat4.perspective(this.projection, Math.PI / 4, aspect, 0.1, 1000);
    }
  }

  /** Обновляет позицию и view-матрицу камеры, а также worldMatrix! */
  update() {
    const cx = Math.cos(this.yaw) * Math.cos(this.pitch);
    const cy = Math.sin(this.pitch);
    const cz = Math.sin(this.yaw) * Math.cos(this.pitch);

    this.position = [
      this.target[0] + cx * this.distance,
      this.target[1] + cy * this.distance,
      this.target[2] + cz * this.distance,
    ];

    // Поворот камеры: yaw/pitch переводим в кватернион
    quat.identity(this.rotation);
    quat.rotateY(this.rotation, this.rotation, this.yaw);
    quat.rotateX(this.rotation, this.rotation, this.pitch);

    // обновляем worldMatrix камеры (с учетом transform)
    this.updateWorldMatrix();

    // получаем view-матрицу (с учётом поворота)
    this.view = COORD.lookAt(this.position, this.target, this.up);
  }

  toggleProjectionMode() {
    this.isOrthographic = !this.isOrthographic;
    this.updateProjection();
  }
}
