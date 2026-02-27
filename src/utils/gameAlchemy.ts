// Runtime adapter for external GameAlchemy engine injected by host app.
// We intentionally avoid direct package imports to keep GUI buildable without private registry access.
type AnyObj = Record<string, any>;

const globalRef = globalThis as AnyObj;

export const GameAlchemy: any =
  globalRef.GameAlchemy ||
  globalRef.gameAlchemy ||
  ({
    core: null,
    init: () => {},
    start: () => {},
    setEditorMode: () => {},
    setPreviewMode: () => {},
    setSkybox: () => {},
    patchObject: () => {},
    updateObject: () => {},
    spawn3DModel: async () => ({}),
    primitiveFactory: { create: () => ({}) },
    createMaterialPreview: () => ({ stop: () => {} }),
  } as AnyObj);
