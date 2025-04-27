import React, { useEffect } from 'react';

/* ---------- типы данных ---------- */
interface GameObjectRaw {
  id: string;
  type: string;
  [k: string]: any;     // остальные поля фабрика примет как есть
}

interface SceneData {
  objects: GameObjectRaw[];
}

interface GameObjectManagerProps {
  coreInstance: any;                              // тип Core в вашем ядре
  shapeFactory: Record<string, (opts: any) => any>;
  sceneData: SceneData;
  activeScene: string;
  onGameObjectsMapUpdate: (map: Map<string, any>) => void;
  requestRenderIfNotRequested: () => void;
}

const GameObjectManager: React.FC<GameObjectManagerProps> = ({
  coreInstance,
  shapeFactory,
  sceneData,
  activeScene,
  onGameObjectsMapUpdate,
  requestRenderIfNotRequested,
}) => {

  /* ---------- создать live-объект через фабрику ---------- */
  const createGameObject = (obj: GameObjectRaw) => {
    const builder = shapeFactory[obj.type];
    if (!builder) {
      console.warn('Неизвестный тип объекта:', obj.type);
      return null;
    }
    const go = builder(obj);     // все параметры (кроме id/type) идут как есть
    go.id = obj.id;
    return go;
  };

  /* ---------- синхронизация React-состояния с движком ---------- */
  useEffect(() => {
    if (!coreInstance || !shapeFactory) return;

        const sceneManager = coreInstance.getSceneManager?.()
                       ?? coreInstance.sceneManager;  

    if (!sceneManager.getCurrentScene()
        || sceneManager.getCurrentScene().name !== activeScene) {
      sceneManager.createScene(activeScene);
      sceneManager.changeScene(activeScene);
    }

        /* -------- целевая сцена, куда кладём объекты -------- */
        const scene =
          sceneManager.scenes?.get?.(activeScene)     // по имени
          ?? sceneManager.getCurrentScene();          // либо текущая
    
        if (!scene) return;                           // safety-check
    
        const liveMap = new Map<string, any>();
    
        sceneData.objects.forEach(obj => {
          const go = createGameObject(obj);
          if (go) {
            sceneManager.addGameObjectToScene(activeScene, go);                            // теперь scene определена
            liveMap.set(obj.id, go);
          }
        })
    onGameObjectsMapUpdate(liveMap);
    requestRenderIfNotRequested();
  }, [coreInstance, shapeFactory, sceneData.objects, activeScene,
      requestRenderIfNotRequested]);

  return null;
};

export default GameObjectManager;
