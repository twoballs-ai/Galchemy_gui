// cameras/TopDownCamera.ts
import { mat4, vec3 } from "gl-matrix";
import { FollowCamera } from "./FollowCamera";

export class TopDownCamera extends FollowCamera {
  orthoSize = 20;      // масштаб клетки в мировых единицах

  constructor(w: number, h: number, target, height = 30) {
    super(w, h, target, vec3.fromValues(0, 0, height));
    this.isOrthographic = true;
    this.updateProjection();
  }

  /** Ортографическая проекция */
  updateProjection(): void {
    const l = -this.orthoSize, r = this.orthoSize;
    const b = -this.orthoSize, t = this.orthoSize;
    mat4.ortho(this.projection, l, r, b, t, this.near, this.far);
  }

  /** Смотрим строго вниз по -Z */
  update(): void {
    this.up = [0, 1, 0];             // «север» в +Y
    super.update();                  // Follow-логика
  }
}
