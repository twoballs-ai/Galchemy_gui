// import React, { useEffect, useRef } from 'react';

// interface CanvasContainerProps {
//   canvasRef: React.RefObject<HTMLCanvasElement>;
//   onMouseDown: (event: MouseEvent) => void;
//   onMouseMove: (event: MouseEvent) => void;
//   onMouseUp: () => void;
//   coreInstance: any;
// }

// const CanvasContainer: React.FC<CanvasContainerProps> = ({
//   canvasRef,
//   onMouseDown,
//   onMouseMove,
//   onMouseUp,
//   coreInstance,
// }) => {
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     canvas.addEventListener('mousedown', onMouseDown);
//     canvas.addEventListener('mousemove', onMouseMove);
//     canvas.addEventListener('mouseup', onMouseUp);

//     return () => {
//       canvas.removeEventListener('mousedown', onMouseDown);
//       canvas.removeEventListener('mousemove', onMouseMove);
//       canvas.removeEventListener('mouseup', onMouseUp);
//     };
//   }, [onMouseDown, onMouseMove, onMouseUp]);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas || !coreInstance) return;

//     const handleResize = () => {
//       const parent = canvas.parentElement;
//       if (parent) {
//         const newWidth = parent.clientWidth;
//         const newHeight = parent.clientHeight;
//         coreInstance.resize(newWidth, newHeight);
//       }
//     };

//     handleResize();

//     const resizeObserver = new ResizeObserver(handleResize);
//     const parent = canvas.parentElement;
//     if (parent) resizeObserver.observe(parent);

//     return () => resizeObserver.disconnect();
//   }, [coreInstance]);

//   return (
//     <canvas
//       ref={canvasRef}
//       id="canvas"
//       style={{ border: '1px solid #ccc', width: '100%', height: '100%' }}
//     />
//   );
// };

// export default CanvasContainer;
