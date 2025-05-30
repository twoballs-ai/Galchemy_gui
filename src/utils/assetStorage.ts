// src/utils/assetStorage.ts
import { openDB, DBSchema } from "idb";
import { AssetItem } from "../types/assetTypes";
import { buildSystemAssets } from "../components/GameEditorComponents/AssetBrowser/systemAssets";


/* ---------- IndexedDB schema ---------- */
interface AssetDB extends DBSchema {
  assets: {
    key: string;                     // id
    value: AssetItem;
    indexes: { "by-type": string };
  };
}

const ASSET_DB_NAME = "AssetDB";
const ASSET_STORE   = "assets";

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

/* ---------- встроенные (движковые) ассеты ---------- */
const SYS: AssetItem[] = buildSystemAssets();

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

/** Добавить новый пользовательский ассет */
export async function addAsset(item: AssetItem) {
  if (item.system) return;                   // системные не пишем
  const db = await getAssetDB();
  await db.put(ASSET_STORE, item);
}

/** Удалить ассет по id (кроме встроенных) */
export async function removeAsset(id: string) {
  if (SYS.some(a => a.id === id)) return;    // встроенные не трогаем
  const db = await getAssetDB();
  await db.delete(ASSET_STORE, id);
}
