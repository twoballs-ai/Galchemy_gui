// App.tsx

import React, { useState, useEffect } from 'react';
import GameTypeSelector from './GameTypeSelector';
import GameEditor from './GameEditor';
import { Button, List, Modal, Space, Typography } from 'antd';
import './App.scss';
import { Project, saveProjectsData, loadProjectsData } from './utils/storageUtils';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isGameTypeModalVisible, setIsGameTypeModalVisible] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Загружаем проекты из localStorage при загрузке
  useEffect(() => {
    const storedProjects = loadProjectsData();
    if (storedProjects.length > 0) {
      setProjects(storedProjects);
    }
  }, []);

  // Сохраняем проекты в localStorage при каждом изменении
  useEffect(() => {
    saveProjectsData(projects);
  }, [projects]);

  const handleCreateProject = () => {
    setIsGameTypeModalVisible(true);
  };

  const handleSelectGameType = (gameType: string) => {
    setIsGameTypeModalVisible(false);
    const newProject: Project = {
      name: `Project ${projects.length + 1}`,
      renderType: gameType,
      scenes: [],
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedProject(null);
  };

  return (
    <div className="app-container">
      {!isEditorOpen ? (
        <div className="main-page">
          <Typography.Title level={2} className="main-title">Мои проекты</Typography.Title>
          <Space style={{ marginBottom: '20px' }}>
            <Button type="primary" onClick={handleCreateProject}>Создать новый проект</Button>
          </Space>
          <List
            bordered
            dataSource={projects}
            renderItem={(project) => (
              <List.Item actions={[
                <Button type="link" onClick={() => handleEditProject(project)}>
                  Редактировать
                </Button>,
              ]}>
                {project.name} – {project.renderType}
              </List.Item>
            )}
          />
        </div>
      ) : (
        selectedProject && (
          <GameEditor
            project={selectedProject}
            onUpdateProject={(updatedProject) => {
              const updatedProjects = projects.map((proj) =>
                proj.name === updatedProject.name ? updatedProject : proj
              );
              setProjects(updatedProjects);
            }}
            onCloseProject={handleCloseEditor}
          />
        )
      )}

      <Modal
        title="Выберите тип рендеринга"
        visible={isGameTypeModalVisible}
        onCancel={() => setIsGameTypeModalVisible(false)}
        footer={null}
      >
        <GameTypeSelector onSelect={handleSelectGameType} />
      </Modal>
    </div>
  );
};

export default App;
