import React, { useEffect } from 'react';

// Пример определения типов для GameObject и SceneData:
interface GameObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image?: string;
  animations?: { [key: string]: string | string[] };
  isAnimated?: boolean;
  [key: string]: any;
}

interface SceneData {
  objects: GameObject[];
}

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
  const createGameObject = (obj: GameObject): GameObject | null => {
    if (!shape2d) return null;

    const shapeFunction = shape2d[obj.type];
    if (!shapeFunction) {
        console.warn('Неизвестный тип объекта:', obj.type);
        return null;
    }

    const gameObjectParams = { ...obj };
    delete gameObjectParams.type;

    // Передаем строку, не создаем new Image
    if (obj.image) {
        gameObjectParams.image = obj.image;
    }

    if ((obj.type === 'character' || obj.type === 'enemy') && obj.isAnimated) {
        gameObjectParams.animations = {};

        if (obj.animations) {
            Object.keys(obj.animations).forEach((key) => {
                gameObjectParams.animations[key] = obj.animations[key];
            });
        }
    }

    if (typeof gameObjectParams.width !== 'number') gameObjectParams.width = 50;
    if (typeof gameObjectParams.height !== 'number') gameObjectParams.height = 50;

    const gameObject = shapeFunction(gameObjectParams);
    gameObject.id = obj.id;

    if (gameObject && 'type' in gameObject) {
        delete gameObject.type;
    }

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
          console.log(gameObject);
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
