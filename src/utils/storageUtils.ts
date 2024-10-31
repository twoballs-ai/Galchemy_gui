// utils/storageUtils.ts

const PROJECT_KEY = 'projectData';
const SCENE_PREFIX = 'scene_';

// Сохранение данных проекта в Local Storage
export const saveProjectData = (data: object) => {
  localStorage.setItem(PROJECT_KEY, JSON.stringify(data));
};

// Загрузка данных проекта из Local Storage
export const loadProjectData = () => {
  const data = localStorage.getItem(PROJECT_KEY);
  return data ? JSON.parse(data) : null;
};

// Сохранение данных сцены в Local Storage
export const saveSceneData = (sceneName: string, data: object) => {
  localStorage.setItem(`${SCENE_PREFIX}${sceneName}`, JSON.stringify(data));
};

// Загрузка данных сцены из Local Storage
export const loadSceneData = (sceneName: string) => {
  const data = localStorage.getItem(`${SCENE_PREFIX}${sceneName}`);
  return data ? JSON.parse(data) : null;
};

// Удаление данных сцены из Local Storage
export const deleteSceneData = (sceneName: string) => {
  localStorage.removeItem(`${SCENE_PREFIX}${sceneName}`);
};

// Сохранение открытых сцен в projectData
export const updateOpenedScenes = (openedScenes: { title: string; key: string; state: string }[]) => {
  const projectData = loadProjectData() || {};
  projectData.openedScenes = openedScenes;
  saveProjectData(projectData);
};

// Загрузка открытых сцен из projectData
export const loadOpenedScenes = () => {
  const projectData = loadProjectData();
  return projectData?.openedScenes || [];
};
