// store/projectSlice.ts

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  saveProjectData,
  loadProjectData,
  ProjectData,
  SceneData,
  OpenedScene
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

export interface ProjectState {
  scenes: SceneData[];
  openedScenes: OpenedScene[];
  activeScene: string;  // хранит id текущей активной сцены
}

// Начальное состояние
const initialState: ProjectState = {
  scenes: [],
  openedScenes: [],
  activeScene: ''
};

/**
 * Thunk для сохранения данных проекта в localStorage.
 * Здесь сохраняем только scenes (без объектов),
 * openedScenes и activeScene.
 */
export const saveProject = createAsyncThunk(
  'project/saveProject',
  async (projectName: string, { getState }) => {
    const state = getState() as { project: ProjectState };
    const projectData: ProjectData = {
      // Берём только нужные поля
      scenes: state.project.scenes.map(scene => ({
        id: scene.id,
        sceneName: scene.sceneName,
        settings: scene.settings
      })),
      openedScenes: state.project.openedScenes,
      activeScene: state.project.activeScene
    };
    saveProjectData(projectName, projectData);
  }
);

/**
 * Thunk для загрузки данных проекта из localStorage.
 */
export const loadProject = createAsyncThunk(
  'project/loadProject',
  async (projectName: string, { dispatch }) => {
    const data = loadProjectData(projectName);
    if (data) {
      dispatch(loadProjectState(data));
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

    /** Добавляем новую сцену (объекты не используем) */
    addScene(state, action: PayloadAction<SceneData>) {
      console.log("add_scenes")
      state.scenes.push(action.payload);
    },
    updateOpenedScene(
      state,
      action: PayloadAction<{ key: string; newState: string }>
    ) {
      const openedScene = state.openedScenes.find(s => s.key === action.payload.key);
      if (openedScene) {
        openedScene.state = action.payload.newState;
      }
    },
    /** Удаляем сцену по её id */
    removeScene(state, action: PayloadAction<string>) {
      state.scenes = state.scenes.filter(scene => scene.id !== action.payload);
      // Если удаляем активную сцену, сбросим activeScene
      if (state.activeScene === action.payload) {
        state.activeScene = state.scenes.length > 0 ? state.scenes[0].id : '';
      }
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
    // Обработка fulfilled/rejected для saveProject, loadProject (при желании)
  }
});

export const {
  loadProjectState,
  addScene,
  removeScene,
  setActiveScene,
  setOpenedScenes,
  updateOpenedScene
} = projectSlice.actions;
export default projectSlice.reducer;
