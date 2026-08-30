import { GameObject3D } from './primitives/GameObject3D.js';
import { mat4 } from 'gl-matrix';

export class GameObjectLight extends GameObject3D {
  private _lightLineBuffer: WebGLBuffer | null = null;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext, {
    subtype = 'point',
    position = [0, 0, 0],
    direction = [0, 0, 0],
    color = '#ffff00',
    intensity = 1.0,
  }: any = {}) {
    super(gl, {
      mesh: { positions: new Float32Array(), indices: new Uint16Array() },
      position,
      color
    });
    this.subtype = subtype;
    this.direction = direction;
    (this as any).isLight = true;
    (this as any).intensity = intensity;
    
    // ИСПРАВЛЕНИЕ: Создаем буфер один раз в конструкторе, а не каждый кадр
    this._lightLineBuffer = gl.createBuffer();
  }

  get worldPosition(): [number, number, number] {
    return this.position;
  }

  renderWebGL3D(
    gl: WebGLRenderingContext | WebGL2RenderingContext, 
    shaderProgram: WebGLProgram, 
    uModel: WebGLUniformLocation, 
    uColor: WebGLUniformLocation, 
    uUseTexture: WebGLUniformLocation
  ) {
    if (!(this as any).isEditorMode) return;
  
    // ИСПРАВЛЕНИЕ: Гарантируем, что нужный шейдер активен
    gl.useProgram(shaderProgram);
  
    const model = mat4.create();
    mat4.translate(model, model, this.position);
    gl.uniformMatrix4fv(uModel, false, model);
    gl.uniform1i(uUseTexture, 0);
  
    let verts: number[] | Float32Array;
    let color: number[];
  
    switch (this.subtype) {
      case 'point':
        verts = [];
        const segs = 12;
        const radius = 0.2;
        for (let i = 0; i < segs; i++) {
          const angle = (i / segs) * Math.PI * 2;
          verts.push(0, 0, 0, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
        }
        color = [1, 1, 0, 1];
        break;
  
      case 'directional':
        const dir = this.direction;
        const len = 0.7;
        verts = new Float32Array([
          0, 0, 0, dir[0]*len, dir[1]*len, dir[2]*len,
          dir[0]*len, dir[1]*len, dir[2]*len, dir[0]*len*0.8, dir[1]*len*0.8+0.1, dir[2]*len*0.8,
          dir[0]*len, dir[1]*len, dir[2]*len, dir[0]*len*0.8, dir[1]*len*0.8-0.1, dir[2]*len*0.8
        ]);
        color = [0, 1, 1, 1];
        break;
  
      case 'ambient':
        verts = [];
        const segments = 16;
        const r = 0.3;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * 2 * Math.PI;
          verts.push(Math.cos(angle)*r, Math.sin(angle)*r, 0);
          if (i > 0) {
            verts.push(Math.cos(angle)*r, Math.sin(angle)*r, 0);
          }
        }
        color = [1, 0, 1, 1];
        break;
  
      default:
        return;
    }
  
    gl.uniform4fv(uColor, color);
  
    const posLoc = this._getAttribLocation(shaderProgram);
    
    // ИСПРАВЛЕНИЕ: Отключаем неиспользуемые атрибуты, чтобы избежать ошибки "no buffer is bound"
    const texCoordLoc = gl.getAttribLocation(shaderProgram, 'aTexCoord');
    if (texCoordLoc >= 0) gl.disableVertexAttribArray(texCoordLoc);

    const normLoc = gl.getAttribLocation(shaderProgram, 'aVertexNormal');
    if (normLoc >= 0) gl.disableVertexAttribArray(normLoc);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, this._lightLineBuffer!);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);
  
    gl.drawArrays(gl.LINES, 0, verts.length / 3);
    
    // Сброс привязки текстуры для безопасности
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}