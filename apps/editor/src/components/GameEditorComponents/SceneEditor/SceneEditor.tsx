import React, { useState, useEffect, useCallback } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { useDispatch, useSelector } from "react-redux";

import SceneCanvas from "./SceneCanvas";
import SceneObjectsPanel from "./panels/SceneObjectsPanel";
import PropertiesPanel from "./panels/PropertiesPanel";
import AssetBrowserPanel from "./panels/AssetBrowserPanel";
import SceneSettingsEditor from "./panels/SceneSettingsEditor";
import EditorToolbar from "./EditorToolbar";
import AddObjectModal, { AddObjectPayload } from "../Modal/AddObjectModal";
import { v4 as uuidv4 } from "uuid";
import { AppDispatch } from "../../../store/store";
import { addSceneObject, loadSceneObjects } from "../../../store/slices/sceneObjectsSlice";
import { GameAlchemy } from "../../../utils/gameAlchemy";
import { RootState } from "../../../store/store";
import { updateSceneSettings, defaultSceneSettings, saveProject } from "../../../store/slices/projectSlice";
import { GameObject } from "../../../utils/dbUtils";

import "./SceneEditor.scss";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4 };
const LAYOUT_STORAGE_KEY = 'scene-editor-layout-v2';
type BreakpointKey = keyof typeof cols;

type GridLayouts = Record<string, Array<{ i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number }>>;

const cloneInitialLayouts = (): GridLayouts =>
  JSON.parse(JSON.stringify(initialLayouts)) as GridLayouts;

const normalizeLayouts = (candidate: GridLayouts): GridLayouts => {
  const normalized: GridLayouts = cloneInitialLayouts();

  (Object.keys(cols) as BreakpointKey[]).forEach((bp) => {
    const source = candidate[bp] ?? initialLayouts[bp];
    if (!Array.isArray(source)) return;

    const defaultMap = new Map(initialLayouts[bp].map((item) => [item.i, item]));
    const merged = source
      .filter((item) => defaultMap.has(item.i))
      .map((item) => {
        const fallback = defaultMap.get(item.i)!;
        const maxCols = cols[bp];
        const width = Math.max(item.minW ?? fallback.minW ?? 1, Math.min(item.w, maxCols));
        return {
          ...fallback,
          ...item,
          w: width,
          h: Math.max(item.minH ?? fallback.minH ?? 1, item.h),
          x: Math.max(0, Math.min(item.x, maxCols - width)),
          y: Math.max(0, item.y),
        };
      });

    defaultMap.forEach((fallback, key) => {
      if (!merged.some((item) => item.i === key)) merged.push(fallback);
    });

    normalized[bp] = merged;
  });

  return normalized;
};

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
  openAddObjectSignal: number;
  quickAddRequest: { nonce: number; payload: { type: string; name: string; subtype?: string } | null };
}

