// src/components/sceneCanvas/GameObjectManager.tsx

import React, { useEffect } from 'react';
import { GameObject, Core, SceneData } from '../../types';

interface GameObjectManagerProps {
  coreInstance: Core | null;
  shape2d: any;
  sceneData: SceneData;
  sceneName: string;
  onGameObjectsMapUpdate: (map: Map<string, GameObject>) => void;
  requestRenderIfNotRequested: () => void;
}

const GameObjectManager: React.FC<GameObjectManagerProps> = ({
  coreInstance,
  shape2d,
  sceneData,
  sceneName,
  onGameObjectsMapUpdate,
  requestRenderIfNotRequested,
}) => {
  // Логика создания объекта
  const createGameObject = (obj: GameObject) => {
    if (!shape2d) return null;

    const shapeFunction = shape2d[obj.type];
    if (!shapeFunction) {
      console.warn('Неизвестный тип объекта:', obj.type);
      return null;
    }

    const gameObjectParams = { ...obj };

    if (obj.type === 'sprite' || obj.type === 'spriteGrid') {
      const image = new Image();
      image.src = obj.image || '';
      gameObjectParams.image = image;

      image.onload = () => {
        requestRenderIfNotRequested();
      };

      image.onerror = () => {
        console.error('Ошибка загрузки изображения для объекта:', obj.id);
      };
    }

    if (typeof gameObjectParams.width !== 'number') gameObjectParams.width = 50;
    if (typeof gameObjectParams.height !== 'number') gameObjectParams.height = 50;

    const gameObject = shapeFunction(gameObjectParams);
    gameObject.id = obj.id;
    return gameObject;
  };

  // Рендеринг объектов
  useEffect(() => {
    if (coreInstance && shape2d && sceneData.objects) {
      const sceneManager = coreInstance.getSceneManager();
      sceneManager.clearScene(sceneName);

      const newGameObjectsMap = new Map<string, GameObject>();

      sceneData.objects.forEach((obj: GameObject) => {
        const gameObject = createGameObject(obj);
        if (gameObject) {
          sceneManager.addGameObjectToScene(sceneName, gameObject);
          newGameObjectsMap.set(obj.id, gameObject);
        }
      });

      onGameObjectsMapUpdate(newGameObjectsMap);
      sceneManager.changeScene(sceneName);
      requestRenderIfNotRequested();
    }
  }, [coreInstance, shape2d, sceneData.objects, sceneName, requestRenderIfNotRequested]);

  return null;
};

export default GameObjectManager;
