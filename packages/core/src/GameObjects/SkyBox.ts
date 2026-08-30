import { mat4 } from "gl-matrix";
import { Shader } from "../Renderer/internal/Shader";
import { skyboxVertex, skyboxFragmentCube } from "../Renderer/shaders/SkyboxCubeShader";
import { loadCubemap } from "../utils/loadCubemap";
import { COORD } from "../core/CoordinateSystem";
export interface CubemapPaths {
  posx:string; negx:string; posy:string; negy:string; posz:string; negz:string;
}

export class Skybox {
  private ready=false;
  private shader:Shader;
  private vao:WebGLVertexArrayObject;
  private tex!:WebGLTexture;

  constructor(private gl:WebGL2RenderingContext, paths:CubemapPaths){
    this.shader = Shader.fromSource(gl, skyboxVertex, skyboxFragmentCube);
    this.vao    = this.initCubeVAO();
    this.load(paths);
  }

  render(view:mat4, proj:mat4){
    if(!this.ready) return;
    const g=this.gl;
    g.depthMask(false); g.disable(g.DEPTH_TEST);

        /* оставляем только yaw+pitch (строки 0…2), строка 1 используем как ‘up’) */
    this.shader.use();
    const v = COORD.getViewNoTranslation(view);
    g.uniformMatrix4fv(this.shader.uniform("uViewNoTrans")!, false, v);
    g.uniformMatrix4fv(this.shader.uniform("uProj")!,false,proj);

    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_CUBE_MAP,this.tex);
    g.uniform1i(this.shader.uniform("uSkyCube")!,0);

    g.bindVertexArray(this.vao);
    g.drawElements(g.TRIANGLES, 36, g.UNSIGNED_SHORT, 0);
    g.bindVertexArray(null);

    g.depthMask(true); g.enable(g.DEPTH_TEST);
  }

  /* ---------- private ---------- */
  private async load(p:CubemapPaths){
    this.tex = await loadCubemap(this.gl, COORD.resolveCubemapOrder(p));
    this.ready=true;
  }

  private initCubeVAO(){
    const g=this.gl;
    const V=new Float32Array([
      -1,-1,-1,  1,-1,-1,  1,1,-1, -1,1,-1,
      -1,-1, 1,  1,-1, 1,  1,1, 1, -1,1, 1
    ]);
    const idx=new Uint16Array([
      0,1,2,0,2,3, 4,6,5,4,7,6,
      3,2,6,3,6,7, 0,5,1,0,4,5,
      1,5,6,1,6,2, 0,3,7,0,7,4
    ]);
    const vao=g.createVertexArray()!;
    const vbo=g.createBuffer()!;
    const ibo=g.createBuffer()!;
    g.bindVertexArray(vao);
      g.bindBuffer(g.ARRAY_BUFFER,vbo);
      g.bufferData(g.ARRAY_BUFFER,V,g.STATIC_DRAW);
      g.enableVertexAttribArray(0);
      g.vertexAttribPointer(0,3,g.FLOAT,false,0,0);
      g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,ibo);
      g.bufferData(g.ELEMENT_ARRAY_BUFFER,idx,g.STATIC_DRAW);
    g.bindVertexArray(null);
    return vao;
  }
}
