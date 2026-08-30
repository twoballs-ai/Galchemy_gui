import { BaseCamera } from './BaseCamera';
import { mat4 } from 'gl-matrix';

/** Опции камеры при создании */
interface CameraOptions {
  fov?: number;
  near?: number;
  far?: number;
  position?: [number, number, number];
  lookAt?: [number, number, number];
}

/** Реализация игровой камеры */
export class GameCamera extends BaseCamera {
  id: string;
  type: string;
  projection: Float32Array;

  fov: number;
  near: number;
  far: number;
  position: [number, number, number];
  lookAt: [number, number, number];

  constructor(w: number, h: number, opts: CameraOptions = {}) {
    super(w, h);
    this.id = crypto.randomUUID();     // Генерируем уникальный id
    this.type = 'camera';              // Задаём тип объекта
    this.projection = new Float32Array(16); // Матрица проекции (4x4)

    this.fov = opts.fov ?? 60;
    this.near = opts.near ?? 0.1;
    this.far = opts.far ?? 1000;
    this.position = opts.position ?? [0, 5, 10];
    this.lookAt = opts.lookAt ?? [0, 0, 0];
    this.updateProjection();
  }

  /** Обновление матрицы проекции */
  updateProjection(): void {
    mat4.perspective(
      this.projection,
      (this.fov * Math.PI) / 180,
      this.width / this.height,
      this.near,
      this.far
    );
  }

  /** Переопределение обновления камеры */
  override update(): void {
    super.update();
    this.updateProjection();
  }
}
