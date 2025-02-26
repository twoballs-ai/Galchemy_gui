import { useEffect } from 'react';

const useCanvasResize = (canvasRef: React.RefObject<HTMLCanvasElement>, coreInstance: any) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !coreInstance) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const newWidth = parent.clientWidth;
        const newHeight = parent.clientHeight;
        coreInstance.resize(newWidth, newHeight);
        //console.log(`Canvas resized to: ${newWidth}x${newHeight}`);
      }
    };

    // Инициализируем размер при монтировании
    handleResize();

    // Создаем ResizeObserver для отслеживания изменений размеров родительского элемента
    const resizeObserver = new ResizeObserver(handleResize);
    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef, coreInstance]);
};

export default useCanvasResize;
