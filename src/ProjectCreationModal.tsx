import React, { useState } from "react";
import { Button, Typography, Input } from "antd";

export interface ProjectCreationModalProps {
  onCreate: (projectName: string) => void;
  onCancel: () => void;
}

const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({ onCreate, onCancel }) => {
  const [projectName, setProjectName] = useState("");

  const handleCreate = () => {
    if (projectName.trim() === "") {
      alert("Пожалуйста, введите имя проекта!");
      return;
    }
    onCreate(projectName.trim());
  };

  return (
    <div>
      <Typography.Title level={4}>Создание нового проекта</Typography.Title>
      <Typography.Paragraph>
        Проект на базе WebGL с поддержкой 3D и 2D. 
        Подходит для любых игр: от простых 2D-аркад до трёхмерных миров. 
        Вы сами решаете, как использовать движок.
        Введите имя для вашего проекта:
        
      </Typography.Paragraph>

      <Input
        placeholder="Мой первый проект"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        onPressEnter={handleCreate}
      />

      <div style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleCreate}>
          Создать проект
        </Button>
        <Button onClick={onCancel} style={{ marginLeft: 8 }}>
          Отмена
        </Button>
      </div>
    </div>
  );
};

export default ProjectCreationModal;
