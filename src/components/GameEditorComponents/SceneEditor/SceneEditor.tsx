import React, { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layouts, Layout } from "react-grid-layout";
import SceneCanvas from "./SceneCanvas";
import SceneObjectsPanel from "./panels/SceneObjectsPanel";
import PropertiesPanel from "./panels/PropertiesPanel";
import "./SceneEditor.scss";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { loadSceneObjects } from "../../../store/slices/sceneObjectsSlice";
import TransformToolbar from './EditorToolbar'; // путь зависит от твоей структуры
import { PlayCircle, Square } from "lucide-react";
import { GameAlchemy } from 'game-alchemy-core';
import { globalLogicManager } from "../../../logicManager";
import EditorToolbar from './EditorToolbar'
import AssetBrowserPanel from "./panels/AssetBrowserPanel"; // ← путь к панели
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4 };


const initialLayouts: Layouts = {
  lg: [
    {
      i: "objectsPanel",
      x: 0, y: 0, w: 3, h: 13,
      minW: 2, minH: 8,
      maxW: 6, maxH: 20
    },
    {
      i: "sceneCanvas",
      x: 3, y: 0, w: 6, h: 13,
      minW: 4, minH: 10,
      maxW: 8, maxH: 30
    },
    {
      i: "propertiesPanel",
      x: 9, y: 0, w: 3, h: 13,
      minW: 2, minH: 8,
      maxW: 6, maxH: 20
    },
    {
      i: "assetBrowserPanel",
      x: 0, y: 20, w: 12, h: 8,
      minW: 4, minH: 3,
      maxH: 10
    },
  ],
  md: [
    {
      i: "objectsPanel",
      x: 0, y: 0, w: 2, h: 10,
      minW: 2, minH: 8,
      maxW: 4, maxH: 20
    },
    {
      i: "sceneCanvas",
      x: 2, y: 0, w: 6, h: 20,
      minW: 4, minH: 12,
      maxW: 8, maxH: 30
    },
    {
      i: "propertiesPanel",
      x: 8, y: 0, w: 2, h: 10,
      minW: 2, minH: 8,
      maxW: 4, maxH: 20
    },
    {
      i: "assetBrowserPanel",
      x: 0, y: 20, w: 10, h: 4,
      minW: 4, minH: 3,
      maxH: 10
    },
  ],
  sm: [
    {
      i: "objectsPanel",
      x: 0, y: 0, w: 3, h: 5,
      minW: 2, minH: 4,
      maxW: 6, maxH: 10
    },
    {
      i: "sceneCanvas",
      x: 0, y: 5, w: 6, h: 20,
      minW: 4, minH: 10,
      maxW: 6, maxH: 30
    },
    {
      i: "propertiesPanel",
      x: 0, y: 25, w: 2, h: 5,
      minW: 2, minH: 4,
      maxW: 4, maxH: 10
    },
    {
      i: "assetBrowserPanel",
      x: 0, y: 30, w: 6, h: 4,
      minW: 4, minH: 3,
      maxH: 10
    },
  ],
  xs: [
    {
      i: "objectsPanel",
      x: 0, y: 0, w: 4, h: 5,
      minW: 2, minH: 4,
      maxW: 4, maxH: 10
    },
    {
      i: "sceneCanvas",
      x: 0, y: 5, w: 4, h: 20,
      minW: 4, minH: 10,
      maxH: 30
    },
    {
      i: "propertiesPanel",
      x: 0, y: 25, w: 4, h: 5,
      minW: 2, minH: 4,
      maxW: 4, maxH: 10
    },
    {
      i: "assetBrowserPanel",
      x: 0, y: 30, w: 4, h: 4,
      minW: 4, minH: 3,
      maxH: 10
    },
  ],
};

interface SceneEditorProps {
  projectName: string;
  activeScene: string;
    panels: {
    objectsPanel: boolean;
    propertiesPanel: boolean;
    assetBrowserPanel: boolean;
  };
  onTogglePanel: (panelKey: keyof typeof panels) => void;
}

