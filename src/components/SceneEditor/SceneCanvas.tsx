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
  
    console.log('Передача объекта в функцию shape2d:', obj);
  
    const shapeFunction = shape2d[obj.type];
    console.log(shapeFunction)
    if (!shapeFunction) {
      console.warn('Неизвестный тип объекта:', obj.type);
      return null;
    }
  
    const gameObject = shapeFunction(obj);
    console.log('Созданный игровой объект:', gameObject);
    return gameObject;
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
