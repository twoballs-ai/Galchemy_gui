import React from "react";
import { Dropdown, Button, Checkbox, Menu } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { toggleSceneVisibility, setOpenedScenes } from "../../store/slices/projectSlice"; // Экшен для переключения видимости сцены
import { getCurrentProject, saveProjectData } from "../../utils/storageUtils";

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
  const dispatch = useDispatch();

  // Получаем данные о сценах и открытых сценах из Redux
  const scenes = useSelector((state: any) => state.project.scenes); // сцены - список всех сцен
  const openedScenes = useSelector((state: any) => state.project.openedScenes); // открытые сцены

  const projectMenuItems = [
    { label: "Создать сцену", key: "newScene", onClick: onNewScene },
    { label: "Закрыть проект", key: "close", onClick: onCloseProject },
  ];

  const editMenuItems = [
    { label: "Отменить", key: "undo" },
    { label: "Повторить", key: "redo" },
  ];

  // Меню для переключения видимости панелей
  const viewMenuItems = Object.entries(panels).map(([key, visible]) => ({
    label: (
      <Checkbox
        checked={visible}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onTogglePanel(key)}
      >
        {key === 'objectsPanel' ? 'Объекты' :
          key === 'propertiesPanel' ? 'Свойства' :
            key === 'assetBrowserPanel' ? 'Ассеты' : key}
      </Checkbox>
    ),
    key,
  }));

  // Меню для "Сцены" (второстепенное меню)
  const scenesMenuItems = scenes.map((scene: any) => ({
    label: (
      <Checkbox
        checked={openedScenes.some((openedScene: any) => openedScene.id === scene.id && openedScene.visible)}
        onChange={() => handleSceneVisibilityChange(scene.id)}
      >
        {scene.sceneName}
      </Checkbox>
    ),
    key: scene.id,
  }));

  // Функция для переключения видимости сцены
  const handleSceneVisibilityChange = (sceneId: string) => {
  // Переключаем видимость сцены в Redux
  dispatch(toggleSceneVisibility(sceneId));

  // Обновляем список открытых сцен с новой видимостью
  const updatedOpenedScenes = openedScenes.map(scene => 
    scene.id === sceneId
      ? { ...scene, visible: !scene.visible }  // Переключаем видимость сцены
      : scene
  );

  dispatch(setOpenedScenes(updatedOpenedScenes));  // Обновляем состояние

  // Сохраняем данные проекта в локальном хранилище
  const projectId = getCurrentProject();  // Получаем текущий ID проекта
  if (projectId) {
    const projectData = {
      scenes: updatedOpenedScenes.map(scene => ({
        id: scene.id,
        sceneName: scene.sceneName,
        settings: scene.settings,
        visible: scene.visible  // Учитываем видимость сцены
      })),
      openedScenes: updatedOpenedScenes,
      activeScene: sceneId,  // Обновляем активную сцену
      visible: true,  // Можно адаптировать
    };

    saveProjectData(projectId, projectData);  // Сохраняем обновленный проект
  }
};
  const helpMenuItems = [
    { label: "Версия", key: "version" },
    { label: "Контакты", key: "contact" },
  ];

  // Функция для генерации кнопки с текстом и стрелкой вниз
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
        <div style={{ display: "flex", alignItems: "center" }}>
          {renderButton("Проект")}
        </div>
      </Dropdown>

      <Dropdown menu={{ items: editMenuItems }} trigger={["click"]}>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>
          {renderButton("Правка")}
        </div>
      </Dropdown>

      {/* Меню "Вид" с панелями и сценами как подпункты */}
      <Dropdown overlay={
        <Menu items={[
          // Подменю с панелями
          {
            key: 'panels',
            label: 'Панели',
            children: viewMenuItems.map(item => ({
              key: item.key,
              label: item.label,
            }))
          },
          // Подменю с сценами
          {
            key: 'scenes',
            label: 'Сцены',
            children: scenesMenuItems,
          },
        ]} />
      } trigger={["click"]}>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>
          {renderButton("Вид")}
        </div>
      </Dropdown>

      <Dropdown menu={{ items: helpMenuItems }} trigger={["click"]}>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>
          {renderButton("Помощь")}
        </div>
      </Dropdown>
    </>
  );
};

export default EditorMenuBar;
