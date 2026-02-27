import { Core } from './Core';
import { primitiveFactory } from '../GameObjects/PrimitiveFactory'; // фабрика примитивов
import { extractFirstMesh, extractMeshes, importGLB, loadGLB } from '../utils/GLTFLoader';
import { EditorMode } from './modes/EditorMode';
import { PreviewMode } from './modes/PreviewMode';
import { patchObject, updateGeometry } from './helpers/objectUpdater';
import { MaterialPreviewRenderer, MaterialMeta } from '../Renderer/MaterialPreviewRenderer';
import type { CubemapPaths } from "../GameObjects/SkyBox";
// Реэкспорт
export { GameObject3D } from '../GameObjects/primitives/GameObject3D';
export { primitiveFactory } from '../GameObjects/PrimitiveFactory';

// --- Вспомогательные типы
interface SpawnOptions {
  position?: [number, number, number];
  color?: string;
  size?: number;
  radius?: number;
  height?: number;
  segments?: number;
}

class GameFacade {
  private core: Core | null = null;

  /* -------- init / режимы ------------------------------------ */

  init({ canvasId, w, h, bg = '#000', renderer = 'webgl' }: { canvasId: string; w: number; h: number; bg?: string; renderer?: 'webgl' | 'webgpu' }): this {
    this.core = new Core({
      canvasId,
      width: w,
      height: h,
      backgroundColor: bg,
      rendererType: renderer,
    });

    (this.core as any).game = this; // ссылка «обратно»
    return this;
  }

  setEditorMode(): this {
    this.core!.setMode(new EditorMode());
    return this;
  }

  setPreviewMode(): this {
    this.core!.setMode(new PreviewMode());
    return this;
  }

  setDebug(on = true): this {
    this.core!.setDebugLogging(on);
    return this;
  }
  setSkybox(paths: CubemapPaths) {
    this.core?.loadSkybox(paths);
  }
  physics({ gravity = 0 } = {}): this {
    this.core!.enablePhysics({ gravity });
    return this;
  }

  patchObject(id: string, props: any): void {
    patchObject(this.core!, id, props);
  }

  /** Обновление геометрии + патч остальных свойств */
  updateObject(id: string, type: string, props: any): void {
    updateGeometry(this.core!, id, type, props);
  }

  /* -------- 3-D примитивы ----------------------- */

  spawnPrimitive(type: string, opts: SpawnOptions = {}): any {
    const gl = this.core!.ctx;
    const go = primitiveFactory.create(type, gl, opts);
    this.core!.add(go);
    return go;
  }

  spawnCamera(opts: Record<string, any> = {}): any {
    const gl = this.core!.ctx;
    const camObj = primitiveFactory.create('camera', gl, opts);
    this.core!.add(camObj);
    return camObj;
  }

  spawnLight(opts: Record<string, any> = {}): any {
    const { subtype = 'point', ...rest } = opts;
    const lightObj = { type: 'light', subtype, ...rest };
    this.core!.add(lightObj);
    return lightObj;
  }

  spawnTerrain(opts: Record<string, any> = {}): any {
    const terrainObj = { type: 'terrain', ...opts };
    this.core!.add(terrainObj);
    return terrainObj;
  }

  createMaterialPreview(
    canvas: HTMLCanvasElement,
    meta: MaterialMeta | undefined
  ): MaterialPreviewRenderer | null {
    if (!meta || !meta.colorMap) {
      console.warn('createMaterialPreview: пропуск, meta отсутствует или без colorMap', meta);
      return null;
    }
    return new MaterialPreviewRenderer(canvas, meta);
  }

  spawnSphere(r = 2, seg = 24, pos = [0, -5, 0] as [number, number, number], color = '#fff'): any {
    return this.spawnPrimitive('sphere', { radius: r, segments: seg, position: pos, color });
  }

  spawnCube(size = 1, pos = [0, -5, 0] as [number, number, number], color = '#e74c3c'): any {
    return this.spawnPrimitive('cube', { size, position: pos, color });
  }

  spawnCylinder(r = 1, h = 2, pos = [0, -5, 0] as [number, number, number], color = '#2ecc71'): any {
    return this.spawnPrimitive('cylinder', { radius: r, height: h, position: pos, color });
  }

  /* -------- загрузка glTF ----------------------------------- */
async spawn3DModel(
  path: string,
  position: [number, number, number] = [0, 0, 0],
  name?: string,
  assetId?: string
) {
  const glObj = await importGLB(this.core!.ctx as WebGL2RenderingContext, path, {
    position, name, assetId
  });

  this.core!.add(glObj);
  return glObj;
}
  /* -------- управление циклом -------------------------------- */

  start(): void {
    this.core!.start();
  }

  stop(): this {
    this.core!.stop();
    return this;
  }
}

/* ---------- singleton (GameAlchemy) ------------------------- */
const GameAlchemy = new GameFacade();

// Прикрепляем фабрику, чтобы GUI мог обращаться через GameAlchemy
(GameAlchemy as any).primitiveFactory = primitiveFactory;

/* экспортируем единственную точку входа пакета */
export default GameAlchemy;
