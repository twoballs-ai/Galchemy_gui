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
  name: string;           // внутреннее имя   (main_<pid>.js)
  displayName?: string;   // то, что видит пользователь (main.js)
  type: "folder" | "script" | "image" | "audio" | "modelAsset" | "material" | "file" | "text";
  parentId?: string;
  fileData?: ArrayBuffer | string;
  url?: string;
  system?: boolean;       // не удаляемое «из коробки»
  protected?: boolean;    // не удаляемое из UI, но можно снести программно
}