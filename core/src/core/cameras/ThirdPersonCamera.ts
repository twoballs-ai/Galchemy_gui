import { FollowCamera } from "./FollowCamera";
import { vec3, quat, mat4 } from "gl-matrix";

/**
 * Камера «за спиной».
 * – Сидит на offset относительно персонажа.
 * – Вращается вокруг цели мышью (Orbit-style).
 */
export class ThirdPersonCamera extends FollowCamera {
  private yaw   = 0;
  private pitch = -0.3;          // лёгкий наклон вниз
  private radius: number;

  constructor(w: number, h: number, target, dist = 8, height = 3) {
    // offset будет пересчитываться каждый кадр → пока ноль
    super(w, h, target, vec3.create());
    this.radius = dist;
    this.offset[1] = height;
    this.keepLookAt = true;
  }

  /** обработка ввода для вращения */
  addOrbit(deltaYaw: number, deltaPitch: number) {
    this.yaw   += deltaYaw;
    this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch + deltaPitch));
  }

  /** позиция = target.pos + вращённый offset */
  update() {
    const ox = this.radius * Math.cos(this.pitch) * Math.sin(this.yaw);
    const oy = this.offset[1] /* высота */;
    const oz = this.radius * Math.cos(this.pitch) * Math.cos(this.yaw);

    this.offset[0] = ox;
    this.offset[2] = oz;       // оси Z-up: вперёд = +Z

    super.update();            // FollowCamera расчёт + view-матрица
  }
}
