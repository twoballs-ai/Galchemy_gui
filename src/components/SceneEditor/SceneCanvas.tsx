import React, { useRef, useEffect } from 'react';

interface SceneCanvasProps {
  scene: string; // Имя активной сцены, передаваемой в компонент
}

const SceneCanvas: React.FC<SceneCanvasProps> = ({ scene }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Инициализация canvas для GUI
    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.fillStyle = 'lightgray'; // Фоновый цвет для визуального представления
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    console.log(`Canvas готов для отображения сцены: ${scene}`);
  }, [scene]);

  return (
    <canvas
      ref={canvasRef}
      // width={800}
      // height={600}
      style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
    />
  );
};

export default SceneCanvas;
