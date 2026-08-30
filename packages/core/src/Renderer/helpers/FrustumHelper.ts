import { vec3 } from 'gl-matrix';
import type { CameraInterface } from '../../types/RendererTypes';
import { COORD } from '../../core/CoordinateSystem';
import { drawLines } from '../internal/drawLines'; // путь укажи свой
import type { WebGLRenderer } from '../renderers/WebGLRenderer';

export function drawCameraFrustum(
  gl: WebGL2RenderingContext,
  ctx: WebGLRenderer,
  cam: CameraInterface
) {
  const pos = cam.position;
  const tgt = cam.lookAt;

  const forward = vec3.normalize([], vec3.subtract([], tgt, pos));
  const right   = vec3.normalize([], vec3.cross([], forward, cam.up));
  const upDir   = vec3.normalize([], vec3.cross([], right, forward));

  const fovRad   = (cam.fov * Math.PI) / 180;
  const nearDist = cam.near;
  const farDist  = Math.min(cam.far, 20);

  const hNear = Math.tan(fovRad / 2) * nearDist;
  const wNear = hNear * (cam.width / cam.height);
  const hFar  = Math.tan(fovRad / 2) * farDist;
  const wFar  = hFar * (cam.width / cam.height);

  const nc = vec3.scaleAndAdd([], pos, forward, nearDist);
  const fc = vec3.scaleAndAdd([], pos, forward, farDist);

  const ntl = vec3.add([], vec3.add([], nc, vec3.scale([], upDir, hNear)), vec3.scale([], right, -wNear));
  const ntr = vec3.add([], vec3.add([], nc, vec3.scale([], upDir, hNear)), vec3.scale([], right, wNear));
  const nbl = vec3.add([], vec3.add([], nc, vec3.scale([], upDir, -hNear)), vec3.scale([], right, -wNear));
  const nbr = vec3.add([], vec3.add([], nc, vec3.scale([], upDir, -hNear)), vec3.scale([], right, wNear));

  const ftl = vec3.add([], vec3.add([], fc, vec3.scale([], upDir, hFar)), vec3.scale([], right, -wFar));
  const ftr = vec3.add([], vec3.add([], fc, vec3.scale([], upDir, hFar)), vec3.scale([], right, wFar));
  const fbl = vec3.add([], vec3.add([], fc, vec3.scale([], upDir, -hFar)), vec3.scale([], right, -wFar));
  const fbr = vec3.add([], vec3.add([], fc, vec3.scale([], upDir, -hFar)), vec3.scale([], right, wFar));

  const lines = new Float32Array([
    ...pos, ...ftl, ...pos, ...ftr, ...pos, ...fbr, ...pos, ...fbl,
    ...ftl, ...ftr, ...ftr, ...fbr, ...fbr, ...fbl, ...fbl, ...ftl
  ]);

  drawLines(
    gl,
    ctx.plain_aPos,
    ctx.plain_uColor,
    lines,
    [1, 1, 0, 1], 
    ctx // передаём WebGLRenderer как ctx
  );
}
