// src/core/GameObjects/GameObjectLight.js
import { GameObject3D } from './primitives/GameObject3D.js';
import { mat4 }         from 'gl-matrix';

export class GameObjectLight extends GameObject3D {
  /**
   * opts:
   *   subtype:   'point'|'directional'|'ambient'
   *   position:  [x,y,z]
   *   direction: [dx,dy,dz]
   *   color:     hex-строка, например '#ffff00'
   */
  constructor(gl, {
    subtype    = 'point',
    position   = [0,0,0],
    direction  = [0,0,0],
    color      = '#ffff00',
    intensity  = 1.0,
  } = {}) {
    // создаём пустой mesh — рисовать будем динамически
    super(gl, {
      mesh: { positions: new Float32Array(), indices: new Uint16Array() },
      position,
      color
    });
    this.subtype   = subtype;
    this.direction = direction;
    this.isLight   = true;
    this.intensity = intensity;
  }
  get worldPosition(){
    return this.position;          // для point‑lamp
  }
  renderWebGL3D(gl, shaderProgram, uModel, uColor, uUseTexture) {
    // рисуем только в режиме редактора
    if (!this.isEditorMode) return;
  
    const model = mat4.create();
    mat4.translate(model, model, this.position);
    gl.uniformMatrix4fv(uModel, false, model);
  
    gl.uniform1i(uUseTexture, false);
  
    let verts;
    let color;
  
    switch (this.subtype) {
      case 'point':
        // Маленькая сфера (звездочка из линий)
        verts = [];
        const segs = 12;
        const radius = 0.2;
        for (let i = 0; i < segs; i++) {
          const angle = (i / segs) * Math.PI * 2;
          verts.push(
            0, 0, 0,
            Math.cos(angle) * radius, Math.sin(angle) * radius, 0
          );
        }
        color = [1, 1, 0, 1]; // жёлтый
        break;
  
      case 'directional':
        // Стрелка
        const dir = this.direction;
        const len = 0.7;
        verts = new Float32Array([
          0,0,0, dir[0]*len, dir[1]*len, dir[2]*len,
          // наконечник стрелки
          dir[0]*len, dir[1]*len, dir[2]*len, dir[0]*len*0.8, dir[1]*len*0.8+0.1, dir[2]*len*0.8,
          dir[0]*len, dir[1]*len, dir[2]*len, dir[0]*len*0.8, dir[1]*len*0.8-0.1, dir[2]*len*0.8
        ]);
        color = [0, 1, 1, 1]; // голубой
        break;
  
      case 'ambient':
        // Кольцо
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
        color = [1, 0, 1, 1]; // пурпурный
        break;
  
      default:
        return;
    }
  
    gl.uniform4fv(uColor, color);
  
    const posLoc = this._getAttribLocation(shaderProgram);
    const texCoordLoc = gl.getAttribLocation(shaderProgram, 'aTexCoord');

if (texCoordLoc >= 0) {
  gl.disableVertexAttribArray(texCoordLoc);
}
  
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);
  
    gl.drawArrays(gl.LINES, 0, verts.length / 3);
    gl.deleteBuffer(buf);
  }
  
}
