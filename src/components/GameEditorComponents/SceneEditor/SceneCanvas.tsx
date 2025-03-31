import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setCurrentObjectId, updateSceneObject } from '../../../store/slices/sceneObjectsSlice';
import PreviewControls from './sceneCanvas/PreviewControls';
import useCanvasResize from './sceneCanvas/hooks/useCanvasResize';
import GameObjectManager from './sceneCanvas/GameObjectManager';
import { useCoreEvents } from './sceneCanvas/hooks/useCoreEvents';
import Galchemy from 'game-alchemy-core';
const { Core, EditorMode, PreviewMode, getShape2d } = Galchemy;
interface GameObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  image?: string;
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

  // Активная сцена из Redux
  const activeScene = useSelector((state: RootState) => state.project.activeScene);
  const projectId = useSelector((state: RootState) => state.project.currentProjectId);
  // Все объекты из Redux
  const sceneObjects = useSelector((state: RootState) => state.sceneObjects.objects);
  // Текущее выбранное id
  const currentObjectId = useSelector((state: RootState) => state.sceneObjects.currentObjectId);

  // Локальные состояния для перетаскивания
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Запрос рендера через requestAnimationFrame
  const requestRenderIfNotRequested = useCallback(() => {
    if (animationFrameIdRef.current === null) {
      animationFrameIdRef.current = requestAnimationFrame(() => {
        coreInstance?.render();
        animationFrameIdRef.current = null;
      });
    }
  }, [coreInstance]);
  // При выборе объекта на холсте передаём только id
  const handleEditorSelectObject = useCallback((objectId: string | null) => {
    dispatch(setCurrentObjectId(objectId));
  }, [dispatch]);

  // Локальное обновление объекта (например, при перетаскивании)
  const handleUpdateObjectLocal = useCallback((updatedObject: GameObject) => {
    setGameObjectsMap((prevMap) => {
      const newMap = new Map(prevMap);
      const existing = newMap.get(updatedObject.id);
      if (existing) {
        newMap.set(updatedObject.id, { ...existing, ...updatedObject });
      }
      return newMap;
    });
    dispatch(updateSceneObject({ activeScene, object: updatedObject }));
  }, [dispatch, activeScene]);

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('Canvas не найден.');
      return;
    }
  
    const core = new Core({
      canvasId: canvasRef.current.id,
      renderType: renderType,
      backgroundColor: '#D3D3D3',
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
    });
  
    const sceneManager = core.getSceneManager();
  
    // Создаём сцену прямо здесь, через экземпляр ядра
    if (!sceneManager.getCurrentScene() || sceneManager.getCurrentScene().name !== activeScene) {
      sceneManager.createScene(activeScene);
      sceneManager.changeScene(activeScene);
    }
  
    core.switchMode(EditorMode, (selectedObjId: string | null) => {
      dispatch(setCurrentObjectId(selectedObjId));
    });
    core.start();
    setCoreInstance(core);
  
    const shape2dInstance = getShape2d(core.renderType);
    setShape2d(shape2dInstance);
  
    return () => {
      core.stop();
    };
  }, [activeScene, renderType, dispatch]);

  // Обновление выделенного объекта в ядре и перерисовка
  useEffect(() => {
    if (!coreInstance || !gameObjectsMap.size) return;

    const liveObject = currentObjectId ? gameObjectsMap.get(currentObjectId) : null;
    coreInstance.setSelectedObject(liveObject || null);
    requestRenderIfNotRequested();
  }, [currentObjectId, gameObjectsMap, coreInstance, requestRenderIfNotRequested]);

  // Локальная логика перетаскивания: mousedown, mousemove, mouseup
  const handleMouseDown = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / canvas.clientWidth);
    const y = (event.clientY - rect.top) * (canvas.height / canvas.clientHeight);
    for (let i = sceneObjects.length - 1; i >= 0; i--) {
      const so = sceneObjects[i];
      if (so.containsPoint && so.containsPoint(x, y)) {
        dispatch(setCurrentObjectId(so.id));
        setIsDragging(true);
        const liveObj = gameObjectsMap.get(so.id);
        if (liveObj) {
          setDragOffset({ x: x - liveObj.x, y: y - liveObj.y });
        }
        return;
      }
    }
    dispatch(setCurrentObjectId(null));
  }, [sceneObjects, dispatch, gameObjectsMap]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !currentObjectId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / canvas.clientWidth);
    const y = (event.clientY - rect.top) * (canvas.height / canvas.clientHeight);
    const liveObj = gameObjectsMap.get(currentObjectId);
    if (!liveObj) return;
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;
    handleUpdateObjectLocal({ ...liveObj, x: newX, y: newY });
  }, [isDragging, currentObjectId, gameObjectsMap, dragOffset, handleUpdateObjectLocal]);

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



  useCanvasResize(canvasRef, coreInstance);
  
  const handleStartPreview = () => {

    const userCodeString = localStorage.getItem(`CodeLogic:${projectId}:${activeScene}`) || "";
    coreInstance.switchMode(PreviewMode, activeScene, userCodeString);
  };
  // Остановка превью: переключаем режим обратно на EditorMode
  const handleStopPreview = () => {
    coreInstance?.switchMode(EditorMode, (selectedObjId: string | null) => {
      dispatch(setCurrentObjectId(selectedObjId));
    });
  };

  // Подписываемся на события ядра
  useCoreEvents(coreInstance, {
    onObjectSelected: ({ object }) => dispatch(setCurrentObjectId(object?.id || null)),
    onModeChanged: ({ mode }) => console.log(`Mode changed to: ${mode}`),
  });
  useEffect(() => {
    if (!coreInstance) return;
  
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверяем, в PreviewMode ли мы
      // (можно также проверять: coreInstance.currentMode instanceof PreviewMode)
      if (e.key === "Escape") {
        // Узнаём, действительно ли сейчас Preview
        if (coreInstance.currentMode?.constructor?.name === "PreviewMode") {
          handleStopPreview(); // твоя функция
        }
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [coreInstance, handleStopPreview]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
      />
      <GameObjectManager
        coreInstance={coreInstance}
        shape2d={shape2d}
        sceneData={{ activeScene, objects: sceneObjects, settings: {} }}
        activeScene={activeScene}
        onGameObjectsMapUpdate={setGameObjectsMap}
        requestRenderIfNotRequested={requestRenderIfNotRequested}
      />
      <PreviewControls
        onStartPreview={handleStartPreview}
        onStopPreview={handleStopPreview}
      />
    </div>
  );
};

export default SceneCanvas;
