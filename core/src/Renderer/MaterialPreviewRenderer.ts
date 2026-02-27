// src/Renderer/MaterialPreviewRenderer.ts
import { mat4, vec3 } from "gl-matrix";
import { createSphereMesh, SphereMesh } from "../utils/SphereMeshPreview";
import { loadMaterialTextures, MaterialTextures } from "../utils/PreviewTextureLoader";
import { createPBRShaderProgram } from "./shaders/pbrShaderSrc";

// Тип для material.meta из material.json
export interface MaterialMeta {
  name: string;
  parameters?: {
    roughness?: number;
    metalness?: number;
  };
  colorMap?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
}

export class MaterialPreviewRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private material: MaterialMeta;
  private sphere!: SphereMesh;
  private program!: WebGLProgram;
  private textures!: MaterialTextures;
  private angle = 0;
  private _raf = 0;

    constructor(canvas: HTMLCanvasElement, material: MaterialMeta | undefined) {
    this.canvas   = canvas;
    this.material = material ?? { name: "EMPTY" };
    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL2 is not supported");
    this.gl = gl;
    this.init();
  }

  async init() {
    // Создание сферы
    this.sphere = createSphereMesh(0.6, 64, 32, this.gl);

    this.program = createPBRShaderProgram(this.gl);

    this.textures = await loadMaterialTextures(this.gl, this.material);

    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  private _animate = (time = 0) => {
    this.angle = (time * 0.001) % (Math.PI * 2);
    this.render();
    this._raf = requestAnimationFrame(this._animate);
  };

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  render() {
    if (!this.program) return;
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.12, 0.12, 0.14, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const model = mat4.create();
    mat4.rotateY(model, model, this.angle);
    const view = mat4.create();
    mat4.lookAt(view, [0, 0, 2.5], [0, 0, 0], [0, 1, 0]);
    const proj = mat4.create();
    mat4.perspective(proj, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 20);

    gl.useProgram(this.program);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uModel"), false, model);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uView"), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uProj"), false, proj);

    gl.uniform3fv(
      gl.getUniformLocation(this.program, "uLightDir"),
      vec3.normalize(vec3.create(), [-1, 2, 2])
    );
    gl.uniform3fv(gl.getUniformLocation(this.program, "uCameraPos"), [0, 0, 2.4]);

    gl.uniform1f(
      gl.getUniformLocation(this.program, "uMetallic"),
      this.material.parameters?.metalness ?? 0.0
    );
    gl.uniform1f(
      gl.getUniformLocation(this.program, "uRoughness"),
      this.material.parameters?.roughness ?? 0.7
    );


    this.textures.bind(gl, this.program);
    this.sphere.render(gl, this.program);
  }

}
