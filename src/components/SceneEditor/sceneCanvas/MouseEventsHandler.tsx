import React, { useEffect, useRef } from 'react';

interface MouseEventsHandlerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onMouseDown: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  onMouseUp: () => void;
}

const MouseEventsHandler: React.FC<MouseEventsHandlerProps> = ({
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) => {
  const isMouseEventAttached = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isMouseEventAttached.current) return;

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);

    isMouseEventAttached.current = true;

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      isMouseEventAttached.current = false;
    };
  }, [canvasRef, onMouseDown, onMouseMove, onMouseUp]);

  return null; // Этот компонент не рендерит ничего, только добавляет обработчики событий
};

export default MouseEventsHandler;
