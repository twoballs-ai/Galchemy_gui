import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Настраиваем путь, чтобы работало из любого места
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "../public/assets/materials");
const OUTPUT = path.resolve(__dirname, "../src/components/GameEditorComponents/AssetBrowser/systemAssets.json");

// Utility: генерация id
function makeId(...parts) {
  return "mat-" + parts.join("-").replace(/[^\w\-]/g, "");
}

// Map расширений к полям material.json
const textureMap = {
  colorMap:   ["_Color", "_BaseColor"],
  normalMap:  ["_NormalGL", "_Normal", "_NormalDX"],
  roughnessMap: ["_Roughness"],
  displacementMap: ["_Displacement", "_Height"],
  mtlx:      [".mtlx"],
  usdc:      [".usdc"]
};

// 1. Получаем список категорий (каталогов)
const categories = await fs.readdir(ROOT, { withFileTypes: true });
let items = [];

// Добавляем "materials" как виртуальный корень
items.push({
  id: "materials",
  name: "materials",
  type: "folder",
  parentId: undefined,
  system: true
});

for (const categoryDir of categories) {
  if (!categoryDir.isDirectory()) continue;
  const category = categoryDir.name;
  const categoryId = category;
  // Добавляем папку категории
  items.push({
    id: categoryId,
    name: category,
    type: "folder",
    parentId: "materials",
    system: true
  });

  const categoryPath = path.join(ROOT, category);
  const mats = await fs.readdir(categoryPath, { withFileTypes: true });
  for (const matDir of mats) {
    if (!matDir.isDirectory()) continue;
    const mat = matDir.name;
    const matPath = path.join(categoryPath, mat);

    // Собираем список файлов в папке материала
    const files = await fs.readdir(matPath);
    // Определяем имя превью
    const previewFile = files.find(f => f.includes("_Color")) ||
                        files.find(f => f.includes("_BaseColor")) ||
                        files.find(f => /\.(jpg|png)$/i.test(f));
    // Генерируем material.json если нет
    const materialJsonPath = path.join(matPath, "material.json");
    let meta;
    let metaExists = false;
    try {
      meta = JSON.parse(await fs.readFile(materialJsonPath, "utf-8"));
      metaExists = true;
    } catch {
      meta = {
        name: mat,
        type: "material",
        parameters: {}
      };
    }
    // Собираем текстурные карты и вспомогательные файлы
    for (const [key, patterns] of Object.entries(textureMap)) {
      if (!meta[key]) {
        // Поиск по суффиксам/расширениям
        const found = files.find(f =>
          patterns.some(p => p.startsWith(".")
            ? f.endsWith(p)
            : f.includes(p))
        );
        if (found) meta[key] = found;
      }
    }
    if (!meta.preview && previewFile) meta.preview = previewFile;

    // Сохраняем material.json если сгенерировали
    if (!metaExists) {
      await fs.writeFile(materialJsonPath, JSON.stringify(meta, null, 2), "utf-8");
      console.log(`Generated ${materialJsonPath}`);
    }

    // Абсолютные пути (от public)
    const urlPrefix = `/assets/materials/${category}/${mat}`;
    const id = makeId(category, mat);
    items.push({
      id,
      name: mat,
      type: "material",
      parentId: categoryId,
      url: `${urlPrefix}/material.json`,
      preview: meta.preview ? `${urlPrefix}/${meta.preview}` : undefined,
      system: true,
      meta
    });
  }
}

// Записываем итоговый индекс ассетов
await fs.writeFile(OUTPUT, JSON.stringify(items, null, 2), "utf-8");
console.log("System assets index written to", OUTPUT);
