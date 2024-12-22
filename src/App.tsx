import React, { useState, useEffect } from 'react';
import GameTypeSelector from './GameTypeSelector';
import GameEditor from './GameEditor';
import { Button, List, Modal, Space, Typography, Layout } from 'antd';
import './App.scss';
import { ProjectSummary, deleteProjectData, saveAllProjects, loadAllProjects } from './utils/storageUtils';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  
  const [isGameTypeModalVisible, setIsGameTypeModalVisible] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // Состояние авторизации

  // Загружаем проекты из localStorage при загрузке
  useEffect(() => {
    const storedProjects = loadAllProjects();
    if (storedProjects.length > 0) {
      setProjects(storedProjects);
    }

    // Проверка авторизации (пока заглушка)
    checkUserAuth();
  }, []);

  // Сохраняем проекты в localStorage при каждом изменении
  useEffect(() => {
    saveAllProjects(projects);
  }, [projects]);

  // Функция проверки авторизации (заглушка)
  const checkUserAuth = () => {
    // Здесь можно будет добавить реальную проверку авторизации
    setIsUserLoggedIn(false); // Пока всегда возвращаем, что пользователь не авторизован
  };

  const handleCreateProject = () => {
    setIsGameTypeModalVisible(true);
  };

  const handleSelectGameType = (gameType: string) => {
    setIsGameTypeModalVisible(false);
    const newProject: ProjectSummary = {
      name: `Project ${projects.length + 1}`,
      renderType: gameType,
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
  };

  const handleEditProject = (project: ProjectSummary) => {
    console.log('Выбранный проект:', JSON.stringify(project, null, 2));
    setSelectedProject(project);
    setIsEditorOpen(true);
  };

  const handleDeleteProject = (projectName: string) => {
    // Удаляем данные конкретного проекта из localStorage
    deleteProjectData(projectName);
  
    // Удаляем проект из списка всех проектов
    const updatedProjects = projects.filter((project) => project.name !== projectName);
    setProjects(updatedProjects);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedProject(null);
  };

  const handleUpdateProject = (updatedProject: ProjectSummary) => {
    const updatedProjects = projects.map((proj) =>
      proj.name === updatedProject.name ? updatedProject : proj
    );
    setProjects(updatedProjects);
  };

  return (
    <Layout className="app-container">
      {/* Header */}


      {/* Content */}
      <Content>
        {!isEditorOpen ? (
          <>      <Header className="app-header">
          <Typography.Title level={3} className="header-title">
            Tette Game Editor
          </Typography.Title>
          <Typography.Text className="header-welcome">
            Приветствуем вас в редакторе игр Tette
          </Typography.Text>
          <Typography.Text className="header-user">
            {isUserLoggedIn ? 'Вы вошли в систему' : 'Гость'}
          </Typography.Text>
        </Header>
        <div className="main-page">
            <Typography.Title level={2} className="main-title">Мои проекты</Typography.Title>
            <Space style={{ marginBottom: '20px' }}>
              <Button type="primary" onClick={handleCreateProject}>Создать новый проект</Button>
            </Space>
            <List
              bordered
              dataSource={projects}
              renderItem={(project) => (
                <List.Item
                  actions={[
                    <Button type="link" onClick={() => handleEditProject(project)}>Редактировать</Button>,
                    <Button type="link" danger onClick={() => handleDeleteProject(project.name)}>Удалить</Button>,
                  ]}
                >
                  {project.name} – {project.renderType}
                </List.Item>
              )}
            />
          </div></>
        ) : (
          selectedProject && (
            <GameEditor
              project={selectedProject}
              onUpdateProject={handleUpdateProject}
              onCloseProject={handleCloseEditor}
            />
          )
        )}

        {/* Modal */}
        <Modal
          title="Выберите тип рендеринга"
          open={isGameTypeModalVisible}
          onCancel={() => setIsGameTypeModalVisible(false)}
          footer={null}
        >
          <GameTypeSelector onSelect={handleSelectGameType} />
        </Modal>
      </Content>
    </Layout>
  );
};

export default App;
