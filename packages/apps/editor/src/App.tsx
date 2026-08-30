// App.tsx
import React, { useState, useEffect } from "react";
import GameEditor from "./GameEditor";
import { v4 as uuidv4 } from "uuid";
import { Button, List, Modal, Space, Typography, Layout } from "antd";
import "./App.scss";
import {
  ProjectSummary,
  deleteProjectData,
  saveAllProjects,
  loadAllProjects,
} from "./utils/storageUtils";
import { useDispatch } from "react-redux";
import { initializeProject, setCurrentProjectId } from "./store/slices/projectSlice";
import ProjectCreationModal from "./ProjectCreationModal";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { AppDispatch } from "./store/store"; // путь может отличаться в твоем проекте
const { Header, Content } = Layout;

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [isProjectCreationModalVisible, setIsProjectCreationModalVisible] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);


const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const storedProjects = loadAllProjects();
    if (storedProjects.length > 0) {
      setProjects(storedProjects);
    }
  }, []);

  useEffect(() => {
    saveAllProjects(projects);
  }, [projects]);

  const handleCreateProject = () => {
    setIsProjectCreationModalVisible(true);
  };
const handleCreateProjectConfirm = async (projectName: string) => {
  const newProj: ProjectSummary = {
    id: uuidv4(),
    name: projectName,
  };

  // 1) Централизованная инициализация (создаст ассеты, сцену, объекты)
  await dispatch(initializeProject(newProj));

  // 2) Обновляем список проектов в App
  setProjects(prev => [...prev, newProj]);

  // 3) Закрываем модальное окно
  setIsProjectCreationModalVisible(false);

  // 4) Открываем редактор для нового проекта
  dispatch(setCurrentProjectId(newProj.id));
  setSelectedProject(newProj);
  setIsEditorOpen(true);
};
  const handleRenameProject = (project: ProjectSummary) => {
    const newName = prompt("Введите новое имя проекта:", project.name);
    if (newName && newName.trim() !== "") {
      const updatedProject = { ...project, name: newName.trim() };
      handleUpdateProject(updatedProject); // уже есть этот метод
    }
  };
  const handleEditProject = (project: ProjectSummary) => {
    dispatch(setCurrentProjectId(project.id));
    setSelectedProject(project);
    setIsEditorOpen(true);
  };

const handleDeleteProject = (projectId: string) => {
  deleteProjectData(projectId);

  // убираем из Redux, а заодно сбрасываем currentProjectId, если нужно
  setProjects(prev => prev.filter(p => p.id !== projectId));
  dispatch(setCurrentProjectId(null));        // <-- добавили
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
            </Header>
            <div className="main-page">
              <Typography.Title level={2} className="main-title">
                Мои проекты
              </Typography.Title>
              <Space style={{ marginBottom: "20px" }}>
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
                      <Button
                        type="link"
                        onClick={() => handleEditProject(project)}
                        title="Редактировать"
                      >
                        Открыть редактор
                      </Button>,
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleRenameProject(project)}
                        title="Переименовать"
                      />,
                      <Button
                        type="link"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDeleteProject(project.id)}
                        title="Удалить"
                      />,
                    ]}
                  >
                    <Typography.Text style={{ color: '#40a9ff', fontWeight: 600 }}>
                      {project.name}
                    </Typography.Text>
                  </List.Item>
                )}
              />
            </div>
          </>
        ) : (
          selectedProject && (
            <GameEditor project={selectedProject} onCloseProject={handleCloseEditor} onUpdateProject={handleUpdateProject} />
          )
        )}

        {/* Единое модальное окно для создания проекта */}
        <Modal
          title="Создание проекта"
          open={isProjectCreationModalVisible}
          onCancel={() => setIsProjectCreationModalVisible(false)}
          footer={null}
        >
          <ProjectCreationModal
            onCreate={handleCreateProjectConfirm}
            onCancel={() => setIsProjectCreationModalVisible(false)}
          />
        </Modal>
      </Content>
    </Layout>
  );
};

export default App;
