// SceneEditor.tsx

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import SceneCanvas from './SceneCanvas';
import SceneObjectsPanel from './panels/SceneObjectsPanel';
import PropertiesPanel from './panels/PropertiesPanel';
import './SceneEditor.scss';
import { loadSceneData, saveSceneData } from '../../utils/storageUtils';

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4 };

const initialLayouts: Layouts = {
  lg: [
    { i: 'objectsPanel', x: 0, y: 0, w: 3, h: 10 },
    { i: 'sceneCanvas', x: 3, y: 0, w: 6, h: 10 },
    { i: 'propertiesPanel', x: 9, y: 0, w: 3, h: 10 },
  ],
  md: [
    { i: 'objectsPanel', x: 0, y: 0, w: 2, h: 10 },
    { i: 'sceneCanvas', x: 2, y: 0, w: 6, h: 10 },
    { i: 'propertiesPanel', x: 8, y: 0, w: 2, h: 10 },
  ],
  sm: [
    { i: 'objectsPanel', x: 0, y: 0, w: 3, h: 5 },
    { i: 'sceneCanvas', x: 0, y: 5, w: 6, h: 10 },
    { i: 'propertiesPanel', x: 0, y: 15, w: 2, h: 5 },
  ],
  xs: [
    { i: 'objectsPanel', x: 0, y: 0, w: 4, h: 5 },
    { i: 'sceneCanvas', x: 0, y: 5, w: 4, h: 10 },
    { i: 'propertiesPanel', x: 0, y: 15, w: 4, h: 5 },
  ],
};

interface SceneEditorProps {
  projectName: string;
  sceneName: string;
  renderType: string;
}

const SceneEditor: React.FC<SceneEditorProps> = ({ projectName, sceneName, renderType }) => {
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);
  const [sceneData, setSceneData] = useState<any>({
    sceneName: sceneName,
    objects: [],
    settings: {},
  });

  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [panels, setPanels] = useState({
    objectsPanel: true,
    propertiesPanel: true,
  });

  useEffect(() => {
    // Загружаем данные сцены при монтировании компонента
    const loadedSceneData = loadSceneData(projectName, sceneName);
    if (loadedSceneData) {
      setSceneData(loadedSceneData);
    }
  }, [projectName, sceneName]);

  useEffect(() => {
    // Сохраняем данные сцены при их изменении
    saveSceneData(projectName, sceneName, sceneData);
  }, [sceneData, projectName, sceneName]);

  const onLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    // Можно сохранить макеты в localStorage, если необходимо
  };

  const handleClosePanel = (panelKey: string) => {
    setPanels((prev) => ({ ...prev, [panelKey]: false }));
    // Удаляем панель из всех макетов
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach((breakpoint) => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(
        (item) => item.i !== panelKey
      );
    });
    setLayouts(newLayouts);
  };

  const handleOpenPanel = (panelKey: string) => {
    setPanels((prev) => ({ ...prev, [panelKey]: true }));
    // Добавляем панель с новой позицией для каждого макета
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach((breakpoint) => {
      newLayouts[breakpoint] = [
        ...newLayouts[breakpoint],
        {
          i: panelKey,
          x: 0,
          y: Infinity,
          w: cols[breakpoint] / 3,
          h: 10,
        },
      ];
    });
    setLayouts(newLayouts);
  };

  const handleSelectObject = (object: any) => {
    setSelectedObject(object);
  };

  const addObjectToScene = (newObject: any) => {
  setSceneData((prevData: any) => {
    const updatedData = {
      ...prevData,
      objects: [...prevData.objects, newObject],
    };
    saveSceneData(projectName, updatedData);
    return updatedData;
  });
};

const handleUpdateObject = (updatedObject: any) => {
  if (!updatedObject || !updatedObject.id) return;
  setSceneData((prevData: any) => {
    const updatedData = {
      ...prevData,
      objects: prevData.objects.map((obj: any) =>
        obj.id === updatedObject.id ? updatedObject : obj
      ),
    };
    saveSceneData(projectName, updatedData);
    return updatedData;
  });
  setSelectedObject(updatedObject);
};

const removeObjectFromScene = (objectId: string) => {
  setSceneData((prevData: any) => {
    const updatedData = {
      ...prevData,
      objects: prevData.objects.filter((obj: any) => obj.id !== objectId),
    };
    saveSceneData(projectName, updatedData);
    return updatedData;
  });
};

  return (
    <div className="scene-editor">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        draggableHandle=".panel-header"
      >
        {panels.objectsPanel && (
          <div key="objectsPanel" className="panel">
            <SceneObjectsPanel
              objects={sceneData.objects}
              onAddObject={addObjectToScene}
              onRemoveObject={removeObjectFromScene}
              onSelectObject={handleSelectObject}
              onClose={() => handleClosePanel('objectsPanel')}
            />
          </div>
        )}
        <div key="sceneCanvas" className="panel">
          <SceneCanvas
            sceneName={sceneName}
            renderType={renderType}
            sceneData={sceneData}
            selectedObject={selectedObject}
            onSelectObject={handleSelectObject}
            onUpdateObject={handleUpdateObject}
          />
        </div>

        {panels.propertiesPanel && (
          <div key="propertiesPanel" className="panel">
            <PropertiesPanel
              object={selectedObject}
              onUpdate={handleUpdateObject}
              onClose={() => handleClosePanel('propertiesPanel')}
            />
          </div>
        )}
      </ResponsiveGridLayout>
      {/* Кнопки для повторного открытия панелей */}
      <div className="panel-controls">
        {!panels.objectsPanel && (
          <button onClick={() => handleOpenPanel('objectsPanel')}>
            Open Objects Panel
          </button>
        )}
        {!panels.propertiesPanel && (
          <button onClick={() => handleOpenPanel('propertiesPanel')}>
            Open Properties Panel
          </button>
        )}
      </div>
    </div>
  );
};

export default SceneEditor;
