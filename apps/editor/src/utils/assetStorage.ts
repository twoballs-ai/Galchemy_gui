import { openDB, DBSchema } from "idb";
import { AssetItem } from "../types/assetTypes";
import systemAssetsJson from "../components/GameEditorComponents/AssetBrowser/systemAssets.json";

interface AssetDB extends DBSchema {
  assets: {
    key: string;
    value: AssetItem;
    indexes: { "by-type": string; "by-project": string };
  };
}

const ASSET_DB_NAME = "AssetDB";
const ASSET_DB_VERSION = 1;
const ASSET_STORE = "assets";

export const SCRIPTS_FOLDER_NAME = 'scripts';

/* ---------- открыть/создать БД ---------- */
async function getAssetDB() {
  return openDB<AssetDB>(ASSET_DB_NAME, ASSET_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        const store = db.createObjectStore(ASSET_STORE, { keyPath: "id" });
        store.createIndex("by-type", "type");
        store.createIndex("by-project", "projectId");
      }
    },
  });
}

/* ---------- системные ассеты (из JSON) ---------- */
const SYS: AssetItem[] = systemAssetsJson as AssetItem[];

/* ---------- хелпер: ассет принадлежит проекту ---------- */
function isAssetOfProject(a: AssetItem, projectId: string): boolean {
  return a.projectId === projectId;
}

/* ---------- хелпер: создать и добавить ассет ---------- */
async function createAndAddAsset(asset: AssetItem): Promise<AssetItem> {
  await addAsset(asset);
  return asset;
}

/* ---------- пользовательские ассеты ---------- */
async function getUserAssets(): Promise<AssetItem[]> {
  const db = await getAssetDB();
  return db.getAll(ASSET_STORE);
}

/* ---------- ассеты проекта ---------- */
export async function getProjectAssets(projectId: string): Promise<AssetItem[]> {
  const db = await getAssetDB();
  const all = await db.getAll(ASSET_STORE);
  return all.filter(a => isAssetOfProject(a, projectId) || a.projectId === undefined);
}

/* ---------- все ассеты (системные + пользовательские) ---------- */
export async function getAssets(): Promise<AssetItem[]> {
  const user = await getUserAssets();
  return [...SYS, ...user];
}

/* ---------- добавить ассет ---------- */
export async function addAsset(item: AssetItem) {
  if (item.system) return;
  const db = await getAssetDB();
  await db.put(ASSET_STORE, item);
}

/* ---------- удалить ассет ---------- */
export async function removeAsset(id: string) {
  if (SYS.some(a => a.id === id)) return;
  const db = await getAssetDB();
  await db.delete(ASSET_STORE, id);
}

/* ---------- найти ассет по id ---------- */
export async function findAssetById(id: string): Promise<AssetItem | undefined> {
  const all = await getAssets();
  return all.find(a => a.id === id);
}

/* ---------- создать или вернуть scripts-папку проекта ---------- */
export async function getOrCreateScriptsFolder(projectId: string): Promise<AssetItem> {
  const assets = await getProjectAssets(projectId);
  const folder = assets.find(
    a => a.type === 'folder' && a.name === SCRIPTS_FOLDER_NAME && isAssetOfProject(a, projectId) && (a.parentId === undefined || a.parentId === null)
  );
  if (folder) return folder;

  return await createAndAddAsset({
    id: crypto.randomUUID(),
    name: SCRIPTS_FOLDER_NAME,
    type: 'folder',
    projectId,
    parentId: undefined,
  });
}

/* ---------- создать скрипт-ассет ---------- */
export async function createScriptAsset(
  name: string,
  parentId: string,
  projectId: string,
  initialContent = ""
): Promise<AssetItem> {
  return await createAndAddAsset({
    id: crypto.randomUUID(),
    name,
    type: "script",
    parentId,
    fileData: initialContent,
    projectId,
  });
}

/* ---------- создать или вернуть script-ассет внутри scripts-папки ---------- */
export async function getOrCreateScriptFile(
  fileName: string,
  defaultContent: string,
  projectId: string
): Promise<AssetItem> {
  const scriptsFolder = await getOrCreateScriptsFolder(projectId);
  const assets = await getProjectAssets(projectId);

  const existingScript = assets.find(
    a => a.type === 'script' &&
         a.name === fileName &&
         a.parentId === scriptsFolder.id &&
         isAssetOfProject(a, projectId)
  );

  if (existingScript) return existingScript;

  return await createAndAddAsset({
    id: crypto.randomUUID(),
    name: fileName,
    type: 'script',
    parentId: scriptsFolder.id,
    fileData: defaultContent,
    projectId,
  });
}

/* ---------- создать или вернуть главный script-ассет проекта ---------- */
export async function getOrCreateProjectScriptAsset(projectId: string): Promise<AssetItem> {
  const internalName = `main_${projectId}.js`; // уникальное имя
  const displayName = "main.js";
  const scriptsFolder = await getOrCreateScriptsFolder(projectId);
  const assets = await getProjectAssets(projectId);

  const existingScript = assets.find(
    a => a.type === "script" &&
         a.name === internalName &&
         a.parentId === scriptsFolder.id &&
         isAssetOfProject(a, projectId)
  );

  if (existingScript) return existingScript;

  return await createAndAddAsset({
    id: crypto.randomUUID(),
    name: internalName,
    displayName,
    type: "script",
    parentId: scriptsFolder.id,
    protected: true,
    fileData: `// Главный скрипт проекта\nexport const scenes = [];\n`,
    projectId,
  });
}

/* ---------- создать или вернуть script-ассет для сцены ---------- */
export async function getOrCreateSceneScriptAsset(sceneName: string, projectId: string): Promise<AssetItem> {
  return await getOrCreateScriptFile(
    `${sceneName}.js`,
    `// Скрипт сцены ${sceneName}\nexport const initScene = () => {};\n`,
    projectId
  );
}

/* ---------- удалить ассеты проекта ---------- */
export async function deleteProjectAssets(projectId: string) {
  const db = await getAssetDB();
  const assets = await getProjectAssets(projectId);

  const scriptsFolder = assets.find(
    a => a.type === "folder" && a.name === SCRIPTS_FOLDER_NAME && isAssetOfProject(a, projectId) && (a.parentId === undefined || a.parentId === null)
  );

  await deleteAssetsByCondition(assets, a => a.type === "script" && isAssetOfProject(a, projectId));

  if (scriptsFolder) {
    const remains = await db.getAllFromIndex(ASSET_STORE, "by-type", "script");
    const nothingLeft = remains.every(s => s.parentId !== scriptsFolder.id || !isAssetOfProject(s, projectId));
    if (nothingLeft) await db.delete(ASSET_STORE, scriptsFolder.id);
  }
}

/* ---------- удалить script-ассет сцены ---------- */
export async function deleteSceneScriptAsset(sceneName: string, projectId: string) {
  const scriptsFolder = await getOrCreateScriptsFolder(projectId);
  const assets = await getProjectAssets(projectId);
  const script = assets.find(
    a => a.type === 'script' &&
         a.name === `${sceneName}.js` &&
         a.parentId === scriptsFolder.id &&
         isAssetOfProject(a, projectId)
  );
  if (script) await removeAsset(script.id);
}

/* ---------- хелпер: удалить ассеты по условию ---------- */
async function deleteAssetsByCondition(assets: AssetItem[], condition: (a: AssetItem) => boolean) {
  const db = await getAssetDB();
  for (const asset of assets) {
    if (condition(asset)) {
      await db.delete(ASSET_STORE, asset.id);
    }
  }
}
