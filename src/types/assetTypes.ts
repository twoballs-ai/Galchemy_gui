// src/types/assetTypes.ts

export type AssetType = "model" | "image" | "audio" | "text" | "folder" | "file";

export interface AssetItem {
  id: string;
  name: string;
  type: AssetType;
  parentId?: string;
  url?: string; // objectURL/base64 для preview
  fileData?: ArrayBuffer | string | null; // бинарные данные
  meta?: Record<string, any>;
  system?: boolean;          // ← НОВОЕ
}
