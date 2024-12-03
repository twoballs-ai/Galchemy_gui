// GameEditor.tsx

import React, { useState, useEffect } from "react";
import { Layout, Button, Dropdown, Space, Drawer } from "antd";
import {
  DownOutlined,
  PlusOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import LogicEditorContent from "./components/LogicEditor/LogicEditorContent";
import SceneEditor from "./components/SceneEditor/SceneEditor";
import Tabs from "./components/Tabs/Tabs";
import {
  saveProjectData,
  loadProjectData,
  saveSceneData,
  loadSceneData,
  updateOpenedScenes,
  loadOpenedScenes,
  deleteSceneData,
  ProjectSummary,
} from "./utils/storageUtils";

const { Header, Content } = Layout;

interface GameEditorProps {
  project: ProjectSummary;
  onUpdateProject: (updatedProject: ProjectSummary) => void;
  onCloseProject: () => void;
}

const GameEditor: React.FC<GameEditorProps> = ({
  project,
  onUpdateProject,
  onCloseProject,
}) => {
  const [sceneTabs, setSceneTabs] = useState<string[]>([]);
  const [activeScene, setActiveScene] = useState<string>("");
  const [editorTabs, setEditorTabs] = useState<{ [key: string]: string }>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerPlacement, setDrawerPlacement] = useState<
    "left" | "right" | "top" | "bottom"
  >("left");

  useEffect(() => {
    setSceneTabs(project.scenes);
  
    const { openedScenes, activeScene } = loadOpenedScenes(project.name);
  
    if (openedScenes.length > 0) {
      setActiveScene(activeScene || openedScenes[0]?.key || "");
      const editorStates: { [key: string]: string } = {};
      openedScenes.forEach((scene) => {
        editorStates[scene.key] = scene.state;
      });
      setEditorTabs(editorStates);
    } else if (project.scenes.length > 0) {
      const firstScene = project.scenes[0];
      setActiveScene(firstScene);
      setSceneTabs([firstScene]); // Добавляем первую сцену в sceneTabs
      updateOpenedScenes(
        project.name,
        [{ title: firstScene, key: firstScene, state: "levelEditor" }],
        firstScene
      );
    } else {
      handleNewScene();
    }
  }, [project]);

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleNewScene = () => {
    const { openedScenes } = loadOpenedScenes(project.name);
  
    const newScene = `Scene ${sceneTabs.length + 1}`;
    const newSceneData = { sceneName: newScene, objects: [], settings: {} };
  
    const updatedSceneTabs = [...sceneTabs, newScene];
    setSceneTabs(updatedSceneTabs);
    setActiveScene(newScene);
    setEditorTabs((prevTabs) => ({ ...prevTabs, [newScene]: "levelEditor" }));
  
    saveSceneData(project.name, newSceneData);
  
    const updatedProject = { ...project, scenes: updatedSceneTabs };
    onUpdateProject(updatedProject);
    saveProjectData(project.name, updatedProject);
  
    const updatedOpenScenes = [
      ...openedScenes,
      { title: newScene, key: newScene, state: "levelEditor" },
    ];
    updateOpenedScenes(project.name, updatedOpenScenes, newScene);
  
    // Обновляем вкладки, чтобы отобразилась новая сцена
    setSceneTabs((prevTabs) => [...prevTabs, newScene]);
  };

  const handleRemoveScene = (tab: string) => {
    const { openedScenes, activeScene } = loadOpenedScenes(project.name);
    if (openedScenes.length <= 1) return;

    const updatedOpenScenes = openedScenes.filter((scene) => scene.key !== tab);
    const newActiveScene = activeScene === tab && updatedOpenScenes.length > 0 ? updatedOpenScenes[0].key : activeScene;

    setActiveScene(newActiveScene);
    setEditorTabs((prevTabs) => {
      const newTabs = { ...prevTabs };
      delete newTabs[tab];
      return newTabs;
    });

    updateOpenedScenes(project.name, updatedOpenScenes, newActiveScene);
  };

  const handleSceneChange = (tab: string) => {
    setActiveScene(tab);
    const { openedScenes } = loadOpenedScenes(project.name);
    if (!openedScenes.find((scene) => scene.key === tab)) {
      const updatedOpenScenes = [...openedScenes, { title: tab, key: tab, state: editorTabs[tab] || "levelEditor" }];
      updateOpenedScenes(project.name, updatedOpenScenes, tab);
    } else {
      updateOpenedScenes(project.name, openedScenes, tab);
    }
  };
  
  const handleEditorTabChange = (key: string) => {
    setEditorTabs((prevTabs) => ({ ...prevTabs, [activeScene]: key }));
    const openedScenes = loadOpenedScenes(project.name).map((scene) =>
      scene.key === activeScene ? { ...scene, state: key } : scene
    );
    updateOpenedScenes(project.name, openedScenes);
  };

  const handleSaveProject = () => {
    const updatedProject = { ...project, scenes: sceneTabs };
    onUpdateProject(updatedProject);
    // Исправленный вызов saveProjectData
    saveProjectData(project.name, updatedProject);
  };
  const projectMenuItems = [
    { label: "Создать сцену", key: "newScene", onClick: handleNewScene },
    { label: "Сохранить проект", key: "save", onClick: handleSaveProject },
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
              <Button
                type="text"
                style={{ color: "white", marginLeft: "16px" }}
              >
                Правка
              </Button>
              <DownOutlined />
            </Space>
        </Dropdown>

        <Dropdown menu={{ items: aboutMenuItems }} trigger={["click"]}>
            <Space>
              <Button
                type="text"
                style={{ color: "white", marginLeft: "16px" }}
              >
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
          onRemoveTab={handleRemoveScene}
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
            type="default"
            icon={<SaveOutlined />}
            onClick={handleSaveProject}
            style={{ marginRight: "16px" }}
          >
            Save
          </Button>
          <Button type="primary" icon={<PlayCircleOutlined />}>
            Run Game
          </Button>
        </Space>
        <div style={{ width: "48px" }} />
      </Header>

      <Layout>
        <Content style={{ padding: "16px", background: "#2e2e2e" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <Button
              type={
                editorTabs[activeScene] === "levelEditor"
                  ? "primary"
                  : "default"
              }
              onClick={() => handleEditorTabChange("levelEditor")}
            >
              Редактор уровня
            </Button>
            <Button
              type={
                editorTabs[activeScene] === "logicEditor"
                  ? "primary"
                  : "default"
              }
              onClick={() => handleEditorTabChange("logicEditor")}
            >
              Редактор логики
            </Button>
            <h2 style={{ color: "white" }}>Active Scene: {activeScene}</h2>
          </div>
          {editorTabs[activeScene] === "levelEditor" ? (
            <SceneEditor
              projectName={project.name}
              sceneName={activeScene}
              renderType={project.renderType}
            />
          ) : (
            <LogicEditorContent
              projectName={project.name}
              sceneName={activeScene}
            />
          )}
        </Content>
      </Layout>

      <Drawer
        title="Параметры проекта"
        placement={drawerPlacement}
        onClose={toggleDrawer}
        open={drawerVisible}
      >
        <p>Здесь можно редактировать параметры проекта.</p>
      </Drawer>
    </Layout>
  );
};

export default GameEditor;