const SceneEditor: React.FC<SceneEditorProps> = ({
  activeScene,
  panels,
  onTogglePanel,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTool, setActiveTool] = useState<'hand' | 'translate' | 'rotate' | 'scale'>('translate');

  // Локальное состояние для макетов
const [layouts, setLayouts] = useState<Layouts>(initialLayouts);

  // Если нужно хранить выделенный объект локально

  // При смене сцены — грузим объекты
  useEffect(() => {
    if (activeScene) {
      dispatch(loadSceneObjects(activeScene));
    }
  }, [activeScene, dispatch]);

  // Функция глубокого копирования layouts
  const cloneLayouts = (layouts: Layouts): Layouts => {
    const newLayouts: Layouts = {};
    for (let bp in layouts) {
      newLayouts[bp] = layouts[bp].map((item) => ({ ...item }));
    }
    return newLayouts;
  };

  const onLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
  };

  // Открытие панели
  const handleOpenPanel = (panelKey: keyof typeof panels) => {
    setPanels(prev => ({ ...prev, [panelKey]: true }));
    // Добавляем дефолтный layout из initialLayouts
    setLayouts(prev => {
      const newLayouts = cloneLayouts(prev);
      // Если в current layouts нет этой панели — вставляем дефолт
      (Object.keys(initialLayouts) as (keyof Layouts)[]).forEach(bp => {
        const exists = prev[bp].some(item => item.i === panelKey);
        if (!exists) {
          // найдём дефолтный layout-объект
          const def = initialLayouts[bp].find(item => item.i === panelKey);
          if (def) newLayouts[bp].push({ ...def });
        }
      });
      return newLayouts;
    });
  };
  const [isPreviewing, setIsPreviewing] = useState(false);
  const handleStartPreview = () => {
    if (!activeScene) return;
    GameAlchemy.core.sceneManager.changeScene?.(activeScene);
    globalLogicManager.runLogicForScene(activeScene);
    GameAlchemy.setPreviewMode();
    setIsPreviewing(true);
  };

  const handleStopPreview = () => {
    GameAlchemy.setEditorMode();
    setIsPreviewing(false);
  };
  return (
    <div className="scene-editor">
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        isPreviewing={isPreviewing}
        onTogglePreview={() =>
          isPreviewing ? handleStopPreview() : handleStartPreview()
        }
      />
<ResponsiveGridLayout
  draggableHandle=".panel-header"
  draggableCancel=".panel-header button"
  layouts={layouts}
  cols={cols}
  breakpoints={breakpoints}
  rowHeight={30}
  onLayoutChange={onLayoutChange}
  resizeHandles={['s', 'w', 'e', 'n', 'se', 'sw', 'ne', 'nw']}
  compactType="vertical"
>
{panels.objectsPanel && (
    <div key="objectsPanel" className="panel">
      <SceneObjectsPanel onClose={() => onTogglePanel("objectsPanel")} />
    </div>
  )}

  <div key="sceneCanvas" className="panel">
    <SceneCanvas />
  </div>

  {panels.propertiesPanel && (
    <div key="propertiesPanel" className="panel">
      <PropertiesPanel onClose={() => onTogglePanel("propertiesPanel")} />
    </div>
  )}
  {panels.assetBrowserPanel && (
    <div key="assetBrowserPanel" className="panel">
      <AssetBrowserPanel onClose={() => onTogglePanel("assetBrowserPanel")} />
    </div>
  )}
      </ResponsiveGridLayout>

      <div className="panel-controls">
        {!panels.objectsPanel && (
          <button onClick={() => handleOpenPanel("objectsPanel")}>
            Open Objects Panel
          </button>
        )}
        {!panels.propertiesPanel && (
          <button onClick={() => handleOpenPanel("propertiesPanel")}>
            Open Properties Panel
          </button>
        )}
      </div>
    </div>
  );
};

export default SceneEditor;
