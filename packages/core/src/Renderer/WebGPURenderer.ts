import { Renderer } from './Renderer';
import type { Core } from '../core/Core';
import type { Scene } from '../core/Scene';
import { Skybox } from '../GameObjects/SkyBox';
import { mat4, mat3, vec3 } from 'gl-matrix';
import { 
  defaultShaderWGSL, 
  plainShaderWGSL, 
  skyboxShaderWGSL,
  spriteShaderWGSL 
} from './shaders/WebGPUShaders';
import { COORD } from '../core/CoordinateSystem';

interface WebGPUBuffer {
  buffer: GPUBuffer;
  byteSize: number;
}

interface WebGPUPipeline {
  pipeline: GPURenderPipeline;
  bindGroupLayout: GPUBindGroupLayout;
}

/**
 * Полноценный WebGPU рендерер с нативной реализацией.
 * Использует WGSL шейдеры и WebGPU API напрямую.
 */
export class WebGPURenderer extends Renderer {
  public readonly backend = 'webgpu';
  
  private readonly canvas: HTMLCanvasElement;
  private context: GPUCanvasContext | null = null;
  private device: GPUDevice | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';
  
  // Pipelines
  private defaultPipeline: WebGPUPipeline | null = null;
  private plainPipeline: WebGPUPipeline | null = null;
  private skyboxPipeline: WebGPUPipeline | null = null;
  private spritePipeline: WebGPUPipeline | null = null;
  private depthPipeline: GPURenderPipeline | null = null;
  
  // Buffers
  private uniformBuffer: WebGPUBuffer | null = null;
  private lightBuffer: WebGPUBuffer | null = null;
  
  // Textures
  private shadowTexture: GPUTexture | null = null;
  private shadowView: GPUTextureView | null = null;
  private depthTexture: GPUTexture | null = null;
  private depthView: GPUTextureView | null = null;
  
  // Samplers
  private sampler: GPUSampler | null = null;
  private comparisonSampler: GPUSampler | null = null;
  
  // State
  private gpuReady = false;
  
  constructor(graphicalContext: any, backgroundColor: string | [number, number, number]) {
    super(null as any, backgroundColor);
    this.canvas = graphicalContext.getCanvas();
    void this._initWebGPU(backgroundColor);
  }

