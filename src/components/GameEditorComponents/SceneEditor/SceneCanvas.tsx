import React, {
  useRef, useEffect, useState, useMemo
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch }   from '../../../store/store';
import { setCurrentObjectId }       from '../../../store/slices/sceneObjectsSlice';

import useCanvasResize    from './sceneCanvas/hooks/useCanvasResize';
import GameObjectListener from './sceneCanvas/GameObjectListener';
import { GameAlchemy }    from 'game-alchemy-core';

/* ---------- тип live-объекта ---------- */
interface GameObjectLive {
  id: string; type: string; x: number; y: number;
  [k: string]: any;
}

const SceneCanvas: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  /* ---------- refs / state ---------- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameObjectsMap, setGameObjectsMap] =
    useState<Map<string, GameObjectLive>>(new Map());

  /* ---------- redux state ---------- */
  const activeScene     = useSelector((s: RootState) => s.project.activeScene);
  const sceneObjects    = useSelector((s: RootState) => s.sceneObjects.objects);
  const currentObjectId = useSelector((s: RootState) => s.sceneObjects.currentObjectId);

  /* ---------- shape-factory из ядра ---------- */
  const shapeFactory = useMemo(() => {
    if (!GameAlchemy.core) return {};
    const gl = GameAlchemy.core.ctx;
    return {
      sphere    : (opts = {}) => GameAlchemy.primitiveFactory.create('sphere',   gl, opts),
      cube      : (opts = {}) => GameAlchemy.primitiveFactory.create('cube',     gl, opts),
      cylinder  : (opts = {}) => GameAlchemy.primitiveFactory.create('cylinder', gl, opts),
      camera    : (opts = {}) => GameAlchemy.primitiveFactory.create('camera',   gl, opts),
      light     : (opts = {}) => GameAlchemy.primitiveFactory.create('light',    gl, opts),
      terrain   : (opts = {}) => GameAlchemy.primitiveFactory.create('terrain',  gl, opts),
      character : (opts = {}) => GameAlchemy.primitiveFactory.create('character',gl, opts),
    };
  }, [GameAlchemy.core]);

  /* ---------- init GameAlchemy ---------- */
  useEffect(() => {
    if (!canvasRef.current) return;

    GameAlchemy.init({
      canvasId : canvasRef.current.id,
      w        : canvasRef.current.clientWidth,
      h        : canvasRef.current.clientHeight,
      bg       : '#5d8aa8',
    });
    GameAlchemy.setEditorMode();

    const core = GameAlchemy.core!;
    const onObjectSelected = (p: { id: string } | null) =>
      dispatch(setCurrentObjectId(p?.id || null));

    core.emitter.on('objectSelected', onObjectSelected);

    /* сцена */
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

  /* ---------- синхронизация redux->ядро ---------- */
  useEffect(() => {
    if (!GameAlchemy.core || !shapeFactory) return;
    GameAlchemy.core.addSceneObjects(activeScene, sceneObjects, shapeFactory);
  }, [activeScene, sceneObjects, shapeFactory]);

  /* ---------- выделение объекта ---------- */
  useEffect(() => {
    if (!GameAlchemy.core) return;
    GameAlchemy.core.scene.setSelectedById?.(currentObjectId ?? null);
  }, [currentObjectId]);

  /* ---------- resize ---------- */
  useCanvasResize(canvasRef, GameAlchemy.core);

  /* ---------- render ---------- */
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
