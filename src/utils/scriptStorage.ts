import {
  getOrCreateScriptFile,
  patchScript,
  AssetItem,
} from './assetStorage';

/** Создаём или берём project.js */
export const initProjectScript = async (
  projectName: string
): Promise<AssetItem> =>
  getOrCreateScriptFile(
    `${projectName}.js`,
    `// Инициализирующий скрипт проекта ${projectName}\nexport const scenes = [];\n`
  );

/** Создаём или берём scene.js */
export const initSceneScript = async (
  sceneName: string
): Promise<AssetItem> =>
  getOrCreateScriptFile(
    `${sceneName}.js`,
    `// Скрипт сцены ${sceneName}\nexport const initScene = () => {};\n`
  );

export { patchScript }; // реэкспорт
