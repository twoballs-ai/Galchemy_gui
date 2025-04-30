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
import SceneEditor from "./components/GameEditorComponents/SceneEditor/SceneEditor";
import Tabs from "./components/GameEditorComponents/Tabs/Tabs";

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
import { StopOutlined } from "@ant-design/icons";

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

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const sceneTabs = openedScenes.map((s) => ({
    key: s.key,
    sceneName: s.sceneName,
  }));

  // ───── Загрузка проекта ─────
  useEffect(() => {
    dispatch(loadProject(project.id)).then(() => {
      setIsProjectLoaded(true);
    });
  }, [dispatch, project.id]);

  // ───── Добавление новой сцены ─────
  const addNewScene = useCallback(
    (sceneName: string) => {
      const newScene = createScene(sceneName);
      dispatch(addScene(newScene));


      const newOpenedScene = {
        id: newScene.id,
        sceneName: newScene.sceneName,
        key: newScene.id,
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
    const updatedOpenedScenes = openedScenes.filter((scene) => scene.key !== tabKey);
    dispatch(setOpenedScenes(updatedOpenedScenes));
  
    if (activeScene === tabKey) {
      const newActive = updatedOpenedScenes.length > 0 ? updatedOpenedScenes[0].key : "";
      dispatch(setActiveScene(newActive));
    }
  
    dispatch(saveProject(project.id));
  };
  

  const handleSceneChange = (tabKey: string) => {
    dispatch(setActiveScene(tabKey));
    dispatch(saveProject(project.id));
  };

 
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


        <div style={{ width: "48px" }} />
      </Header>

      {/* ───── Контент ───── */}
      <Layout>
        <Content style={{ padding: "6px", background: "#2e2e2e" }}>

        <SceneEditor
  activeScene={activeScene}
  projectName={project.name}
/>
        </Content>
      </Layout>

    </Layout>
  );
};

export default GameEditor;
