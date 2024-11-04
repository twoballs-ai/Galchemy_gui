import React, { useRef, useEffect, useState } from 'react';
import { Core, SceneManager, getShape2d } from 'tette-core';

interface SceneCanvasProps {
  scene: string;
  sceneData: any;
}

const SceneCanvas: React.FC<SceneCanvasProps> = ({ scene, sceneData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coreInstance, setCoreInstance] = useState<Core | null>(null);
  const [shape2d, setShape2d] = useState<any>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('Canvas не найден.');
      return;
    }

    const sceneManager = new SceneManager();
    sceneManager.createScene(scene);

    const core = new Core({
      canvasId: canvasRef.current.id,
      renderType: '2d',
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
      if (core) {
        core.stop();
        console.log('Core остановлен.');
      }
    };
  }, [scene]);

  const createGameObject = (obj: any) => {
    if (!shape2d) return null;
  
    // Достаем параметры из объекта
    const {
    x = 50,
    y = 50,
    color = 'blue',
    borderColor = 'black',
    borderWidth = 1,
    radius = 50,
    ...params
  } = obj;

  
    // Создание объекта в зависимости от типа
    switch (obj.type) {
      case 'square':
        return shape2d.square({ x, y, color, size: obj.size, ...params });
      case 'rectangle':
        return shape2d.rectangle({ x, y, color, width: obj.width, height: obj.height, ...params });
      case 'circle':
        // Убедитесь, что все необходимые параметры передаются
        return shape2d.circle({ x, y, color, radius, borderColor, borderWidth, ...params });
      case 'line':
        return shape2d.line({ x1: obj.x1, y1: obj.y1, x2: obj.x2, y2: obj.y2, color, lineWidth: obj.lineWidth, ...params });
      case 'polygon':
        return shape2d.polygon({ x, y, color, vertices: obj.vertices, ...params });
      case 'text':
        return shape2d.text({ x, y, color, text: obj.text, fontSize: obj.fontSize, fontFamily: obj.fontFamily, ...params });
      case 'ellipse':
        return shape2d.ellipse({ x, y, color, radiusX: obj.radiusX, radiusY: obj.radiusY, rotation: obj.rotation, ...params });
      case 'arc':
        return shape2d.arc({
          x, y, color, radius: obj.radius, startAngle: obj.startAngle, endAngle: obj.endAngle,
          borderColor, borderWidth, ...params,
        });
      case 'bezierCurve':
        return shape2d.bezierCurve({
          x, y, color,
          startX: obj.startX, startY: obj.startY,
          controlX1: obj.controlX1, controlY1: obj.controlY1,
          controlX2: obj.controlX2, controlY2: obj.controlY2,
          endX: obj.endX, endY: obj.endY, ...params,
        });
      case 'star':
        return shape2d.star({ x, y, color, radius: obj.radius, points: obj.points, ...params });
      case 'point':
        return shape2d.point({ x, y, color, size: obj.size, ...params });
      default:
        console.warn('Неизвестный тип объекта:', obj.type);
        return null;
    }
  };

  useEffect(() => {
    if (coreInstance && shape2d && sceneData.objects) {
      const sceneManager = coreInstance.getSceneManager();
      sceneManager.clearScene(scene);

      sceneData.objects.forEach((obj: any) => {
        const gameObject = createGameObject(obj);
        console.log(obj);
        console.log(gameObject);
        if (gameObject) {
          sceneManager.addGameObjectToScene(scene, gameObject);
          console.log('Объект добавлен в сцену:', gameObject);
        }
      });

      sceneManager.changeScene(scene);
      coreInstance.render();
    }
  }, [sceneData.objects, coreInstance, shape2d]);

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
      console.log('Остановка предпросмотра.');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
      />
      <button onClick={handleStartPreview} style={{ position: 'absolute', top: 10, left: 10 }}>
        Start Preview
      </button>
      <button onClick={handleStopPreview} style={{ position: 'absolute', top: 10, left: 100 }}>
        Stop Preview
      </button>
    </div>
  );
};

export default SceneCanvas;
