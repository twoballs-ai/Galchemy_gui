// store/projectSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { saveProjectData, ProjectData, SceneData, OpenedScene } from '../utils/storageUtils';

// Определяем состояние проекта, включая активную сцену
export interface ProjectState {
  scenes: SceneData[];
  openedScenes: OpenedScene[];
  activeScene: string;
}

const initialState: ProjectState = {
  scenes: [],
  openedScenes: [],
  activeScene: '', // активная сцена по умолчанию пустая
};

// Thunk для сохранения данных проекта в localStorage
// export const saveProject = createAsyncThunk(
//   'project/saveProject',
//   async (projectName: string, { getState }) => {

//     const state = getState() as { project: ProjectState };
//     // Формируем объект ProjectData для сохранения
//     const projectData: ProjectData = {
//       scenes: state.project.scenes,
//       openedScenes: state.project.openedScenes,
//       activeScene: state.project.activeScene,
//     };

//     saveProjectData(projectName, projectData);
//   }
// );

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    // Устанавливаем список сцен
    setScenes(state, action: PayloadAction<SceneData[]>) {
      state.scenes = action.payload;
    },
    // Добавляем новую сцену
    addScene(state, action: PayloadAction<SceneData>) {
      state.scenes.push(action.payload);
    },
    // Обновляем список открытых вкладок
    setOpenedScenes(state, action: PayloadAction<OpenedScene[]>) {
      state.openedScenes = action.payload;
    },
    // Устанавливаем активную сцену
    setActiveScene(state, action: PayloadAction<string>) {
      state.activeScene = action.payload;
    },
    // Можно добавить и другие редюсеры по необходимости
  },
});

export const { setScenes, addScene, setOpenedScenes, setActiveScene } = projectSlice.actions;
export default projectSlice.reducer;
