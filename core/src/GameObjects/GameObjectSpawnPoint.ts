// GameObjectSpawnPoint.ts
import { GameObject3D } from './primitives/GameObject3D.js';

export class GameObjectSpawnPoint extends GameObject3D {
  constructor(gl: WebGL2RenderingContext, opts: any = {}) {
    super(gl, {
      mesh: {
        positions: new Float32Array(),
        indices: new Uint16Array(),
      },
      position: opts.position ?? [0, 0, 0],
      color: opts.color ?? '#00ff00',
    });

    this.id = opts.id ?? crypto.randomUUID();
    this.type = 'spawnPoint';
    this.name = opts.name ?? 'Spawn Point';
    this.characterId = opts.characterId ?? null; // Привязка к персонажу
  }
}
