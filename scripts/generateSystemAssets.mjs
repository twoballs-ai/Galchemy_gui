import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "../public/assets/materials");
const OUTPUT = path.resolve(__dirname, "../src/components/GameEditorComponents/AssetBrowser/systemAssets.json");

// Utility: генерация id
function makeId(...parts) {
  return "mat-" + parts.join("-").replace(/[^\w\-]/g, "");
}

// Map расширений к полям meta
const textureMap = {
  colorMap:   ["_Color", "_BaseColor"],
  normalMap:  ["_NormalGL", "_Normal", "_NormalDX"],
  roughnessMap: ["_Roughness"],
  displacementMap: ["_Displacement", "_Height"],
  mtlx:      [".mtlx"],
  usdc:      [".usdc"]
};

const categories = await fs.readdir(ROOT, { withFileTypes: true });
let items = [];

// Добавляем виртуальный корень
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

    // Файлы материала
    const files = await fs.readdir(matPath);
    const previewFile = files.find(f => f.includes("_Color")) ||
                        files.find(f => f.includes("_BaseColor")) ||
                        files.find(f => /\.(jpg|png)$/i.test(f));

    // Собираем meta, как бы мы сгенерировали material.json, но не пишем на диск!
    let meta = {
      name: mat,
      type: "material",
      parameters: {}
    };
    // Собираем текстурные карты
    for (const [key, patterns] of Object.entries(textureMap)) {
      if (!meta[key]) {
        const found = files.find(f =>
          patterns.some(p => p.startsWith(".")
            ? f.endsWith(p)
            : f.includes(p))
        );
        if (found) meta[key] = found;
      }
    }
    if (!meta.preview && previewFile) meta.preview = previewFile;

    // Добавляем в итоговый список
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

// Записываем общий индекс ассетов
await fs.writeFile(OUTPUT, JSON.stringify(items, null, 2), "utf-8");
console.log("System assets index written to", OUTPUT);
