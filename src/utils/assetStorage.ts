// src/utils/assetStorage.ts
import { openDB, DBSchema } from "idb";
import { AssetItem } from "../types/assetTypes";
import systemAssetsJson from "../components/GameEditorComponents/AssetBrowser/systemAssets.json";

/* ---------- IndexedDB schema ---------- */
interface AssetDB extends DBSchema {
  assets: {
    key: string;
    value: AssetItem;
    indexes: { "by-type": string };
  };
}

const ASSET_DB_NAME = "AssetDB";
const ASSET_STORE  = "assets";

/* ---------- helper: открыть/создать БД ---------- */
async function getAssetDB() {
  return openDB<AssetDB>(ASSET_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        const store = db.createObjectStore(ASSET_STORE, { keyPath: "id" });
        store.createIndex("by-type", "type");
      }
    },
  });
}

/* ---------- системные ассеты (автоимпорт из json) ---------- */
const SYS: AssetItem[] = systemAssetsJson as AssetItem[];

/* ---------- пользовательский слой ---------- */
async function getUserAssets(): Promise<AssetItem[]> {
  const db = await getAssetDB();
  return db.getAll(ASSET_STORE);
}

/* -------------------------------------------------- */
/** Вернёт системные + пользовательские ассеты */
export async function getAssets(): Promise<AssetItem[]> {
  const user = await getUserAssets();
  return [...SYS, ...user];
}

export async function addAsset(item: AssetItem) {
  if (item.system) return;
  const db = await getAssetDB();
  await db.put(ASSET_STORE, item);
}

export async function removeAsset(id: string) {
  if (SYS.some(a => a.id === id)) return;
  const db = await getAssetDB();
  await db.delete(ASSET_STORE, id);
}
export async function findAssetById(id: string): Promise<AssetItem | undefined> {
  const all = await getAssets();
  return all.find(a => a.id === id);
}

const SCRIPTS_FOLDER_NAME = 'scripts';

/** Гарантированно возвращает id папки scripts (создаёт, если нет). */
export async function getOrCreateScriptsFolder(): Promise<AssetItem> {
  let assets = await getAssets();
  let folder = assets.find(
    a => a.type === 'folder' && a.name === SCRIPTS_FOLDER_NAME && a.parentId === undefined
  );

  if (!folder) {
    folder = { id: crypto.randomUUID(), name: SCRIPTS_FOLDER_NAME, type: 'folder' };
    await addAsset(folder);
  }
  return folder;
}
export async function createScriptAsset(
  name: string,
  parentId: string,
  initialContent = ""
): Promise<AssetItem> {
  const asset: AssetItem = {
    id: crypto.randomUUID(),
    name,
    type: "script",
    parentId,
    fileData: initialContent,
  };
  await addAsset(asset);
  return asset;
}
/** Создаёт (или возвращает) script-ассет внутри scripts-папки */
export async function getOrCreateScriptFile(
  fileName: string,
  defaultContent: string
): Promise<AssetItem> {
  const scriptsFolder = await getOrCreateScriptsFolder();
  let assets = await getAssets();

  let script = assets.find(
    a =>
      a.type === 'script' &&
      a.name === fileName &&
      a.parentId === scriptsFolder.id
  );

  if (!script) {
    script = {
      id: crypto.randomUUID(),
      name: fileName,
      type: 'script',
      parentId: scriptsFolder.id,
      fileData: defaultContent,
    };
    await addAsset(script);
  }
  return script;
}
// Создать (или вернуть) script-ассет проекта
export async function getOrCreateProjectScriptAsset(projectId: string): Promise<AssetItem> {
  const internalName = `main_${projectId}.js`; // уникальное имя в БД
  const displayName  = "main.js";             // показываем пользователю

  const scriptsFolder = await getOrCreateScriptsFolder();
  const assets        = await getAssets();

  let script = assets.find(
    a =>
      a.type     === "script" &&
      a.name     === internalName &&
      a.parentId === scriptsFolder.id
  );

  if (!script) {
    script = {
      id          : crypto.randomUUID(),
      name        : internalName,   // хранится в БД
      displayName : displayName,    // видно в UI
      type        : "script",
      parentId    : scriptsFolder.id,
      protected   : true,           // <── защищён от удаления
      fileData    : `// Главный скрипт проекта\nexport const scenes = [];\n`,
    };
    await addAsset(script);
  }
  return script;
}
// Создать или вернуть script-ассет для сцены
export async function getOrCreateSceneScriptAsset(sceneName: string): Promise<AssetItem> {
  return getOrCreateScriptFile(
    `${sceneName}.js`,
    `// Скрипт сцены ${sceneName}\nexport const initScene = () => {};\n`
  );
}
// src/utils/assetStorage.ts   (добавляем в самый конец файла)

export async function deleteProjectAssets(projectId: string) {
  const db      = await getAssetDB();
  const assets  = await getUserAssets();
  const scriptsFolder = assets.find(
    a => a.type === "folder" && a.name === SCRIPTS_FOLDER_NAME && !a.parentId
  );

  /* ---------- 1. чистим скрипты проекта ---------- */
  const projectScripts = assets.filter(
    a => a.type === "script" && a.name === `main_${projectId}.js`
  );
  for (const s of projectScripts) await db.delete(ASSET_STORE, s.id);

  /* ---------- 2. если папка осталась пустой — удаляем её ---------- */
  if (scriptsFolder) {
    const remains = await db.getAllFromIndex(
      ASSET_STORE,
      "by-type",
      "script"
    );

    const nothingLeft = remains.every(s => s.parentId !== scriptsFolder.id);
    if (nothingLeft) await db.delete(ASSET_STORE, scriptsFolder.id);
  }
}

// Удалить скрипт сцены
export async function deleteSceneScriptAsset(sceneName: string) {
  const scriptsFolder = await getOrCreateScriptsFolder();
  const assets = await getAssets();
  const script = assets.find(a => a.type === 'script' && a.name === `${sceneName}.js` && a.parentId === scriptsFolder.id);
  if (script) await removeAsset(script.id);
}


/** Безопасное обновление содержимого скрипта */
export async function patchScript(
  assetId: string,
  patch: (code: string) => string
) {
  const script = await findAssetById(assetId);
  if (!script || script.type !== 'script') return;

  const current = typeof script.fileData === 'string'
    ? script.fileData
    : new TextDecoder().decode(script.fileData as ArrayBuffer);

  await addAsset({ ...script, fileData: patch(current) });
}

// Удалить скрипт проекта
export async function deleteProjectScriptAsset(projectName: string) {
  const scriptsFolder = await getOrCreateScriptsFolder();
  const assets = await getAssets();
  const script = assets.find(a => a.type === 'script' && a.name === `${projectName}.js` && a.parentId === scriptsFolder.id);
  if (script) await removeAsset(script.id);
}