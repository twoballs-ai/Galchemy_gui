import React from "react";
import { Button, Typography } from "antd";

export interface ProjectCreationModalProps {
  onCreate: () => void;
  onCancel: () => void;
}

const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({ onCreate, onCancel }) => {
  return (
    <div>
      <Typography.Title level={4}>Чистый проект WebGL</Typography.Title>
      <Typography.Paragraph>
        Проект на базе WebGL с поддержкой 3D и 2D. 
        Подходит для любых игр: от простых 2D-аркад до трёхмерных миров. 
        Вы сами решаете, как использовать движок.
      </Typography.Paragraph>

      <Button type="primary" onClick={onCreate}>
        Создать проект
      </Button>
      <Button onClick={onCancel} style={{ marginLeft: 8 }}>
        Отмена
      </Button>
    </div>
  );
};

export default ProjectCreationModal;