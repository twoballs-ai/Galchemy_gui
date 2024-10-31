// utils/dbUtils.ts

import { openDB } from 'idb';

const DB_NAME = 'ProjectDB';
const DB_VERSION = 1;
const PROJECT_STORE = 'projectData';
const SCENES_STORE = 'scenes';

// Инициализация базы данных
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PROJECT_STORE)) {
        db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SCENES_STORE)) {
        db.createObjectStore(SCENES_STORE, { keyPath: 'sceneName' });
      }
    },
  });
};

// Сохранение данных проекта
export const saveProjectData = async (data: object) => {
  const db = await initDB();
  await db.put(PROJECT_STORE, { id: 'project', ...data });
};

// Загрузка данных проекта
export const loadProjectData = async () => {
  const db = await initDB();
  return (await db.get(PROJECT_STORE, 'project')) || null;
};

// Сохранение данных сцены
export const saveSceneData = async (sceneName: string, data: object) => {
  const db = await initDB();
  await db.put(SCENES_STORE, { sceneName, ...data });
};

// Загрузка данных сцены
export const loadSceneData = async (sceneName: string) => {
  const db = await initDB();
  return (await db.get(SCENES_STORE, sceneName)) || null;
};

// Удаление данных сцены
export const deleteSceneData = async (sceneName: string) => {
  const db = await initDB();
  await db.delete(SCENES_STORE, sceneName);
};
