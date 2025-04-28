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
import LogicCodeEditorContent from "./components/GameEditorComponents/LogicCodeEditor/LogicCodeEditorContent";
import SceneEditor from "./components/GameEditorComponents/SceneEditor/SceneEditor";
import Tabs from "./components/GameEditorComponents/Tabs/Tabs";
import ProjectSettingsDrawer from "./components/ProjectSettings/ProjectSettingsDrawer";

import { ProjectSummary, saveSceneLogic } from "./utils/storageUtils";
import { globalLogicManager } from "./logicManager";

import { GameAlchemy } from 'game-alchemy-core';  
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

// ────────────────────────────────────────────────────────────
// Логика инициализации (только CodeLogic — GUI выпилен)
// ────────────────────────────────────────────────────────────
const createInitialSceneCodeLogic = (projectId: string, sceneId: string) => {
  const initialCode = `// Редактор кода для сцены ${sceneId}

function runLogic() {
  console.log("Hello, World!");
}
`;
  try {
    const key = `CodeLogic:${projectId}:${sceneId}`;
    localStorage.setItem(key, initialCode);
  } catch (error) {
    console.error(`Ошибка при сохранении CodeLogic для сцены ${sceneId}:`, error);
  }
};

const createInitialSceneLogic = (projectId: string, sceneId: string) =>
  createInitialSceneCodeLogic(projectId, sceneId);

const createProjectLogic = (projectId: string) => {
  const key = `CodeLogic:${projectId}:projectLogic`;
  if (!localStorage.getItem(key)) {
    const initialCode = `// Редактор кода для проекта

function runProjectLogic() {
  console.log("Project Logic");
}
`;
    localStorage.setItem(key, initialCode);
  }
};

// ────────────────────────────────────────────────────────────
// Компонент GameEditor
// ────────────────────────────────────────────────────────────
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

  const sceneTabs = openedScenes.map((s) => ({
    key: s.key,
    sceneName: s.sceneName,
  }));

  // ───── Загрузка проекта ─────
  useEffect(() => {
    dispatch(loadProject(project.id)).then(() => {
      setIsProjectLoaded(true);
      createProjectLogic(project.id);
    });
  }, [dispatch, project.id]);

  // ───── Добавление новой сцены ─────
  const addNewScene = useCallback(
    (sceneName: string) => {
      const newScene = createScene(sceneName);
      dispatch(addScene(newScene));

      createInitialSceneLogic(project.id, newScene.id);

      const newOpenedScene = {
        id: newScene.id,
        sceneName: newScene.sceneName,
        key: newScene.id,
        state: "levelEditor",
      };

      dispatch(setOpenedScenes([...openedScenes, newOpenedScene]));
      dispatch(setActiveScene(newScene.id));
      dispatch(saveProject(project.id));
    },
    [dispatch, project.id, openedScenes]
  );

  // ───── Создаём первую сцену при пустом проекте ─────
  useEffect(() => {
    if (isProjectLoaded && scenes.length === 0 && activeScene === "") {
      addNewScene("Scene 1");
    }
  }, [isProjectLoaded, scenes, activeScene, addNewScene]);

  // ───── Обработчики вкладок ─────
  const handleNewScene = () => addNewScene(`Scene ${scenes.length + 1}`);

  const handleRemoveOpenedScene = (tabKey: string) => {
    if (tabKey === "projectLogic") return;

    const updatedOpenedScenes = openedScenes.filter((scene) => scene.key !== tabKey);
    dispatch(setOpenedScenes(updatedOpenedScenes));

    if (activeScene === tabKey) {
      const newActive =
        updatedOpenedScenes.length > 0 ? updatedOpenedScenes[0].key : "projectLogic";
      dispatch(setActiveScene(newActive));
    }

    dispatch(saveProject(project.id));
  };

  const handleSceneChange = (tabKey: string) => {
    dispatch(setActiveScene(tabKey));
    dispatch(saveProject(project.id));
  };

  const handleEditorTabChange = (mode: string) => {
    setEditorTabs((prev) => ({ ...prev, [activeScene]: mode }));
    dispatch(updateOpenedScene({ key: activeScene, newState: mode }));
    dispatch(saveProject(project.id));
  };

  // ───── Запуск игры ─────
  const handleRunGame = () => {
    if (activeScene !== "projectLogic") {
      const { sceneManager } = GameAlchemy.core;
      sceneManager.changeScene?.(activeScene);   // 🆕 Переключаем сцену!
  
      globalLogicManager.runLogicForScene(activeScene);
      GameAlchemy.setPreviewMode();
    }
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

  // ───── Логический редактор (только CodeEditor) ─────
  const renderLogicEditor = () => (
    <LogicCodeEditorContent activeScene={activeScene} />
  );

  // ────────────────────────────────────────────────────
  // JSX
  // ────────────────────────────────────────────────────
  return (
    <Layout style={{ height: "100vh", background: "#1c1c1c" }}>
      {/* ───── Верхнее меню и вкладки ───── */}
      <Header style={{ background: "#1f1f1f", padding: "0 16px", display: "flex", height: "60px" }}>
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

      {/* ───── Кнопки управления ───── */}
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
            Run Scene
          </Button>
        </Space>
        <div style={{ width: "48px" }} />
      </Header>

      {/* ───── Контент ───── */}
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

          {activeScene === "projectLogic" || currentEditorMode === "logicEditor" ? (
            renderLogicEditor()
          ) : (
            <SceneEditor
              activeScene={activeScene}
              projectName={project.name}
            />
          )}
        </Content>
      </Layout>

      {/* ───── Настройки проекта ───── */}
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
