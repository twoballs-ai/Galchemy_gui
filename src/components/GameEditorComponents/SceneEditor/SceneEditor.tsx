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

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4 };


const initialLayouts: Layouts = {
  lg: [
    { i: "objectsPanel", x: 0, y: 0, w: 3, h: 10, minH: 10 },
    { i: "sceneCanvas", x: 3, y: 0, w: 6, h: 20, minH: 15 },
    { i: "propertiesPanel", x: 9, y: 0, w: 3, h: 10, minH: 10 },
    { i: "assetBrowserPanel", x: 0, y: 20, w: 12, h: 5, minH: 4 }, // <--- ДОБАВИЛИ
  ],
  md: [
    { i: "objectsPanel", x: 0, y: 0, w: 2, h: 10, minH: 10 },
    { i: "sceneCanvas", x: 2, y: 0, w: 6, h: 20, minH: 15 },
    { i: "propertiesPanel", x: 8, y: 0, w: 2, h: 10, minH: 10 },
    { i: "assetBrowserPanel", x: 0, y: 20, w: 10, h: 4, minH: 3 },
  ],
  sm: [
    { i: "objectsPanel", x: 0, y: 0, w: 3, h: 5, minH: 5 },
    { i: "sceneCanvas", x: 0, y: 5, w: 6, h: 20, minH: 15 },
    { i: "propertiesPanel", x: 0, y: 25, w: 2, h: 5, minH: 5 },
    { i: "assetBrowserPanel", x: 0, y: 30, w: 6, h: 4, minH: 3 },
  ],
  xs: [
    { i: "objectsPanel", x: 0, y: 0, w: 4, h: 5, minH: 5 },
    { i: "sceneCanvas", x: 0, y: 5, w: 4, h: 20, minH: 15 },
    { i: "propertiesPanel", x: 0, y: 25, w: 4, h: 5, minH: 5 },
    { i: "assetBrowserPanel", x: 0, y: 30, w: 4, h: 4, minH: 3 },
  ],
};

interface SceneEditorProps {
  projectName: string;
  activeScene: string;
}

const SceneEditor: React.FC<SceneEditorProps> = ({
  activeScene,

}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTool, setActiveTool] = useState<'hand' | 'translate' | 'rotate' | 'scale'>('translate');

  // Локальное состояние для макетов
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);
  const [panels, setPanels] = useState({
    objectsPanel: true,
    propertiesPanel: true,
    assetBrowserPanel: true, // ← обязательно
  });

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

  // Закрытие панели
  const handleClosePanel = (panelKey: string) => {
    setPanels((prev) => ({ ...prev, [panelKey]: false }));
    const newLayouts = cloneLayouts(layouts);
    Object.keys(newLayouts).forEach((breakpoint) => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(
        (item) => item.i !== panelKey
      );
    });
    setLayouts(newLayouts);
  };

  // Открытие панели
  const handleOpenPanel = (panelKey: string) => {
    if (panels[panelKey]) return;
    setPanels((prev) => ({ ...prev, [panelKey]: true }));
    const newLayouts = cloneLayouts(layouts);
    Object.keys(newLayouts).forEach((breakpoint) => {
      if (!newLayouts[breakpoint].find((item) => item.i === panelKey)) {
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
            {/* Передаём объекты, а также коллбеки для выбора/закрытия панели */}
            <SceneObjectsPanel
              onClose={() => handleClosePanel("objectsPanel")}
            />
          </div>
        )}

        <div key="sceneCanvas" className="panel">
          <SceneCanvas/>
        </div>

        {panels.propertiesPanel && (
          <div key="propertiesPanel" className="panel">
            <PropertiesPanel
              onClose={() => handleClosePanel("propertiesPanel")}
            />
          </div>
        )}
        {panels.assetBrowserPanel && (
  <div key="assetBrowserPanel" className="panel">
    <AssetBrowserPanel onClose={() => handleClosePanel("assetBrowserPanel")} />
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
