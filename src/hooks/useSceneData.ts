// hooks/useSceneData.ts

import { useState, useEffect } from 'react';
import { saveSceneData, loadSceneData } from '../utils/storageUtils';

interface SceneData {
  objects: any[]; // Массив объектов на сцене
  // Добавьте другие свойства сцены, если нужно
}

const useSceneData = (sceneName: string) => {
  const [sceneData, setSceneData] = useState<SceneData>({ objects: [] });

  useEffect(() => {
    const storedData = loadSceneData(sceneName);
    if (storedData) {
      setSceneData(storedData);
    }
  }, [sceneName]);

  useEffect(() => {
    saveSceneData(sceneName, sceneData);
  }, [sceneName, sceneData]);

  return [sceneData, setSceneData] as [SceneData, React.Dispatch<React.SetStateAction<SceneData>>];
};

export default useSceneData;
