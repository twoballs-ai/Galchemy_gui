// components/GameEditorComponents/MainMenuBar.tsx
import React from "react";
import { Dropdown, Button, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";

interface EditorMenuBarProps {
  onNewScene: () => void;
  onCloseProject: () => void;
}

const EditorMenuBar: React.FC<EditorMenuBarProps> = ({
  onNewScene,
  onCloseProject,
}) => {
  const projectMenuItems = [
    { label: "Создать сцену", key: "newScene", onClick: onNewScene },
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
    <>
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
            Помощь
          </Button>
          <DownOutlined />
        </Space>
      </Dropdown>
    </>
  );
};

export default EditorMenuBar;
