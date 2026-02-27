import { WebGLRenderer } from '../Renderer/WebGLRenderer';
import { WebGPURenderer } from '../Renderer/WebGPURenderer';
import { ColorMixin } from '../utils/ColorMixin';

export class GraphicalContext {
  private canvas: HTMLCanvasElement;
  private renderCanvas: HTMLCanvasElement;
  private ctx: WebGL2RenderingContext;
  private renderer: WebGLRenderer | WebGPURenderer;

  constructor(canvasId: string, background = '#000', width = 800, height = 600, rendererType: 'webgl' | 'webgpu' = 'webgl') {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) throw new Error(`Canvas "${canvasId}" not found`);
    this.canvas = canvas;

    this.canvas.width = width;
    this.canvas.height = height;

    this.renderCanvas = rendererType === 'webgpu' ? document.createElement('canvas') : this.canvas;
    this.renderCanvas.width = width;
    this.renderCanvas.height = height;

    this.ctx = this.renderCanvas.getContext('webgl2') as WebGL2RenderingContext;
    if (!this.ctx) throw new Error('WebGL2 is not supported in this browser');

    const clearColor = ColorMixin(background);
    this.renderer = rendererType === 'webgpu'
      ? new WebGPURenderer(this, clearColor)
      : new WebGLRenderer(this, clearColor);
  }

  getContext() { return this.ctx; }
  getCanvas() { return this.canvas; }
  getRenderCanvas() { return this.renderCanvas; }
  getRenderer() { return this.renderer; }

  resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;

    if (this.renderCanvas !== this.canvas) {
      this.renderCanvas.width = w;
      this.renderCanvas.height = h;
    }

    this.ctx.viewport(0, 0, w, h);
    this.renderer.resize?.(w, h);
  }
}
