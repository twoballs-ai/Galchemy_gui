import React, { useState, useEffect } from 'react';
import GameTypeSelector from './GameTypeSelector';
import GameEditor from './GameEditor';
import { v4 as uuidv4 } from 'uuid';
import { Button, List, Modal, Space, Typography, Layout } from 'antd';
import './App.scss';
import { ProjectSummary, deleteProjectData, saveAllProjects, loadAllProjects } from './utils/storageUtils';
import { useDispatch } from 'react-redux';
import { setCurrentProjectId } from './store/slices/projectSlice';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [isGameTypeModalVisible, setIsGameTypeModalVisible] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const dispatch = useDispatch();

  // Загружаем проекты из localStorage при загрузке
  useEffect(() => {
    const storedProjects = loadAllProjects();
    if (storedProjects.length > 0) {
      setProjects(storedProjects);
    }
    checkUserAuth();
  }, []);

  // Сохраняем проекты в localStorage при каждом изменении
  useEffect(() => {
    saveAllProjects(projects);
  }, [projects]);

  // Функция проверки авторизации (заглушка)
  const checkUserAuth = () => {
    setIsUserLoggedIn(false);
  };

  const handleCreateProject = () => {
    setIsGameTypeModalVisible(true);
  };

  const handleSelectGameType = (gameType: string) => {
    setIsGameTypeModalVisible(false);
    const newProject: ProjectSummary = {
      id: uuidv4(),
      name: `Project ${projects.length + 1}`,
      renderType: gameType,
    };
    setProjects([...projects, newProject]);
  };

  const handleEditProject = (project: ProjectSummary) => {
    dispatch(setCurrentProjectId(project.id));  // Установили текущий проект
    setSelectedProject(project);
    setIsEditorOpen(true);
};

  const handleDeleteProject = (projectId: string) => {
    deleteProjectData(projectId);
    setProjects(projects.filter((project) => project.id !== projectId));
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedProject(null);
  };

  const handleUpdateProject = (updatedProject: ProjectSummary) => {
    setProjects(projects.map((proj) =>
      proj.id === updatedProject.id ? updatedProject : proj
    ));
  };

  return (
    <Layout className="app-container">
      <Content>
        {!isEditorOpen ? (
          <>
            <Header className="app-header">
              <Typography.Title level={3} className="header-title">
                Game Alchemy Editor
              </Typography.Title>
              <Typography.Text className="header-welcome">
                Приветствуем вас в редакторе игр Game Alchemy
              </Typography.Text>
              <Typography.Text className="header-user">
                {isUserLoggedIn ? 'Вы вошли в систему' : 'Гость'}
              </Typography.Text>
            </Header>
            <div className="main-page">
              <Typography.Title level={2} className="main-title">
                Мои проекты
              </Typography.Title>
              <Space style={{ marginBottom: '20px' }}>
                <Button type="primary" onClick={handleCreateProject}>
                  Создать новый проект
                </Button>
              </Space>
              <List
                bordered
                dataSource={projects}
                renderItem={(project) => (
                  <List.Item
                    actions={[
                      <Button type="link" onClick={() => handleEditProject(project)}>
                        Редактировать
                      </Button>,
                      <Button type="link" danger onClick={() => handleDeleteProject(project.id)}>
                        Удалить
                      </Button>,
                    ]}
                  >
                    {project.name} – {project.renderType}
                  </List.Item>
                )}
              />
            </div>
          </>
        ) : (
          selectedProject && (
            <GameEditor
              project={selectedProject}
              onUpdateProject={handleUpdateProject}
              onCloseProject={handleCloseEditor}
            />
          )
        )}

        <Modal
          title="Выбор типа проекта"
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
