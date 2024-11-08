const ALL_PROJECTS_KEY = 'allProjects';

// Интерфейсы
export interface ProjectSummary {
  name: string;
  renderType: string;
  scenes: string[];
}

export interface SceneData {
  sceneName: string;
  objects: any[];
  settings: object;
}

export interface ProjectData {
  scenes: SceneData[];
  openedScenes: { title: string; key: string; state: string }[];
  activeScene: string;
}

// Сохранение списка всех проектов
export const saveAllProjects = (projects: ProjectSummary[]) => {
  try {
    localStorage.setItem(ALL_PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Ошибка при сохранении allProjects:', error);
  }
};

// Загрузка списка всех проектов
export const loadAllProjects = (): ProjectSummary[] => {
  try {
    const data = localStorage.getItem(ALL_PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Ошибка при загрузке allProjects:', error);
    return [];
  }
};

// Сохранение данных конкретного проекта
export const saveProjectData = (projectName: string, data: ProjectData) => {
  try {
    const key = `ProjectData:${projectName}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Ошибка при сохранении данных проекта ${projectName}:`, error);
  }
};

// Загрузка данных конкретного проекта
export const loadProjectData = (projectName: string): ProjectData | null => {
  try {
    const key = `ProjectData:${projectName}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Ошибка при загрузке данных проекта ${projectName}:`, error);
    return null;
  }
};

// Удаление данных проекта
export const deleteProjectData = (projectName: string) => {
  try {
    const key = `ProjectData:${projectName}`;
    localStorage.removeItem(key);
    const projects = loadAllProjects().filter((project) => project.name !== projectName);
    saveAllProjects(projects);
  } catch (error) {
    console.error(`Ошибка при удалении данных проекта ${projectName}:`, error);
  }
};

// Сохранение данных сцены в проекте
export const saveSceneData = (projectName: string, sceneData: SceneData) => {
  const projectData = loadProjectData(projectName) || { scenes: [], openedScenes: [] };
  const sceneIndex = projectData.scenes.findIndex((s) => s.sceneName === sceneData.sceneName);

  if (sceneIndex > -1) {
    projectData.scenes[sceneIndex] = sceneData;
  } else {
    projectData.scenes.push(sceneData);
  }

  saveProjectData(projectName, projectData);
};

// Загрузка данных сцены из проекта
export const loadSceneData = (projectName: string, sceneName: string): SceneData | null => {
  const projectData = loadProjectData(projectName);
  return projectData?.scenes.find((scene) => scene.sceneName === sceneName) || null;
};

// Удаление данных сцены из проекта
export const deleteSceneData = (projectName: string, sceneName: string) => {
  const projectData = loadProjectData(projectName);
  if (projectData) {
    projectData.scenes = projectData.scenes.filter((scene) => scene.sceneName !== sceneName);
    saveProjectData(projectName, projectData);
  }
};

// Сохранение открытых сцен в проекте
export const updateOpenedScenes = (
  projectName: string,
  openedScenes: { title: string; key: string; state: string }[],
  activeScene: string
) => {
  const projectData = loadProjectData(projectName) || { scenes: [], openedScenes: [], activeScene: '' };
  projectData.openedScenes = openedScenes;
  projectData.activeScene = activeScene;
  saveProjectData(projectName, projectData);
};

// Загрузка открытых сцен из проекта
export const loadOpenedScenes = (projectName: string) => {
  const projectData = loadProjectData(projectName);
  return {
    openedScenes: projectData?.openedScenes || [],
    activeScene: projectData?.activeScene || '',
  };
};