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
import { setCurrentProjectId } from "./store/slices/projectSlice";
import ProjectCreationModal from "./ProjectCreationModal";

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [isProjectCreationModalVisible, setIsProjectCreationModalVisible] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const dispatch = useDispatch();

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
  const handleCreateProjectConfirm = () => {
    const newProj: ProjectSummary = {
      id: uuidv4(),
      name: `Project ${projects.length + 1}`,
    };
    setProjects([...projects, newProj]);
    setIsProjectCreationModalVisible(false);
  };

  const handleEditProject = (project: ProjectSummary) => {
    dispatch(setCurrentProjectId(project.id));
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
                      <Button type="link" onClick={() => handleEditProject(project)}>
                        Редактировать
                      </Button>,
                      <Button type="link" danger onClick={() => handleDeleteProject(project.id)}>
                        Удалить
                      </Button>,
                    ]}
                  >
                    {project.name}
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
