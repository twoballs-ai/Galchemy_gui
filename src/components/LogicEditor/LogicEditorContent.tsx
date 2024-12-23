// LogicEditorContent.tsx (примерный скелет)
import React, { useState, useEffect } from 'react';
import { loadSceneData, saveSceneData } from '../../utils/storageUtils';
import { globalLogicManager } from '../../logicManager';

interface LogicEditorContentProps {
  projectName: string;
  sceneName: string;
}

const LogicEditorContent: React.FC<LogicEditorContentProps> = ({
  projectName,
  sceneName,
}) => {
  const [graph, setGraph] = useState<any>(null);

  useEffect(() => {
    // Загружаем SceneData, берем поле logicGraph и сохраняем в локальный стейт
    const sceneData = loadSceneData(projectName, sceneName);
    if (sceneData?.logicGraph) {
      setGraph(sceneData.logicGraph);
    }
  }, [projectName, sceneName]);

  // Допустим, при каждом изменении графа вызываем handleGraphChange
  const handleGraphChange = (newGraph: any) => {
    setGraph(newGraph);

    // Сохраняем в sceneData
    const sceneData = loadSceneData(projectName, sceneName);
    if (sceneData) {
      sceneData.logicGraph = newGraph;
      saveSceneData(projectName, sceneData);

      // Заодно кладём в глобальный менеджер
      globalLogicManager.setGraph(sceneName, newGraph);
    }
  };

  return (
    <div style={{ color: 'white' }}>
      <h3>Редактор логики для сцены {sceneName}</h3>
      {/* Здесь будет ваш Rete.js редактор */}
      {/* При каждом изменении графа: handleGraphChange(updatedGraph) */}
    </div>
  );
};

export default LogicEditorContent;
