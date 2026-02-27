// src/Renderer/helpers/TransformGizmo.ts
import { mat4, vec3 } from "gl-matrix";
import {
  AXIS_X_COLOR, AXIS_Y_COLOR, AXIS_Z_COLOR,
  RIGHT, UP, FORWARD
} from "../../constants/CoordSystem";
import { COORD } from "../../core/CoordinateSystem";
import type { WebGLRenderer } from "../renderers/WebGLRenderer";

export enum GizmoMode {
  TRANSLATE = 'translate',
  ROTATE = 'rotate',
  SCALE = 'scale',
}

export class TransformGizmo {
  mode: GizmoMode = GizmoMode.TRANSLATE;
  activeAxis: 'x' | 'y' | 'z' | null = null;
  isDragging = false;
  dragStart: vec3 = vec3.create();
  initialPosition: vec3 = vec3.create();

  setMode(mode: GizmoMode) {
    this.mode = mode;
  }

private getAxisVector(axis: 'x' | 'y' | 'z'): vec3 {
  return {
    x: COORD.RIGHT,
    y: COORD.UP,         // теперь Y-вверх
    z: COORD.FORWARD,    // Z-вперёд
  }[axis];
}


  draw(renderer: WebGLRenderer) {
    const { gl, plainShaderProgram, plain_aPos, plain_uModel, plain_uView, plain_uProj, plain_uColor, activeCamera } = renderer;
    const obj = renderer.selectedObject;
    if (!obj || !obj.position) return;

    const pos = obj.position;

   const drawLine = (axis: 'x' | 'y' | 'z', color: number[]) => {
  const dir = this.getAxisVector(axis);
  const vertices = new Float32Array([
    pos[0], pos[1], pos[2],
    pos[0] + dir[0], pos[1] + dir[1], pos[2] + dir[2],
  ]);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.useProgram(plainShaderProgram);
  gl.uniformMatrix4fv(plain_uModel, false, mat4.create());
  gl.uniformMatrix4fv(plain_uView, false, activeCamera.getView());
  gl.uniformMatrix4fv(plain_uProj, false, activeCamera.getProjection());
  gl.uniform4fv(renderer.plain_uColor, color);

  gl.vertexAttribPointer(plain_aPos, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(plain_aPos);

  gl.lineWidth(2); // толщина линии
  gl.drawArrays(gl.LINES, 0, 2);

  gl.deleteBuffer(buf);
};

    drawLine('x', AXIS_X_COLOR);
    drawLine('y', AXIS_Y_COLOR);
    drawLine('z', AXIS_Z_COLOR);
  }

  onMouseDown(ray: { origin: vec3 }, object: any) {
    this.isDragging = true;
    vec3.copy(this.initialPosition, object.position);
    vec3.copy(this.dragStart, ray.origin);
  }

  onMouseMove(ray: { origin: vec3 }, object: any) {
    if (!this.isDragging || !this.activeAxis) return;

    const delta = vec3.create();
    vec3.subtract(delta, ray.origin, this.dragStart);

    const axisVec = this.getAxisVector(this.activeAxis);
    const movement = vec3.dot(delta, axisVec);

    const newPos = vec3.scaleAndAdd(vec3.create(), this.initialPosition, axisVec, movement);
    object.position = newPos;
  }

  onMouseUp() {
    this.isDragging = false;
    this.activeAxis = null;
  }
}
