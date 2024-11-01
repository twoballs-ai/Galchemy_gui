import React, { useRef, useEffect, useState } from 'react';
import { Core, SceneManager } from 'tette-core'; // Импорты из вашего пакета

interface SceneCanvasProps {
  scene: string; // Имя активной сцены, передаваемой в компонент
}

const SceneCanvas: React.FC<SceneCanvasProps> = ({ scene }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coreInstance, setCoreInstance] = useState<Core | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Создаем экземпляр SceneManager и Core
    const sceneManager = new SceneManager();
    sceneManager.createScene(scene); // Инициализация сцены

    const core = new Core({
      canvasId: canvasRef.current.id,
      renderType: 'webgl',
      backgroundColor: '#D3D3D3',
      sceneManager: sceneManager,
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight,
    });

    core.enableGuiMode(); // Активируем режим GUI
    setCoreInstance(core);

    return () => {
      // Очистка при размонтировании, если необходимо
    };
  }, [scene]);

  // Функция для запуска предпросмотра
  const handleStartPreview = () => {
    if (coreInstance) {
      coreInstance.disableGuiMode(); // Отключаем режим GUI и запускаем игровой цикл
      coreInstance.start();
    }
  };

  // Функция для возврата в режим GUI
  const handleStopPreview = () => {
    if (coreInstance) {
      coreInstance.enableGuiMode(); // Активируем режим GUI
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