const SceneEditor: React.FC<SceneEditorProps> = ({
  projectName,
  activeScene,
  panels,
  onTogglePanel,
  openAddObjectSignal,
  quickAddRequest,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTool, setActiveTool] = useState<'hand' | 'translate' | 'rotate' | 'scale'>('translate');
  const [layouts, setLayouts] = useState<GridLayouts>(initialLayouts);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const activeSceneData = useSelector((s: RootState) =>
    s.project.scenes.find((scene) => scene.id === activeScene)
  );

  const graphicsPreset =
    (activeSceneData?.settings?.graphicsPreset as 'low' | 'medium' | 'high' | 'ultra') ??
    defaultSceneSettings.graphicsPreset;
  const devicePreset =
    (activeSceneData?.settings?.devicePreset as 'desktop' | 'tablet' | 'phone') ??
    defaultSceneSettings.devicePreset;
  const orientation =
    (activeSceneData?.settings?.orientation as 'landscape' | 'portrait') ??
    defaultSceneSettings.orientation;

  useEffect(() => {
    if (activeScene) dispatch(loadSceneObjects(activeScene));
  }, [activeScene, dispatch]);

  useEffect(() => {
    const storageKey = `${LAYOUT_STORAGE_KEY}:${projectName}:${activeScene}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      setLayouts(cloneInitialLayouts());
      return;
    }

    try {
      const parsed = JSON.parse(raw) as GridLayouts;
      setLayouts(normalizeLayouts(parsed));
    } catch {
      setLayouts(cloneInitialLayouts());
    }
  }, [projectName, activeScene]);

  useEffect(() => {
    if (!activeScene) return;
    const storageKey = `${LAYOUT_STORAGE_KEY}:${projectName}:${activeScene}`;
    const timer = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(normalizeLayouts(layouts)));
    }, 120);

    return () => window.clearTimeout(timer);
  }, [layouts, projectName, activeScene]);

  const onLayoutChange = (_currentLayout: unknown[], allLayouts: GridLayouts) => {
    if (isLayoutLocked) return;
    setLayouts(normalizeLayouts(allLayouts));
  };

  const handleOpenPanel = (panelKey: PanelKey) => {
    if (!panels[panelKey]) onTogglePanel(panelKey);
  };

  const handleStartPreview = useCallback(() => {
    if (!activeScene || !GameAlchemy.core) return;
    GameAlchemy.core.sceneManager.switchScene?.(activeScene);
    GameAlchemy.setPreviewMode();
    setIsPreviewing(true);
  }, [activeScene]);

  const handleStopPreview = useCallback(() => {
    GameAlchemy.setEditorMode();
    setIsPreviewing(false);
  }, []);

  useEffect(() => {
    const core = GameAlchemy.core;
    if (!core) return;

    core.setToolMode?.(activeTool);
    core.setTransformMode?.(activeTool);
    core.setGizmoMode?.(activeTool);
  }, [activeTool]);

  useEffect(() => {
    if (!activeScene) return;
    dispatch(saveProject());
  }, [dispatch, activeScene, graphicsPreset, devicePreset, orientation, activeSceneData?.settings?.backgroundColor]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;

      if (event.key === 'q' || event.key === 'Q') setActiveTool('hand');
      if (event.key === 'w' || event.key === 'W') setActiveTool('translate');
      if (event.key === 'e' || event.key === 'E') setActiveTool('rotate');
      if (event.key === 'r' || event.key === 'R') setActiveTool('scale');

      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        if (isPreviewing) handleStopPreview();
        else handleStartPreview();
      }

      if (event.key === 'n' || event.key === 'N') {
        setIsAddModalOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPreviewing, activeScene, handleStartPreview, handleStopPreview]);

  useEffect(() => {
    if (openAddObjectSignal <= 0) return;
    setIsAddModalOpen(true);
  }, [openAddObjectSignal]);

  const handleAddObject = useCallback((newObject: AddObjectPayload) => {
    if (!activeScene) return;
    const preparedObject: GameObject = {
      ...newObject,
      sceneId: activeScene,
      title: newObject.title || newObject.name || newObject.type,
      name: newObject.name || newObject.title || newObject.type,
      x: newObject.x ?? 0,
      y: newObject.y ?? 0,
      z: newObject.z ?? 0,
      position: [newObject.x ?? 0, newObject.y ?? 0, newObject.z ?? 0],
      rotX: newObject.rotX ?? 0,
      rotY: newObject.rotY ?? 0,
      rotZ: newObject.rotZ ?? 0,
      rotation: newObject.rotation ?? [0, 0, 0],
      scaleX: newObject.scaleX ?? 1,
      scaleY: newObject.scaleY ?? 1,
      scaleZ: newObject.scaleZ ?? 1,
      scale: newObject.scale ?? [1, 1, 1],
    };
    dispatch(addSceneObject({ activeScene, object: preparedObject }));
  }, [activeScene, dispatch]);

  useEffect(() => {
    if (!quickAddRequest.payload || quickAddRequest.nonce <= 0) return;
    handleAddObject({
      id: uuidv4(),
      type: quickAddRequest.payload.type as AddObjectPayload["type"],
      name: quickAddRequest.payload.name,
      x: 0,
      y: 0,
      z: 0,
      ...(quickAddRequest.payload.subtype ? { subtype: quickAddRequest.payload.subtype as any } : {}),
    });
  }, [quickAddRequest, handleAddObject]);

  return (
    <div className="scene-editor">
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        isPreviewing={isPreviewing}
        onTogglePreview={() => (isPreviewing ? handleStopPreview() : handleStartPreview())}
        graphicsPreset={graphicsPreset}
        onGraphicsPresetChange={(preset) => {
          if (!activeScene) return;
          dispatch(updateSceneSettings({ sceneId: activeScene, settings: { graphicsPreset: preset } }));
        }}
        devicePreset={devicePreset}
        onDevicePresetChange={(preset) => {
          if (!activeScene) return;
          dispatch(updateSceneSettings({ sceneId: activeScene, settings: { devicePreset: preset } }));
        }}
        onOpenAddObjectModal={() => setIsAddModalOpen(true)}
        isLayoutLocked={isLayoutLocked || devicePreset !== 'desktop'}
        onToggleLayoutLock={() => setIsLayoutLocked((prev) => !prev)}
        onResetLayout={() => setLayouts(cloneInitialLayouts())}
      />

      <SceneSettingsEditor
        sceneSettings={activeSceneData?.settings}
        onSettingsChange={(newSettings) => {
          if (!activeScene) return;
          dispatch(updateSceneSettings({ sceneId: activeScene, settings: newSettings as Record<string, unknown> }));
        }}
      />

      <ResponsiveGridLayout
        className="layout"
        draggableHandle=".panel-header"
        draggableCancel=".panel-header button, .panel-header input, .panel-header select, .panel-body, .react-resizable-handle"
        layouts={layouts}
        cols={cols}
        breakpoints={breakpoints}
        compactType={null}
        preventCollision={true}
        isBounded={true}
        resizeHandles={["e", "s", "se"]}
        margin={[10, 10]}
        containerPadding={[0, 0]}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        isResizable={devicePreset === 'desktop' && !isLayoutLocked}
        isDraggable={devicePreset === 'desktop' && !isLayoutLocked}
      >
        {panels.objectsPanel && (
          <div key="objectsPanel" className="panel">
            <SceneObjectsPanel onClose={() => onTogglePanel("objectsPanel")} />
          </div>
        )}

        <div key="sceneCanvas" className="panel">
          <SceneCanvas isPreviewing={isPreviewing} orientation={orientation || "landscape"} />
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

      <AddObjectModal
        open={isAddModalOpen}
        onAdd={handleAddObject}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default SceneEditor;
