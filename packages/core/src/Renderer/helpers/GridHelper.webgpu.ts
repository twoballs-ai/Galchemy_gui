import { COORD } from '../../core/CoordinateSystem';

export function drawGridWebGPU(
  device: GPUDevice,
  pass: GPURenderPassEncoder,
  pipeline: GPURenderPipeline,
  bindGroupLayout: GPUBindGroupLayout,
  camera: any
) {
  const cam = camera;
  if (!cam) return;

  const size = 500;
  const gridStep = 1;
  const A = COORD.RIGHT;
  const B = COORD.FORWARD;

  const gridLines: number[] = [];
  const xAxis: number[] = [];
  const zAxis: number[] = [];

  for (let i = -size; i <= size; i += gridStep) {
    if (i === 0) {
      xAxis.push(
        A[0] * -size, A[1] * -size, A[2] * -size,
        A[0] * size, A[1] * size, A[2] * size
      );
      zAxis.push(
        B[0] * -size, B[1] * -size, B[2] * -size,
        B[0] * size, B[1] * size, B[2] * size
      );
    } else {
      gridLines.push(
        A[0] * -size + B[0] * i, A[1] * -size + B[1] * i, A[2] * -size + B[2] * i,
        A[0] * size + B[0] * i, A[1] * size + B[1] * i, A[2] * size + B[2] * i
      );
      gridLines.push(
        B[0] * -size + A[0] * i, B[1] * -size + A[1] * i, B[2] * -size + A[2] * i,
        B[0] * size + A[0] * i, B[1] * size + A[1] * i, B[2] * size + A[2] * i
      );
    }
  }

  // Рисуем основные линии сетки (серые)
  drawLinesWebGPU(device, pass, pipeline, bindGroupLayout, new Float32Array(gridLines), [0.4, 0.4, 0.4, 0.4], camera);

  // Оси
  drawLinesWebGPU(device, pass, pipeline, bindGroupLayout, new Float32Array(xAxis), COORD.AXIS_X_COLOR, camera);
  drawLinesWebGPU(device, pass, pipeline, bindGroupLayout, new Float32Array(zAxis), COORD.AXIS_Z_COLOR, camera);
}

function drawLinesWebGPU(
  device: GPUDevice,
  pass: GPURenderPassEncoder,
  pipeline: GPURenderPipeline,
  bindGroupLayout: GPUBindGroupLayout,
  vertices: Float32Array,
  color: number[],
  camera: any
) {
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();

  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.draw(vertices.length / 3, 1, 0, 0);

  vertexBuffer.destroy();
}
