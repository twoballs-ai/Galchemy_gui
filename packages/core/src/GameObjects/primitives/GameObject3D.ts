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
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string | number[];
  textureSrc?: string;
  roughness?: number;
  metalness?: number;
  // ─── Новые поля для спрайта ───
  isSprite?: boolean;            // флаг "это спрайт"
  disableCulling?: boolean;      // отключить backface culling
  spritePlane?: "xy" | "xz" | "yz";
}

export class GameObject3D {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  parent: GameObject3D | null = null;
  children: Set<GameObject3D> = new Set();
  offset: [number, number, number] = [0, 0, 0];

  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  worldMatrix: mat4 = mat4.create();

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

  // ─── Поля для спрайта ───
  isSprite: boolean = false;
  disableCulling: boolean = false;
  spritePlane: "xy" | "xz" | "yz" = "xy";

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
      metalness = 0.0,
      isSprite = false,
      disableCulling = false,
      spritePlane = "xy",
    }: GameObject3DOptions = {}
  ) {
    this.gl = gl;
    this.mesh = mesh;
    this.position = [...position];
    this.rotation = [...rotation];
    this.scale = [...scale];
    this.roughness = roughness;
    this.metalness = metalness;

    this.isSprite = isSprite;
    this.disableCulling = disableCulling;
    this.spritePlane = spritePlane;

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
    const local = mat4.create();
    mat4.translate(local, local, this.position);
    mat4.rotateX(local, local, this.rotation[0]);
    mat4.rotateY(local, local, this.rotation[1]);
    mat4.rotateZ(local, local, this.rotation[2]);
    mat4.scale(local, local, this.scale);

    if (this.offset && (this.offset[0] !== 0 || this.offset[1] !== 0 || this.offset[2] !== 0)) {
      mat4.translate(local, local, this.offset);
    }

    mat4.multiply(this.worldMatrix, parentMatrix, local);

    for (const child of this.children) {
      child.updateWorldMatrix(this.worldMatrix);
    }
  }

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

  /**
   * Загружает новую текстуру в объект (заменяет предыдущую).
   */
  setTexture(src: string): void {
    this.texture = this._loadTexture(src);
    this.textureLoaded = false; // _loadTexture выставит true в onload
  }

  /**
   * Заменяет меш объекта. Используется, например, для смены плоскости или
   * размера спрайта без пересоздания всего GameObject3D.
   */
  replaceMesh(newMesh: Mesh): void {
    const gl = this.gl;

    // Удаляем старые буферы
    if (this.vertexBuffer)   { gl.deleteBuffer(this.vertexBuffer);   this.vertexBuffer   = null; }
    if (this.indexBuffer)    { gl.deleteBuffer(this.indexBuffer);    this.indexBuffer    = null; }
    if (this.texCoordBuffer) { gl.deleteBuffer(this.texCoordBuffer); this.texCoordBuffer = null; }
    if (this.normalBuffer)   { gl.deleteBuffer(this.normalBuffer);   this.normalBuffer   = null; }

    this.mesh = newMesh;

    const hasValidMesh = newMesh && newMesh.positions && newMesh.indices;
    if (!hasValidMesh) {
      this.boundingRadius = 0;
      this.vertexCount = 0;
      return;
    }

    this.boundingRadius = this._computeBoundingRadius(newMesh.positions);

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, newMesh.positions, gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, newMesh.indices, gl.STATIC_DRAW);

    this.vertexCount = newMesh.indices.length;
    this.indexType = newMesh.indices.BYTES_PER_ELEMENT === 2
      ? gl.UNSIGNED_SHORT
      : gl.UNSIGNED_INT;

    if (newMesh.texCoords) {
      this.texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, newMesh.texCoords, gl.STATIC_DRAW);
    } else {
      this.texCoordBuffer = null;
    }

    if (newMesh.normals) {
      this.normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, newMesh.normals, gl.STATIC_DRAW);
    } else {
      this.normalBuffer = null;
    }
  }

  protected _getAttribLocation(shaderProgram: WebGLProgram): number {
    if (!this.aPosLocMap.has(shaderProgram)) {
      const loc = this.gl.getAttribLocation(shaderProgram, 'aVertexPosition');
      this.aPosLocMap.set(shaderProgram, loc);
    }
    return this.aPosLocMap.get(shaderProgram)!;
  }

  renderWebGL3D(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    shaderProgram: WebGLProgram,
    uModel: WebGLUniformLocation | null,
    uAmbientColor: WebGLUniformLocation | null,
    uUseTexture: WebGLUniformLocation | null,
    uNormalMatrix: WebGLUniformLocation | null,
    parentMatrix: mat4 = mat4.create()
  ): void {
    // ─── Отключаем backface culling для спрайтов, чтобы они были видны с обеих сторон ───
    const wasCullingEnabled = this.disableCulling ? gl.isEnabled(gl.CULL_FACE) : false;
    if (this.disableCulling && wasCullingEnabled) {
      gl.disable(gl.CULL_FACE);
    }

    gl.useProgram(shaderProgram);

    if (this.vertexBuffer && this.indexBuffer && this.vertexCount > 0) {
      const posLoc = this._getAttribLocation(shaderProgram);

      if (uModel) {
        gl.uniformMatrix4fv(uModel, false, this.worldMatrix);
      }

      if (uNormalMatrix) {
        const nrm = mat3.create();
        mat3.normalFromMat4(nrm, this.worldMatrix);
        gl.uniformMatrix3fv(uNormalMatrix, false, nrm);
      }

      if (this.texture && this.textureLoaded) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        if (uUseTexture) gl.uniform1i(uUseTexture, 1);
      } else {
        if (uAmbientColor) gl.uniform3fv(uAmbientColor, this.color.slice(0, 3));
        if (uUseTexture) gl.uniform1i(uUseTexture, 0);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(posLoc);

      const texLoc = gl.getAttribLocation(shaderProgram, "aTexCoord");
      if (this.texCoordBuffer && texLoc !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texLoc);
      } else if (texLoc >= 0) {
        gl.disableVertexAttribArray(texLoc);
      }

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
      
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    for (const child of this.children) {
      child.renderWebGL3D(
        gl,
        shaderProgram,
        uModel,
        uAmbientColor,
        uUseTexture,
        uNormalMatrix,
        this.worldMatrix
      );
    }

    // ─── Восстанавливаем состояние culling ───
    if (this.disableCulling && wasCullingEnabled) {
      gl.enable(gl.CULL_FACE);
    }
  }

  renderWebGPU3D(renderer: any): void {
    const device = renderer.device;
    if (!device || !this.vertexBuffer || !this.indexBuffer || this.vertexCount === 0) return;

    if (!(this as any)._gpuVertexBuffer) {
      (this as any)._gpuVertexBuffer = device.createBuffer({
        size: this.mesh!.positions.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer((this as any)._gpuVertexBuffer, 0, this.mesh!.positions);
    }

    if (!(this as any)._gpuIndexBuffer) {
      (this as any)._gpuIndexBuffer = device.createBuffer({
        size: this.mesh!.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer((this as any)._gpuIndexBuffer, 0, this.mesh!.indices);
    }

    const modelMatrix = this.worldMatrix;
  }
}