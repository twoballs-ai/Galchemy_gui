// App.tsx
import React, { useState, useEffect, useMemo } from "react";
import GameEditor from "./GameEditor";
import { v4 as uuidv4 } from "uuid";
import {
  Button,
  Modal,
  Typography,
  Layout,
  Avatar,
  Input,
  Dropdown,
  Empty,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  FolderOpenOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SortAscendingOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
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
import { AppDispatch } from "./store/store";

const { Header, Content } = Layout;
const { Text, Title, Paragraph } = Typography;

type SortMode = "updated" | "created" | "name";
type ViewMode = "grid" | "list";

// Временный "пользователь" — заглушка под будущую авторизацию
const MOCK_USER = {
  name: "Guest User",
  avatar: null as string | null,
  email: "guest@gamealchemy.local",
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [isProjectCreationModalVisible, setIsProjectCreationModalVisible] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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

  // Фильтрация и сортировка
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? projects.filter((p) => p.name.toLowerCase().includes(query))
      : projects;

    return [...filtered].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "created") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });
  }, [projects, searchQuery, sortMode]);

  const handleCreateProject = () => setIsProjectCreationModalVisible(true);

  const handleCreateProjectConfirm = async (projectName: string) => {
    const now = Date.now();
    const newProj: ProjectSummary = {
      id: uuidv4(),
      name: projectName,
      createdAt: now,
      updatedAt: now,
    };

    await dispatch(initializeProject(newProj));
    setProjects((prev) => [...prev, newProj]);
    setIsProjectCreationModalVisible(false);
    dispatch(setCurrentProjectId(newProj.id));
    setSelectedProject(newProj);
    setIsEditorOpen(true);
  };

  const handleRenameProject = (project: ProjectSummary) => {
    const newName = prompt("Введите новое имя проекта:", project.name);
    if (newName && newName.trim() !== "" && newName.trim() !== project.name) {
      handleUpdateProject({ ...project, name: newName.trim(), updatedAt: Date.now() });
    }
  };

  const handleEditProject = (project: ProjectSummary) => {
    dispatch(setCurrentProjectId(project.id));
    setSelectedProject(project);
    setIsEditorOpen(true);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProjectData(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    dispatch(setCurrentProjectId(null));
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedProject(null);
  };

  const handleUpdateProject = (updatedProject: ProjectSummary) => {
    setProjects((prev) =>
      prev.map((proj) => (proj.id === updatedProject.id ? updatedProject : proj))
    );
  };

  const formatDate = (ts?: number) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Меню пользователя (заглушка)
  const userMenu = {
    items: [
      { key: "profile", icon: <UserOutlined />, label: "Профиль" },
      { key: "settings", icon: <SettingOutlined />, label: "Настройки" },
      { type: "divider" as const },
      { key: "logout", icon: <LogoutOutlined />, label: "Выйти", danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === "logout") console.log("logout (stub)");
    },
  };

  const sortMenu = {
    items: [
      { key: "updated", label: "По последнему изменению" },
      { key: "created", label: "По дате создания" },
      { key: "name", label: "По имени" },
    ],
    onClick: ({ key }: { key: string }) => setSortMode(key as SortMode),
  };

  const stats = {
    total: projects.length,
    recentWeek: projects.filter((p) => (p.updatedAt ?? 0) > Date.now() - 7 * 86400_000).length,
  };

  return (
    <Layout className="dashboard">
      {/* ========== HEADER (Показываем ТОЛЬКО если редактор НЕ открыт) ========== */}
      {!isEditorOpen && (
        <Header className="dashboard-header">
          <div className="dashboard-header__brand">
            <div className="dashboard-header__logo">GA</div>
            <Title level={4} className="dashboard-header__title">
              Game Alchemy
            </Title>
          </div>

          <div className="dashboard-header__stats">
            <div className="stat-chip">
              <FolderOpenOutlined />
              <span className="stat-chip__value">{stats.total}</span>
              <span className="stat-chip__label">проектов</span>
            </div>
            <div className="stat-chip">
              <ClockCircleOutlined />
              <span className="stat-chip__value">{stats.recentWeek}</span>
              <span className="stat-chip__label">за неделю</span>
            </div>
          </div>

          <div className="dashboard-header__actions">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProject}>
              Новый проект
            </Button>

            <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
              <div className="user-chip">
                <Avatar
                  size={32}
                  src={MOCK_USER.avatar}
                  icon={<UserOutlined />}
                  className="user-chip__avatar"
                />
                <div className="user-chip__info">
                  <span className="user-chip__name">{MOCK_USER.name}</span>
                  <span className="user-chip__email">{MOCK_USER.email}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
      )}

      {/* ========== CONTENT ========== */}
      <Content className="dashboard-content">
        {isEditorOpen ? (
          selectedProject && (
            <GameEditor
              project={selectedProject}
              onCloseProject={handleCloseEditor}
              onUpdateProject={handleUpdateProject}
            />
          )
        ) : (
          <div className="dashboard-content__inner">
            {/* Приветствие */}
            <section className="welcome-section">
              <div>
                <Title level={2} className="welcome-section__title">
                  Привет, {MOCK_USER.name.split(" ")[0]} 👋
                </Title>
                <Paragraph className="welcome-section__subtitle">
                  Продолжите работу над проектом или создайте что-то новое
                </Paragraph>
              </div>
            </section>

            {/* Панель инструментов */}
            <section className="toolbar">
              <Input
                placeholder="Поиск проектов..."
                prefix={<SearchOutlined />}
                allowClear
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="toolbar__search"
              />

              <Dropdown menu={sortMenu} trigger={["click"]}>
                <Button icon={<SortAscendingOutlined />}>
                  Сортировка
                </Button>
              </Dropdown>

              <div className="toolbar__view-switch">
                <Tooltip title="Сетка">
                  <Button
                    type={viewMode === "grid" ? "primary" : "text"}
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode("grid")}
                  />
                </Tooltip>
                <Tooltip title="Список">
                  <Button
                    type={viewMode === "list" ? "primary" : "text"}
                    icon={<UnorderedListOutlined />}
                    onClick={() => setViewMode("list")}
                  />
                </Tooltip>
              </div>
            </section>

            {/* Контент */}
            {filteredProjects.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  projects.length === 0
                    ? "У вас пока нет проектов. Создайте первый!"
                    : "Ничего не найдено"
                }
                className="empty-state"
              >
                {projects.length === 0 && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProject}>
                    Создать проект
                  </Button>
                )}
              </Empty>
            ) : viewMode === "grid" ? (
              <Row gutter={[16, 16]} className="projects-grid">
                {filteredProjects.map((project) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                    <ProjectCard
                      project={project}
                      formatDate={formatDate}
                      onEdit={handleEditProject}
                      onRename={handleRenameProject}
                      onDelete={handleDeleteProject}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="projects-list">
                {filteredProjects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    formatDate={formatDate}
                    onEdit={handleEditProject}
                    onRename={handleRenameProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <Modal
          title="Создание проекта"
          open={isProjectCreationModalVisible}
          onCancel={() => setIsProjectCreationModalVisible(false)}
          footer={null}
          className="project-modal"
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

/* =========================
   ProjectCard (grid view)
   ========================= */
interface ProjectCardProps {
  project: ProjectSummary;
  formatDate: (ts?: number) => string;
  onEdit: (p: ProjectSummary) => void;
  onRename: (p: ProjectSummary) => void;
  onDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  formatDate,
  onEdit,
  onRename,
  onDelete,
}) => (
  <div className="project-card" onClick={() => onEdit(project)}>
    <div className="project-card__preview">
      <FileTextOutlined className="project-card__preview-icon" />
    </div>

    <div className="project-card__body">
      <div className="project-card__header">
        <Text strong className="project-card__name" title={project.name}>
          {project.name}
        </Text>
        <Dropdown
          trigger={["click"]}
          onClick={(e) => e.stopPropagation()}
          menu={{
            items: [
              { key: "rename", icon: <EditOutlined />, label: "Переименовать" },
              { type: "divider" },
              { key: "delete", icon: <DeleteOutlined />, label: "Удалить", danger: true },
            ],
            onClick: ({ key }: { key: string }) => {
              if (key === "rename") onRename(project);
              if (key === "delete") onDelete(project.id);
            },
          }}
        >
          <Button
            type="text"
            className="project-card__menu"
            onClick={(e) => e.stopPropagation()}
          >
            ⋯
          </Button>
        </Dropdown>
      </div>

      <div className="project-card__meta">
        <div className="project-card__meta-row">
          <CalendarOutlined />
          <span>Создан: {formatDate(project.createdAt)}</span>
        </div>
        <div className="project-card__meta-row">
          <ClockCircleOutlined />
          <span>Изменён: {formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  </div>
);

/* =========================
   ProjectRow (list view)
   ========================= */
const ProjectRow: React.FC<ProjectCardProps> = ({
  project,
  formatDate,
  onEdit,
  onRename,
  onDelete,
}) => (
  <div className="project-row" onClick={() => onEdit(project)}>
    <div className="project-row__icon">
      <FileTextOutlined />
    </div>
    <div className="project-row__main">
      <Text strong className="project-row__name">
        {project.name}
      </Text>
      <div className="project-row__meta">
        <span>Создан: {formatDate(project.createdAt)}</span>
        <span className="dot">•</span>
        <span>Изменён: {formatDate(project.updatedAt)}</span>
      </div>
    </div>
    <div className="project-row__actions" onClick={(e) => e.stopPropagation()}>
      <Tooltip title="Открыть">
        <Button type="text" onClick={() => onEdit(project)}>
          Открыть
        </Button>
      </Tooltip>
      <Tooltip title="Переименовать">
        <Button type="text" icon={<EditOutlined />} onClick={() => onRename(project)} />
      </Tooltip>
      <Tooltip title="Удалить">
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(project.id)}
        />
      </Tooltip>
    </div>
  </div>
);

export default App;