import React from "react";
import { Dropdown, Button, Checkbox } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { setOpenedScenes, setActiveScene, saveProject } from "../../store/slices/projectSlice";

interface EditorMenuBarProps {
  onNewScene: () => void;
  onCloseProject: () => void;
  panels: Record<string, boolean>;
  onTogglePanel: (panelKey: string) => void;
}

const EditorMenuBar: React.FC<EditorMenuBarProps> = ({
  onNewScene,
  onCloseProject,
  panels,
  onTogglePanel,
}) => {
  const dispatch = useDispatch<any>();

  const scenes = useSelector((state: any) => state.project.scenes);
  const openedScenes = useSelector((state: any) => state.project.openedScenes);
  const activeScene = useSelector((state: any) => state.project.activeScene);

  const projectMenuItems = [
    { label: "Создать сцену", key: "newScene", onClick: onNewScene },
    { label: "Закрыть проект", key: "close", onClick: onCloseProject },
  ];

  const editMenuItems = [
    { label: "Отменить", key: "undo" },
    { label: "Повторить", key: "redo" },
  ];

  const viewMenuItems = Object.entries(panels).map(([key, visible]) => ({
    label: (
      <Checkbox
        checked={visible}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onTogglePanel(key)}
      >
        {key === "objectsPanel"
          ? "Объекты"
          : key === "propertiesPanel"
            ? "Свойства"
            : key === "assetBrowserPanel"
              ? "Ассеты"
              : key}
      </Checkbox>
    ),
    key,
  }));

  const handleToggleSceneOpen = (scene: any) => {
    const isOpened = openedScenes.some((s: any) => s.id === scene.id);

    let nextOpenedScenes;
    if (isOpened) {
      if (openedScenes.length === 1) return;
      nextOpenedScenes = openedScenes.filter((s: any) => s.id !== scene.id);
    } else {
      nextOpenedScenes = [
        ...openedScenes,
        { id: scene.id, sceneName: scene.sceneName, key: scene.id, visible: true },
      ];
    }

    dispatch(setOpenedScenes(nextOpenedScenes));

    if (activeScene === scene.id && !nextOpenedScenes.some((s: any) => s.id === scene.id)) {
      dispatch(setActiveScene(nextOpenedScenes[0]?.id ?? ""));
    }

    if (!isOpened) {
      dispatch(setActiveScene(scene.id));
    }

    dispatch(saveProject());
  };

  const scenesMenuItems = scenes.map((scene: any) => {
    const isOpened = openedScenes.some((openedScene: any) => openedScene.id === scene.id);

    return {
      key: scene.id,
      label: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Checkbox
            checked={isOpened}
            onClick={(e) => e.stopPropagation()}
            onChange={() => handleToggleSceneOpen(scene)}
          >
            {scene.sceneName}
          </Checkbox>
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (!isOpened) handleToggleSceneOpen(scene);
              dispatch(setActiveScene(scene.id));
              dispatch(saveProject());
            }}
          >
            Открыть
          </Button>
        </div>
      ),
    };
  });

  const helpMenuItems = [
    { label: "Версия", key: "version" },
    { label: "Контакты", key: "contact" },
  ];

  const renderButton = (text: string) => (
    <Button
      type="text"
      style={{
        color: "white",
        display: "flex",
        alignItems: "center",
        padding: "8px 16px",
        marginRight: "8px",
        backgroundColor: "transparent",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      {text}
      <DownOutlined style={{ marginLeft: 8 }} />
    </Button>
  );

  return (
    <>
      <Dropdown menu={{ items: projectMenuItems }} trigger={["click"]}>
        <div style={{ display: "flex", alignItems: "center" }}>{renderButton("Проект")}</div>
      </Dropdown>

      <Dropdown menu={{ items: editMenuItems }} trigger={["click"]}>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>{renderButton("Правка")}</div>
      </Dropdown>

      <Dropdown
        menu={{
          items: [
            {
              key: "panels",
              label: "Панели",
              children: viewMenuItems,
            },
            {
              key: "scenes",
              label: `Сцены (${openedScenes.length}/${scenes.length})`,
              children: scenesMenuItems,
            },
          ],
        }}
        trigger={["click"]}
      >
        <div style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>{renderButton("Вид")}</div>
      </Dropdown>

      <Dropdown menu={{ items: helpMenuItems }} trigger={["click"]}>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>{renderButton("Помощь")}</div>
      </Dropdown>
    </>
  );
};

export default EditorMenuBar;
