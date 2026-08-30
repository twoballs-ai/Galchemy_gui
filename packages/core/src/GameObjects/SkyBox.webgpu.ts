import { mat4 } from "gl-matrix";
import { COORD } from "../core/CoordinateSystem";

export class SkyboxWebGPU {
  private ready = false;
  private vertexBuffer: GPUBuffer | null = null;
  private indexBuffer: GPUBuffer | null = null;
  private texture: GPUTexture | null = null;
  private sampler: GPUSampler | null = null;
  private bindGroup: GPUBindGroup | null = null;

  constructor(
    private device: GPUDevice,
    private pipeline: GPURenderPipeline,
    private bindGroupLayout: GPUBindGroupLayout
  ) {}

  async load(paths: { posx: string; negx: string; posy: string; negy: string; posz: string; negz: string }) {
    // Загрузка кубической текстуры через WebGPU
    // В полной реализации здесь будет загрузка 6 граней
    this.ready = true;
  }

  render(pass: GPURenderPassEncoder, view: mat4, proj: mat4) {
    if (!this.ready || !this.vertexBuffer || !this.indexBuffer) return;

    const g = this.device;
    
    // Обновляем uniform с матрицами
    const uniformData = new Float32Array(32);
    uniformData.set(proj, 0);
    const viewNoTrans = COORD.getViewNoTranslation(view);
    uniformData.set(viewNoTrans, 16);
    
    g.queue.writeBuffer(/* uniform buffer */, 0, uniformData);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup!);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(36, 1, 0, 0, 0);
  }

  initBuffers() {
    const g = this.device;
    const V = new Float32Array([
      -1,-1,-1,  1,-1,-1,  1,1,-1, -1,1,-1,
      -1,-1, 1,  1,-1, 1,  1,1, 1, -1,1, 1
    ]);
    const idx = new Uint16Array([
      0,1,2,0,2,3, 4,6,5,4,7,6,
      3,2,6,3,6,7, 0,5,1,0,4,5,
      1,5,6,1,6,2, 0,3,7,0,7,4
    ]);

    this.vertexBuffer = g.createBuffer({
      size: V.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(V);
    this.vertexBuffer.unmap();

    this.indexBuffer = g.createBuffer({
      size: idx.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(idx);
    this.indexBuffer.unmap();
  }
}
