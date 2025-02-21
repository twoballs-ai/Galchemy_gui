// SceneCanvas.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Core, SceneManager, getShape2d, EditorMode, PreviewMode } from 'tette-core';
import { globalLogicManager } from '../../../logicManager';
import PreviewControls from './sceneCanvas/PreviewControls';
import useCanvasResize from './sceneCanvas/hooks/useCanvasResize';
import GameObjectManager from './sceneCanvas/GameObjectManager';

interface SceneData {
  sceneName: string;
  objects: GameObject[];
  settings: object;
  logicGraph?: any; 
}

interface GameObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  image?: string;
  // Другие свойства

  // Методы для проверки точки и получения bounding box
  containsPoint?: (x: number, y: number) => boolean;
  getBoundingBox?: () => { x: number; y: number; width: number; height: number };
}

interface SceneCanvasProps {
  sceneName: string;
  renderType: string;
  sceneData: SceneData;
  selectedObject: GameObject | null;
  onSelectObject: (object: GameObject | null) => void;
  onUpdateObject: (updatedObject: GameObject) => void;
}

const SceneCanvas: React.FC<SceneCanvasProps> = ({
  sceneName,
  renderType,
  sceneData,
  selectedObject,
  onSelectObject,
  onUpdateObject,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const [coreInstance, setCoreInstance] = useState<Core | null>(null);
  const [shape2d, setShape2d] = useState<any>(null);
  const [gameObjectsMap, setGameObjectsMap] = useState<Map<string, GameObject>>(new Map());

  // Состояния для перетаскивания
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Функция запроса рендера, если не запрошен
  const requestRenderIfNotRequested = useCallback(() => {
    if (animationFrameIdRef.current === null) {
      animationFrameIdRef.current = requestAnimationFrame(() => {
        coreInstance?.render();
        animationFrameIdRef.current = null;
      });
    }
  }, [coreInstance]);

  // Обработчики событий
  const handleSelectObject = useCallback((object: GameObject | null) => {
    onSelectObject(object);
  }, [onSelectObject]);

  const handleUpdateObjectLocal = useCallback((updatedObject: GameObject) => {
    // Обновляем gameObjectsMap без прямой мутации
    setGameObjectsMap((prevMap) => {
      const newMap = new Map(prevMap);
      const gameObject = newMap.get(updatedObject.id);
      if (gameObject) {
        const updatedGameObject = { ...gameObject, x: updatedObject.x, y: updatedObject.y };

        // Обновление изображения, если изменилось
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
            console.error('Ошибка загрузки изображения для объекта:', updatedObject.id);
          };
        }

        newMap.set(updatedObject.id, updatedGameObject);
      }
      return newMap;
    });

    // Уведомляем родителя об обновлении объекта
    onUpdateObject(updatedObject);
  }, [requestRenderIfNotRequested, onUpdateObject]);

  // Инициализация Core и Shape2D
  useEffect(() => {
    if (!canvasRef.current) {
      console.error('Canvas не найден.');
      return;
    }

    const sceneManager = new SceneManager();
    sceneManager.createScene(sceneName);

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

    console.log('Core и shape2d инициализированы:', core, shape2dInstance);

    return () => {
      core.stop();
      console.log('Core остановлен.');
    };
  }, [sceneName, renderType]);



  useEffect(() => {
    if (coreInstance) {
      coreInstance.setSelectedObject(selectedObject);
    }
  }, [selectedObject, coreInstance]);
  // Обработчики событий мыши
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

    console.log(`Moving object ${updatedObject.id} to (${updatedObject.x}, ${updatedObject.y})`);

    handleUpdateObjectLocal(updatedObject);
  }, [isDragging, selectedObject, dragOffset, handleUpdateObjectLocal]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Дополнительные действия при отпускании мыши, если необходимо
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

  // Получение объекта под курсором
  const getObjectAtPosition = (x: number, y: number): GameObject | null => {
    const objects = Array.from(gameObjectsMap.values());

    for (let i = objects.length - 1; i >= 0; i--) {
      const gameObject = objects[i];
      if (gameObject.containsPoint && gameObject.containsPoint(x, y)) {
        return sceneData.objects.find(obj => obj.id === gameObject.id) || null;
      }
    }
    return null;
  };

  const handleStartPreview = () => {
    if (coreInstance) {
      coreInstance.switchMode(PreviewMode, sceneName);
  
      // Активация анимаций для всех объектов
      gameObjectsMap.forEach((gameObject) => {
        if (gameObject.type === 'character' || gameObject.type === 'enemy') {
          // gameObject.isStatic = false; // Включаем динамическое поведение
        }
      });
      console.log('Preview mode started.');
    }
  };
  
  const handleStopPreview = () => {
    if (coreInstance) {
      coreInstance.switchMode(EditorMode);
  
      // Деактивация анимаций (статическое отображение)
      gameObjectsMap.forEach((gameObject) => {
        if (gameObject.type === 'character' || gameObject.type === 'enemy') {
          // gameObject.isStatic = true; // Переводим в статический режим
        }
      });
      console.log('Editor mode resumed.');
    }
  };

  // Подключение функции resize
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
        sceneData={sceneData}
        sceneName={sceneName}
        onGameObjectsMapUpdate={setGameObjectsMap}
        requestRenderIfNotRequested={requestRenderIfNotRequested}
      />
      <PreviewControls onStartPreview={handleStartPreview} onStopPreview={handleStopPreview} />

    </div>
  );
};

export default SceneCanvas;
