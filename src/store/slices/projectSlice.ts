import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  saveProjectData,
  loadProjectData,
  ProjectData,
  OpenedScene,
  setCurrentProjectToLS
} from '../../utils/storageUtils';
import { getOrCreateProjectScriptAsset, getOrCreateSceneScriptAsset } from '../../utils/assetStorage';
import { initializeDefaultSceneObjects } from '../../utils/initScene';
/**
 * Если объекты не нужны в проектном срезе,
 * то SceneData будет выглядеть без поля objects.
 */
export interface SceneData {
  id: string;
  sceneName: string;
  settings?: Record<string, unknown>;
}

/**
 * Добавляем новое поле currentProjectId для хранения id текущего проекта.
 */
export interface ProjectState {
  currentProjectId: string | null;
  scenes: SceneData[];
  openedScenes: OpenedScene[];
  activeScene: string;  // хранит id текущей активной сцены
}

// Начальное состояние
const initialState: ProjectState = {
  currentProjectId: null,
  scenes: [],
  openedScenes: [],
  activeScene: ''
};
// helper-функция для обновления списка сцен в файле
const updateProjectScriptContent = (content: string, scenes: SceneData[]): string => {
  const scenesList = scenes.map(scene => `"${scene.sceneName}"`).join(", ");
  return content.replace(
    /export const scenes = \[.*?\];/,
    `export const scenes = [${scenesList}];`
  );
};
/**
 * Thunk для сохранения данных проекта в localStorage.
 * Здесь сохраняем только scenes (без объектов), openedScenes и activeScene.
 */
export const saveProject = createAsyncThunk(
  'project/saveProject',
  async (_, { getState }) => {
    const state = getState() as { project: ProjectState };
    const projectId = state.project.currentProjectId;

    if (!projectId) {
      console.warn('saveProject: Нет текущего проекта');
      return;
    }

    const projectData: ProjectData = {
      scenes: state.project.scenes.map(scene => ({
        id: scene.id,
        sceneName: scene.sceneName,
        settings: scene.settings
      })),
      openedScenes: state.project.openedScenes,
      activeScene: state.project.activeScene
    };

    saveProjectData(projectId, projectData);
  }
);


/**
 * Thunk для загрузки данных проекта из localStorage.
 */
export const loadProject = createAsyncThunk(
  'project/loadProject',
  async (projectId: string, { dispatch }) => {
    const data = loadProjectData(projectId);
    if (data) {
      dispatch(loadProjectState(data));
      dispatch(setCurrentProjectId(projectId));  // Запоминаем текущий проект
    }
  }
);
export const addSceneWithScript = createAsyncThunk(
  'project/addSceneWithScript',
  async (scene: SceneData, { dispatch, getState }) => {
    dispatch(addScene(scene));
    // 2. Создаём script-ассет для сцены
    const state = getState() as { project: ProjectState };
    const projectId = state.project.currentProjectId;
    await getOrCreateSceneScriptAsset(scene.sceneName, projectId); // ← вот так!
    // ...
    dispatch(saveProject(state.project.currentProjectId));
  }
);
export const initializeProject = createAsyncThunk(
  "project/initializeProject",
  async (project: ProjectSummary, { dispatch }) => {
    // Установим текущий проект
    dispatch(setCurrentProjectId(project.id));

    // Создадим главный скрипт проекта
    await getOrCreateProjectScriptAsset(project.id);

    // Создадим первую сцену
    const startScene = {
      id: `scene_${uuidv4()}`,
      sceneName: "Scene 1",
      settings: {},
    };
    dispatch(addScene(startScene));

    // Создадим script-ассет для сцены
    await getOrCreateSceneScriptAsset(startScene.sceneName, project.id);

    // Откроем сцену во вкладках и сделаем активной
    dispatch(setOpenedScenes([{
      id: startScene.id,
      sceneName: startScene.sceneName,
      key: startScene.id,
    }]));
    dispatch(setActiveScene(startScene.id));

    // Добавим дефолтные объекты
    await dispatch(initializeDefaultSceneObjects(startScene.id));

    // Сохраним проект
    await dispatch(saveProject());
  }
);
// Удалить сцену с удалением script-ассета
export const removeSceneWithScript = createAsyncThunk(
  'project/removeSceneWithScript',
  async (sceneId: string, { dispatch, getState }) => {
    // Найти сцену по id
    const state = getState() as { project: ProjectState };
    const scene = state.project.scenes.find(s => s.id === sceneId);
    if (scene) {
      // 1. Удаляем сцену из Redux
      dispatch(removeScene(sceneId));
      // 2. Удаляем script-ассет сцены
      await deleteSceneScriptAsset(scene.sceneName);
      // 3. Сохраняем проект
      dispatch(saveProject(state.project.currentProjectId));
    }
  }
);
const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    /** Заполняем state на основе загруженных данных ProjectData */
    loadProjectState(state, action: PayloadAction<ProjectData>) {
      state.scenes = action.payload.scenes.map(scene => ({
        id: scene.id,
        sceneName: scene.sceneName,
        settings: scene.settings
      }));
      state.openedScenes = action.payload.openedScenes;
      state.activeScene = action.payload.activeScene;
    },
    /** Новый экшен для установки currentProjectId */
    setCurrentProjectId(state, action: PayloadAction<string | null>) {
      state.currentProjectId = action.payload;
      setCurrentProjectToLS(action.payload ?? "");
    },
    /** Добавляем новую сцену (объекты не используем) */
    addScene(state, action: PayloadAction<SceneData>) {
      state.scenes.push(action.payload);

    },

    removeScene(state, action: PayloadAction<string>) {
      state.scenes = state.scenes.filter(scene => scene.id !== action.payload);
    },


    /** Устанавливаем активную сцену */
    setActiveScene(state, action: PayloadAction<string>) {
      state.activeScene = action.payload;
    },
    /** Обновляем массив открытых вкладок */
    setOpenedScenes(state, action: PayloadAction<OpenedScene[]>) {
      state.openedScenes = action.payload;
    }
  },
  extraReducers: builder => {
    // Опционально: обработка fulfilled/rejected для saveProject, loadProject
  }
});

export const {
  loadProjectState,
  setCurrentProjectId,
  addScene,
  removeScene,
  setActiveScene,
  setOpenedScenes,
} = projectSlice.actions;
export default projectSlice.reducer;
