// helpers/assetTree.ts
import { AssetItem } from "../../../types/assetTypes";

/** Рекурсивно строим дерево папок */
export function buildFolderTree(assets: AssetItem[], parentId?: string): AssetItem[] {
  return assets
    .filter(item => item.type === "folder" && item.parentId === parentId)
    .map(folder => ({
      ...folder,
      children: buildFolderTree(assets, folder.id)
    }));
}

/** Содержимое папки: ассеты и папки внутри */
export function getFolderContent(assets: AssetItem[], folderId?: string): AssetItem[] {
  return assets.filter(item => item.parentId === folderId);
}

/** Получить массив хлебных крошек (от корня до текущей папки) */
export function getBreadcrumbs(assets: AssetItem[], folderId?: string): AssetItem[] {
  const breadcrumbs: AssetItem[] = [];
  let current = assets.find(a => a.id === folderId);
  while (current) {
    breadcrumbs.unshift(current);
    current = assets.find(a => a.id === current.parentId);
  }
  // добавить корень, если не указан folderId
  if (!folderId) {
    const root = assets.find(a => !a.parentId && a.type === "folder");
    if (root) breadcrumbs.unshift(root);
  }
  return breadcrumbs;
}
