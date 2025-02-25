// store/projectSlice.ts

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  saveProjectData,
  loadProjectData,
  ProjectData,
  SceneData,
  OpenedScene
} from '../utils/storageUtils';

/** Определяем структуру объекта внутри сцены */
export interface SceneObject {
  id: string;
  name: string;
  // Любые дополнительные поля
}

/** Расширяем SceneData для хранения массива objects */
export interface ExtendedSceneData extends SceneData {
  objects: SceneObject[];
}

export interface ProjectState {
  scenes: ExtendedSceneData[];
  openedScenes: OpenedScene[];
  activeScene: string;  // хранит id текущей активной сцены
}

const initialState: ProjectState = {
  scenes: [],
  openedScenes: [],
  activeScene: ''
};

/**
 * Thunk для сохранения данных проекта в localStorage.
 * Если у нас есть название проекта (projectName), сохраняем всё, что есть в Redux-состоянии.
 */
export const saveProject = createAsyncThunk(
  'project/saveProject',
  async (projectName: string, { getState }) => {
    const state = getState() as { project: ProjectState };
    const projectData: ProjectData = {
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
 * В примере просто грузим, а затем диспатчим loadProjectState для заполнения Redux.
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
        ...scene,
        // Дополняем each scene объектами, если нужно
        // Если вам не нужны objects в Redux, уберите это
        objects: []
      }));
      state.openedScenes = action.payload.openedScenes;
      state.activeScene = action.payload.activeScene;
    },

    /** Добавляем новую сцену */
    addScene: {
      prepare: (sceneName: string) => {
        const newId = uuidv4();
        return {
          payload: {
            id: newId,
            sceneName,
            settings: {},
            objects: [] as SceneObject[]
          }
        };
      },
      reducer: (state, action: PayloadAction<ExtendedSceneData>) => {
        state.scenes.push(action.payload);
      }
    },

    /** Добавляем объект в указанную сцену */
    addSceneObject(state, action: PayloadAction<{ sceneId: string; objectName: string }>) {
      const { sceneId, objectName } = action.payload;
      const scene = state.scenes.find(scene => scene.id === sceneId);
      if (scene) {
        scene.objects.push({
          id: uuidv4(),
          name: objectName
        });
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

    /** Удаляем объект из сцены */
    removeSceneObject(state, action: PayloadAction<{ sceneId: string; objectId: string }>) {
      const { sceneId, objectId } = action.payload;
      const scene = state.scenes.find(scene => scene.id === sceneId);
      if (scene) {
        scene.objects = scene.objects.filter(obj => obj.id !== objectId);
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
    // Можно обрабатывать fulfilled/rejected для saveProject, loadProject и т.п.
  }
});

export const {
  loadProjectState,
  addScene,
  addSceneObject,
  removeScene,
  removeSceneObject,
  setActiveScene,
  setOpenedScenes
} = projectSlice.actions;
export default projectSlice.reducer;
