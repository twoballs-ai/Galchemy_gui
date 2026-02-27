import { IGameObject, IScene, ICamera } from '../types/CoreTypes';
import { EventEmitter } from '../utils/EventEmitter';
import { Core } from './Core';

export class Scene implements IScene {
  public name: string;
  public objects: IGameObject[] = [];
  public activeCamera: ICamera | null = null;
  public selectedObject: IGameObject | null = null;
  private emitter: EventEmitter;
  private core: Core;

  constructor(name: string, core: Core, emitter: EventEmitter) {
    this.name = name;
    this.core = core;
    this.emitter = emitter;
  }

  add(obj: IGameObject) {
    this.objects.push(obj);
    // only auto-activate if NOT in editor
    if (obj.isCamera && !this.activeCamera && !this.core.showHelpers) {
      this.setActiveCamera(obj as ICamera);
    }
    this.emitter.emit('objectAdded', { scene: this.name, object: obj });
  }

  remove(obj: IGameObject) {
    this.objects = this.objects.filter(o => o.id !== obj.id);
    if (this.selectedObject?.id === obj.id) {
      this.setSelectedById(null);
    }
    this.emitter.emit('objectRemoved', { scene: this.name, object: obj });
  }

  clear() {
    this.objects = [];
    this.activeCamera = null;
    this.selectedObject = null;
    this.emitter.emit('sceneCleared', { scene: this.name });
  }

  update(deltaTime: number) {
    // 1) логика / анимация
    this.objects.forEach(o => o.update?.(deltaTime));

    // 2) пересчёт transform-ов **только корневых**
    this.objects.forEach(root => {
      if (!('parent' in root) || root.parent) return; // есть parent → не корень
      if (typeof (root as any).updateWorldMatrix === 'function') {
        (root as any).updateWorldMatrix();            // рекурсивно вниз по дереву
     }
   });
  }

  setActiveCamera(camera: ICamera) {
    if (camera?.isCamera) {
      this.activeCamera = camera;
      this.core.setActiveCamera(camera);
    } else {
      console.warn('Попытка установить активной не-камеру');
    }
  }

  setSelectedById(id: string | null) {
    this.selectedObject = id ? this.objects.find(o => o.id === id) ?? null : null;
    this.core.setSelectedObject(this.selectedObject);
    this.emitter.emit('objectSelected', this.selectedObject ? { id: this.selectedObject.id } : null);
  }
}
