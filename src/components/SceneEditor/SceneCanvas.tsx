import React, { useRef, useEffect, useState } from 'react';
import { Core, SceneManager, getShape2d } from 'tette-core';

interface SceneCanvasProps {
  sceneName: string;
  renderType: string;
  sceneData: any;
  selectedObject: any;
  onSelectObject: (object: any) => void;
  onUpdateObject: (updatedObject: any) => void;
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
  const [coreInstance, setCoreInstance] = useState<Core | null>(null);
  const [shape2d, setShape2d] = useState<any>(null);

  // Состояния для перетаскивания
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  // Хранение игровых объектов по их ID
  const [gameObjectsMap, setGameObjectsMap] = useState<Map<string, any>>(new Map());

  // Объявление функций handleSelectObject и handleUpdateObject
  const handleSelectObject = (object: any) => {
    onSelectObject(object);
  };

  const handleUpdateObject = (updatedObject: any) => {
    onUpdateObject(updatedObject);

    // Обновляем свойства игрового объекта в gameObjectsMap
    const gameObject = gameObjectsMap.get(updatedObject.id);
    if (gameObject) {
      Object.assign(gameObject, updatedObject);
      coreInstance?.render();
    }
  };

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

    core.enableGuiMode();
    setCoreInstance(core);

    const shape2dInstance = getShape2d(core.renderType);
    setShape2d(shape2dInstance);

    console.log('Core и shape2d инициализированы:', core, shape2dInstance);

    return () => {
      core.stop();
      console.log('Core остановлен.');
    };
  }, [sceneName, renderType]);

  // Создание игровых объектов
  const createGameObject = (obj: any) => {
    if (!shape2d) return null;

    console.log('Передача объекта в функцию shape2d:', obj);

    const shapeFunction = shape2d[obj.type];
    if (!shapeFunction) {
      console.warn('Неизвестный тип объекта:', obj.type);
      return null;
    }

    const gameObject = shapeFunction(obj);
    gameObject.id = obj.id; // Присваиваем ID объекту
    console.log('Созданный игровой объект:', gameObject);
    return gameObject;
  };

  // Обработчики событий мыши
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / canvas.clientWidth);
      const y = (event.clientY - rect.top) * (canvas.height / canvas.clientHeight);

      const clickedObject = getObjectAtPosition(x, y);

      if (clickedObject) {
        handleSelectObject(clickedObject);

        setIsDragging(true);
        const gameObject = gameObjectsMap.get(clickedObject.id);
        if (gameObject) {
          setDragOffsetX(x - gameObject.x);
          setDragOffsetY(y - gameObject.y);
        }
      } else {
        handleSelectObject(null);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !selectedObject) return;

      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / canvas.clientWidth);
      const y = (event.clientY - rect.top) * (canvas.height / canvas.clientHeight);

      const updatedObject = { ...selectedObject };

      // Логика перемещения объекта
      updatedObject.x = x - dragOffsetX;
      updatedObject.y = y - dragOffsetY;

      handleUpdateObject(updatedObject);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedObject, dragOffsetX, dragOffsetY, gameObjectsMap]);

  // Функция для определения объекта под курсором
  const getObjectAtPosition = (x: number, y: number): any => {
    const objects = Array.from(gameObjectsMap.values());

    // Перебираем объекты в обратном порядке (от верхнего к нижнему)
    for (let i = objects.length - 1; i >= 0; i--) {
      const gameObject = objects[i];
      if (gameObject.containsPoint && gameObject.containsPoint(x, y)) {
        return sceneData.objects.find((obj: any) => obj.id === gameObject.id);
      }
    }
    return null;
  };

  // Рендеринг сцены и отображение bounding box для выбранного объекта
  useEffect(() => {
    if (coreInstance && shape2d && sceneData.objects) {
      const sceneManager = coreInstance.getSceneManager();
      sceneManager.clearScene(sceneName);

      const newGameObjectsMap = new Map<string, any>();

      sceneData.objects.forEach((obj: any) => {
        const gameObject = createGameObject(obj);
        if (gameObject) {
          sceneManager.addGameObjectToScene(sceneName, gameObject);
          newGameObjectsMap.set(obj.id, gameObject);
        }
      });

      // Добавляем отображение bounding box для выбранного объекта
      if (selectedObject) {
        const gameObject = newGameObjectsMap.get(selectedObject.id);
        if (gameObject) {
          const boundingBox = gameObject.getBoundingBox();
          const highlightRect = shape2d.rectangle({
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
            color: 'rgba(0, 0, 255, 0.1)', // Полупрозрачный синий
            borderColor: 'blue',
            borderWidth: 1,
            isFilled: false,
          });
          sceneManager.addGameObjectToScene(sceneName, highlightRect);
        }
      }

      setGameObjectsMap(newGameObjectsMap);
      sceneManager.changeScene(sceneName);
      coreInstance.render();
    }
  }, [sceneData.objects, coreInstance, shape2d, selectedObject, sceneName]);

  // Обработчики для предпросмотра
  const handleStartPreview = () => {
    if (coreInstance) {
      coreInstance.disableGuiMode();
      coreInstance.start();
      console.log('Запуск предпросмотра.');
    }
  };

  const handleStopPreview = () => {
    if (coreInstance) {
      coreInstance.enableGuiMode();
      coreInstance.stop();
      console.log('Остановка предпросмотра.');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
      />
      <button
        onClick={handleStartPreview}
        style={{ position: 'absolute', top: 10, left: 10 }}
      >
        Start Preview
      </button>
      <button
        onClick={handleStopPreview}
        style={{ position: 'absolute', top: 10, left: 120 }}
      >
        Stop Preview
      </button>
    </div>
  );
};

export default SceneCanvas;
