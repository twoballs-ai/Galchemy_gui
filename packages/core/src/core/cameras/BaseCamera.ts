import { mat4 } from 'gl-matrix';
import { COORD } from "../../core/CoordinateSystem";
import { UP } from '../../constants/CoordSystem';  // добавим импорт

import { vec3 } from 'gl-matrix';
export class BaseCamera {
  constructor(w, h) {
    this.width  = w;
    this.height = h;
    this.projection = mat4.create();
    this.view = mat4.create();
    this.position = [0, 0, 10];
    this.lookAt = [0, 0, 0];
    this.up = UP;  // теперь это [0, 0, 1]
  }

  update() {
    const m = COORD.lookAt(this.position as vec3, this.lookAt as vec3);
this.view = m;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.updateProjection();
  }

  getProjection() { return this.projection; }
  getView()       { return this.view; }

  updateProjection() {
    // может быть переопределён в подклассах
  }
}
