import React from "react";
import { Dropdown, Button, Space, Checkbox } from "antd";
import { DownOutlined } from "@ant-design/icons";

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
        {key === 'objectsPanel' ? 'Объекты' :
          key === 'propertiesPanel' ? 'Свойства' :
            key === 'assetBrowserPanel' ? 'Ассеты' : key}
      </Checkbox>
    ),
    key,
  }));

  const helpMenuItems = [
    { label: "Версия", key: "version" },
    { label: "Контакты", key: "contact" },
  ];

  return (
    <>
      <Dropdown menu={{ items: projectMenuItems }} trigger={["click"]}>
        <Space>
          <Button type="text" style={{ color: "white" }}>Проект</Button>
          <DownOutlined />
        </Space>
      </Dropdown>

      <Dropdown menu={{ items: editMenuItems }} trigger={["click"]}>
        <Space>
          <Button type="text" style={{ color: "white", marginLeft: 16 }}>Правка</Button>
          <DownOutlined />
        </Space>
      </Dropdown>

      <Dropdown menu={{ items: viewMenuItems }} trigger={["click"]}>
        <Space>
          <Button type="text" style={{ color: "white", marginLeft: 16 }}>Вид</Button>
          <DownOutlined />
        </Space>
      </Dropdown>

      <Dropdown menu={{ items: helpMenuItems }} trigger={["click"]}>
        <Space>
          <Button type="text" style={{ color: "white", marginLeft: 16 }}>Помощь</Button>
          <DownOutlined />
        </Space>
      </Dropdown>
    </>
  );
};

export default EditorMenuBar;
