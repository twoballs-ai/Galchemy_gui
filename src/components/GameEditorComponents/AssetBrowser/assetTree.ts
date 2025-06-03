import { AssetItem } from "../../../types/assetTypes";

/** Расширенный детектор папки-материала */
function isMaterialFolder(assets: AssetItem[], folderId: string) {
  // 1) Есть ли внутри stub-файл material.json?
  const hasMaterialJson = assets.some(
    (a) => a.parentId === folderId && a.name.toLowerCase() === "material.json"
  );

  // 2) Или есть «уникальные» для материала файлы .mtlx / .usdc?
  const hasMaterialBinary = assets.some((a) => {
    if (a.parentId !== folderId) return false;
    const ext = a.name.split(".").pop()?.toLowerCase();
    return ext === "mtlx" || ext === "usdc";
  });

  // 3) Или существует AssetItem с type:"material" и таким же именем,
  //    что и сама папка (твой buildSystemAssets именно так и делает).
  const folder = assets.find((a) => a.id === folderId);
  const hasMaterialStub = folder
    ? assets.some(
        (a) => a.type === "material" && a.name === folder.name
      )
    : false;

  return hasMaterialJson || hasMaterialBinary || hasMaterialStub;
}
/** Рекурсивно строим дерево папок, исключая папки-материалы */
export function buildFolderTree(
  assets: AssetItem[],
  parentId?: string
): AssetItem[] {
  return assets
    .filter(
      (item) =>
        item.type === "folder" &&
        item.parentId === parentId &&
        !isMaterialFolder(assets, item.id) // ← новый детектор
    )
    .map((folder) => ({
      ...folder,
      children: buildFolderTree(assets, folder.id),
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
