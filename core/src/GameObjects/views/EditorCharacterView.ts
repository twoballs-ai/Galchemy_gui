// src/GameObjects/primitives/3dPrimitives/EditorCharacterView.ts
import { GameObject3D } from '../primitives/GameObject3D';
import { mat4 } from 'gl-matrix';
import { createCapsuleGeometry } from '../primitives/3dPrimitives/createCapsuleGeometry';

export class EditorCharacterView extends GameObject3D {
  characterRef: GameObject3D;

  constructor(gl: WebGL2RenderingContext, targetCharacter: GameObject3D) {
    super(gl, {
      mesh: createCapsuleGeometry(0.5, 2.0, 24),  // капсула: радиус 0.5, высота 2.0
      position: targetCharacter.position,
      color: '#ff69b4',
    });

    this.characterRef = targetCharacter;
    this.type = 'editorCharacterView';
    this.isEditorOnly = true;         // будет рендериться только в EditorMode

    this.attachTo(targetCharacter);   // капсула «следит» за позицией персонажа
  }

  renderWebGL3D(gl, shaderProgram, uModel, uColor, uUseTexture, uNormalMatrix) {
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, this.worldPosition);
    // вытягиваем капсулу по Y (чтобы была «вытянута»)
    mat4.scale(modelMatrix, modelMatrix, [0.5, 1.5, 0.5]);

    gl.uniformMatrix4fv(uModel, false, modelMatrix);
    gl.uniform4fv(uColor, this.color);
    gl.uniform1i(uUseTexture, false);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    // Рисуем контур капсулы линиями (wireframe). 
    // Если позже надо заливать — заменить на TRIANGLES.
    gl.drawElements(gl.LINES, this.vertexCount, this.indexType, 0);
  }
}
