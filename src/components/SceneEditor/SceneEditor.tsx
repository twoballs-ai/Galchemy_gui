// SceneEditor.tsx

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import SceneCanvas from './SceneCanvas';
import SceneObjectsPanel from './panels/SceneObjectsPanel';
import PropertiesPanel from './panels/PropertiesPanel';
import './SceneEditor.scss';
import { loadSceneData, saveSceneData } from '../../utils/storageUtils';
import { v4 as uuidv4 } from 'uuid'; // Для генерации уникальных идентификаторов

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4 };

const initialLayouts: Layouts = {
  lg: [
    { i: 'objectsPanel', x: 0, y: 0, w: 3, h: 10, minH: 10 },
    { i: 'sceneCanvas', x: 3, y: 0, w: 6, h: 20, minH: 15 },
    { i: 'propertiesPanel', x: 9, y: 0, w: 3, h: 10, minH: 10 },
  ],
  md: [
    { i: 'objectsPanel', x: 0, y: 0, w: 2, h: 10, minH: 10 },
    { i: 'sceneCanvas', x: 2, y: 0, w: 6, h: 20, minH: 15 },
    { i: 'propertiesPanel', x: 8, y: 0, w: 2, h: 10, minH: 10 },
  ],
  sm: [
    { i: 'objectsPanel', x: 0, y: 0, w: 3, h: 5, minH: 5 },
    { i: 'sceneCanvas', x: 0, y: 5, w: 6, h: 20, minH: 15 },
    { i: 'propertiesPanel', x: 0, y: 25, w: 2, h: 5, minH: 5 },
  ],
  xs: [
    { i: 'objectsPanel', x: 0, y: 0, w: 4, h: 5, minH: 5 },
    { i: 'sceneCanvas', x: 0, y: 5, w: 4, h: 20, minH: 15 },
    { i: 'propertiesPanel', x: 0, y: 25, w: 4, h: 5, minH: 5 },
  ],
};

interface SceneEditorProps {
  projectName: string;
  sceneName: string;
  renderType: string;
}

interface SceneData {
  sceneName: string;
  objects: GameObject[];
  settings: object;
}

interface GameObject {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  enablePhysics?: boolean;
  isStatic?: boolean;
  layer?: number;
  image?: string;
  // Добавьте другие свойства по необходимости
}

const SceneEditor: React.FC<SceneEditorProps> = ({ projectName, sceneName, renderType }) => {
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);
  const [sceneData, setSceneData] = useState<SceneData>({
    sceneName: sceneName,
    objects: [],
    settings: {},
  });

  const [selectedObject, setSelectedObject] = useState<GameObject | null>(null);
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
    saveSceneData(projectName, sceneData);
  }, [sceneData, projectName]);

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
          w: Math.floor(cols[breakpoint] / 3), // Обеспечиваем целочисленное значение
          h: 10,
          minH: 5,
        },
      ];
    });
    setLayouts(newLayouts);
  };

  const handleSelectObject = (object: GameObject | null) => {
    setSelectedObject(object);
  };

  const addObjectToScene = (newObject: Partial<GameObject>) => {
    const completeObject: GameObject = {
      id: uuidv4(),
      type: newObject.type || 'rectangle',
      name: newObject.name || 'New Object',
      x: newObject.x || 0,
      y: newObject.y || 0,
      width: newObject.width || 50,
      height: newObject.height || 50,
      radius: newObject.radius || null,
      color: newObject.color || '#FF0000',
      borderColor: newObject.borderColor || '#000000',
      borderWidth: newObject.borderWidth || 1,
      enablePhysics: newObject.enablePhysics || false,
      isStatic: newObject.isStatic || false,
      layer: newObject.layer || 0,
      image: newObject.image || '',
      // Добавьте другие свойства по необходимости
    };

    setSceneData((prevData: SceneData) => {
      const updatedData = {
        ...prevData,
        objects: [...prevData.objects, completeObject],
      };
      return updatedData;
    });

    setSelectedObject(completeObject);
  };

  const handleUpdateObject = (updatedObject: GameObject) => {
    if (!updatedObject || !updatedObject.id) return;
    setSceneData((prevData: SceneData) => {
      const updatedData = {
        ...prevData,
        objects: prevData.objects.map((obj: GameObject) =>
          obj.id === updatedObject.id ? updatedObject : obj
        ),
      };
      return updatedData;
    });
    setSelectedObject(updatedObject);
  };

  const removeObjectFromScene = (objectId: string) => {
    setSceneData((prevData: SceneData) => {
      const updatedData = {
        ...prevData,
        objects: prevData.objects.filter((obj: GameObject) => obj.id !== objectId),
      };
      // Если удаляемый объект был выбранным, сбрасываем selection
      if (selectedObject && selectedObject.id === objectId) {
        setSelectedObject(null);
      }
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
        isResizable={true} // Включение возможности изменения размеров панелей
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
