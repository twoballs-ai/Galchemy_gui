const noop = () => {};

let warned = false;
const warnMissingCore = () => {
  if (warned) return;
  warned = true;
  console.warn(
    '[GameAlchemy] Core is not connected. Provide window.GameAlchemy from host runtime to enable 3D scene rendering.'
  );
};

export const GameAlchemy: any = {
  core: null,
  primitiveFactory: { create: () => ({}) },
  init: () => {
    warnMissingCore();
    return GameAlchemy;
  },
  start: warnMissingCore,
  setEditorMode: warnMissingCore,
  setPreviewMode: warnMissingCore,
  setSkybox: warnMissingCore,
  spawn3DModel: async () => {
    warnMissingCore();
    return {};
  },
  patchObject: noop,
  updateObject: noop,
  createMaterialPreview: () => ({ stop: noop }),
};
