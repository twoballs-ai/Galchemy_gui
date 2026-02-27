import { GameObject3D }            from './primitives/GameObject3D';
import { createSphereGeometry }    from './primitives/3dPrimitives/createSphereGeometry';
import { createCubeGeometry }      from './primitives/3dPrimitives/createCubeGeometry';
import { createCylinderGeometry }  from './primitives/3dPrimitives/createCylinderGeometry';
import { createTerrainGeometry }   from './primitives/3dPrimitives/createTerrainGeometry';
import { GameObjectCamera }        from './GameObjectCamera';
import { GameObjectLight }         from './GameObjectLight';
// import defaultTextureSrc ... — УДАЛЕНО!
import { GameObjectCharacter }     from './GameObjectCharacter';
import { GameObjectSpawnPoint }    from './GameObjectSpawnPoint.js';
import { COORD }                   from '../core/CoordinateSystem';
// ── камеры ─────────────────────────────────────────────────────────
import { GameCamera }        from '../core/cameras/GameCamera';
import { FirstPersonCamera } from '../core/cameras/FirstPersonCamera';
import { ThirdPersonCamera } from '../core/cameras/ThirdPersonCamera';
import { TopDownCamera }     from '../core/cameras/TopDownCamera';
import { GameObjectModel } from './GameObjectModel';

const DEFAULT_PRIMITIVE_COLOR = '#7f7f7f';
const DEFAULT_DISTANCE = 5;
type CameraSubtype = 'game' | 'first' | 'third' | 'topdown';

/** Опции, передаваемые при создании объекта-камеры. */
interface CameraOpts {
  subtype?: CameraSubtype;
  [key: string]: unknown;
}

function defaultPosition(distance = DEFAULT_DISTANCE) {
  return COORD.FORWARD.map(c => -c * distance) as [number,number,number];
}

class PrimitiveFactory {
  registry = {};

  register(type, builder) {
    this.registry[type] = builder;
  }

  /**
   * Создаём примитив
   * @param {string} type — ключ в registry
   * @param {WebGL2RenderingContext} gl
   * @param {object} opts — опции, могут включать color, position, radius и т.п.
   */
  create(type, gl, opts = {}) {
    const builder = this.registry[type];
    if (!builder) {
      throw new Error(`Unknown primitive type: ${type}`);
    }
    const merged = {
      color: DEFAULT_PRIMITIVE_COLOR,
      // texture: defaultTextureSrc, // УДАЛЕНО! Теперь texture только через opts
      ...opts,
    };
    return builder(gl, merged);
  }
}

export const primitiveFactory = new PrimitiveFactory();

/* ---------- built-ins ---------- */

primitiveFactory.register(
  'sphere',
  (gl, { radius = 1, segments = 24, position = [0, 0, -5], color, texture }) =>
    new GameObject3D(gl, {
      mesh     : createSphereGeometry(radius, segments),
      position,
      color,
      textureSrc: texture,
    })
);

primitiveFactory.register(
  'model',
  (gl, { mesh, position = [0, 0, 0], name, assetId }) =>
    new GameObjectModel(gl, mesh, { position, name, assetId })
);
primitiveFactory.register(
  'cube',
  (gl, { size = 1, position, color, texture }) => {
    const pos = position ?? defaultPosition();
    return new GameObject3D(gl, {
      mesh      : createCubeGeometry(size),
      position  : pos,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register(
  'cylinder',
  (gl, { radius = 1, height = 2, position, color, texture }) => {
    const pos = position ?? defaultPosition();
    const mesh = createCylinderGeometry(radius, height);

    if (COORD.UP[2] === 1 && COORD.FORWARD[1] === 1) {
      // Y-up — не нужно
    } else if (COORD.UP[2] === 1) {
      for (let i = 0; i < mesh.positions.length; i += 3) {
        const y = mesh.positions[i+1];
        mesh.positions[i+1] = mesh.positions[i+2];
        mesh.positions[i+2] = -y;
      }
    }

    return new GameObject3D(gl, {
      mesh,
      position : pos,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register(
  'camera',
  (gl: WebGL2RenderingContext, opts: CameraOpts = {}) => {
    const subtype: CameraSubtype = opts.subtype ?? 'game';
    const cameraMap = {
      game   : GameCamera,
      first  : FirstPersonCamera,
      third  : ThirdPersonCamera,
      topdown: TopDownCamera,
    } as const satisfies Record<CameraSubtype, new (...args: any[]) => any>;
    const CameraClass = cameraMap[subtype];

    return new GameObjectCamera(gl, { ...opts, cameraClass: CameraClass });
  }
);

primitiveFactory.register(
  'terrain',
  (gl, {
    width = 10, depth = 10, seg = 64,
    position, color, texture, heightFn = (x,z) => 0
  }) => {
    const pos = position ?? [0,0,0];
    const mesh = createTerrainGeometry({
      width, depth, seg,
      heightFn: (u,v) => heightFn(u,v),
      axisA: COORD.RIGHT,
      axisB: COORD.FORWARD
    });
    return new GameObject3D(gl, {
      mesh,
      position: pos,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register('light', (gl, opts) => new GameObjectLight(gl, opts));

primitiveFactory.register(
  'character',
  (gl, { position = [0, 0, 0], color, texture, name = 'Character' }) =>
    new GameObjectCharacter(gl, {
      position,
      color,
      textureSrc: texture,
      name,
    })
);
