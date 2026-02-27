import { mat4, quat, vec3 } from "gl-matrix";
import {
  HANDEDNESS, UP_AXIS, CLIP_RANGE,
  RIGHT, FORWARD, UP
} from "../constants/CoordSystem";

export type Handedness = "RH" | "LH";

export interface CubemapPaths {
  posx: string;
  negx: string;
  posy: string;
  negy: string;
  posz: string;
  negz: string;
}

export class CoordinateSystem {
  readonly RIGHT = RIGHT;
  readonly FORWARD = FORWARD;
  readonly UP = UP;
  readonly AXIS_X_COLOR: [number, number, number, number] = [1, 0, 0, 1];
  readonly AXIS_Y_COLOR: [number, number, number, number] = [0, 1, 0, 1];
  readonly AXIS_Z_COLOR: [number, number, number, number] = [0, 0, 1, 1];
  readonly SELECTION_COLOR: [number, number, number, number] = [1, 1, 0, 1];
  readonly handedness: Handedness = HANDEDNESS as Handedness;

  private gl: WebGL2RenderingContext | null = null;

  setGL(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  perspective(fov: number, aspect: number, near: number, far: number): mat4 {
    const m = mat4.create();
    mat4.perspective(m, fov, aspect, near, far);

    if (CLIP_RANGE === "ZeroToOne") {
      m[10] = far / (near - far);
      m[14] = (far * near) / (near - far);
    }

    if (this.handedness === "LH") {
      m[8] *= -1;
      m[9] *= -1;
      m[10] *= -1;
      m[11] *= -1;
    }

    return m;
  }

  lookAt(eye: vec3, target: vec3, up: vec3 = this.UP): mat4 {
    const m = mat4.create();
    if (this.handedness === "RH") {
      mat4.lookAt(m, eye, target, up);
    } else {
      mat4.lookAtLH!(m, eye, target, up);
    }
    return m;
  }

  getViewNoTranslation(view: mat4): mat4 {
    const v = mat4.clone(view);
    v[12] = v[13] = v[14] = 0;

    if (UP_AXIS === "Y") {
      v[1] = 0; v[5] = 1; v[9] = 0;  // Y-вверх
    } else {
      v[2] = 0; v[6] = 0; v[10] = 1; // Z-вверх
    }

    return v;
  }

  resolveCubemapOrder(paths: CubemapPaths): Record<number, string> {
    const g = this.gl!;
    // Y-up: стандартный GL/WebGL/WebGPU layout
    return {
      [g.TEXTURE_CUBE_MAP_POSITIVE_X]: paths.posx, // right
      [g.TEXTURE_CUBE_MAP_NEGATIVE_X]: paths.negx, // left
      [g.TEXTURE_CUBE_MAP_POSITIVE_Y]: paths.posy, // top (Y+)
      [g.TEXTURE_CUBE_MAP_NEGATIVE_Y]: paths.negy, // bottom (Y-)
      [g.TEXTURE_CUBE_MAP_POSITIVE_Z]: paths.posz, // back (Z+)
      [g.TEXTURE_CUBE_MAP_NEGATIVE_Z]: paths.negz  // front (Z-)
    };
  }
}
export function composeMatrix(
  position: vec3,
  rotation: quat,   // rotation в виде кватерниона!
  scale: vec3
): mat4 {
  const m = mat4.create();
  mat4.fromRotationTranslationScale(m, rotation, position, scale);
  return m;
}
export const COORD = new CoordinateSystem();
