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
    // @ts-ignore - если это свойство есть в вашем базовом классе или режиме
    (this as any).isEditorOnly = true;         

    this.attachTo(targetCharacter);
  }

  renderWebGL3D(
    gl: WebGLRenderingContext | WebGL2RenderingContext, 
    shaderProgram: WebGLProgram, 
    uModel: WebGLUniformLocation, 
    uColor: WebGLUniformLocation, 
    uUseTexture: WebGLUniformLocation, 
    uNormalMatrix: WebGLUniformLocation
  ) {
    // КРИТИЧЕСКИ ВАЖНО: Активируем программу
    gl.useProgram(shaderProgram);

    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, this.worldPosition);
    mat4.scale(modelMatrix, modelMatrix, [0.5, 1.5, 0.5]);

    gl.uniformMatrix4fv(uModel, false, modelMatrix);
    gl.uniform4fv(uColor, this.color);
    gl.uniform1i(uUseTexture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    
    // ИСПРАВЛЕНО: Получаем реальный индекс атрибута вместо хардкода '0'
    const posLoc = this._getAttribLocation(shaderProgram);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    // БЕЗОПАСНОСТЬ: Отключаем атрибуты, которые есть в шейдере, но не используются капсулой
    const texLoc = gl.getAttribLocation(shaderProgram, 'aTexCoord');
    if (texLoc >= 0) gl.disableVertexAttribArray(texLoc);
    
    const normLoc = gl.getAttribLocation(shaderProgram, 'aVertexNormal');
    if (normLoc >= 0) gl.disableVertexAttribArray(normLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.LINES, this.vertexCount, this.indexType, 0);
  }
}