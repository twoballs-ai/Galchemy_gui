// GameEditor.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Layout, Button, Dropdown, Space } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  DownOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import LogicGuiEditorContent from "./components/GameEditorComponents/LogicGuiEditor/LogicGuiEditorContent";
import LogicCodeEditorContent from "./components/GameEditorComponents/LogicCodeEditor/LogicCodeEditorContent";
import SceneEditor from "./components/GameEditorComponents/SceneEditor/SceneEditor";
import Tabs from "./components/GameEditorComponents/Tabs/Tabs";
import ProjectSettingsDrawer from "./components/ProjectSettings/ProjectSettingsDrawer";

import { ProjectSummary, saveSceneLogic } from "./utils/storageUtils";
import { globalLogicManager } from "./logicManager";

import { RootState, AppDispatch } from "./store/store";
import {
  loadProject,
  saveProject,
  addScene,
  removeScene,
  setActiveScene,
  setOpenedScenes,
  updateScene,
  updateOpenedScene,
} from "./store/slices/projectSlice";

// Интерфейс для данных логики сцены (используется для сохранения кода)
interface SceneLogicData {
  logicEvents: any[];
}

const { Header, Content } = Layout;

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

// Функция для создания начального кода для кодового редактора логики.
// Ключ формируется как "CodeLogic:<projectId>:<sceneId>"
const createInitialSceneCodeLogic = (projectId: string, sceneId: string) => {
  const initialCode = `// Редактор кода для сцены ${sceneId}\n\nfunction runLogic() {\n  console.log("Hello, World!");\n}\n`;
  try {
    const key = `CodeLogic:${projectId}:${sceneId}`;
    localStorage.setItem(key, initialCode);
  } catch (error) {
    console.error(`Ошибка при сохранении CodeLogic для сцены ${sceneId}:`, error);
  }
};

// Функция для создания начальной логики для визуального редактора.
// Ключ формируется как "LogicData:<projectId>:<sceneId>"
const createInitialSceneVisualLogic = (projectId: string, sceneId: string) => {
  const initialLogic = { logicEvents: [] };
  saveSceneLogic(projectId, sceneId, initialLogic);
};

// Универсальная функция создания начальной логики для сцены,
// которая в зависимости от режима вызывает нужную функцию.
const createInitialSceneLogic = (
  projectId: string,
  sceneId: string,
  logicEditorMode: "visual" | "code"
) => {
  if (logicEditorMode === "code") {
    createInitialSceneCodeLogic(projectId, sceneId);
  } else {
    createInitialSceneVisualLogic(projectId, sceneId);
  }
};

// Функция создания логики для проекта (специальная сцена с id "projectLogic")
// Ключ формируется как "LogicData:<projectId>:projectLogic" или "CodeLogic:<projectId>:projectLogic"
const createProjectLogic = (projectId: string, logicEditorMode: "visual" | "code") => {
  const key =
    logicEditorMode === "code"
      ? `CodeLogic:${projectId}:projectLogic`
      : `LogicData:${projectId}:projectLogic`;
  if (!localStorage.getItem(key)) {
    if (logicEditorMode === "code") {
      const initialCode = `// Редактор кода для проекта\n\nfunction runProjectLogic() {\n  console.log("Project Logic");\n}\n`;
      localStorage.setItem(key, initialCode);
    } else {
      const initialLogic = { logicEvents: [] };
      saveSceneLogic(projectId, "projectLogic", initialLogic);
    }
  }
};

