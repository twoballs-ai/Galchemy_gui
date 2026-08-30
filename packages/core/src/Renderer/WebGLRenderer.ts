import { Renderer } from "./Renderer";
import { SpriteRenderer } from "./SpriteRenderer";
import { GridHelper } from "./helpers/GridHelper"; // <-- ИЗМЕНЕНО: импортируем класс вместо функции
import { drawGizmo } from "./helpers/GizmoHelper";
import type { Scene } from "../core/Scene";
import { TransformGizmo } from "./helpers/TransformGizmo";
import { drawMeshOutline } from "./helpers/MeshOutlineHelper";
import { vertexShaderSrc, fragmentShaderSrc } from "./shaders/DefaultShader";
import { plainVertexShader, plainFragmentShader } from "./shaders/PlainShader";
import { initShadowMap, initDepthProgram, calcLightVP } from "./internal/ShadowUtils";
import { drawCameraFrustum } from './helpers/FrustumHelper';
import { COORD } from "../core/CoordinateSystem";
import { Shader } from "./internal/Shader";
import { Skybox } from "../GameObjects/SkyBox";
import type { Core } from "../core/Core";
import type { IGameObject } from "../types/CoreTypes";
import { mat4 } from "gl-matrix";

export class WebGLRenderer extends Renderer {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  transformGizmo = new TransformGizmo();
  private gridHelper: GridHelper; // <-- ДОБАВЛЕНО: свойство для хранения экземпляра
  
  gridSize = 10;
  gridStep = 1;
  public selectedObject: IGameObject | null = null;
  
  private uNormalMatrix!: WebGLUniformLocation;
  private uLightPos!: WebGLUniformLocation;
  private uViewPos!: WebGLUniformLocation;
  private uAmbientColor!: WebGLUniformLocation;
  private uSpecularColor!: WebGLUniformLocation;
  private uShininess!: WebGLUniformLocation;
  private defaultShader!: Shader;
  private plainShader!: Shader;
  private uModel!: WebGLUniformLocation;
  private uView!: WebGLUniformLocation;
  private uProj!: WebGLUniformLocation;
  private uColor!: WebGLUniformLocation;
  private uUseTexture!: WebGLUniformLocation;
  private uTexture!: WebGLUniformLocation;
  
  private shadowFBO!: WebGLFramebuffer;
  private shadowTex!: WebGLTexture;
  private depthProgram!: WebGLProgram;
  private shaderProgram!: WebGLProgram;
  private uDepthModel!: WebGLUniformLocation;
  private uDepthLightVP!: WebGLUniformLocation;
  private aPos: number = -1;
  private aTexCoord: number = -1;
  private skybox: Skybox | null = null;

  private plain_uModel!: WebGLUniformLocation;
  private plain_uView!: WebGLUniformLocation;
  private plain_uProj!: WebGLUniformLocation;
  private plain_uColor!: WebGLUniformLocation;
  private spriteRenderer: SpriteRenderer;
  private plain_aPos: number = -1; 

  public core: Core | null = null;

  constructor(graphicalContext: any, backgroundColor: string | [number, number, number]) {
    super(graphicalContext.getContext(), backgroundColor);

    this.canvas = graphicalContext.getRenderCanvas?.() ?? graphicalContext.getCanvas();
    this.gl = graphicalContext.getContext() as WebGL2RenderingContext;
    COORD.setGL(this.gl);

    this._initWebGL(backgroundColor);
    this._initShaders();
    this._setupProjection();
    
    initShadowMap(this);
    initDepthProgram(this);

    // <-- ДОБАВЛЕНО: инициализация GridHelper (буферы создаются один раз)
    this.gridHelper = new GridHelper(this.gl, this.gridStep);

    this.spriteRenderer = new SpriteRenderer(
      this.gl,
      this.canvas.width,
      this.canvas.height
    );
  }

  setCore(core: Core) {
    this.core = core;
  }

  setSkybox(skybox: Skybox) {
    this.skybox = skybox;
  }

