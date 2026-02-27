import { Scene } from './Scene';
import { IGameObject, IScene } from '../types/CoreTypes';
import { EventEmitter } from '../utils/EventEmitter';
import { Core } from './Core';

export class SceneManager {
  public scenes: Map<string, IScene> = new Map();
  private currentScene: IScene | null = null;
  private core: Core;
  private emitter: EventEmitter;

  constructor(core: Core, emitter: EventEmitter) {
    this.core = core;
    this.emitter = emitter;
  }

  createScene(name: string): IScene {
    const scene = new Scene(name, this.core, this.emitter);
    this.scenes.set(name, scene);
    if (!this.currentScene) this.switchScene(name);
    this.emitter.emit('sceneCreated', { scene: name });
    return scene;
  }

  switchScene(name: string) {
    const scene = this.scenes.get(name);
    if (!scene) {
      console.warn(`Scene "${name}" not found`);
      return;
    }
    this.currentScene = scene;
    this.emitter.emit('sceneSwitched', { scene: name });
  }

  getCurrentScene(): IScene {
    if (!this.currentScene) {
      throw new Error('No active scene');
    }
    return this.currentScene;
  }

  addGameObjectToScene(sceneName: string, obj: IGameObject) {
    const scene = this.scenes.get(sceneName) ?? this.currentScene;
    scene?.add(obj);
  }

  removeGameObjectFromScene(sceneName: string, obj: IGameObject) {
    const scene = this.scenes.get(sceneName) ?? this.currentScene;
    scene?.remove(obj);
  }

  clearScene(sceneName: string) {
    this.scenes.get(sceneName)?.clear();
  }

  update(dt: number) {
    this.currentScene?.update(dt);
  }
  
}
