export type AssetType =  | 'folder'
    | 'image'
    | 'audio'
    | 'modelAsset'
    | 'material'
    | 'text'
    | 'script'   // 👈 НОВОЕ
    | 'file';

export interface AssetItem {
  id: string;
  name: string;
  type: AssetType;
  parentId?: string;
  url?: string;
  fileData?: ArrayBuffer | string;
  system?: boolean;
}