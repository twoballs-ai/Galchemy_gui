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
  displayName?: string;   
  type: "folder" | "script" | "image" | "audio" | "modelAsset" | "material" | "file" | "text";
  parentId?: string;
  fileData?: ArrayBuffer | string;
  url?: string;
  system?: boolean;      
  protected?: boolean;    
  projectId?: string;  
}