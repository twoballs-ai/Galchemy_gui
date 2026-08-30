import { GameObject3D } from '../primitives/GameObject3D';
import { mat4 } from 'gl-matrix';
import { createCapsuleGeometry } from '../primitives/3dPrimitives/createCapsuleGeometry';

export class EditorCharacterView extends GameObject3D {
  characterRef: GameObject3D;

  constructor(gl: WebGL2RenderingContext, targetCharacter: GameObject3D) {
    super(gl, {
      mesh: createCapsuleGeometry(0.5, 2.0, 24),
      position: targetCharacter.position,
      color: '#ff69b4',
    });

    this.characterRef = targetCharacter;
    this.type = 'editorCharacterView';
    (this as any).isEditorOnly = true;

    this.attachTo(targetCharacter);
  }

  renderWebGL3D(
    gl: WebGLRenderingContext | WebGL2RenderingContext, 
    shaderProgram: WebGLProgram, 
    uModel: WebGLUniformLocation | null, 
    uColor: WebGLUniformLocation | null, 
    uUseTexture: WebGLUniformLocation | null, 
    uNormalMatrix: WebGLUniformLocation | null
  ) {
    // ИСПРАВЛЕНИЕ 1: Защита от пустых или неинициализированных буферов
    if (!this.vertexBuffer || !this.indexBuffer || this.vertexCount === 0) {
      return;
    }

    gl.useProgram(shaderProgram);

    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, this.worldPosition);
    mat4.scale(modelMatrix, modelMatrix, [0.5, 1.5, 0.5]);

    if (uModel) gl.uniformMatrix4fv(uModel, false, modelMatrix);
    if (uColor) gl.uniform4fv(uColor, this.color);
    if (uUseTexture) gl.uniform1i(uUseTexture, 0);

    const posLoc = this._getAttribLocation(shaderProgram);
    
    // ИСПРАВЛЕНИЕ 2: Если атрибут позиции не найден в шейдере, рисовать нельзя
    if (posLoc < 0) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    const texLoc = gl.getAttribLocation(shaderProgram, 'aTexCoord');
    if (texLoc >= 0) gl.disableVertexAttribArray(texLoc);
    
    const normLoc = gl.getAttribLocation(shaderProgram, 'aVertexNormal');
    if (normLoc >= 0) gl.disableVertexAttribArray(normLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.LINES, this.vertexCount, this.indexType, 0);
    
    // Очистка состояния после отрисовки
    gl.disableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}