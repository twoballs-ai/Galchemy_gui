// src/utils/assetStorage.ts

import { openDB, DBSchema } from 'idb';
import { AssetItem } from '../types/assetTypes';

interface AssetDB extends DBSchema {
  assets: {
    key: string;
    value: AssetItem;
    indexes: { 'by-type': string };
  };
}

const ASSET_DB_NAME = "AssetDB";
const ASSET_STORE = "assets";

async function getAssetDB() {
  return openDB<AssetDB>(ASSET_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        const store = db.createObjectStore(ASSET_STORE, { keyPath: 'id' });
        store.createIndex('by-type', 'type');
      }
    }
  });
}

export async function addAsset(asset: AssetItem) {
  const db = await getAssetDB();
  await db.put(ASSET_STORE, asset);
}

export async function getAssets(): Promise<AssetItem[]> {
  const db = await getAssetDB();
  return db.getAll(ASSET_STORE);
}

export async function removeAsset(assetId: string) {
  const db = await getAssetDB();
  await db.delete(ASSET_STORE, assetId);
}
