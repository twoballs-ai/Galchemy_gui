import { FollowCamera } from "./FollowCamera";
import { vec3 } from "gl-matrix";

/**
 * Камера «из глаз».
 * – Сидит в точке target.worldPosition + offset (по умолчанию чуть выше центра).
 * – Поворачивается вместе с персонажем (yaw/pitch можно привязывать к самому объекту-персонажу
 *   или обрабатывать в этой камере — решай сам).
 */
export class FirstPersonCamera extends FollowCamera {
  constructor(w: number, h: number, target, eyeHeight = 1.7) {
    super(w, h, target, vec3.fromValues(0, eyeHeight, 0));
    this.keepLookAt = false;       // даём возможность вручную крутить взгляд
  }

  /** можно добавить обработку мыши для yaw/pitch */
  setViewAngles(yaw: number, pitch: number) {
    // yaw вокруг UP, pitch вокруг RIGHT
    // ... (по желанию)
  }
}
