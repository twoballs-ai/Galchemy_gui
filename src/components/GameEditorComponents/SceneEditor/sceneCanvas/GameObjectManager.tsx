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
    const opts = {
      ...obj,
      // важная строка — задаём позицию из Redux-поля (x,y,z)
      position: [ obj.x, obj.y, obj.z ],
    };
    const go = builder(opts);    // все параметры (кроме id/type) идут как есть
    go.id = obj.id;
    if (coreInstance.showHelpers) {
      go.isEditorMode = true;
    }
  
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
            sceneManager.addGameObjectToScene(activeScene, go);
             // Если мы в редакторе — помечаем новый объект    if (coreInstance.showHelpers) {      go.isEditorMode = true;
 
            liveMap.set(obj.id, go);
        
            // 🔥 Если это камера — делаем её активной!
            if (obj.type === 'camera') {
              const scene = sceneManager.scenes.get(activeScene) ?? sceneManager.getCurrentScene();
              if (scene) {
                scene.activeCamera = go;
              }
            }
          }
        });
    onGameObjectsMapUpdate(liveMap);
    requestRenderIfNotRequested();
  }, [coreInstance, shapeFactory, sceneData.objects, activeScene,
      requestRenderIfNotRequested]);

  return null;
};

export default GameObjectManager;
