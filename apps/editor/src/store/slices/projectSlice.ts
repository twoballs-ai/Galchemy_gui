import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  saveProjectData,
  loadProjectData,
  ProjectData,
  OpenedScene,
  setCurrentProjectToLS,
  ProjectSummary
} from '../../utils/storageUtils';
import {
  getOrCreateProjectScriptAsset,
  getOrCreateSceneScriptAsset,
  deleteSceneScriptAsset
} from '../../utils/assetStorage';
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

export type GraphicsPreset = 'low' | 'medium' | 'high' | 'ultra';
export type DevicePreset = 'desktop' | 'tablet' | 'phone';
export type RendererType = 'webgl' | 'webgpu';

export interface SceneSettings {
  backgroundColor?: string;
  graphicsPreset?: GraphicsPreset;
  devicePreset?: DevicePreset;
  orientation?: 'landscape' | 'portrait';
  rendererType?: RendererType;
}

export const defaultSceneSettings: SceneSettings = {
  backgroundColor: '#1e293b',
  graphicsPreset: 'high',
  devicePreset: 'desktop',
  orientation: 'landscape',
  rendererType: 'webgl',
};

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
        settings: {
          ...defaultSceneSettings,
          ...scene.settings,
        },
        visible: true
      })),
      openedScenes: state.project.openedScenes,
      activeScene: state.project.activeScene,
      visible: true
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
    dispatch(setCurrentProjectId(projectId));
    const data = loadProjectData(projectId);
    if (data) {
      dispatch(loadProjectState(data));
      return;
    }

    // Если проект открывается впервые, инициализируем пустое состояние проекта
    dispatch(loadProjectState({
      scenes: [],
      openedScenes: [],
      activeScene: "",
      visible: true,
    }));
  }
);
export const addSceneWithScript = createAsyncThunk(
  'project/addSceneWithScript',
  async (scene: SceneData, { dispatch, getState }) => {
    // 1. добавляем сцену в Redux-стор
    dispatch(addScene(scene));

    // 2. создаём script-ассет для новой сцены
    const { currentProjectId, openedScenes } =
      (getState() as { project: ProjectState }).project;
    if (currentProjectId) {
      await getOrCreateSceneScriptAsset(scene.sceneName, currentProjectId);
    }

    // 3. кладём на сцену дефолтные объекты
    await dispatch(initializeDefaultSceneObjects(scene.id));

    // 4. открываем вкладку и делаем сцену активной (по желанию)
    dispatch(setOpenedScenes([
      ...openedScenes.filter(s => s.id !== scene.id),
      { id: scene.id, sceneName: scene.sceneName, key: scene.id, visible: true },
    ]));
    dispatch(setActiveScene(scene.id));

    // 5. сохраняем проект
    await dispatch(saveProject());
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
      settings: { ...defaultSceneSettings } as Record<string, unknown>,
    };
    dispatch(addScene(startScene));

    // Создадим script-ассет для сцены
    await getOrCreateSceneScriptAsset(startScene.sceneName, project.id);

    // Откроем сцену во вкладках и сделаем активной
    dispatch(setOpenedScenes([{
      id: startScene.id,
      sceneName: startScene.sceneName,
      key: startScene.id,
      visible: true,
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
      await deleteSceneScriptAsset(scene.sceneName, state.project.currentProjectId ?? "");
      // 3. Сохраняем проект
      dispatch(saveProject());
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
        settings: {
          ...defaultSceneSettings,
          ...(scene.settings as Record<string, unknown>),
        },
        visible: (scene as any).visible ?? true
      }));

      const validOpened = (action.payload.openedScenes || [])
        .filter(opened => state.scenes.some(scene => scene.id === opened.id))
        .map(opened => ({ ...opened, key: opened.id }));

      state.openedScenes = validOpened.length
        ? validOpened
        : state.scenes.slice(0, 1).map(scene => ({
            id: scene.id,
            sceneName: scene.sceneName,
            key: scene.id,
            visible: true,
          }));

      state.activeScene =
        state.openedScenes.find(scene => scene.id === action.payload.activeScene)?.id ||
        state.openedScenes[0]?.id ||
        '';
    },

    /** Новый экшен для установки currentProjectId */
    setCurrentProjectId(state, action: PayloadAction<string | null>) {
      state.currentProjectId = action.payload;
      setCurrentProjectToLS(action.payload ?? "");
    },
    /** Добавляем новую сцену (объекты не используем) */
    addScene(state, action: PayloadAction<SceneData>) {
      state.scenes.push({
        ...action.payload,
        settings: {
          ...defaultSceneSettings,
          ...(action.payload.settings ?? {}),
        },
      });

    },

    updateSceneSettings(
      state,
      action: PayloadAction<{ sceneId: string; settings: Record<string, unknown> }>
    ) {
      const targetScene = state.scenes.find((scene) => scene.id === action.payload.sceneId);
      if (!targetScene) return;
      targetScene.settings = {
        ...defaultSceneSettings,
        ...(targetScene.settings ?? {}),
        ...action.payload.settings,
      };
    },

    removeScene(state, action: PayloadAction<string>) {
      state.scenes = state.scenes.filter(scene => scene.id !== action.payload);
    },
    toggleSceneVisibility(state, action: PayloadAction<string>) {
      const scene = state.openedScenes.find(scene => scene.id === action.payload);
      if (scene) {
        scene.visible = !scene.visible; // Переключаем видимость сцены
      }
    },
    setActiveScene(state, action: PayloadAction<string>) {
      state.activeScene = action.payload;
    },
    setOpenedScenes(state, action: PayloadAction<OpenedScene[]>) {
      state.openedScenes = action.payload;
    },
  },
});

export const {
  loadProjectState,
  setCurrentProjectId,
  addScene,
  updateSceneSettings,
  removeScene,
  setActiveScene,
  setOpenedScenes,
  toggleSceneVisibility,
} = projectSlice.actions;
export default projectSlice.reducer;
