import { Renderer } from './Renderer';
import { WebGLRenderer } from './WebGLRenderer';
import type { Core } from '../core/Core';
import type { Scene } from '../core/Scene';
import { Skybox } from '../GameObjects/SkyBox';

/**
 * WebGPU backend.
 *
 * Рендер 3D/2D сцены выполняется проверенным WebGL пайплайном в offscreen-canvas,
 * после чего кадр композится в целевой canvas через WebGPU.
 *
 * Это даёт рабочий runtime на реальном WebGPU-контексте без дублирования всей логики сцены.
 */
export class WebGPURenderer extends Renderer {
  public readonly backend = 'webgpu';

  private readonly canvas: HTMLCanvasElement;
  private readonly glRenderer: WebGLRenderer;
  private readonly sourceCanvas: HTMLCanvasElement;

  private context: any = null;
  private device: any = null;
  private format: string = 'bgra8unorm';

  private presentPipeline: any = null;
  private presentSampler: any = null;
  private presentTexture: any = null;
  private presentBindGroup: any = null;

  private gpuReady = false;

  constructor(graphicalContext: any, backgroundColor: string | [number, number, number]) {
    super(graphicalContext.getContext(), backgroundColor);

    this.canvas = graphicalContext.getCanvas();
    this.sourceCanvas = graphicalContext.getRenderCanvas?.() ?? this.canvas;
    this.glRenderer = new WebGLRenderer(graphicalContext, backgroundColor);

    void this._initWebGPU();
  }

  private async _initWebGPU(): Promise<void> {
    if (!('gpu' in navigator)) {
      console.warn('[WebGPURenderer] navigator.gpu is not available');
      return;
    }

    const gpu = (navigator as any).gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      console.warn('[WebGPURenderer] No WebGPU adapter found');
      return;
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu') as any;

    if (!this.context) {
      console.warn('[WebGPURenderer] Failed to get webgpu canvas context');
      return;
    }

    this.format = gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });

    const shader = this.device.createShaderModule({
      code: `
        @vertex
        fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
          var pos = array<vec2f, 3>(
            vec2f(-1.0, -3.0),
            vec2f(-1.0,  1.0),
            vec2f( 3.0,  1.0)
          );
          return vec4f(pos[vertexIndex], 0.0, 1.0);
        }

        @group(0) @binding(0) var srcSampler : sampler;
        @group(0) @binding(1) var srcTex : texture_2d<f32>;

        @fragment
        fn fs_main(@builtin(position) fragCoord : vec4f) -> @location(0) vec4f {
          let uv = fragCoord.xy / vec2f(textureDimensions(srcTex));
          return textureSample(srcTex, srcSampler, uv);
        }
      `,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: (globalThis as any).GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 1, visibility: (globalThis as any).GPUShaderStage.FRAGMENT, texture: {} },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.presentPipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: { module: shader, entryPoint: 'vs_main' },
      fragment: {
        module: shader,
        entryPoint: 'fs_main',
        targets: [{ format: this.format }],
      },
      primitive: { topology: 'triangle-list' },
    });

    this.presentSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    this._recreatePresentTexture();
    this.gpuReady = true;
  }

  private _recreatePresentTexture(): void {
    if (!this.device || !this.presentSampler) return;

    this.presentTexture?.destroy();
    this.presentTexture = this.device.createTexture({
      size: {
        width: this.canvas.width,
        height: this.canvas.height,
      },
      format: 'rgba8unorm',
      usage: (globalThis as any).GPUTextureUsage.TEXTURE_BINDING | (globalThis as any).GPUTextureUsage.COPY_DST,
    });

    this.presentBindGroup = this.device.createBindGroup({
      layout: this.presentPipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.presentSampler },
        { binding: 1, resource: this.presentTexture.createView() },
      ],
    });
  }

  setCore(core: Core) {
    this.glRenderer.setCore(core);
  }

  setCamera(camera: any) {
    this.glRenderer.setCamera(camera);
  }

  setSkybox(skybox: Skybox) {
    this.glRenderer.setSkybox(skybox);
  }

  clear(): void {
    this.glRenderer.clear();
  }

  render(scene: Scene, helpers = false): void {
    this.glRenderer.render(scene, helpers);

    if (!this.gpuReady || !this.device || !this.context || !this.presentPipeline || !this.presentTexture || !this.presentBindGroup) {
      return;
    }

    this.device.queue.copyExternalImageToTexture(
      { source: this.sourceCanvas },
      { texture: this.presentTexture },
      {
        width: this.canvas.width,
        height: this.canvas.height,
      }
    );

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });

    pass.setPipeline(this.presentPipeline);
    pass.setBindGroup(0, this.presentBindGroup);
    pass.draw(3, 1, 0, 0);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }

  resize(w: number, h: number): void {
    this.glRenderer.resize(w, h);

    if (!this.gpuReady || !this.device || !this.context) return;

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });
    this._recreatePresentTexture();
  }
}
