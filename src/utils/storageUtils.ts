const ALL_PROJECTS_KEY = 'allProjects';
const CURRENT_PROJECT_KEY = 'currentProjectId';

export interface ProjectSummary {
  id: string;
  name: string;
}

export interface SceneData {
  id: string;           // Уникальный идентификатор сцены
  sceneName: string;
  settings: object;
}

export interface OpenedScene {
  id: string;
  sceneName: string;
  key: string;
}

export interface ProjectData {
  scenes: SceneData[];
  openedScenes: OpenedScene[];
  activeScene: string;
}

export interface LogicCondition {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface LogicAction {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface LogicEvent {
  id: string;
  conditions: LogicCondition[];
  actions: LogicAction[];
}

export interface SceneLogicData {
  logicEvents: LogicEvent[];
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

// Сохранение данных конкретного проекта по его id
export const saveProjectData = (projectId: string, data: ProjectData) => {
  try {
    const key = `ProjectData:${projectId}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Ошибка при сохранении данных проекта ${projectId}:`, error);
  }
};

// Загрузка данных конкретного проекта по его id
export const loadProjectData = (projectId: string): ProjectData | null => {
  try {
    const key = `ProjectData:${projectId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Ошибка при загрузке данных проекта ${projectId}:`, error);
    return null;
  }
};

// Удаление данных проекта по его id
export const deleteProjectData = (projectId: string) => {
  try {
    const key = `ProjectData:${projectId}`;
    localStorage.removeItem(key);
    const projects = loadAllProjects().filter((project) => project.id !== projectId);
    saveAllProjects(projects);
  } catch (error) {
    console.error(`Ошибка при удалении данных проекта ${projectId}:`, error);
  }
};

// Удаление данных сцены из проекта по имени сцены
export const deleteSceneData = (projectId: string, sceneName: string) => {
  try {
    const projectData = loadProjectData(projectId);
    if (projectData) {
      projectData.scenes = projectData.scenes.filter((scene) => scene.sceneName !== sceneName);
      // Если требуется, можно сохранить обновлённые данные
    }
  } catch (error) {
    console.error(`Ошибка при удалении данных сцены ${sceneName} из проекта ${projectId}:`, error);
  }
};

// Работа с логикой сцены
const getLogicStorageKey = (projectId: string, sceneId: string) => {
  return `LogicData:${projectId}:${sceneId}`;
};

export const saveSceneLogic = (projectId: string, sceneId: string, logicData: SceneLogicData) => {
  try {
    const key = getLogicStorageKey(projectId, sceneId);
    localStorage.setItem(key, JSON.stringify(logicData));
  } catch (error) {
    console.error(`Ошибка при сохранении логики сцены ${sceneId} в проекте ${projectId}:`, error);
  }
};

export const loadSceneLogic = (projectId: string, sceneId: string): SceneLogicData | null => {
  try {
    const key = getLogicStorageKey(projectId, sceneId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { logicEvents: [] };
  } catch (error) {
    console.error(`Ошибка при загрузке логики сцены ${sceneId} в проекте ${projectId}:`, error);
    return { logicEvents: [] };
  }
};

export const deleteSceneLogic = (projectId: string, sceneId: string) => {
  try {
    const key = getLogicStorageKey(projectId, sceneId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Ошибка при удалении логики сцены ${sceneId} в проекте ${projectId}:`, error);
  }
};

// Работа с текущим проектом
export const setCurrentProjectToLS = (projectId: string) => {
  try {
    localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
  } catch (error) {
    console.error('Ошибка при установке текущего проекта:', error);
  }
};

export const getCurrentProject = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_PROJECT_KEY);
  } catch (error) {
    console.error('Ошибка при получении текущего проекта:', error);
    return null;
  }
};

export const clearCurrentProject = () => {
  try {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  } catch (error) {
    console.error('Ошибка при очистке текущего проекта:', error);
  }
};