  private _initWebGL(bg: string | [number, number, number]): void {
    const [r, g, b] = typeof bg === "string" ? this._hexToRGB(bg) : bg;
    const gl = this.gl;
    gl.clearColor(r, g, b, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private _hexToRGB(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  private _loadShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  }

  private _initShaders(): void {
    const gl = this.gl;

    this.defaultShader = Shader.fromSource(gl, vertexShaderSrc, fragmentShaderSrc);
    this.shaderProgram = this.defaultShader.program;
    this.defaultShader.use();

    this.uNormalMatrix  = this.defaultShader.uniform("uNormalMatrix")!;
    this.uLightPos      = this.defaultShader.uniform("uLightPos")!;
    this.uViewPos       = this.defaultShader.uniform("uViewPos")!;
    this.uAmbientColor  = this.defaultShader.uniform("uAmbientColor")!;
    this.uSpecularColor = this.defaultShader.uniform("uSpecularColor")!;
    this.uShininess     = this.defaultShader.uniform("uShininess")!;
    this.uModel         = this.defaultShader.uniform("uModel")!;
    this.uView          = this.defaultShader.uniform("uView")!;
    this.uProj          = this.defaultShader.uniform("uProjection")!;
    this.uColor         = this.defaultShader.uniform("uColor")!;
    this.uUseTexture    = this.defaultShader.uniform("uUseTexture")!;
    this.uTexture       = this.defaultShader.uniform("uTexture")!;

    this.aPos      = this.defaultShader.attrib("aVertexPosition");
    this.aTexCoord = this.defaultShader.attrib("aTexCoord");
    gl.enableVertexAttribArray(this.aPos);
    gl.enableVertexAttribArray(this.aTexCoord);

    this.plainShader = Shader.fromSource(gl, plainVertexShader, plainFragmentShader);
    (this as any).plainShaderProgram = this.plainShader.program;

    this.plain_uModel = this.plainShader.uniform("uModel")!;
    this.plain_uView  = this.plainShader.uniform("uView")!;
    this.plain_uProj  = this.plainShader.uniform("uProjection")!;
    this.plain_uColor = this.plainShader.uniform("uColor")!;
    this.plain_aPos   = this.plainShader.attrib("aVertexPosition");
  }

  private _setupProjection(): void {
    const gl = this.gl;
    const cam = this.activeCamera;

    const proj = COORD.perspective(
      (cam?.fov ?? 45) * Math.PI / 180,
      this.canvas.width / this.canvas.height,
      cam?.near ?? 0.1,
      cam?.far ?? 100
    );

    this.defaultShader.use();
    gl.uniformMatrix4fv(this.uProj, false, proj);
  }

  setCamera(camera: any) {
    this.activeCamera = camera;
    camera.update();
  
    this.defaultShader.use();
    this.gl.uniformMatrix4fv(this.uProj, false, camera.getProjection());
    this.gl.uniformMatrix4fv(this.uView, false, camera.getView());
  }

  clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  render(scene: Scene, helpers = false): void {
    const gl = this.gl;

    for (const o of scene.objects) {
      if (o.parent) continue;
      if (typeof o.updateWorldMatrix === "function") {
        o.updateWorldMatrix();
      }
    }

    this.clear();
    if (this.skybox) {
      this.skybox.render(this.activeCamera.getView(), this.activeCamera.getProjection());
    }

    this.defaultShader.use();
    const eye = this.activeCamera.position;
    gl.uniform3fv(this.uViewPos, eye);

    const lights = scene.objects.filter(o => (o as any).isLight).slice(0, 16);

    // --- 4) Shadow map ---
    let lightVP: mat4 | null = null;
    if (lights.length > 0) {
      const mainLight = lights[0];
      lightVP = calcLightVP(mainLight);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFBO);
      gl.viewport(0, 0, 2048, 2048);
      gl.clear(gl.DEPTH_BUFFER_BIT);

      gl.useProgram(this.depthProgram);
      gl.uniformMatrix4fv(this.uDepthLightVP, false, lightVP);

      for (const o of scene.objects) {
        if (o.parent) continue;
        
        if ((o as any).isEditorOnly || (o as any).isLight) continue;

        if (typeof o.renderWebGL3D === "function") {
          o.renderWebGL3D(
            gl, 
            this.shaderProgram,
            this.uModel, 
            this.uAmbientColor,
            this.uUseTexture, 
            this.uNormalMatrix
          );
        }
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // --- 5) Основной рендеринг ---
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    this.defaultShader.use();

    if (lightVP) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
      gl.uniform1i(gl.getUniformLocation(this.shaderProgram, 'uShadowTex')!, 1);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, 'uLightVP')!, false, lightVP);
    }

    const MAX_LIGHTS = 16;
    const lightPositions = new Float32Array(3 * MAX_LIGHTS);
    const lightColors = new Float32Array(3 * MAX_LIGHTS);
    
    lights.forEach((l, i) => {
      const [x, y, z] = (l as any).worldPosition;
      const [r, g, b] = l.color.slice(0, 3);
      const intensity = typeof (l as any).intensity === "number" ? (l as any).intensity : 1.0;
      lightPositions.set([x, y, z], i * 3);
      lightColors.set([r * intensity, g * intensity, b * intensity], i * 3);
    });

    if (lights.length > 0) {
      const uLightPositionsLoc = gl.getUniformLocation(this.shaderProgram, 'uLightPositions');
      const uLightColorsLoc = gl.getUniformLocation(this.shaderProgram, 'uLightColors');
      if (uLightPositionsLoc && uLightColorsLoc) {
        gl.uniform1i(gl.getUniformLocation(this.shaderProgram, 'uLightCount')!, lights.length);
        gl.uniform3fv(uLightPositionsLoc, lightPositions);
        gl.uniform3fv(uLightColorsLoc, lightColors);
      }
    }

    gl.uniform3fv(this.uSpecularColor, [1, 1, 1]);
    gl.uniform1f(this.uShininess, 32.0);
    
    this.activeCamera.update();
    gl.uniformMatrix4fv(this.uView, false, this.activeCamera.getView());
    gl.uniformMatrix4fv(this.uProj, false, this.activeCamera.getProjection());

    // --- 6) Основные объекты ---
    for (const o of scene.objects) {
      if (o.parent) continue;
      if (typeof o.renderWebGL3D === "function") {
        o.renderWebGL3D(
          gl,
          this.shaderProgram,
          this.uModel,
          this.uAmbientColor,
          this.uUseTexture,
          this.uNormalMatrix
        );
        
        if (o === this.core?.scene.selectedObject) {
          drawMeshOutline({
            gl,
            mesh: (o as any).mesh,
            vertexBuffer: (o as any).vertexBuffer,
            uniforms: {
              uUseTexture: this.uUseTexture,
              uColor: this.uColor
            },
            attribs: {
              aPos: this.aPos,
              aTexCoord: this.aTexCoord
            },
            state: o
          });
        }
      }
    }

    // --- 7) Помощники ---
    if (helpers) {
      this.gridHelper.render(this); // <-- ИЗМЕНЕНО: вызываем метод класса вместо старой функции
      drawGizmo(this);
      for (const o of scene.objects) {
        if ((o as any).isCamera && (o as any).camera) {
          drawCameraFrustum(this.gl, this, (o as any).camera);
        }
      }
    }

    // --- 8) Спрайты ---
    for (const o of scene.objects) {
      if (typeof (o as any).renderWebGL2D === "function") {
        (o as any).renderWebGL2D(this.spriteRenderer);
      }
    }

    // --- 9) Трансформ-гизмо ---
    this.transformGizmo.draw(this);
    this.spriteRenderer.flush();
  }

  resize(w: number, h: number): void {
    this.gl.viewport(0, 0, w, h);
    this._setupProjection();
    this.spriteRenderer.resize(w, h);
  }
}