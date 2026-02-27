import type { EventEmitter } from '../utils/EventEmitter';
import type { Core as CoreClass } from '../core/Core';

export type Core = CoreClass;

export interface ICamera {
  id?: string;
  type?: string;
  projection?: Float32Array;
  isCamera?: boolean;
  update(): void;
  getView?: () => Float32Array;
  getProjection?: () => Float32Array;
  resize?(w: number, h: number): void;
}

export interface IGameObject {
  id?: string;
  type?: string;
  isEditorMode?: boolean;
  isEditorOnly?: boolean;
  isCamera?: boolean;
  isLight?: boolean;
  name?: string;
  parent?: IGameObject | null;
  children?: Set<IGameObject>;
  update?(dt: number): void;
  camera?: ICamera;
  [key: string]: unknown;
}

export interface IScene {
  name: string;
  objects: IGameObject[];
  activeCamera: ICamera | null;
  selectedObject: IGameObject | null;
  add(obj: IGameObject): void;
  remove(obj: IGameObject): void;
  clear(): void;
  update(dt: number): void;
  setActiveCamera(camera: ICamera): void;
  setSelectedById(id: string | null): void;
}

export interface ICoreLike {
  canvas: HTMLCanvasElement;
  emitter: EventEmitter;
  scene: IScene;
  showHelpers: boolean;
  setActiveCamera(camera: ICamera, force?: boolean): void;
  setShowHelpers(value: boolean): void;
  setDebugLogging(value: boolean): void;
}
