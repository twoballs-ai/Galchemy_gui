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

  // States for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [highlightFrame, setHighlightFrame] = useState<any>(null);

  // Store game objects by their ID
  const [gameObjectsMap, setGameObjectsMap] = useState<Map<string, any>>(new Map());

  let animationFrameId: number | null = null;

  const requestRenderIfNotRequested = () => {
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(() => {
        coreInstance?.render();
        animationFrameId = null;
      });
    }
  };

  // Declare handleSelectObject and handleUpdateObject functions
  const handleSelectObject = (object: any) => {
    onSelectObject(object);
  };

  const handleUpdateObject = (updatedObject: any) => {
    // Avoid updating sceneData.objects during dragging to prevent re-rendering the scene
    // onUpdateObject(updatedObject); // Comment this out during dragging

    const gameObject = gameObjectsMap.get(updatedObject.id);
    if (gameObject) {
      // Update only necessary properties
      gameObject.x = updatedObject.x;
      gameObject.y = updatedObject.y;
      // Update other properties if necessary

      // If the image has changed, update it
      if (
        updatedObject.image &&
        (updatedObject.type === 'sprite' || updatedObject.type === 'spriteGrid') &&
        updatedObject.image !== gameObject.image.src // Check if image has changed
      ) {
        const image = new Image();
        image.src = updatedObject.image;
        image.onload = () => {
          gameObject.image = image;
          requestRenderIfNotRequested();
        };
      } else {
        // Only render if necessary
        requestRenderIfNotRequested();
      }
    }
  };

  // Initialize Core and Shape2D
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

  // Create the highlight frame
  useEffect(() => {
    if (shape2d) {
      const frame = shape2d.frame({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        borderColor: 'blue',
        borderWidth: 2,
      });
      frame.visible = false; // Initially, the frame is not visible
      setHighlightFrame(frame);
    }
  }, [shape2d]);

  // Add the highlight frame to the scene
  useEffect(() => {
    if (coreInstance && highlightFrame) {
      const sceneManager = coreInstance.getSceneManager();
      sceneManager.addGameObjectToScene(sceneName, highlightFrame);
      requestRenderIfNotRequested();
    }
  }, [coreInstance, highlightFrame]);

  // Create game objects
  const createGameObject = (obj: any) => {
    if (!shape2d) return null;

    const shapeFunction = shape2d[obj.type];
    if (!shapeFunction) {
      console.warn('Неизвестный тип объекта:', obj.type);
      return null;
    }

    const gameObjectParams = { ...obj }; // Create a copy

    // Handle sprites and spriteGrids
    if (obj.type === 'sprite' || obj.type === 'spriteGrid') {
      const image = new Image();
      image.src = obj.image;
      gameObjectParams.image = image; // Assign the image object

      image.onload = () => {
        requestRenderIfNotRequested();
      };

      image.onerror = () => {
        console.error('Ошибка загрузки изображения для объекта:', obj.name);
      };
    }

    const gameObject = shapeFunction(gameObjectParams);
    gameObject.id = obj.id; // Assign ID to game object
    return gameObject;
  };

  // Update highlight frame when selectedObject changes
  useEffect(() => {
    if (highlightFrame && selectedObject && gameObjectsMap.has(selectedObject.id)) {
      const gameObject = gameObjectsMap.get(selectedObject.id);
      const boundingBox = gameObject.getBoundingBox();

      highlightFrame.x = boundingBox.x;
      highlightFrame.y = boundingBox.y;
      highlightFrame.width = boundingBox.width;
      highlightFrame.height = boundingBox.height;
      highlightFrame.visible = true;
    } else if (highlightFrame) {
      highlightFrame.visible = false;
    }
    requestRenderIfNotRequested();
  }, [selectedObject, highlightFrame, gameObjectsMap]);

  // Render the scene (only when sceneData.objects changes)
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

      // Add the highlight frame to the scene
      if (highlightFrame) {
        sceneManager.addGameObjectToScene(sceneName, highlightFrame);
      }

      setGameObjectsMap(newGameObjectsMap);
      sceneManager.changeScene(sceneName);
      requestRenderIfNotRequested();
    }
  }, [sceneData.objects, coreInstance, shape2d, sceneName, highlightFrame]);

  // Mouse event handlers
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

      // Logic for moving the object
      updatedObject.x = x - dragOffsetX;
      updatedObject.y = y - dragOffsetY;

      handleUpdateObject(updatedObject);
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // Update the sceneData.objects only when dragging ends
      if (selectedObject) {
        onUpdateObject(selectedObject);
      }
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

  // Function to get object under cursor
  const getObjectAtPosition = (x: number, y: number): any => {
    const objects = Array.from(gameObjectsMap.values());

    // Iterate objects in reverse order (from top to bottom)
    for (let i = objects.length - 1; i >= 0; i--) {
      const gameObject = objects[i];
      if (gameObject.containsPoint && gameObject.containsPoint(x, y)) {
        return sceneData.objects.find((obj: any) => obj.id === gameObject.id);
      }
    }
    return null;
  };

  // Handlers for preview
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
