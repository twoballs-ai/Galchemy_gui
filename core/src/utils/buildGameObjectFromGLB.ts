import { mat4, quat, vec3 } from 'gl-matrix';
import { GameObjectModel } from '../GameObjects/GameObjectModel';
import type { GLTF } from './gltfTypes';

const COMPONENT_BYTES = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

function numComponents(type: string) {
  return { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }[type]!;
}

function readAccessor(json: GLTF, binary: ArrayBuffer, accessorIndex: number) {
  const acc = json.accessors[accessorIndex];
  const view = json.bufferViews[acc.bufferView];
  const off = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const len = acc.count * numComponents(acc.type) * COMPONENT_BYTES[acc.componentType];
  const slice = binary.slice(off, off + len);
  switch (acc.componentType) {
    case 5123: return new Uint16Array(slice);
    case 5125: return new Uint32Array(slice);
    case 5126: return new Float32Array(slice);
    default :  throw new Error('Unsupported component type');
  }
}

function quatToEuler([x, y, z, w]: number[]): [number, number, number] {
  // Стандартная функция перевода кватерниона в эйлеры
  const ysqr = y * y;
  const t0 = +2.0 * (w * x + y * z);
  const t1 = +1.0 - 2.0 * (x * x + ysqr);
  const roll = Math.atan2(t0, t1);
  let t2 = +2.0 * (w * y - z * x);
  t2 = t2 > 1 ? 1 : t2;
  t2 = t2 < -1 ? -1 : t2;
  const pitch = Math.asin(t2);
  const t3 = +2.0 * (w * z + x * y);
  const t4 = +1.0 - 2.0 * (ysqr + z * z);
  const yaw = Math.atan2(t3, t4);
  return [roll, pitch, yaw];
}

// ----------- ГЛАВНАЯ ФУНКЦИЯ -----------

export function buildGameObjectFromGLB(
  gl: WebGL2RenderingContext,
  json: GLTF,
  binary: ArrayBuffer,
  { position = [0, 0, 0], name = 'GLTFModel', assetId = '' } = {}
): GameObjectModel
{
  function buildFromNode(nodeIdx: number): GameObjectModel {
    const node = json.nodes[nodeIdx];
    const t = node.translation ?? [0, 0, 0];
    const r = node.rotation ?? [0, 0, 0, 1];
    const s = node.scale ?? [1, 1, 1];

    let thisObj: GameObjectModel;

    if (typeof node.mesh === 'number') {
      const meshDef = json.meshes[node.mesh];
      // Только первый примитив, если их несколько — можно добавить перебор
      if (meshDef.primitives.length === 1) {
        const prim = meshDef.primitives[0];
        const positions = readAccessor(json, binary, prim.attributes.POSITION) as Float32Array;
        const normals   = prim.attributes.NORMAL      !== undefined ? readAccessor(json, binary, prim.attributes.NORMAL)      as Float32Array : undefined;
        const texCoords = prim.attributes.TEXCOORD_0  !== undefined ? readAccessor(json, binary, prim.attributes.TEXCOORD_0)  as Float32Array : undefined;
        const indices   = readAccessor(json, binary, prim.indices);

        const mesh = { positions, indices, normals, texCoords };
        thisObj = new GameObjectModel(gl, mesh, {
          position: t,
          rotation: quatToEuler(r),
          scale: s,
          name: node.name ?? meshDef.name ?? name,
          assetId,
        });
      } else {
        // Мульти-примитивная меш-сборка
        thisObj = new GameObjectModel(gl, null, {
          position: t,
          rotation: quatToEuler(r),
          scale: s,
          name: node.name ?? meshDef.name ?? name,
          assetId,
        });
        meshDef.primitives.forEach((prim, i) => {
          const positions = readAccessor(json, binary, prim.attributes.POSITION) as Float32Array;
          const normals   = prim.attributes.NORMAL      !== undefined ? readAccessor(json, binary, prim.attributes.NORMAL)      as Float32Array : undefined;
          const texCoords = prim.attributes.TEXCOORD_0  !== undefined ? readAccessor(json, binary, prim.attributes.TEXCOORD_0)  as Float32Array : undefined;
          const indices   = readAccessor(json, binary, prim.indices);

          const mesh = { positions, indices, normals, texCoords };
          const childObj = new GameObjectModel(gl, mesh, {
            position: [0, 0, 0], // все примитивы должны быть на месте
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            name: meshDef.name ? `${meshDef.name}_p${i}` : `Primitive${i}`,
            assetId,
          });
          thisObj.addChild(childObj);
        });
      }
    } else {
      // Просто группа, без меша
      thisObj = new GameObjectModel(gl, null, {
        position: t,
        rotation: quatToEuler(r),
        scale: s,
        name: node.name ?? name,
        assetId,
      });
    }

    // Дети
    if (node.children) {
      for (const childIdx of node.children) {
        const childObj = buildFromNode(childIdx);
        thisObj.addChild(childObj);
      }
    }

    return thisObj;
  }

  // Стартуем с корневых nodes
  const sceneIdx = json.scene ?? 0;
  const scene = json.scenes[sceneIdx];
  let root: GameObjectModel;

  if (scene.nodes.length === 1) {
    root = buildFromNode(scene.nodes[0]);
    // Можно явно подправить root (например, если указываем позицию модели при импорте)
    root.position = position;
    root.name = name;
    root.assetId = assetId;
  } else {
    root = new GameObjectModel(gl, null, { position, name, assetId });
    for (const nodeIdx of scene.nodes) {
      root.addChild(buildFromNode(nodeIdx));
    }
  }

  return root;
}
