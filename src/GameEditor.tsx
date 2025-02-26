// GameEditor.tsx

import React, { useEffect, useState, useCallback  } from "react";
import { Layout, Button, Dropdown, Space } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  DownOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from 'uuid';
import LogicEditorContent from "./components/GameEditorComponents/LogicEditor/LogicEditorContent";
import SceneEditor from "./components/GameEditorComponents/SceneEditor/SceneEditor";
import Tabs from "./components/GameEditorComponents/Tabs/Tabs";
import ProjectSettingsDrawer from "./components/ProjectSettings/ProjectSettingsDrawer";

import { ProjectSummary } from "./utils/storageUtils";
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


const GameEditor: React.FC<GameEditorProps> = ({
  project,
  onUpdateProject,
  onCloseProject,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Из Redux-среза "project":
  const { scenes, openedScenes, activeScene } = useSelector(
    (state: RootState) => state.project
  );
console.log(openedScenes)
  // Локальное состояние для "логики редактора вкладок" (например, "levelEditor"/"logicEditor")
  const [editorTabs, setEditorTabs] = useState<{ [key: string]: string }>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  // Формируем список вкладок: из Redux + добавляем "projectLogic", если его нет
  const sceneTabs = openedScenes.map(s => ({
    key: s.key,
    sceneName: s.sceneName,
  }));
  
  if (!sceneTabs.find(tab => tab.key === "projectLogic")) {
    sceneTabs.push({ key: "projectLogic", sceneName: "Проектная логика" });
  }
  // При монтировании загружаем проект из localStorage
  useEffect(() => {
    dispatch(loadProject(project.name)).then(() => setIsProjectLoaded(true));
  }, [dispatch, project.name]);


const addNewScene = useCallback(
  (sceneName: string) => {
    const newScene = createScene(sceneName);
    dispatch(addScene(newScene));
    
    // Создаём объект для openedScenes с нужной структурой
    const newOpenedScene = {
      id: newScene.id,
      sceneName: newScene.sceneName,
      key: newScene.id, // можно использовать id как ключ
      state: "levelEditor"  // либо другой дефолтный статус
    };

    // Обновляем openedScenes, добавляя новую сцену
    dispatch(setOpenedScenes([...openedScenes, newOpenedScene]));
    dispatch(setActiveScene(newScene.id));
    dispatch(saveProject(project.name));
  },
  [dispatch, project.name, openedScenes]
);
  // Если сцен нет и активная сцена не установлена – создаём дефолтную сцену
  useEffect(() => {
    if (isProjectLoaded && scenes.length === 0 && activeScene === "") {
      addNewScene("Scene 1");
    }
  }, [isProjectLoaded, scenes, activeScene, addNewScene]);

  // Создаём новую сцену (на основе количества уже созданных сцен)
  const handleNewScene = useCallback(() => {
    const index = scenes.length + 1;
    addNewScene(`Scene ${index}`);
  }, [scenes.length, addNewScene]);

  // Удаляем сцену по её идентификатору
  const handleRemoveOpenedScene = (tabKey: string) => {
    // Защита от удаления глобальной вкладки
    if (tabKey === "projectLogic") return;
  
    // Убираем сцену только из списка открытых вкладок
    const updatedOpenedScenes = openedScenes.filter(scene => scene.key !== tabKey);
    dispatch(setOpenedScenes(updatedOpenedScenes));
  
    // Если закрытая вкладка была активной, переключаем активную сцену на первую оставшуюся вкладку (или на "projectLogic")
    if (activeScene === tabKey) {
      const newActive = updatedOpenedScenes.length > 0 ? updatedOpenedScenes[0].key : "projectLogic";
      dispatch(setActiveScene(newActive));
    }
    
    dispatch(saveProject(project.name));
  };

  // Переключаем активную сцену (или "projectLogic")
  const handleSceneChange = (tabKey: string) => {
    dispatch(setActiveScene(tabKey));
    // По желанию сохраним
    dispatch(saveProject(project.name));
  };

  // Меняем режим редактора (уровень / логика) — храним локально
  const handleEditorTabChange = (mode: string) => {
    // Обновляем локальный стейт (если он вам ещё нужен)
    setEditorTabs((prevTabs) => ({
      ...prevTabs,
      [activeScene]: mode,
    }));
  
    // Обновляем state открытой сцены в Redux
    dispatch(updateOpenedScene({ key: activeScene, newState: mode }));
    dispatch(saveProject(project.name));
  };

  const handleRunGame = () => {
    // Запускаем "игру" для активной сцены
    if (activeScene === "projectLogic") {
      //console.log("Running global logic...");
      return;
    }
    globalLogicManager.runLogicForScene(activeScene);
  };

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  // Меню
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

  // Определяем, какой режим редактора сейчас активен для текущей сцены
  // const currentEditorMode = editorTabs[activeScene] || "levelEditor";
  const currentEditorMode =
  openedScenes.find((scene) => scene.key === activeScene)?.state ||
  "levelEditor";
  return (
    <Layout style={{ height: "100vh", background: "#1c1c1c" }}>
      {/* Верхняя панель с меню и вкладками */}
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
          showGlobalLogicTab={false} // у нас уже вручную добавляется "projectLogic"
        />
      </Header>

      {/* Панель с кнопками "New Scene" и "Run Game" */}
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
                Active Scene: {
                  // Показать имя сцены:
                  scenes.find((s) => s.id === activeScene)?.sceneName || activeScene
                }
              </h2>
            </div>
          )}

          {activeScene === "projectLogic" ? (
            <LogicEditorContent projectName={project.name} scope="project" />
          ) : currentEditorMode === "logicEditor" ? (
            <LogicEditorContent
              projectName={project.name}
              activeScene={activeScene}
              scope="scene"
            />
          ) : (
            <SceneEditor
              projectName={project.name}
              activeScene={activeScene}
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
