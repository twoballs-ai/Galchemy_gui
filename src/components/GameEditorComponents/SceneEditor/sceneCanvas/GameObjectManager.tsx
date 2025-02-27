import React, { useEffect } from 'react';


interface GameObjectManagerProps {
  coreInstance: Core | null;
  shape2d: any;
  sceneData: SceneData;
  activeScene: string;
  onGameObjectsMapUpdate: (map: Map<string, GameObject>) => void;
  requestRenderIfNotRequested: () => void;
}

const GameObjectManager: React.FC<GameObjectManagerProps> = ({
  coreInstance,
  shape2d,
  sceneData,
  activeScene,
  onGameObjectsMapUpdate,
  requestRenderIfNotRequested,
}) => {
  // Функция создания игрового объекта
  const createGameObject = (obj: GameObject) => {
    if (!shape2d) return null;

    const shapeFunction = shape2d[obj.type];
    if (!shapeFunction) {
      console.warn('Неизвестный тип объекта:', obj.type);
      return null;
    }

    const gameObjectParams = { ...obj };

    // Если объект - персонаж или враг, загружаем анимации
    if (obj.type === 'character' || obj.type === 'enemy') {
      gameObjectParams.animations = {};

      if (obj.animations) {
        Object.keys(obj.animations).forEach((key) => {
          const image = new Image();
          image.src = obj.animations[key];

          image.onload = () => {
            requestRenderIfNotRequested();
          };

          image.onerror = () => {
            console.error(`Ошибка загрузки анимации "${key}" для объекта:`, obj.id);
          };

          gameObjectParams.animations[key] = image;
        });
      }
    } else if (obj.type === 'sprite' || obj.type === 'spriteGrid') {
      // Если объект - спрайт, загружаем изображение
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

  // Рендеринг объектов при изменении сцены
  useEffect(() => {
    if (coreInstance && shape2d && sceneData.objects) {
      const sceneManager = coreInstance.getSceneManager();
      sceneManager.clearScene(activeScene);

      const newGameObjectsMap = new Map<string, GameObject>();

      sceneData.objects.forEach((obj: GameObject) => {
        const gameObject = createGameObject(obj);
        if (gameObject) {
          sceneManager.addGameObjectToScene(activeScene, gameObject);
          newGameObjectsMap.set(obj.id, gameObject);
        }
      });

      onGameObjectsMapUpdate(newGameObjectsMap);
      sceneManager.changeScene(activeScene);
      requestRenderIfNotRequested();
    }
  }, [coreInstance, shape2d, sceneData.objects, activeScene, requestRenderIfNotRequested]);

  return null;
};

export default GameObjectManager;
