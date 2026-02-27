import { GameObject3D } from './primitives/GameObject3D.js';
import { GameCamera } from '../core/cameras/GameCamera.js';
import { createCameraIconGeometry } from './primitives/3dPrimitives/objectIcons/createCameraIconGeometry.js';
import { mat4 } from 'gl-matrix';

export class GameObjectCamera extends GameObject3D {
  constructor(gl, opts = {}) {
    super(gl, {
      mesh: createCameraIconGeometry(),
      position: opts.position || [0, 0, 0],
      color: opts.color || '#ffd700'
    });

    this.camera = new GameCamera(gl.canvas.width, gl.canvas.height, opts);
    this.isCamera = true;
  }

  update() {
    this.camera.position = this.position;
    this.camera.lookAt = this.lookAt || [0, 0, 0];
    this.camera.update();
  }

  getProjection() { return this.camera.getProjection(); }
  getView() { return this.camera.getView(); }

  renderWebGL3D(gl, shaderProgram, uModel, uColor, uUseTexture) {
    if (this.isEditorMode) {
      // console.log('Рендерю иконку камеры', this);
      const modelMatrix = mat4.create();
      mat4.translate(modelMatrix, modelMatrix, this.position);
      gl.uniformMatrix4fv(uModel, false, modelMatrix);
      gl.uniform4fv(uColor, this.color);
      gl.uniform1i(uUseTexture, false);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(gl.LINES, this.vertexCount, this.indexType, 0);
    }
  }
}
