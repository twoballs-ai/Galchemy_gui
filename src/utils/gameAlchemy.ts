import { GameAlchemy as ShimGameAlchemy } from '../shims/gameAlchemyCore';

type PrimitiveFactory = {
  create: (type: string, gl: unknown, options?: Record<string, unknown>) => unknown;
};

export interface GameAlchemyApi {
  core: any;
  primitiveFactory: PrimitiveFactory;
  init: (params: {
    canvasId: string;
    w: number;
    h: number;
    bg?: string;
    renderer?: 'webgl' | 'webgpu';
  }) => GameAlchemyApi;
  start: () => void;
  stop?: () => void;
  setEditorMode: () => void;
  setPreviewMode: () => void;
  setSkybox: (paths: unknown) => void;
  spawn3DModel: (
    path: string,
    position?: [number, number, number],
    name?: string,
    assetId?: string
  ) => Promise<unknown>;
  patchObject: (id: string, props: Record<string, unknown>) => void;
  updateObject: (id: string, type: string, props: Record<string, unknown>) => void;
  createMaterialPreview: (...args: unknown[]) => { stop: () => void } | null;
}

type GlobalWithAlchemy = typeof globalThis & {
  GameAlchemy?: GameAlchemyApi;
  gameAlchemy?: GameAlchemyApi;
};

const globalRef = globalThis as GlobalWithAlchemy;

const isRuntimeProvided = (candidate: unknown): candidate is GameAlchemyApi => {
  if (!candidate || typeof candidate !== 'object') return false;
  const entity = candidate as Partial<GameAlchemyApi>;
  return (
    typeof entity.init === 'function' &&
    typeof entity.start === 'function' &&
    typeof entity.setEditorMode === 'function'
  );
};

const runtimeInstance = globalRef.GameAlchemy ?? globalRef.gameAlchemy;
export const GameAlchemy: GameAlchemyApi = isRuntimeProvided(runtimeInstance)
  ? runtimeInstance
  : (ShimGameAlchemy as GameAlchemyApi);

if (!globalRef.GameAlchemy) {
  globalRef.GameAlchemy = GameAlchemy;
}
