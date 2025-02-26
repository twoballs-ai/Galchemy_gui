import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import SceneCanvas from './SceneCanvas';
import SceneObjectsPanel from './panels/SceneObjectsPanel';
import PropertiesPanel from './panels/PropertiesPanel';
import './SceneEditor.scss';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import {
  loadSceneObjects,
  addSceneObject,
  updateSceneObject,
  removeSceneObject,
} from '../../../store/slices/sceneObjectsSlice';

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
  activeScene: string;
  renderType: string;
}

export interface GameObject {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number | null;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  enablePhysics?: boolean;
  isStatic?: boolean;
  layer?: number;
  image?: string;
}

const SceneEditor: React.FC<SceneEditorProps> = ({ activeScene, renderType }) => {
  const dispatch = useDispatch<AppDispatch>();
  // Получаем объекты из Redux

  const sceneObjects = useSelector((state: RootState) => state.sceneObjects?.objects || []);

  
  // Локальное состояние для макетов и управления панелями
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);
  const [selectedObject, setSelectedObject] = useState<GameObject | null>(null);
  const [panels, setPanels] = useState({
    objectsPanel: true,
    propertiesPanel: true,
  });
  // Если есть дополнительные настройки сцены, их можно хранить локально
  const [sceneSettings, setSceneSettings] = useState<object>({});

  // Функция глубокого клонирования макетов
  const cloneLayouts = (layouts: Layouts): Layouts => {
    const newLayouts: Layouts = {};
    for (let bp in layouts) {
      newLayouts[bp] = layouts[bp].map(item => ({ ...item }));
    }
    return newLayouts;
  };

  const onLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    // По необходимости можно сохранить макеты в localStorage
  };

  // Закрытие панели: обновляем флаг и удаляем панель из макетов
  const handleClosePanel = (panelKey: string) => {
    setPanels(prev => ({ ...prev, [panelKey]: false }));
    const newLayouts = cloneLayouts(layouts);
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i !== panelKey);
    });
    setLayouts(newLayouts);
  };

  // Открытие панели: если панели нет, добавляем её с дефолтной позицией
  const handleOpenPanel = (panelKey: string) => {
    if (panels[panelKey]) return;
    setPanels(prev => ({ ...prev, [panelKey]: true }));
    const newLayouts = cloneLayouts(layouts);
    Object.keys(newLayouts).forEach(breakpoint => {
      if (!newLayouts[breakpoint].find(item => item.i === panelKey)) {
        newLayouts[breakpoint] = [
          ...newLayouts[breakpoint],
          {
            i: panelKey,
            x: 0,
            y: Infinity,
            w: Math.floor(cols[breakpoint] / 3),
            h: 10,
            minH: 5,
          },
        ];
      }
    });
    setLayouts(newLayouts);
  };

  const handleSelectObject = (object: GameObject | null) => {
    setSelectedObject(object);
  };

  // Обработчики для работы с объектами через Redux
  const handleAddObject = (newObject: Partial<GameObject>) => {
    const completeObject: GameObject = {
      id: uuidv4(),
      type: newObject.type || 'rectangle',
      name: newObject.name || 'New Object',
      x: newObject.x || 0,
      y: newObject.y || 0,
      width: newObject.width || 50,
      height: newObject.height || 50,
      radius: newObject.radius !== undefined ? newObject.radius : null,
      color: newObject.color || '#FF0000',
      borderColor: newObject.borderColor || '#000000',
      borderWidth: newObject.borderWidth || 1,
      enablePhysics: newObject.enablePhysics || false,
      isStatic: newObject.isStatic || false,
      layer: newObject.layer || 0,
      image: newObject.image || '',
    };
    dispatch(addSceneObject({ activeScene, object: completeObject }));
  };

  const handleUpdateObject = (updatedObject: GameObject) => {
    dispatch(updateSceneObject({ activeScene, object: updatedObject }));
    setSelectedObject(updatedObject);
  };

  const handleRemoveObject = (objectId: string) => {
    dispatch(removeSceneObject({ activeScene, objectId }));
    if (selectedObject && selectedObject.id === objectId) {
      setSelectedObject(null);
    }
  };

  // Загружаем объекты сцены при монтировании или изменении activeScene
  useEffect(() => {
    dispatch(loadSceneObjects(activeScene));
  }, [activeScene, dispatch]);

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
        isResizable={true}
      >
        {panels.objectsPanel && (
          <div key="objectsPanel" className="panel">
            <SceneObjectsPanel
              objects={sceneObjects}
              onAddObject={handleAddObject}
              onRemoveObject={handleRemoveObject}
              onSelectObject={handleSelectObject}
              onClose={() => handleClosePanel('objectsPanel')}
            />
          </div>
        )}
        <div key="sceneCanvas" className="panel">
          <SceneCanvas
            activeScene={activeScene}
            renderType={renderType}
            sceneData={{ activeScene, objects: sceneObjects, settings: sceneSettings }}
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
