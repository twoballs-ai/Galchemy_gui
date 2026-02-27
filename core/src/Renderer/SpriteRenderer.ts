import { mat4 } from 'gl-matrix';
function compileShader(gl, type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    function compileProgram(gl, vSrc, fSrc) {
      const vs = compileShader(gl, gl.VERTEX_SHADER,   vSrc);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, fSrc);
      const p  = gl.createProgram();
      gl.attachShader(p, vs); gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(p));
      return p;
    }

const VS = `
  attribute vec2 aPos;
  attribute vec2 aUV;
  uniform   mat4 uModel, uProj;
  varying   vec2 vUV;
  void main(){
    vUV = aUV;
    gl_Position = uProj * uModel * vec4(aPos,0.0,1.0);
  }`;
const FS = `
  precision mediump float;
  uniform sampler2D uTex;
  varying vec2 vUV;
  void main(){ gl_FragColor = texture2D(uTex, vUV); }`;

export class SpriteRenderer {
  constructor(gl, canvasW, canvasH) {
    this.gl = gl;
    this._batch = [];

    /* quad */
    const data = new Float32Array([
      // x  y   u v
      -0.5,  0.5, 0,0,
      -0.5, -0.5, 0,1,
       0.5, -0.5, 1,1,
       0.5,  0.5, 1,0
    ]);
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0,1,2, 0,2,3]), gl.STATIC_DRAW);

    this.prog = compileProgram(gl, VS, FS);
    this.aPos   = gl.getAttribLocation (this.prog, 'aPos');
    this.aUV    = gl.getAttribLocation (this.prog, 'aUV');
    this.uModel = gl.getUniformLocation(this.prog, 'uModel');
    this.uProj  = gl.getUniformLocation(this.prog, 'uProj');

    this.proj = mat4.create();
    this.resize(canvasW, canvasH);
  }

  resize(w,h){ mat4.ortho(this.proj,0,w,h,0,-1,1); }

  add(obj){ this._batch.push(obj); }

  flush() {
    const gl = this.gl;
    if (!this._batch.length) return;

    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.uProj, false, this.proj);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.vertexAttribPointer(this.aPos,2,gl.FLOAT,false,16,0);
    gl.vertexAttribPointer(this.aUV ,2,gl.FLOAT,false,16,8);
    gl.enableVertexAttribArray(this.aPos);
    gl.enableVertexAttribArray(this.aUV);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    for (const s of this._batch) {
      gl.bindTexture(gl.TEXTURE_2D, s.texture);
      gl.uniformMatrix4fv(this.uModel, false, s.modelMatrix);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
    this._batch.length = 0;      // очистили
  }
}
