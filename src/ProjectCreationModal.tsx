// ProjectCreationModal.tsx
import React, { useState } from "react";
import { List, Button, Typography, Divider } from "antd";
import { ProjectSummary } from "./utils/storageUtils";

export interface ProjectCreationModalProps {
  onCreate: (gameType: string, logicMode: "visual" | "code") => void;
  onCancel: () => void;
}

const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({ onCreate, onCancel }) => {
  const gameTypes = [
    {
      key: "2d",
      title: "2D Игра Canvas 2D(WebGL 2D)",
      description:
        "Игра с использованием Canvas 2D(WebGL 2D). Позволяет создавать простые игры с 2D-графикой, используя примитивы и спрайты.",
    },
        // {
    //   key: 'webgl2d',
    //   title: '2D Игра (WebGL 2D)',
    //   description:
    //     'Игра с использованием WebGL 2D. Использует координаты X и Y для отрисовки спрайтов. Подходит для создания более сложных 2D-игр, требующих высокой производительности, но без поддержки 3D-объектов.',
    // },
    // {
    //   key: 'webgl3d',
    //   title: '3D Игра (WebGL 3D)',
    //   description:
    //     'Игра с использованием WebGL 3D. Позволяет создавать игры с полным 3D-рендерингом, используя трёхмерные модели и анимации. Идеально для сложных проектов и игр с полным 3D-миром.',
    // },
    // Если нужно добавить другие типы, раскомментируйте или добавьте новые объекты.
  ];

  const logicModes = [
    {
      key: "visual",
      title: "Визуальный редактор логики",
      description: "Создавайте логику с помощью drag‑and‑drop блоков.",
    },
    {
      key: "code",
      title: "Кодовый редактор логики",
      description: "Пишите скрипты для логики игры напрямую на JavaScript.",
    },
  ];

  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);
  const [selectedLogicMode, setSelectedLogicMode] = useState<"visual" | "code" | null>(null);

  return (
    <div>
      <Typography.Title level={4}>Выберите тип проекта</Typography.Title>
      <List
        bordered
        dataSource={gameTypes}
        renderItem={(item) => (
          <List.Item
            onClick={() => setSelectedGameType(item.key)}
            style={{
              cursor: "pointer",
              background: selectedGameType === item.key ? "#e6f7ff" : undefined,
            }}
          >
            <div style={{ flex: 1 }}>
              <Typography.Title level={5}>{item.title}</Typography.Title>
              <Typography.Text>{item.description}</Typography.Text>
            </div>
          </List.Item>
        )}
      />
      <Divider />
      <Typography.Title level={4}>Выберите режим редактора логики</Typography.Title>
      <List
        bordered
        dataSource={logicModes}
        renderItem={(item) => (
          <List.Item
            onClick={() => setSelectedLogicMode(item.key as "visual" | "code")}
            style={{
              cursor: "pointer",
              background: selectedLogicMode === item.key ? "#e6f7ff" : undefined,
            }}
          >
            <div style={{ flex: 1 }}>
              <Typography.Title level={5}>{item.title}</Typography.Title>
              <Typography.Text>{item.description}</Typography.Text>
            </div>
          </List.Item>
        )}
      />
      <Divider />
      <Button
        type="primary"
        onClick={() => {
          if (selectedGameType && selectedLogicMode) {
            onCreate(selectedGameType, selectedLogicMode);
          }
        }}
        disabled={!selectedGameType || !selectedLogicMode}
      >
        Создать проект
      </Button>
      <Button onClick={onCancel} style={{ marginLeft: 8 }}>
        Отмена
      </Button>
    </div>
  );
};

export default ProjectCreationModal;
