import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import { setCurrentObjectId, updateSceneObject } from '../../../store/slices/sceneObjectsSlice';

import useCanvasResize from './sceneCanvas/hooks/useCanvasResize';
import GameObjectManager from './sceneCanvas/GameObjectManager';

import { GameAlchemy } from 'game-alchemy-core';                   // ← никаких named-импортов

/* ─────────── типы ─────────── */
interface GameObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  image?: string;
}

/* ─────────── пропсы ─────────── */
interface SceneCanvasProps {}

const SceneCanvas: React.FC<SceneCanvasProps> = () => {
  const dispatch = useDispatch<AppDispatch>();

  /* refs / state */
  const canvasRef           = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [gameObjectsMap, setGameObjectsMap] = useState<Map<string, GameObject>>(new Map());

  /* redux */
  const activeScene     = useSelector((s: RootState) => s.project.activeScene);
  const sceneObjects    = useSelector((s: RootState) => s.sceneObjects.objects);
  const currentObjectId = useSelector((s: RootState) => s.sceneObjects.currentObjectId);

  /* rAF helper */
  const requestRenderIfNotRequested = useCallback(() => {
    if (animationFrameIdRef.current === null) {
      animationFrameIdRef.current = requestAnimationFrame(() => {
        GameAlchemy.core?.renderer.render(GameAlchemy.core.scene, GameAlchemy.core.debug);
        animationFrameIdRef.current = null;
      });
    }
  }, []);

  /* обновление объекта */
  const handleUpdateObjectLocal = useCallback((updated: GameObject) => {
    setGameObjectsMap((prev) => {
      const m = new Map(prev);
      if (m.has(updated.id)) m.set(updated.id, { ...m.get(updated.id)!, ...updated });
      return m;
    });
    dispatch(updateSceneObject({ activeScene, object: updated }));
    requestRenderIfNotRequested();
  }, [dispatch, activeScene, requestRenderIfNotRequested]);

  /* ───── init GameFacade ───── */
  useEffect(() => {
    if (!canvasRef.current) return;

    GameAlchemy.init({
      canvasId : canvasRef.current.id,
      w        : canvasRef.current.clientWidth,
      h        : canvasRef.current.clientHeight,
      bg       : '#D3D3D3',
      debug    : true,
    });

    const { sceneManager } = GameAlchemy.core;
    if (!sceneManager.getCurrentScene() || sceneManager.getCurrentScene().name !== activeScene) {
       sceneManager.createScene(activeScene);          // если такой ещё нет
       sceneManager.switchScene(activeScene);          // ← правильный метод
       GameAlchemy.core.scene = sceneManager.getCurrentScene(); // держим Core в синхроне
    }

    GameAlchemy.start();
    return () => GameAlchemy.core?.sceneManager?.clear && GameAlchemy.core.stop();
  }, [activeScene]);

  /* выделение */
  useEffect(() => {
    if (!GameAlchemy.core) return;
    const obj = currentObjectId ? gameObjectsMap.get(currentObjectId) : null;
    GameAlchemy.core.scene.setSelected?.(obj || null);
    requestRenderIfNotRequested();
  }, [currentObjectId, gameObjectsMap, requestRenderIfNotRequested]);

  /* drag’n’drop — оставил без изменений */
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / canvas.clientWidth);
    const y = (e.clientY - rect.top)  * (canvas.height / canvas.clientHeight);

    for (let i = sceneObjects.length - 1; i >= 0; i--) {
      const so = sceneObjects[i];
      if (so.containsPoint?.(x, y)) {
        dispatch(setCurrentObjectId(so.id));
        setIsDragging(true);
        const live = gameObjectsMap.get(so.id);
        if (live) setDragOffset({ x: x - live.x, y: y - live.y });
        return;
      }
    }
    dispatch(setCurrentObjectId(null));
  }, [sceneObjects, dispatch, gameObjectsMap]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !currentObjectId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / canvas.clientWidth);
    const y = (e.clientY - rect.top)  * (canvas.height / canvas.clientHeight);

    const live = gameObjectsMap.get(currentObjectId);
    if (!live) return;
    handleUpdateObjectLocal({ ...live, x: x - dragOffset.x, y: y - dragOffset.y });
  }, [isDragging, currentObjectId, gameObjectsMap, dragOffset, handleUpdateObjectLocal]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup',   handleMouseUp);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup',   handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  useCanvasResize(canvasRef, GameAlchemy.core);

  /* ─────────── render ─────────── */
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
      />
      <GameObjectManager
        coreInstance={GameAlchemy.core}
        sceneData={{ activeScene, objects: sceneObjects, settings: {} }}
        activeScene={activeScene}
        onGameObjectsMapUpdate={setGameObjectsMap}
        requestRenderIfNotRequested={requestRenderIfNotRequested}
      />
    </div>
  );
};

export default SceneCanvas;
