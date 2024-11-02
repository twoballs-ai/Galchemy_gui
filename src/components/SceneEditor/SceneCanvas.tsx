import React, { useRef, useEffect, useState } from 'react';
import { Core, SceneManager, getShape2d } from 'tette-core'; // Импортируем getShape2d

interface SceneCanvasProps {
  scene: string; // Имя активной сцены
  sceneData: any; // Данные сцены, включая объекты
}

const SceneCanvas: React.FC<SceneCanvasProps> = ({ scene, sceneData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coreInstance, setCoreInstance] = useState<Core | null>(null);
  const [shape2d, setShape2d] = useState<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Создаем экземпляры SceneManager и Core
    const sceneManager = new SceneManager();
    sceneManager.createScene(scene); // Инициализация сцены

    const core = new Core({
      canvasId: canvasRef.current.id,
      renderType: '2d', // или '2d' по необходимости
      backgroundColor: '#D3D3D3',
      sceneManager: sceneManager,
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
    });

    core.enableGuiMode(); // Активируем режим GUI
    setCoreInstance(core);

    // Инициализируем shape2d
    console.log(core)
    const shape2dInstance = getShape2d(core.renderType);
    setShape2d(shape2dInstance);

    return () => {
      // Очистка при размонтировании
      core.stop();
    };
  }, [scene]);

  // Обновляем сцену при изменении объектов
  useEffect(() => {
    if (coreInstance && shape2d) {
      const sceneManager = coreInstance.getSceneManager();
      sceneManager.clearScene(scene); // Очищаем текущую сцену

      sceneData.objects.forEach((obj: any) => {
        let gameObject;

        if (obj.type === 'rectangle') {
          gameObject = shape2d.rectangle({
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            color: obj.color,
          });
        }
        // Обработка других типов объектов аналогично

        if (gameObject) {
          sceneManager.addGameObjectToScene(scene, gameObject);
        }
      });

      sceneManager.changeScene(scene); // Устанавливаем активную сцену
      coreInstance.render(); // Перерисовываем сцену
    }
  }, [sceneData.objects, coreInstance, shape2d]);

  // Функция для запуска предпросмотра
  const handleStartPreview = () => {
    if (coreInstance) {
      coreInstance.disableGuiMode(); // Отключаем режим GUI и запускаем игровой цикл
      coreInstance.start();
    }
  };

  // Функция для остановки предпросмотра
  const handleStopPreview = () => {
    if (coreInstance) {
      coreInstance.enableGuiMode(); // Включаем режим GUI
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
      />
      {/* Кнопки для управления предпросмотром */}
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
