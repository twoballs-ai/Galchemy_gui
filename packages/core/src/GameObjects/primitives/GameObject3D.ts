import { mat4, mat3, vec3 } from 'gl-matrix';
import { hexToRGB } from '../../utils/ColorMixin';

export interface Mesh {
  positions: Float32Array;
  indices: Uint16Array | Uint32Array;
  texCoords?: Float32Array;
  normals?: Float32Array;
}

export interface GameObject3DOptions {
  mesh?: Mesh | null;
  position?: [number, number, number];
  rotation?: [number, number, number]; // эйлеры (рад)
  scale?: [number, number, number];
  color?: string | number[];
  textureSrc?: string;
  roughness?: number;
  metalness?: number;
}

export class GameObject3D {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  parent: GameObject3D | null = null;
  children: Set<GameObject3D> = new Set();
  offset: [number, number, number] = [0, 0, 0];

  // Трансформации
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  worldMatrix: mat4 = mat4.create();

  // Материалы, буферы и пр.
  roughness: number;
  metalness: number;
  color: number[];
  texture: WebGLTexture | null = null;
  textureLoaded: boolean = false;
  boundingRadius: number;
  vertexBuffer: WebGLBuffer | null;
  indexBuffer: WebGLBuffer | null;
  texCoordBuffer: WebGLBuffer | null;
  normalBuffer: WebGLBuffer | null;
  vertexCount: number;
  indexType: GLenum;
  mesh: Mesh | null;
  aPosLocMap: WeakMap<WebGLProgram, number>;

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    {
      mesh = null,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = [1, 1, 1],
      color = '#ffffff',
      textureSrc = null,
      roughness = 0.8,
      metalness = 0.0
    }: GameObject3DOptions = {}
  ) {
    this.gl = gl;
    this.mesh = mesh;
    this.position = [...position];
    this.rotation = [...rotation];
    this.scale = [...scale];
    this.roughness = roughness;
    this.metalness = metalness;
    this.color = Array.isArray(color)
      ? (color.length === 3 ? [...color, 1] : color.slice(0, 4))
      : hexToRGB(color);

    if (textureSrc) {
      this.texture = this._loadTexture(textureSrc);
    }

    const hasValidMesh = mesh && mesh.positions && mesh.indices;
    if (hasValidMesh) {
      this.boundingRadius = this._computeBoundingRadius(mesh.positions);
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);

      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

      this.vertexCount = mesh.indices.length;
      this.indexType = mesh.indices.BYTES_PER_ELEMENT === 2
        ? gl.UNSIGNED_SHORT
        : gl.UNSIGNED_INT;

      if (mesh.texCoords) {
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.texCoords, gl.STATIC_DRAW);
      } else {
        this.texCoordBuffer = null;
      }

      if (mesh.normals) {
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
      } else {
        this.normalBuffer = null;
      }
    } else {
      this.boundingRadius = 0;
      this.vertexBuffer = null;
      this.indexBuffer = null;
      this.texCoordBuffer = null;
      this.normalBuffer = null;
      this.vertexCount = 0;
      this.indexType = gl.UNSIGNED_SHORT;
    }

    this.aPosLocMap = new WeakMap();

    // Сразу считаем worldMatrix (без parent пока)
    this.updateWorldMatrix();
  }

  setPosition(pos: [number, number, number]) {
    this.position = [...pos];
    this.updateWorldMatrix();
  }
  setRotation(rot: [number, number, number]) {
    this.rotation = [...rot];
    this.updateWorldMatrix();
  }
  setScale(scale: [number, number, number]) {
    this.scale = [...scale];
    this.updateWorldMatrix();
  }

  updateWorldMatrix(parentMatrix: mat4 = mat4.create()) {
    // Собираем локальную матрицу
    const local = mat4.create();
    mat4.translate(local, local, this.position);
    mat4.rotateX(local, local, this.rotation[0]);
    mat4.rotateY(local, local, this.rotation[1]);
    mat4.rotateZ(local, local, this.rotation[2]);
    mat4.scale(local, local, this.scale);

    // offset (если есть)
    if (this.offset && (this.offset[0] !== 0 || this.offset[1] !== 0 || this.offset[2] !== 0)) {
      mat4.translate(local, local, this.offset);
    }

    // Умножаем на parent
    mat4.multiply(this.worldMatrix, parentMatrix, local);

    // Рекурсивно для детей
    for (const child of this.children) {
      child.updateWorldMatrix(this.worldMatrix);
    }
  }

  // (Оставим attachTo/detach как есть, но теперь они должны вызывать updateWorldMatrix)
  attachTo(parentGO: GameObject3D, offset: [number, number, number] = [0, 0, 0]): this {
    if (this.parent) this.parent.children.delete(this);
    this.parent = parentGO;
    this.offset = [...offset];
    parentGO.children.add(this);
    this.updateWorldMatrix(parentGO.worldMatrix);
    return this;
  }
  detach(): this {
    if (this.parent) this.parent.children.delete(this);
    this.parent = null;
    this.updateWorldMatrix();
    return this;
  }

  get worldPosition(): [number, number, number] {
    // worldMatrix из матрицы вытаскиваем позицию
    return [
      this.worldMatrix[12],
      this.worldMatrix[13],
      this.worldMatrix[14]
    ];
  }

  private _computeBoundingRadius(positions: Float32Array): number {
    let max = 0;
    for (let i = 0; i < positions.length; i += 3) {
      const d = Math.hypot(positions[i], positions[i + 1], positions[i + 2]);
      if (d > max) max = d;
    }
    return max;
  }

  private _loadTexture(src: string): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const white = new Uint8Array([255, 255, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, white);

    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.textureLoaded = true;
    };
    img.src = src;
    return tex;
  }

  private _getAttribLocation(shaderProgram: WebGLProgram): number {
    if (!this.aPosLocMap.has(shaderProgram)) {
      const loc = this.gl.getAttribLocation(shaderProgram, 'aVertexPosition');
      this.aPosLocMap.set(shaderProgram, loc);
    }
    return this.aPosLocMap.get(shaderProgram)!;
  }

  renderWebGL3D(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    shaderProgram: WebGLProgram,
    uModel: WebGLUniformLocation,
    uAmbientColor: WebGLUniformLocation,
    uUseTexture: WebGLUniformLocation,
    uNormalMatrix: WebGLUniformLocation,
    parentMatrix: mat4 = mat4.create()
  ): void {


    // Если есть mesh — рендерим этот объект
    if (this.vertexBuffer && this.indexBuffer && this.vertexCount > 0) {
      const posLoc = this._getAttribLocation(shaderProgram);

      gl.uniformMatrix4fv(uModel, false, this.worldMatrix);

      const nrm = mat3.create();
      mat3.normalFromMat4(nrm, this.worldMatrix);
      gl.uniformMatrix3fv(uNormalMatrix, false, nrm);

      if (this.texture && this.textureLoaded) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(uUseTexture, true);
      } else {
        gl.uniform3fv(uAmbientColor, this.color.slice(0, 3));
        gl.uniform1i(uUseTexture, false);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(posLoc);

      // texCoords
      const texLoc = gl.getAttribLocation(shaderProgram, "aTexCoord");
      if (this.texCoordBuffer && texLoc !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texLoc);
      } else if (texLoc >= 0) {
        gl.disableVertexAttribArray(texLoc);
      }

      // normals
      const normLoc = gl.getAttribLocation(shaderProgram, 'aVertexNormal');
      if (this.normalBuffer && normLoc !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normLoc);
      } else if (normLoc >= 0) {
        gl.disableVertexAttribArray(normLoc);
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(gl.TRIANGLES, this.vertexCount, this.indexType, 0);
    }

    // После себя обязательно отрисовываем всех детей — с учётом текущей мировой матрицы
    for (const child of this.children) {
      child.renderWebGL3D(
        gl,
        shaderProgram,
        uModel,
        uAmbientColor,
        uUseTexture,
        uNormalMatrix,
        this.worldMatrix // прокидываем актуальный worldMatrix для детей
      );
    }
  }
}
