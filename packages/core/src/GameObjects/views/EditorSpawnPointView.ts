// EditorSpawnPointView.ts
import { GameObject3D } from '../primitives/GameObject3D.js';
import { mat4 } from 'gl-matrix';

export class EditorSpawnPointView extends GameObject3D {
  constructor(gl: WebGL2RenderingContext, targetSpawnPoint: GameObject3D) {
    super(gl, {
      mesh: {
        positions: new Float32Array([
          0, 0, 0,
          0, 0.8, 0,
          -0.3, 0.5, 0,
          0.3, 0.5, 0,
        ]),
        indices: new Uint16Array([0, 2, 3, 2, 1, 3]),
      },
      position: targetSpawnPoint.position,
      color: '#00ff00',
    });

    this.spawnPointRef = targetSpawnPoint;
    this.type = 'editorSpawnPointView';
    this.isEditorOnly = true;

    this.attachTo(targetSpawnPoint);
  }

  renderWebGL3D(gl, shaderProgram, uModel, uColor, uUseTexture) {
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, this.worldPosition);
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
