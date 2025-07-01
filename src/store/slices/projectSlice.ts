import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  saveProjectData,
  loadProjectData,
  ProjectData,
  OpenedScene,
  setCurrentProjectToLS
} from '../../utils/storageUtils';
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
// Добавить новую сцену с созданием script-ассета
export const addSceneWithScript = createAsyncThunk(
  'project/addSceneWithScript',
  async (scene: SceneData, { dispatch, getState }) => {
    // 1. Добавляем сцену в Redux
    dispatch(addScene(scene));
    // 2. Создаём script-ассет для сцены
    await getOrCreateSceneScriptAsset(scene.sceneName);
    // 3. (опционально) Добавить дефолтные объекты на сцену
    // ... (см. блок ниже)
    // 4. Сохраняем проект
    const state = getState() as { project: ProjectState };
    dispatch(saveProject(state.project.currentProjectId));
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
    setCurrentProjectId(state, action: PayloadAction<string>) {
      state.currentProjectId = action.payload;
      setCurrentProjectToLS(action.payload);
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
