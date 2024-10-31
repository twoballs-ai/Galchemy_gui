import React, { useEffect, useRef, useState } from 'react';
import { GraphicalContext, WebGLRenderer, SceneManager, ResourceManager } from '../../../../TETTE_CORE/core/core_logic';

const SceneCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const [renderer, setRenderer] = useState<WebGLRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize the rendering context
    const graphicalContext = new GraphicalContext(canvasRef.current);
    const rendererInstance = new WebGLRenderer(graphicalContext);
    setRenderer(rendererInstance);

    // Set up scene manager
    const sceneManagerInstance = new SceneManager();
    sceneManagerInstance.setRenderer(rendererInstance);
    setSceneManager(sceneManagerInstance);

    // Render loop
    const renderLoop = () => {
      rendererInstance.render(sceneManagerInstance.getCurrentScene());
      requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Cleanup on unmount
    return () => {
      rendererInstance.cleanup();
      graphicalContext.cleanup();
    };
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', height: '100%' }} />;
};

export default SceneCanvas;
