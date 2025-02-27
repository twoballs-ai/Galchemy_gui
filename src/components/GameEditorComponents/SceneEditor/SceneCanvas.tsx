import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setCurrentObject, updateSceneObject } from '../../../store/slices/sceneObjectsSlice';
import { Core, SceneManager, getShape2d, EditorMode, PreviewMode } from 'tette-core';
import PreviewControls from './sceneCanvas/PreviewControls';
import useCanvasResize from './sceneCanvas/hooks/useCanvasResize';
import GameObjectManager from './sceneCanvas/GameObjectManager';

interface GameObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  image?: string;
  containsPoint?: (x: number, y: number) => boolean;
  getBoundingBox?: () => { x: number; y: number; width: number; height: number };
}

interface SceneCanvasProps {
  renderType: string;
}

const SceneCanvas: React.FC<SceneCanvasProps> = ({ renderType }) => {
  const dispatch = useDispatch();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const [coreInstance, setCoreInstance] = useState<Core | null>(null);
  const [shape2d, setShape2d] = useState<any>(null);
  const [gameObjectsMap, setGameObjectsMap] = useState<Map<string, GameObject>>(new Map());

  // ✅ Теперь активная сцена берётся из Redux
  const activeScene = useSelector((state: RootState) => state.project.activeScene);
  // ✅ Теперь объекты сцены загружаются напрямую из Redux
  const sceneObjects = useSelector((state: RootState) => state.sceneObjects.objects);
  const selectedObject = useSelector((state: RootState) => state.sceneObjects.currentObject);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const requestRenderIfNotRequested = useCallback(() => {
    if (animationFrameIdRef.current === null) {
      animationFrameIdRef.current = requestAnimationFrame(() => {
        coreInstance?.render();
        animationFrameIdRef.current = null;
      });
    }
  }, [coreInstance]);

  const handleSelectObject = useCallback((object: GameObject | null) => {
    dispatch(setCurrentObject(object));
  }, [dispatch]);

  const handleUpdateObjectLocal = useCallback((updatedObject: GameObject) => {
    setGameObjectsMap((prevMap) => {
      const newMap = new Map(prevMap);
      const gameObject = newMap.get(updatedObject.id);
      if (gameObject) {
        const updatedGameObject = { ...gameObject, x: updatedObject.x, y: updatedObject.y };

        if (
          updatedObject.image &&
          (updatedObject.type === 'sprite' || updatedObject.type === 'spriteGrid') &&
          updatedObject.image !== gameObject.image?.src
        ) {
          const image = new Image();
          image.src = updatedObject.image;
          image.onload = () => {
            updatedGameObject.image = image;
            requestRenderIfNotRequested();
          };
          image.onerror = () => {
            console.error('Ошибка загрузки изображения:', updatedObject.id);
          };
        }

        newMap.set(updatedObject.id, updatedGameObject);
      }
      return newMap;
    });

    dispatch(updateSceneObject({ activeScene, object: updatedObject }));
  }, [dispatch, activeScene, requestRenderIfNotRequested]);

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('Canvas не найден.');
      return;
    }

    const sceneManager = new SceneManager();
    sceneManager.createScene(activeScene);

    const core = new Core({
      canvasId: canvasRef.current.id,
      renderType: renderType,
      backgroundColor: '#D3D3D3',
      sceneManager: sceneManager,
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
    });
    core.switchMode(EditorMode);
    setCoreInstance(core);

    const shape2dInstance = getShape2d(core.renderType);
    setShape2d(shape2dInstance);

    return () => {
      core.stop();
    };
  }, [activeScene, renderType]);

  useEffect(() => {
    if (coreInstance) {
      coreInstance.setSelectedObject(selectedObject);
    }
  }, [selectedObject, coreInstance]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / canvas.clientWidth);
    const y = (event.clientY - rect.top) * (canvas.height / canvas.clientHeight);

    const clickedObject = getObjectAtPosition(x, y);

    if (clickedObject) {
      handleSelectObject(clickedObject);
      setIsDragging(true);
      const gameObject = gameObjectsMap.get(clickedObject.id);
      if (gameObject) {
        setDragOffset({ x: x - gameObject.x, y: y - gameObject.y });
      }
    } else {
      handleSelectObject(null);
    }
  }, [gameObjectsMap, handleSelectObject]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !selectedObject) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / canvas.clientWidth);
    const y = (event.clientY - rect.top) * (canvas.height / canvas.clientHeight);

    const updatedObject: GameObject = { ...selectedObject, x: x - dragOffset.x, y: y - dragOffset.y };

    handleUpdateObjectLocal(updatedObject);
  }, [isDragging, selectedObject, dragOffset, handleUpdateObjectLocal]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  const getObjectAtPosition = (x: number, y: number): GameObject | null => {
    for (let i = sceneObjects.length - 1; i >= 0; i--) {
      const gameObject = sceneObjects[i];
      if (gameObject.containsPoint && gameObject.containsPoint(x, y)) {
        return gameObject;
      }
    }
    return null;
  };

  const handleStartPreview = () => {
    coreInstance?.switchMode(PreviewMode, activeScene);
  };

  const handleStopPreview = () => {
    coreInstance?.switchMode(EditorMode);
  };

  useCanvasResize(canvasRef, coreInstance);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} id="canvas" style={{ border: '1px solid #ccc', width: '100%', height: '100%' }} />
      <GameObjectManager
        coreInstance={coreInstance}
        shape2d={shape2d}
        sceneData={{ activeScene, objects: sceneObjects, settings: {} }}
        activeScene={activeScene}
        onGameObjectsMapUpdate={setGameObjectsMap}
        requestRenderIfNotRequested={requestRenderIfNotRequested}
      />
      <PreviewControls onStartPreview={handleStartPreview} onStopPreview={handleStopPreview} />
    </div>
  );
};

export default SceneCanvas;
