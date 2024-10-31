// SceneEditor.tsx

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import SceneCanvas from './SceneCanvas';
import SceneObjectsPanel from './panels/SceneObjectsPanel';
import PropertiesPanel from './panels/PropertiesPanel';
import './SceneEditor.scss';

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

const SceneEditor: React.FC = () => {
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);
  const [panels, setPanels] = useState({
    objectsPanel: true,
    propertiesPanel: true,
  });

  useEffect(() => {
    // Load layouts from localStorage
    const savedLayouts = localStorage.getItem('sceneEditorLayouts');
    if (savedLayouts) {
      setLayouts(JSON.parse(savedLayouts));
    }
  }, []);

  const onLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    // Save layouts to localStorage
    localStorage.setItem('sceneEditorLayouts', JSON.stringify(allLayouts));
  };

  const handleClosePanel = (panelKey: string) => {
    setPanels((prev) => ({ ...prev, [panelKey]: false }));
    // Remove panel from all layouts
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach((breakpoint) => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter((item) => item.i !== panelKey);
    });
    setLayouts(newLayouts);
  };

  const handleOpenPanel = (panelKey: string) => {
    setPanels((prev) => ({ ...prev, [panelKey]: true }));
    // Add panel to all layouts
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach((breakpoint) => {
      // Add panel with default position for each breakpoint
      newLayouts[breakpoint] = [
        ...newLayouts[breakpoint],
        {
          i: panelKey,
          x: 0,
          y: Infinity,
          w: cols[breakpoint] / 3, // Adjust width according to breakpoint
          h: 10,
        },
      ];
    });
    setLayouts(newLayouts);
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
            <SceneObjectsPanel onClose={() => handleClosePanel('objectsPanel')} />
          </div>
        )}
        <div key="sceneCanvas" className="panel">
          <SceneCanvas />
        </div>
        {panels.propertiesPanel && (
          <div key="propertiesPanel" className="panel">
            <PropertiesPanel onClose={() => handleClosePanel('propertiesPanel')} />
          </div>
        )}
      </ResponsiveGridLayout>
      {/* Button to reopen closed panels */}
      <div className="panel-controls">
        {!panels.objectsPanel && (
          <button onClick={() => handleOpenPanel('objectsPanel')}>Open Objects Panel</button>
        )}
        {!panels.propertiesPanel && (
          <button onClick={() => handleOpenPanel('propertiesPanel')}>Open Properties Panel</button>
        )}
      </div>
    </div>
  );
};

export default SceneEditor;
