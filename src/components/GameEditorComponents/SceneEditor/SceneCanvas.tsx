import React, {
  useRef, useEffect, useState, useCallback, useMemo
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch }   from '../../../store/store';
import {
  setCurrentObjectId,
  updateSceneObject
} from '../../../store/slices/sceneObjectsSlice';

import useCanvasResize   from './sceneCanvas/hooks/useCanvasResize';
import GameObjectManager from './sceneCanvas/GameObjectManager';

import { GameAlchemy } from 'game-alchemy-core';    // ← default-импорт

/* ---------- тип локального live-объекта ---------- */
interface GameObjectLive {
  id: string; type: string; x: number; y: number;
  [k: string]: any;
}

const SceneCanvas: React.FC = () => {
  const dispatch  = useDispatch<AppDispatch>();

  /* ---------- refs / state ---------- */
  const canvasRef           = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [gameObjectsMap, setGameObjectsMap] =
    useState<Map<string, GameObjectLive>>(new Map());

  /* ---------- redux state ---------- */
  const activeScene     = useSelector((s: RootState) => s.project.activeScene);
  const sceneObjects    = useSelector((s: RootState) => s.sceneObjects.objects);
  const currentObjectId = useSelector((s: RootState) => s.sceneObjects.currentObjectId);

  /* ---------- rAF helper ---------- */
  const requestRenderIfNotRequested = useCallback(() => {
    if (animationFrameIdRef.current === null) {
      animationFrameIdRef.current = requestAnimationFrame(() => {
        GameAlchemy.core?.renderer.render(
          GameAlchemy.core.scene,
          GameAlchemy.core.debug
        );
        animationFrameIdRef.current = null;
      });
    }
  }, []);

  /* ---------- локальное обновление объекта ---------- */
  const handleUpdateObjectLocal = useCallback((updated: GameObjectLive) => {
    setGameObjectsMap(prev => {
      const m = new Map(prev);
      if (m.has(updated.id)) m.set(updated.id, { ...m.get(updated.id)!, ...updated });
      return m;
    });
    dispatch(updateSceneObject({ activeScene, object: updated }));
    requestRenderIfNotRequested();
  }, [dispatch, activeScene, requestRenderIfNotRequested]);

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

    const { sceneManager } = GameAlchemy.core;
    if (!sceneManager.getCurrentScene()
        || sceneManager.getCurrentScene().name !== activeScene) {
      sceneManager.createScene(activeScene);
      sceneManager.switchScene(activeScene);
    }

    GameAlchemy.start();
    return () => GameAlchemy.core?.stop();
  }, [activeScene]);

  /* ---------- выделение объекта в сцене ---------- */
  useEffect(() => {
    if (!GameAlchemy.core) return;
    const live = currentObjectId ? gameObjectsMap.get(currentObjectId) : null;
    GameAlchemy.core.scene.setSelected?.(live || null);
    requestRenderIfNotRequested();
  }, [currentObjectId, gameObjectsMap, requestRenderIfNotRequested]);

  /* ---------- drag’n’drop ---------- */


  /* ---------- canvas resize ---------- */
  useCanvasResize(canvasRef, GameAlchemy.core);

  /* ---------- shape-factory из ядра ---------- */
const shapeFactory = useMemo(() => {
  if (!GameAlchemy.core) return {};
  const gl = GameAlchemy.core.ctx;
  return {
    sphere  : (opts = {}) => GameAlchemy.primitiveFactory.create('sphere',   gl, opts),
    cube    : (opts = {}) => GameAlchemy.primitiveFactory.create('cube',     gl, opts),
    cylinder: (opts = {}) => GameAlchemy.primitiveFactory.create('cylinder', gl, opts),
    camera: (opts = {}) => GameAlchemy.primitiveFactory.create('camera', GameAlchemy.core.ctx, opts),
    light: (opts = {}) => GameAlchemy.primitiveFactory.create('light', gl, opts),
    terrain : (opts = {}) => GameAlchemy.spawnTerrain?.(opts),
    
  };
}, [GameAlchemy.core]);

  /* ---------- render ---------- */
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
      />
      <GameObjectManager
        coreInstance={GameAlchemy.core}
        shapeFactory={shapeFactory}
        sceneData={{ activeScene, objects: sceneObjects }}
        activeScene={activeScene}
        onGameObjectsMapUpdate={setGameObjectsMap}
        requestRenderIfNotRequested={requestRenderIfNotRequested}
      />
    </div>
  );
};

export default SceneCanvas;
