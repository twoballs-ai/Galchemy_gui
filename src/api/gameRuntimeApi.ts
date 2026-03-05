import { GameAlchemy } from '../utils/gameAlchemy';
import { getSceneObjects, type GameObject } from '../utils/dbUtils';
import { findAssetById } from '../utils/assetStorage';

const DEFAULT_TEXTURE =
  '/assets/materials/basic/Concrete034_2K-PNG/Concrete034_2K-PNG_Color.png';

type RuntimeOptions = {
  canvasId: string;
  width: number;
  height: number;
  background?: string;
  renderer?: 'webgl' | 'webgpu';
};

const resolveTexture = async (opts: Record<string, unknown>) => {
  if (typeof opts.texture === 'string' && opts.texture) return opts.texture;
  if (typeof opts.textureSrc === 'string' && opts.textureSrc) return opts.textureSrc;
  if (!opts.textureAssetId) return DEFAULT_TEXTURE;

  const asset = await findAssetById(String(opts.textureAssetId));
  if (!asset) return DEFAULT_TEXTURE;
  if (typeof asset.url === 'string' && asset.url) return asset.url;
  if (typeof asset.fileData === 'string' && asset.fileData) return asset.fileData;
  if (asset.fileData) return URL.createObjectURL(new Blob([asset.fileData]));
  return DEFAULT_TEXTURE;
};

export const createRuntime = async (opts: RuntimeOptions) => {
  GameAlchemy.init({
    canvasId: opts.canvasId,
    w: Math.max(1, Math.round(opts.width)),
    h: Math.max(1, Math.round(opts.height)),
    bg: opts.background ?? '#111827',
    renderer: opts.renderer ?? 'webgl',
  });

  const core = GameAlchemy.core;
  if (!core) throw new Error('GameAlchemy core initialization failed');

  const gl = core.ctx;
  const primitiveFactory = {
    sphere: async (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('sphere', gl, { ...o, texture: await resolveTexture(o) }),
    cube: async (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('cube', gl, { ...o, texture: await resolveTexture(o) }),
    cylinder: async (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('cylinder', gl, { ...o, texture: await resolveTexture(o) }),
    terrain: async (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('terrain', gl, { ...o, texture: await resolveTexture(o) }),
    plane: async (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('plane', gl, { ...o, texture: await resolveTexture(o) }),
    water: async (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('plane', gl, { ...o, texture: await resolveTexture(o) }),
    character: async (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('character', gl, { ...o, texture: await resolveTexture(o) }),
    spawnPoint: (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('spawnPoint', gl, o),
    sprite: async (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('sprite', gl, {
        ...o,
        imageSrc: await resolveTexture(o),
        x: Number(o.x ?? 0),
        y: Number(o.y ?? 0),
        width: Number(o.width ?? 128),
        height: Number(o.height ?? 128),
      }),
    camera: (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('camera', gl, o),
    light: (o: Record<string, unknown> = {}) =>
      GameAlchemy.primitiveFactory.create('light', gl, o),
    model: async (o: Record<string, unknown> = {}) => {
      const asset = await findAssetById(String(o.modelAssetId || ''));
      if (!asset?.fileData) throw new Error('Model asset not found');
      const blobUrl = URL.createObjectURL(new Blob([asset.fileData]));
      return GameAlchemy.spawn3DModel(
        blobUrl,
        [Number(o.x ?? 0), Number(o.y ?? 0), Number(o.z ?? 0)],
        asset.name,
        asset.id
      );
    },
  };

  return {
    core,
    start: () => GameAlchemy.start(),
    stop: () => GameAlchemy.stop?.(),
    setPreviewMode: () => GameAlchemy.setPreviewMode(),
    setEditorMode: () => GameAlchemy.setEditorMode(),
    async loadScene(sceneId: string, objects?: GameObject[]) {
      const list = objects ?? (await getSceneObjects(sceneId));
      const existing = core.sceneManager.scenes?.get?.(sceneId);
      if (!existing) core.sceneManager.createScene(sceneId);
      core.sceneManager.switchScene(sceneId);
      await core.addSceneObjects(sceneId, list, primitiveFactory);
    },
  };
};
