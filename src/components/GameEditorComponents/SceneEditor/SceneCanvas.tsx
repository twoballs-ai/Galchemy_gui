import React, {
  useRef, useEffect, useState, useMemo
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch }   from '../../../store/store';
import { setCurrentObjectId }       from '../../../store/slices/sceneObjectsSlice';

import useCanvasResize    from './sceneCanvas/hooks/useCanvasResize';
import GameObjectListener from './sceneCanvas/GameObjectListener';
import { GameAlchemy }    from 'game-alchemy-core';
import { DaylightBoxPaths } from "../../../../public/assets/skyBoxes/DaylightBox";
import { findAssetById, getAssets } from '../../../utils/assetStorage';
import { getSceneObjects } from '../../../utils/dbUtils';
interface GameObjectLive {
  id: string; type: string; x: number; y: number;
  [k: string]: any;
}

/* ---------- ОДИН дефолтный материал для всех ---------- */
const DEFAULT_TEXTURE = "/assets/materials/basic/Concrete034_2K-PNG/Concrete034_2K-PNG_Color.png";

const SceneCanvas: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameObjectsMap, setGameObjectsMap] =
    useState<Map<string, GameObjectLive>>(new Map());

  const activeScene     = useSelector((s: RootState) => s.project.activeScene);
  const sceneObjects    = useSelector((s: RootState) => s.sceneObjects.objects);
  const currentObjectId = useSelector((s: RootState) => s.sceneObjects.currentObjectId);

  /* ---------- shape-factory с одним дефолтным материалом ---------- */
  const shapeFactory = useMemo(() => {
    if (!GameAlchemy.core) return {};
    const gl = GameAlchemy.core.ctx;
    const make = (type: string) => (opts = {}) =>
      GameAlchemy.primitiveFactory.create(type, gl, {
        ...opts,
        texture: opts.texture || DEFAULT_TEXTURE,
      });
    return {
      sphere    : make('sphere'),
      cube      : make('cube'),
      cylinder  : make('cylinder'),
      terrain   : make('terrain'),
      character : make('character'),
      camera    : (opts = {}) => GameAlchemy.primitiveFactory.create('camera', gl, opts),
      light     : (opts = {}) => GameAlchemy.primitiveFactory.create('light',  gl, opts),
    model: async (opts = {}) => {
      // opts.modelAssetId должен приходить из объекта сцены!
      const asset = await findAssetById(opts.modelAssetId);
      if (!asset || !asset.fileData) throw new Error("Asset not found or no file data");
      const blobUrl = URL.createObjectURL(new Blob([asset.fileData]));
      return GameAlchemy.spawn3DModel(blobUrl, [opts.x ?? 0, opts.y ?? 0, opts.z ?? 0], asset.name, asset.id);
    },
    };
  }, [GameAlchemy.core]);

  useEffect(() => {
    if (!canvasRef.current) return;
    GameAlchemy.init({
      canvasId : canvasRef.current.id,
      w        : canvasRef.current.clientWidth,
      h        : canvasRef.current.clientHeight,
      bg       : '#5d8aa8',
    });
    GameAlchemy.setEditorMode();
    GameAlchemy.setSkybox(DaylightBoxPaths);
    const core = GameAlchemy.core!;
    const onObjectSelected = (p: { id: string } | null) =>
      dispatch(setCurrentObjectId(p?.id || null));

    core.emitter.on('objectSelected', onObjectSelected);

    if (!core.sceneManager.getCurrentScene()
        || core.sceneManager.getCurrentScene().name !== activeScene) {
      core.sceneManager.createScene(activeScene);
      core.sceneManager.switchScene(activeScene);
    }

    GameAlchemy.start();

    return () => {
      core.emitter.off('objectSelected', onObjectSelected);
      core.stop();
    };
  }, [activeScene, dispatch]);

  useEffect(() => {
    if (!GameAlchemy.core || !shapeFactory) return;
    GameAlchemy.core.addSceneObjects(activeScene, sceneObjects, shapeFactory);
  }, [activeScene, sceneObjects, shapeFactory]);

  useEffect(() => {
    if (!GameAlchemy.core) return;
    GameAlchemy.core.scene.setSelectedById?.(currentObjectId ?? null);
  }, [currentObjectId]);
useEffect(() => {
  const sceneId = "scene_180f97e0-49f8-4ffd-8da0-5c3e6da747fc";
  const modelId = "f1befe82-eb7e-4f1b-a4d9-21dd8a6386d8";

  getAssets().then(list => {
    console.log("=== ASSETS (AssetDB) ===");
    list.filter(a => a.type === "modelAsset").forEach(a => console.log(a));
  });

  getSceneObjects(sceneId).then(list => {
    console.log("=== SCENE OBJECTS (ProjectDB) ===");
    list.filter(o => o.type === "model").forEach(o => console.log(o));
  });

  findAssetById(modelId).then(asset => {
    console.log(`Asset by id ${modelId}:`, asset);
  });
}, []);
  useCanvasResize(canvasRef, GameAlchemy.core);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
      />
      <GameObjectListener
        coreInstance={GameAlchemy.core}
        onGameObjectsMapUpdate={setGameObjectsMap}
      />
    </div>
  );
};

export default SceneCanvas;
