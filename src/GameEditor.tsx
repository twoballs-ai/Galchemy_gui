import React, { useEffect, useState, useCallback } from "react";
import { Layout } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import SceneEditor from "./components/GameEditorComponents/SceneEditor/SceneEditor";
import Tabs from "./components/GameEditorComponents/Tabs/Tabs";
import EditorMenuBar from "./components/GameEditorComponents/MainMenuBar";
import { ProjectSummary } from "./utils/storageUtils";
import { startBoot, finishBoot } from "./store/slices/bootSlice";
import { RootState, AppDispatch } from "./store/store";
import {
  loadProject,
  saveProject,
  setActiveScene,
  setOpenedScenes,
  addSceneWithScript,
} from "./store/slices/projectSlice";
import SplashScreen from "./components/SplashScreen";

const { Header, Content } = Layout;

type PanelKey = "objectsPanel" | "propertiesPanel" | "assetBrowserPanel";

interface GameEditorProps {
  project: ProjectSummary;
  onUpdateProject: (updatedProject: ProjectSummary) => void;
  onCloseProject: () => void;
}

const createScene = (sceneName: string) => ({
  id: `scene_${uuidv4()}`,
  sceneName,
  settings: {},
});

const GameEditor: React.FC<GameEditorProps> = ({ project, onCloseProject }) => {
  const dispatch = useDispatch<AppDispatch>();

  const boot = useSelector((s: RootState) => s.boot);
  const { scenes, openedScenes, activeScene } = useSelector(
    (state: RootState) => state.project
  );

  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  const [panels, setPanels] = useState<Record<PanelKey, boolean>>({
    objectsPanel: true,
    propertiesPanel: true,
    assetBrowserPanel: true,
  });

  const sceneTabs = openedScenes.map((s) => ({
    key: s.key,
    sceneName: s.sceneName,
  }));

  useEffect(() => {
    dispatch(startBoot("Компиляция сцены…"));
  }, [dispatch]);

  useEffect(() => {
    dispatch(loadProject(project.id))
      .then(() => setIsProjectLoaded(true))
      .finally(() => dispatch(finishBoot()));
  }, [dispatch, project.id]);

  const addNewScene = useCallback(
    async (sceneName: string) => {
      const newScene = createScene(sceneName);
      await dispatch(addSceneWithScript(newScene));

      // addSceneWithScript already opens tab, activates scene and persists project.
    },
    [dispatch]
  );

  useEffect(() => {
    if (isProjectLoaded && scenes.length === 0 && activeScene === "") {
      addNewScene("Scene 1");
    }
  }, [isProjectLoaded, scenes, activeScene, addNewScene]);

  const handleNewScene = () => addNewScene(`Scene ${scenes.length + 1}`);

  const handleRemoveOpenedScene = (tabKey: string) => {
    const updatedOpenedScenes = openedScenes.filter((scene) => scene.key !== tabKey);
    dispatch(setOpenedScenes(updatedOpenedScenes));

    if (activeScene === tabKey) {
      const newActive = updatedOpenedScenes.length > 0 ? updatedOpenedScenes[0].key : "";
      dispatch(setActiveScene(newActive));
    }

    dispatch(saveProject());
  };

  const handleSceneChange = (tabKey: string) => {
    dispatch(setActiveScene(tabKey));
    dispatch(saveProject());
  };

  return (
    <>
      {boot.isBooting && <SplashScreen msg={boot.message} />}
      <Layout style={{ height: "100vh", background: "#141925" }}>
        <Header className="editor-topbar">
          <EditorMenuBar
            onNewScene={handleNewScene}
            onCloseProject={onCloseProject}
            panels={panels}
            onTogglePanel={(panelKey) =>
              setPanels((prev) => ({ ...prev, [panelKey]: !prev[panelKey] }))
            }
          />
          <Tabs
            tabs={sceneTabs}
            activeTab={activeScene}
            onTabClick={handleSceneChange}
            onRemoveTab={handleRemoveOpenedScene}
          />
        </Header>

        <Layout>
          <Content style={{ padding: "8px", background: "#111827" }}>
            <SceneEditor
              activeScene={activeScene}
              projectName={project.name}
              panels={panels}
              onTogglePanel={(key) =>
                setPanels((prev) => ({ ...prev, [key]: !prev[key] }))
              }
            />
          </Content>
        </Layout>
      </Layout>
    </>
  );
};

export default GameEditor;
