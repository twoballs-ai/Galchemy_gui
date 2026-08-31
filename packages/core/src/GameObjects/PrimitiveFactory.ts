import { GameObject3D }            from './primitives/GameObject3D';
import { createSphereGeometry }    from './primitives/3dPrimitives/createSphereGeometry';
import { createCubeGeometry }      from './primitives/3dPrimitives/createCubeGeometry';
import { createCylinderGeometry }  from './primitives/3dPrimitives/createCylinderGeometry';
import { createTerrainGeometry }   from './primitives/3dPrimitives/createTerrainGeometry';
import { createPlaneGeometry }     from './primitives/3dPrimitives/createPlaneGeometry';
import { createCapsuleGeometry }   from './primitives/3dPrimitives/createCapsuleGeometry';
import { createConeGeometry }      from './primitives/3dPrimitives/createConeGeometry';
import { createTorusGeometry }     from './primitives/3dPrimitives/createTorusGeometry';
import { createIcosahedronGeometry } from './primitives/3dPrimitives/createIcosahedronGeometry';
import { createPyramidGeometry }   from './primitives/3dPrimitives/createPyramidGeometry';
import { createPrismGeometry }     from './primitives/3dPrimitives/createPrismGeometry';
import { createSpriteGeometry }    from './primitives/3dPrimitives/createSpriteGeometry';
import { GameObjectCamera }        from './GameObjectCamera';
import { GameObjectLight }         from './GameObjectLight';
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
      ...opts,
    };
    return builder(gl, merged);
  }
}

export const primitiveFactory = new PrimitiveFactory();

/* ---------- built-ins ---------- */

primitiveFactory.register(
  'sphere',
  (gl, { radius = 1, segments = 24, position = [0, 0, -5], rotation, scale, color, texture }) =>
    new GameObject3D(gl, {
      mesh     : createSphereGeometry(radius, segments),
      position,
      rotation,
      scale,
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
  (gl, { size = 1, width, height, depth, position, rotation, scale, color, texture }) => {
    const pos = position ?? defaultPosition();
    const w = width ?? size;
    const h = height ?? size;
    const d = depth ?? size;
    return new GameObject3D(gl, {
      mesh      : createCubeGeometry(w, h, d),
      position  : pos,
      rotation,
      scale,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register(
  'cylinder',
  (gl, { radius = 1, height = 2, position, rotation, scale, color, texture }) => {
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
      rotation,
      scale,
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
    position, rotation, scale, color, texture, heightFn = (x,z) => 0
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
      rotation,
      scale,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register(
  'plane',
  (gl, { width = 10, depth = 10, widthSeg = 1, depthSeg = 1, position, rotation, scale, color, texture }) =>
    new GameObject3D(gl, {
      mesh: createPlaneGeometry({ width, depth, widthSeg, depthSeg }),
      position: position ?? [0, 0, 0],
      rotation,
      scale,
      color,
      textureSrc: texture,
    })
);

primitiveFactory.register('light', (gl, opts) => new GameObjectLight(gl, opts));

primitiveFactory.register(
  'character',
  (gl, { position = [0, 0, 0], rotation, scale, color, texture, name = 'Character' }) =>
    new GameObjectCharacter(gl, {
      position,
      rotation,
      scale,
      color,
      textureSrc: texture,
      name,
    })
);

primitiveFactory.register(
  'spawnPoint',
  (gl, opts = {}) => new GameObjectSpawnPoint(gl, opts)
);


/* ---------- новые примитивы ---------- */

primitiveFactory.register(
  'capsule',
  (gl, { radius = 0.5, height = 2, segments = 16, position, rotation, scale, color, texture }) => {
    const pos = position ?? defaultPosition();
    return new GameObject3D(gl, {
      mesh: createCapsuleGeometry(radius, height, segments),
      position: pos,
      rotation,
      scale,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register(
  'cone',
  (gl, { radius = 1, height = 2, segments = 32, position, rotation, scale, color, texture }) => {
    const pos = position ?? defaultPosition();
    return new GameObject3D(gl, {
      mesh: createConeGeometry(radius, height, segments),
      position: pos,
      rotation,
      scale,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register(
  'torus',
  (gl, { outerRadius = 1, innerRadius = 0.3, segmentsOuter = 32, segmentsInner = 16, position, rotation, scale, color, texture }) => {
    const pos = position ?? defaultPosition();
    return new GameObject3D(gl, {
      mesh: createTorusGeometry(outerRadius, innerRadius, segmentsOuter, segmentsInner),
      position: pos,
      rotation,
      scale,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register(
  'icosahedron',
  (gl, { radius = 1, position, rotation, scale, color, texture }) => {
    const pos = position ?? defaultPosition();
    return new GameObject3D(gl, {
      mesh: createIcosahedronGeometry(radius),
      position: pos,
      rotation,
      scale,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register(
  'pyramid',
  (gl, { baseSize = 1, height = 1, position, rotation, scale, color, texture }) => {
    const pos = position ?? defaultPosition();
    return new GameObject3D(gl, {
      mesh: createPyramidGeometry(baseSize, height),
      position: pos,
      rotation,
      scale,
      color,
      textureSrc: texture
    });
  }
);

primitiveFactory.register(
  'prism',
  (gl, { width = 1, height = 1, depth = 1, position, rotation, scale, color, texture }) => {
    const pos = position ?? defaultPosition();
    return new GameObject3D(gl, {
      mesh: createPrismGeometry(width, height, depth),
      position: pos,
      rotation,
      scale,
      color,
      textureSrc: texture
    });
  }
);

/* ---------- спрайт (полноценный 3D-примитив с плоской геометрией) ---------- */

primitiveFactory.register(
  'sprite',
  (gl, {
    width = 1,
    height = 1,
    plane = 'xy',
    position,
    rotation,
    scale,
    color,
    texture,
  }) => {
    const pos = position ?? defaultPosition();
    const mesh = createSpriteGeometry({
      width: Number(width),
      height: Number(height),
      plane: (plane as 'xy' | 'xz' | 'yz') ?? 'xy',
    });

    return new GameObject3D(gl, {
      mesh,
      position: pos,
      rotation,
      scale,
      color,
      textureSrc: texture,
      isSprite: true,
      disableCulling: true,   // видим с обеих сторон
      spritePlane: (plane as 'xy' | 'xz' | 'yz') ?? 'xy',
    });
  }
);