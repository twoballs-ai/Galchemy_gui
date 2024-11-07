import { useState, useEffect } from 'react';
import { saveSceneData, loadSceneData } from '../utils/storageUtils';
import { v4 as uuidv4 } from 'uuid';

interface SceneData {
  objects: any[];
}

const useSceneData = (sceneName: string) => {
  const [sceneData, setSceneData] = useState<SceneData>({ objects: [] });

  useEffect(() => {
    const storedData = loadSceneData(sceneName);
    if (storedData) {
      setSceneData(storedData);
    } else {
      // Если данных нет, создаём пустую сцену
      setSceneData({ objects: [] });
    }
  }, [sceneName]);

  useEffect(() => {
    saveSceneData(sceneName, sceneData);
  }, [sceneName, sceneData]);

  const addObjectToScene = (newObject: any) => {
    const objectWithId = { ...newObject, id: uuidv4() };
    setSceneData((prevData) => ({
      ...prevData,
      objects: [...prevData.objects, objectWithId],
    }));
  };

  return [sceneData, setSceneData, addObjectToScene] as [
    SceneData,
    React.Dispatch<React.SetStateAction<SceneData>>,
    (newObject: any) => void
  ];
};

export default useSceneData;
