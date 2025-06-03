import { AssetItem } from "../../../types/assetTypes";

// Кешируем результат, чтобы не дёргать каждый раз
let CACHE: AssetItem[] | null = null;

/**
 * Собирает ассеты, группируя материалы в отдельные объекты с meta-данными.
 */
export function buildSystemAssets(): AssetItem[] {
  if (CACHE) return CACHE;

  // Подгружаем все файлы из assets, включая material.json
  const raw = import.meta.glob(
    "/node_modules/game-alchemy-core/src/assets/**",
    { eager: true, as: "url" }
  ) as Record<string, string>;

  // Подгружаем все material.json отдельно (как json)
  const materialJsons = import.meta.glob(
    "/node_modules/game-alchemy-core/src/assets/materials/**/material.json",
    { eager: true, as: "json" }
  ) as Record<string, any>;

  const RAW_PREFIX = "/node_modules/game-alchemy-core/src/assets/";

  const folderId = new Map<string, string>();
  folderId.set("", undefined as any);

  const assets: AssetItem[] = [];

  // 1. Сначала добавляем обычные папки и файлы (кроме materials/*/material.json)
  for (const [absPath, url] of Object.entries(raw)) {
    if (absPath.endsWith("material.json")) continue; // Не добавляем material.json как файл

    const rel = absPath.replace(RAW_PREFIX, "");
    const parts = rel.split("/");

    // Создаём папки
    let parentPath = "";
    let parentId: string | undefined = undefined;
    for (let i = 0; i < parts.length - 1; i++) {
      parentPath += (i ? "/" : "") + parts[i];
      if (!folderId.has(parentPath)) {
        const id = crypto.randomUUID();
        folderId.set(parentPath, id);
        assets.push({
          id,
          name: parts[i],
          type: "folder",
          parentId,
          system: true,
        });
      }
      parentId = folderId.get(parentPath)!;
    }

    // Определяем тип файла
    const file = parts.at(-1)!;
    const ext = file.split(".").pop()!.toLowerCase();
    const type: AssetItem["type"] =
      ["png", "jpg", "jpeg", "bmp", "gif", "webp"].includes(ext) ? "image" :
      ["glb", "gltf", "usdz", "usdc"].includes(ext) ? "model" :
      ["mp3", "ogg", "wav", "flac"].includes(ext) ? "audio" :
      ["txt", "md", "json"].includes(ext) ? "text" :
      ["mtlx", "material"].includes(ext) ? "material" :
      "file";

    assets.push({
      id: crypto.randomUUID(),
      name: file,
      type,
      parentId,
      url,
      system: true,
    });
  }

  // 2. Затем отдельным слоем добавляем материалы из material.json (PBR-бандлы)
  const materialsParentId = assets.find(a => a.name === "materials" && a.type === "folder")?.id;
for (const [absPath, json] of Object.entries(materialJsons)) {
  const m = absPath.match(/materials\/([^\/]+)\/([^\/]+)\/material\.json$/);
  if (!m) continue;
  const [ , category , folderName ] = m;          // bricks / Bricks091_1K-JPG

  // id папки-категории (bricks / metallic / rocks)
  const categoryId = assets.find(
    (a) => a.type === "folder" && a.name === category && a.parentId === materialsParentId
  )?.id;

  if (!categoryId) continue; // страхуемся

  // превью, как раньше …
  let previewUrl: string | undefined = undefined;
  if (json.preview) {
    previewUrl = Object.entries(raw).find(
      ([k]) => k.endsWith(`materials/${category}/${folderName}/${json.preview}`)
    )?.[1];
  }

  assets.push({
    id: crypto.randomUUID(),
    name: json.name || folderName,
    type: "material",
    parentId: categoryId,      // ⬅ сюда!
    url: absPath,
    preview: previewUrl,
    system: true,
    meta: json,
  } as AssetItem);
}

  CACHE = assets;
  return assets;
}
