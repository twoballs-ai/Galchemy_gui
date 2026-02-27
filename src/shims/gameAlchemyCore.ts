const noop = () => {};

export const GameAlchemy: any = {
  core: null,
  primitiveFactory: { create: () => ({}) },
  init: noop,
  start: noop,
  setEditorMode: noop,
  setPreviewMode: noop,
  setSkybox: noop,
  spawn3DModel: async () => ({}),
  patchObject: noop,
  updateObject: noop,
  createMaterialPreview: () => ({ stop: noop }),
};