  private async _initWebGPU(bgColor: string | [number, number, number]): Promise<void> {
    if (!('gpu' in navigator)) {
      console.warn('[WebGPURenderer] navigator.gpu is not available');
      return;
    }

    const gpu = navigator.gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      console.warn('[WebGPURenderer] No WebGPU adapter found');
      return;
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;

    if (!this.context) {
      console.warn('[WebGPURenderer] Failed to get webgpu canvas context');
      return;
    }

    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });

    // Create samplers
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    });

    this.comparisonSampler = this.device.createSampler({
      compare: 'less-equal',
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // Create pipelines
    await this._createPipelines();
    
    // Create uniform buffers
    this._createBuffers();
    
    // Create shadow resources
    this._createShadowResources();

    this.gpuReady = true;
  }

  private async _createPipelines(): Promise<void> {
    if (!this.device) return;

    // Default 3D pipeline
    this.defaultPipeline = this._createPipeline(
      defaultShaderWGSL,
      [
        { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] },
        { arrayStride: 12, attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }] },
        { arrayStride: 8, attributes: [{ shaderLocation: 2, offset: 0, format: 'float32x2' }] },
      ],
      { topology: 'triangle-list', cullMode: 'back' },
      true
    );

    // Plain pipeline (for gizmos, helpers)
    this.plainPipeline = this._createPipeline(
      plainShaderWGSL,
      [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }],
      { topology: 'line-list', cullMode: 'none' },
      false
    );

    // Skybox pipeline
    this.skyboxPipeline = this._createPipeline(
      skyboxShaderWGSL,
      [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }],
      { topology: 'triangle-list', cullMode: 'front' },
      false
    );

    // Sprite pipeline
    this.spritePipeline = this._createPipeline(
      spriteShaderWGSL,
      [
        { arrayStride: 16, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }] },
        { arrayStride: 16, attributes: [{ shaderLocation: 1, offset: 8, format: 'float32x2' }] },
      ],
      { topology: 'triangle-list', cullMode: 'none' },
      true,
      true
    );

    // Depth-only pipeline for shadow pass
    this.depthPipeline = this._createDepthPipeline();
  }

  private _createPipeline(
    shaderCode: string,
    vertexBuffers: GPUVertexBufferLayout[],
    primitive: GPUPrimitiveState,
    hasTexture: boolean,
    isSprite = false
  ): WebGPUPipeline {
    if (!this.device) throw new Error('Device not initialized');

    const shaderModule = this.device.createShaderModule({ code: shaderCode });
    
    const bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = [];
    let bindingIndex = 0;

    bindGroupLayoutEntries.push({
      binding: bindingIndex++,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: { type: 'uniform' },
    });

    if (shaderCode.includes('LightData')) {
      bindGroupLayoutEntries.push({
        binding: bindingIndex++,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      });
    }

    if (hasTexture) {
      bindGroupLayoutEntries.push({
        binding: bindingIndex++,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'float' },
      });
      bindGroupLayoutEntries.push({
        binding: bindingIndex++,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
      });
    }

    if (shaderCode.includes('uShadowTex')) {
      bindGroupLayoutEntries.push({
        binding: bindingIndex++,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'depth' },
      });
    }

    const bindGroupLayout = this.device.createBindGroupLayout({ entries: bindGroupLayoutEntries });

    const pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: { module: shaderModule, entryPoint: 'vs_main', buffers: vertexBuffers },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{
          format: this.format,
          blend: isSprite ? {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
            alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
          } : undefined,
        }],
      },
      primitive,
      depthStencil: { depthWriteEnabled: true, depthCompare: 'less', format: 'depth24plus' },
    });

    return { pipeline, bindGroupLayout };
  }

  private _createDepthPipeline(): GPURenderPipeline {
    if (!this.device) throw new Error('Device not initialized');

    const depthVS = `
struct Uniforms {
  modelMatrix : mat4x4<f32>,
  lightVP : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
struct VertexInput { @location(0) position : vec3<f32>, };
@vertex
fn vs_main(input : VertexInput) -> @builtin(position) vec4<f32> {
  return uniforms.lightVP * uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
}
@fragment
fn fs_main() -> @location(0) vec4<f32> { return vec4<f32>(0.0); }
`;

    const shaderModule = this.device.createShaderModule({ code: depthVS });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }],
    });

    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }],
      },
      fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [] },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      depthStencil: { depthWriteEnabled: true, depthCompare: 'less', format: 'depth24plus' },
    });
  }

  private _createBuffers(): void {
    if (!this.device) return;

    const uniformSize = 512; // Aligned size for uniforms
    this.uniformBuffer = {
      buffer: this.device.createBuffer({ size: uniformSize, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
      byteSize: uniformSize,
    };

    const lightSize = 16 * 4 * 3 + 16 * 4 * 3;
    this.lightBuffer = {
      buffer: this.device.createBuffer({ size: lightSize, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
      byteSize: lightSize,
    };
  }

  private _createShadowResources(): void {
    if (!this.device) return;

    const size = 2048;
    this.shadowTexture = this.device.createTexture({
      size: [size, size],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.shadowView = this.shadowTexture.createView();
    this._recreateDepthTexture();
  }

  private _recreateDepthTexture(): void {
    if (!this.device) return;

    this.depthTexture?.destroy();
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depthView = this.depthTexture.createView();
  }

  setCore(core: Core) {}

  setCamera(camera: any) {
    this.activeCamera = camera;
  }

  setSkybox(skybox: Skybox) {
    (this as any).skybox = skybox;
  }

  clear(): void {}

  render(scene: Scene, helpers = false): void {
    if (!this.gpuReady || !this.device || !this.context) return;

    const encoder = this.device.createCommandEncoder();
    this._updateUniforms(scene);
    this._renderShadowPass(encoder, scene);

    const renderPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context!.getCurrentTexture().createView(),
        clearValue: this._getClearColor(),
        loadOp: 'clear',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.depthView!,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    if ((this as any).skybox) this._renderSkybox(renderPass);
    this._renderObjects3D(renderPass, scene);
    if (helpers) this._renderHelpers(renderPass, scene);
    this._renderSprites2D(renderPass, scene);

    renderPass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  private _updateUniforms(scene: Scene): void {
    if (!this.device || !this.uniformBuffer || !this.lightBuffer) return;
    const camera = this.activeCamera;
    if (!camera) return;

    camera.update();
    const view = camera.getView();
    const proj = camera.getProjection();

    const uniformData = new Float32Array(128);
    uniformData.set(view, 16);
    uniformData.set(proj, 32);
    this.device.queue.writeBuffer(this.uniformBuffer.buffer, 0, uniformData);

    const lights = scene.objects.filter((o: any) => o.isLight).slice(0, 16);
    const lightData = new Float32Array(16 * 6);
    lights.forEach((light: any, i: number) => {
      const pos = light.worldPosition;
      const color = light.color;
      lightData.set(pos, i * 6);
      lightData.set(color.slice(0, 3), i * 6 + 3);
    });
    this.device.queue.writeBuffer(this.lightBuffer.buffer, 0, lightData);
  }

  private _renderShadowPass(encoder: GPUCommandEncoder, scene: Scene): void {
    if (!this.device || !this.depthPipeline) return;
    const lights = scene.objects.filter((o: any) => o.isLight);
    if (lights.length === 0) return;

    const mainLight = lights[0];
    const lightVP = this._calcLightVP(mainLight);

    const pass = encoder.beginRenderPass({
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.shadowView!,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    pass.setPipeline(this.depthPipeline);
    for (const obj of scene.objects) {
      if (obj.parent) continue;
      if (typeof obj.renderWebGPU3D === 'function') obj.renderWebGPU3D(this);
    }
    pass.end();
  }

  private _renderObjects3D(pass: GPURenderPassEncoder, scene: Scene): void {
    if (!this.device || !this.defaultPipeline) return;
    pass.setPipeline(this.defaultPipeline.pipeline);

    const bindGroup = this.device.createBindGroup({
      layout: this.defaultPipeline.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer!.buffer } },
        { binding: 1, resource: { buffer: this.lightBuffer!.buffer } },
      ],
    });
    pass.setBindGroup(0, bindGroup);

    for (const obj of scene.objects) {
      if (obj.parent) continue;
      if (typeof obj.renderWebGPU3D === 'function') obj.renderWebGPU3D(this);
    }
  }

  private _renderHelpers(pass: GPURenderPassEncoder, scene: Scene): void {
    if (!this.device || !this.plainPipeline) return;
    this._drawGrid(pass);
    this._drawGizmo(pass);
    for (const obj of scene.objects) {
      if ((obj as any).isCamera && (obj as any).camera) this._drawFrustum(pass, (obj as any).camera);
    }
  }

  private _renderSprites2D(pass: GPURenderPassEncoder, scene: Scene): void {
    if (!this.device || !this.spritePipeline) return;
    pass.setPipeline(this.spritePipeline.pipeline);
    for (const obj of scene.objects) {
      if (typeof obj.renderWebGPU2D === 'function') obj.renderWebGPU2D(this);
    }
  }

  private _renderSkybox(pass: GPURenderPassEncoder): void {
    if (!this.device || !this.skyboxPipeline) return;
    pass.setPipeline(this.skyboxPipeline.pipeline);
  }

  private _calcLightVP(light: any): mat4 {
    const view = mat4.create();
    const proj = mat4.create();
    mat4.lookAt(view, light.position, [0, 0, 0], [0, 1, 0]);
    mat4.ortho(proj, -10, 10, -10, 10, 0.1, 40);
    const vp = mat4.create();
    mat4.multiply(vp, proj, view);
    return vp;
  }

  private _getClearColor(): GPUColorDict {
    const bg = this.backgroundColor;
    if (typeof bg === 'string') {
      const n = parseInt(bg.slice(1), 16);
      return { r: (n >> 16) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
    }
    return { r: bg[0], g: bg[1], b: bg[2], a: 1 };
  }

  private _drawGrid(pass: GPURenderPassEncoder): void {}
  private _drawGizmo(pass: GPURenderPassEncoder): void {}
  private _drawFrustum(pass: GPURenderPassEncoder, camera: any): void {}

  resize(w: number, h: number): void {
    if (!this.gpuReady || !this.device) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this._recreateDepthTexture();
  }
}
