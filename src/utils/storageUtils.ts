const PROJECT_KEY = 'projectData';
const SCENE_PREFIX = 'scene_';

// Сохранение данных проекта в Local Storage
export const saveProjectData = (data: object) => {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Ошибка при сохранении данных проекта в localStorage:', error);
  }
};

// Загрузка данных проекта из Local Storage
export const loadProjectData = () => {
  try {
    const data = localStorage.getItem(PROJECT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Ошибка при загрузке данных проекта из localStorage:', error);
    return null;
  }
};

// Сохранение данных сцены в Local Storage
export const saveSceneData = (sceneName: string, data: object) => {
  try {
    localStorage.setItem(`${SCENE_PREFIX}${sceneName}`, JSON.stringify(data));
  } catch (error) {
    console.error('Ошибка при сохранении данных сцены в localStorage:', error);
  }
};

// Загрузка данных сцены из Local Storage
export const loadSceneData = (sceneName: string) => {
  try {
    const data = localStorage.getItem(`${SCENE_PREFIX}${sceneName}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Ошибка при загрузке данных сцены из localStorage:', error);
    return null;
  }
};

// Удаление данных сцены из Local Storage
export const deleteSceneData = (sceneName: string) => {
  try {
    localStorage.removeItem(`${SCENE_PREFIX}${sceneName}`);
  } catch (error) {
    console.error('Ошибка при удалении данных сцены из localStorage:', error);
  }
};

// Сохранение открытых сцен в projectData
export const updateOpenedScenes = (
  openedScenes: { title: string; key: string; state: string }[]
) => {
  const projectData = loadProjectData() || {};
  projectData.openedScenes = openedScenes;
  saveProjectData(projectData);
};

// Загрузка открытых сцен из projectData
export const loadOpenedScenes = () => {
  const projectData = loadProjectData();
  return projectData?.openedScenes || [];
};
