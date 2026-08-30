// src/GameObjects/primitives/3dPrimitives/GameObjectCharacter.ts
import { GameObject3D } from '../GameObjects/primitives/GameObject3D';

export class GameObjectCharacter extends GameObject3D {
  // Если нужна физика, добавим поле collider
  collider: { type: 'capsule'; radius: number; height: number; offset: [number, number, number] };

  constructor(gl: WebGL2RenderingContext, opts: any = {}) {
    // Если хотим «модель» персонажа, можно передать mesh через opts.mesh,
    // иначе просто даём пустой заглушечный меш:
    const mesh = opts.mesh ?? {
      positions: new Float32Array(),
      indices: new Uint16Array(),
    };

    super(gl, {
      mesh,
      position: opts.position ?? [0, 0, 0],
      color: opts.color ?? '#ffffff',
      textureSrc: opts.textureSrc ?? null,
    });

    this.id = opts.id ?? crypto.randomUUID();
    this.type = 'character';
    this.name = opts.name ?? 'Character';

    // Определяем коллайдер в форме капсулы
    this.collider = {
      type: 'capsule',
      radius: 0.5,
      height: 2.0,
      offset: [0, -1.0, 0],  // смещаем центрыдвижку капсулы вниз наполовину
    };

    // Если у вас есть система физики в Core, 
    // можно тут же зарегистрировать коллайдер, например:
    // core.physics?.addCapsule(this, this.collider);
  }

  attachCamera(cameraObject) {
    cameraObject.attachTo(this);
  }
}
