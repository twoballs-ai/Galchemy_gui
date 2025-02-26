import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Обновляем интерфейс GameObject: добавляем поле sceneId
export interface GameObject {
  id: string;
  sceneId: string; // идентификатор сцены
  type: string;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number | null;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  enablePhysics?: boolean;
  isStatic?: boolean;
  layer?: number;
  image?: string;
  // Другие свойства при необходимости
}

interface MyDB extends DBSchema {
  sceneObjects: {
    key: string;
    value: GameObject;
    indexes: { 'by-sceneId': string };
  };
}

const DB_NAME = 'ProjectDB';
const DB_VERSION = 1;
const SCENE_OBJECTS_STORE = 'sceneObjects';

async function getDB(): Promise<IDBPDatabase<MyDB>> {
  return openDB<MyDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SCENE_OBJECTS_STORE)) {
        const store = db.createObjectStore(SCENE_OBJECTS_STORE, { keyPath: 'id' });
        // Создаем индекс для поиска по sceneId
        store.createIndex('by-sceneId', 'sceneId');
      }
    },
  });
}

/**
 * Получает объекты для заданной сцены из IndexedDB.
 */
export async function getSceneObjects(sceneId: string): Promise<GameObject[]> {
  const db = await getDB();
  return db.getAllFromIndex(SCENE_OBJECTS_STORE, 'by-sceneId', sceneId);
}

/**
 * Добавляет объект в IndexedDB и возвращает добавленный объект.
 * Перед добавлением гарантируем, что поле sceneId установлено.
 */
export async function dbAddSceneObject(sceneId: string, object: GameObject): Promise<GameObject> {
  const db = await getDB();
  object.sceneId = sceneId;
  await db.add(SCENE_OBJECTS_STORE, object);
  return object;
}

/**
 * Обновляет объект в IndexedDB и возвращает обновленный объект.
 */
export async function dbUpdateSceneObject(sceneId: string, object: GameObject): Promise<GameObject> {
  const db = await getDB();
  object.sceneId = sceneId;
  await db.put(SCENE_OBJECTS_STORE, object);
  return object;
}

/**
 * Удаляет объект из IndexedDB по его id.
 */
export async function dbRemoveSceneObject(sceneId: string, objectId: string): Promise<void> {
  const db = await getDB();
  await db.delete(SCENE_OBJECTS_STORE, objectId);
}