const GameEditor: React.FC<GameEditorProps> = ({
  project,
  onUpdateProject,
  onCloseProject,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const { scenes, openedScenes, activeScene } = useSelector(
    (state: RootState) => state.project
  );

  const [editorTabs, setEditorTabs] = useState<{ [key: string]: string }>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);

  const sceneTabs = openedScenes.map(s => ({
    key: s.key,
    sceneName: s.sceneName,
  }));
  
  useEffect(() => {
    dispatch(loadProject(project.id)).then(() => {
      setIsProjectLoaded(true);
      // При загрузке проекта создаём логику для проекта, если она ещё не создана
      createProjectLogic(project.id, project.logicEditorMode);
    });
  }, [dispatch, project.id, project.logicEditorMode]);

  const addNewScene = useCallback(
    (sceneName: string) => {
      const newScene = createScene(sceneName);
      dispatch(addScene(newScene));
  
      // Создаем начальную логику для сцены в зависимости от выбранного режима:
      // для кода – создается CodeLogic, для визуала – LogicData.
      createInitialSceneLogic(project.id, newScene.id, project.logicEditorMode);
  
      const newOpenedScene = {
        id: newScene.id,
        sceneName: newScene.sceneName,
        key: newScene.id,
        state: "levelEditor"
      };
  
      dispatch(setOpenedScenes([...openedScenes, newOpenedScene]));
      dispatch(setActiveScene(newScene.id));
      dispatch(saveProject(project.id));
    },
    [dispatch, project.id, openedScenes, project.logicEditorMode]
  );

  useEffect(() => {
    if (isProjectLoaded && scenes.length === 0 && activeScene === "") {
      addNewScene("Scene 1");
    }
  }, [isProjectLoaded, scenes, activeScene, addNewScene]);

  const handleNewScene = useCallback(() => {
    const index = scenes.length + 1;
    addNewScene(`Scene ${index}`);
  }, [scenes.length, addNewScene]);

  const handleRemoveOpenedScene = (tabKey: string) => {
    if (tabKey === "projectLogic") return;

    const updatedOpenedScenes = openedScenes.filter(scene => scene.key !== tabKey);
    dispatch(setOpenedScenes(updatedOpenedScenes));

    if (activeScene === tabKey) {
      const newActive = updatedOpenedScenes.length > 0 ? updatedOpenedScenes[0].key : "projectLogic";
      dispatch(setActiveScene(newActive));
    }

    dispatch(saveProject(project.id));
  };

  const handleSceneChange = (tabKey: string) => {
    dispatch(setActiveScene(tabKey));
    dispatch(saveProject(project.id));
  };

  const handleEditorTabChange = (mode: string) => {
    setEditorTabs((prevTabs) => ({
      ...prevTabs,
      [activeScene]: mode,
    }));
    dispatch(updateOpenedScene({ key: activeScene, newState: mode }));
    dispatch(saveProject(project.id));
  };

  const handleRunGame = () => {
    if (activeScene === "projectLogic") {
      return;
    }
    globalLogicManager.runLogicForScene(activeScene);
  };

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const projectMenuItems = [
    { label: "Создать сцену", key: "newScene", onClick: handleNewScene },
    { label: "Закрыть проект", key: "close", onClick: onCloseProject },
  ];

  const editMenuItems = [
    { label: "Отменить", key: "undo" },
    { label: "Повторить", key: "redo" },
  ];

  const aboutMenuItems = [
    { label: "Версия", key: "version" },
    { label: "Контакты", key: "contact" },
  ];

  const currentEditorMode =
    openedScenes.find((scene) => scene.key === activeScene)?.state || "levelEditor";

  // Рендер логического редактора: в зависимости от выбранного режима проекта используем
  // либо GUI-версию, либо кодовую.
  const renderLogicEditor = () => {
    if (project.logicEditorMode === "visual") {
      return <LogicGuiEditorContent activeScene={activeScene} />;
    } else if (project.logicEditorMode === "code") {
      return <LogicCodeEditorContent activeScene={activeScene} />;
    }
    return <LogicGuiEditorContent activeScene={activeScene} />;
  };

  return (
    <Layout style={{ height: "100vh", background: "#1c1c1c" }}>
      <Header
        style={{
          background: "#1f1f1f",
          padding: "0 16px",
          display: "flex",
          height: "60px",
        }}
      >
        <Dropdown menu={{ items: projectMenuItems }} trigger={["click"]}>
          <Space>
            <Button type="text" style={{ color: "white" }}>
              Проект
            </Button>
            <DownOutlined />
          </Space>
        </Dropdown>

        <Dropdown menu={{ items: editMenuItems }} trigger={["click"]}>
          <Space>
            <Button type="text" style={{ color: "white", marginLeft: "16px" }}>
              Правка
            </Button>
            <DownOutlined />
          </Space>
        </Dropdown>

        <Dropdown menu={{ items: aboutMenuItems }} trigger={["click"]}>
          <Space>
            <Button type="text" style={{ color: "white", marginLeft: "16px" }}>
              О программе
            </Button>
            <DownOutlined />
          </Space>
        </Dropdown>

        <Tabs
          tabs={sceneTabs}
          activeTab={activeScene}
          onTabClick={handleSceneChange}
          onAddTab={handleNewScene}
          onRemoveTab={handleRemoveOpenedScene}
          showGlobalLogicTab={false}
        />
      </Header>

      <Header
        style={{
          background: "#1f1f1f",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "48px",
        }}
      >
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={toggleDrawer}
          style={{ color: "white" }}
        />
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewScene}
            style={{ marginRight: "16px" }}
          >
            New Scene
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRunGame}
          >
            Run Game
          </Button>
        </Space>
        <div style={{ width: "48px" }} />
      </Header>

      <Layout>
        <Content style={{ padding: "16px", background: "#2e2e2e" }}>
          {activeScene !== "projectLogic" && activeScene !== "" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <Button
                type={currentEditorMode === "levelEditor" ? "primary" : "default"}
                onClick={() => handleEditorTabChange("levelEditor")}
              >
                Редактор уровня
              </Button>
              <Button
                type={currentEditorMode === "logicEditor" ? "primary" : "default"}
                onClick={() => handleEditorTabChange("logicEditor")}
              >
                Редактор логики
              </Button>
              <h2 style={{ color: "white" }}>
                Active Scene: {scenes.find((s) => s.id === activeScene)?.sceneName || activeScene}
              </h2>
            </div>
          )}

          {activeScene === "projectLogic" || currentEditorMode === "logicEditor"
            ? renderLogicEditor()
            : (
              <SceneEditor
                activeScene={activeScene}
                projectName={project.name}
                renderType={project.renderType}
              />
            )}
        </Content>
      </Layout>

      <ProjectSettingsDrawer
        visible={drawerVisible}
        onClose={toggleDrawer}
        project={project}
        onUpdateProject={onUpdateProject}
      />
    </Layout>
  );
};

export default GameEditor;
