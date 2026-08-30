export type AssetType =
  | 'folder'
  | 'image'
  | 'audio'
  | 'modelAsset'
  | 'material'
  | 'text'
  | 'script'
  | 'file';

export interface AssetMeta {
  colorMap?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  displacementMap?: string;
  [key: string]: unknown;
}

export interface AssetItem {
  id: string;
  name: string;
  displayName?: string;
  type: AssetType;
  parentId?: string;
  fileData?: ArrayBuffer | string;
  url?: string;
  preview?: string;
  meta?: AssetMeta;
  system?: boolean;
  protected?: boolean;
  projectId?: string;
}
