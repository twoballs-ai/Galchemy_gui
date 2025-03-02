import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { setCurrentObjectId, updateSceneObject } from '../../../store/slices/sceneObjectsSlice';
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
  // и т.д.
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

  // Все объекты из Redux
  const sceneObjects = useSelector((state: RootState) => state.sceneObjects.objects);

  // Текущее выбранное id
  const currentObjectId = useSelector((state: RootState) => state.sceneObjects.currentObjectId);
  // Для удобства можем найти объект в "сырых" данных Redux:
  const selectedReduxObject = currentObjectId 
    ? sceneObjects.find(obj => obj.id === currentObjectId)
    : null;

  // Локальные состояния для перетаскивания
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Анимация рендера
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
    // Обновим локальную карту
    setGameObjectsMap((prevMap) => {
      const newMap = new Map(prevMap);
      const existing = newMap.get(updatedObject.id);
      if (existing) {
        const updatedGameObject = { ...existing, x: updatedObject.x, y: updatedObject.y };
        // Если нужно обновить image, layer и т.д. — тоже можно
        newMap.set(updatedObject.id, updatedGameObject);
      }
      return newMap;
    });

    // Сохраним изменения в Redux/базе
    dispatch(updateSceneObject({ activeScene, object: updatedObject }));
  }, [dispatch, activeScene]);

  // Инициализация ядра
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

    // Вместо целого объекта, EditorMode теперь отдаёт только id:
    core.switchMode(EditorMode, (selectedObjId: string | null) => {
      dispatch(setCurrentObjectId(selectedObjId));
    });

    setCoreInstance(core);

    const shape2dInstance = getShape2d(core.renderType);
    setShape2d(shape2dInstance);

    return () => {
      core.stop();
    };
  }, [activeScene, renderType, dispatch]);

  // Подсветка выбранного объекта в ядре (опционально)
  // Если нужно, можно найти «живой» объект в gameObjectsMap и вызвать coreInstance.setSelectedObject(...)
  useEffect(() => {
    if (!coreInstance) return;

    // Найдём "живой" объект в map
    const liveObject = currentObjectId ? gameObjectsMap.get(currentObjectId) : null;
    coreInstance.setSelectedObject(liveObject || null);

    requestRenderIfNotRequested();
  }, [currentObjectId, gameObjectsMap, coreInstance, requestRenderIfNotRequested]);

  // Локальная логика перетаскивания
  const handleMouseDown = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / canvas.clientWidth);
    const y = (event.clientY - rect.top) * (canvas.height / canvas.clientHeight);

    // Можем проверить: какой объект из gameObjectsMap «живой» попадает под курсор?
    // Или, если ещё используете sceneObjects + containsPoint, нужно синхронизировать
    for (let i = sceneObjects.length - 1; i >= 0; i--) {
      const so = sceneObjects[i];
      if (so.containsPoint && so.containsPoint(x, y)) {
        // Выбираем этот объект
        dispatch(setCurrentObjectId(so.id));
        setIsDragging(true);

        // Находим «живой» объект в локальной карте
        const liveObj = gameObjectsMap.get(so.id);
        if (liveObj) {
          setDragOffset({ x: x - liveObj.x, y: y - liveObj.y });
        }
        return;
      }
    }
    // Если не нашли — сбрасываем выбор
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

    // Новые координаты
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;

    // Обновим локально + Redux
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

  // Запуск/остановка превью
  const handleStartPreview = () => {
    coreInstance?.switchMode(PreviewMode, activeScene);
  };

  const handleStopPreview = () => {
    coreInstance?.switchMode(EditorMode, (selectedObjId: string | null) => {
      dispatch(setCurrentObjectId(selectedObjId));
    });
  };

  useCanvasResize(canvasRef, coreInstance);

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
