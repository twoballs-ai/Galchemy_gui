import React, { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { useDispatch } from "react-redux";

import SceneCanvas from "./SceneCanvas";
import SceneObjectsPanel from "./panels/SceneObjectsPanel";
import PropertiesPanel from "./panels/PropertiesPanel";
import AssetBrowserPanel from "./panels/AssetBrowserPanel";
import EditorToolbar from "./EditorToolbar";
import { AppDispatch } from "../../../store/store";
import { loadSceneObjects } from "../../../store/slices/sceneObjectsSlice";
import { GameAlchemy } from "../../../utils/gameAlchemy";

import "./SceneEditor.scss";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4 };

type GridLayouts = Record<string, Array<{ i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number }>>;

const initialLayouts: GridLayouts = {
  lg: [
    { i: "objectsPanel", x: 0, y: 0, w: 3, h: 13, minW: 2, minH: 8, maxW: 6, maxH: 20 },
    { i: "sceneCanvas", x: 3, y: 0, w: 6, h: 13, minW: 4, minH: 10, maxW: 8, maxH: 30 },
    { i: "propertiesPanel", x: 9, y: 0, w: 3, h: 13, minW: 2, minH: 8, maxW: 6, maxH: 20 },
    { i: "assetBrowserPanel", x: 0, y: 20, w: 12, h: 8, minW: 4, minH: 3, maxH: 10 },
  ],
  md: [
    { i: "objectsPanel", x: 0, y: 0, w: 2, h: 10, minW: 2, minH: 8, maxW: 4, maxH: 20 },
    { i: "sceneCanvas", x: 2, y: 0, w: 6, h: 20, minW: 4, minH: 12, maxW: 8, maxH: 30 },
    { i: "propertiesPanel", x: 8, y: 0, w: 2, h: 10, minW: 2, minH: 8, maxW: 4, maxH: 20 },
    { i: "assetBrowserPanel", x: 0, y: 20, w: 10, h: 4, minW: 4, minH: 3, maxH: 10 },
  ],
  sm: [
    { i: "objectsPanel", x: 0, y: 0, w: 3, h: 5, minW: 2, minH: 4, maxW: 6, maxH: 10 },
    { i: "sceneCanvas", x: 0, y: 5, w: 6, h: 20, minW: 4, minH: 10, maxW: 6, maxH: 30 },
    { i: "propertiesPanel", x: 0, y: 25, w: 2, h: 5, minW: 2, minH: 4, maxW: 4, maxH: 10 },
    { i: "assetBrowserPanel", x: 0, y: 30, w: 6, h: 4, minW: 4, minH: 3, maxH: 10 },
  ],
  xs: [
    { i: "objectsPanel", x: 0, y: 0, w: 4, h: 5, minW: 2, minH: 4, maxW: 4, maxH: 10 },
    { i: "sceneCanvas", x: 0, y: 5, w: 4, h: 20, minW: 4, minH: 10, maxH: 30 },
    { i: "propertiesPanel", x: 0, y: 25, w: 4, h: 5, minW: 2, minH: 4, maxW: 4, maxH: 10 },
    { i: "assetBrowserPanel", x: 0, y: 30, w: 4, h: 4, minW: 4, minH: 3, maxH: 10 },
  ],
};

type PanelKey = "objectsPanel" | "propertiesPanel" | "assetBrowserPanel";

interface SceneEditorProps {
  projectName: string;
  activeScene: string;
  panels: Record<PanelKey, boolean>;
  onTogglePanel: (panelKey: PanelKey) => void;
}

const SceneEditor: React.FC<SceneEditorProps> = ({ activeScene, panels, onTogglePanel }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTool, setActiveTool] = useState<'hand' | 'translate' | 'rotate' | 'scale'>('translate');
  const [layouts, setLayouts] = useState<GridLayouts>(initialLayouts);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (activeScene) dispatch(loadSceneObjects(activeScene));
  }, [activeScene, dispatch]);

  const onLayoutChange = (_currentLayout: unknown[], allLayouts: GridLayouts) => {
    setLayouts(allLayouts);
  };

  const handleOpenPanel = (panelKey: PanelKey) => {
    if (!panels[panelKey]) onTogglePanel(panelKey);
  };

  const handleStartPreview = () => {
    if (!activeScene || !GameAlchemy.core) return;
    GameAlchemy.core.sceneManager.switchScene?.(activeScene);
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
        onTogglePreview={() => (isPreviewing ? handleStopPreview() : handleStartPreview())}
      />

      <ResponsiveGridLayout
        className="layout"
        draggableHandle=".panel-header"
        draggableCancel=".panel-header button"
        layouts={layouts}
        cols={cols}
        breakpoints={breakpoints}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
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
        {!panels.objectsPanel && <button onClick={() => handleOpenPanel("objectsPanel")}>Объекты</button>}
        {!panels.propertiesPanel && <button onClick={() => handleOpenPanel("propertiesPanel")}>Свойства</button>}
        {!panels.assetBrowserPanel && <button onClick={() => handleOpenPanel("assetBrowserPanel")}>Assets</button>}
      </div>
    </div>
  );
};

export default SceneEditor;
