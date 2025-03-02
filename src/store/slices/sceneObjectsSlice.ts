import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getSceneObjects, 
  dbAddSceneObject, 
  dbUpdateSceneObject, 
  dbRemoveSceneObject 
} from '../../utils/dbUtils';

// "Сырые" данные объекта из базы / Redux
export interface GameObject {
  id: string;
  sceneId: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number | null;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  enablePhysics?: boolean;
  isStatic?: boolean;
  layer?: number;
  image?: string;
}

interface SceneObjectsState {
  objects: GameObject[];
  currentObjectId: string | null; // <-- Храним только ID, а не весь объект
  loading: boolean;
  error?: string;
}

const initialState: SceneObjectsState = {
  objects: [],
  currentObjectId: null,
  loading: false,
  error: undefined,
};

// Thunks (не меняются):
export const loadSceneObjects = createAsyncThunk(
  'sceneObjects/load',
  async (activeScene: string, { rejectWithValue }) => {
    try {
      const objects = await getSceneObjects(activeScene);
      return objects;
    } catch (error) {
      return rejectWithValue('Ошибка загрузки объектов');
    }
  }
);

export const addSceneObject = createAsyncThunk(
  'sceneObjects/add',
  async (
    { activeScene, object }: { activeScene: string; object: GameObject },
    { rejectWithValue }
  ) => {
    try {
      const newObject = await dbAddSceneObject(activeScene, object);
      return newObject;
    } catch (error) {
      return rejectWithValue('Ошибка добавления объекта');
    }
  }
);

export const updateSceneObject = createAsyncThunk(
  'sceneObjects/update',
  async (
    { activeScene, object }: { activeScene: string; object: GameObject },
    { rejectWithValue }
  ) => {
    try {
      const updatedObject = await dbUpdateSceneObject(activeScene, object);
      return updatedObject;
    } catch (error) {
      return rejectWithValue('Ошибка обновления объекта');
    }
  }
);

export const removeSceneObject = createAsyncThunk(
  'sceneObjects/remove',
  async (
    { activeScene, objectId }: { activeScene: string; objectId: string },
    { rejectWithValue }
  ) => {
    try {
      await dbRemoveSceneObject(activeScene, objectId);
      return objectId;
    } catch (error) {
      return rejectWithValue('Ошибка удаления объекта');
    }
  }
);

const sceneObjectsSlice = createSlice({
  name: 'sceneObjects',
  initialState,
  reducers: {
    clearObjects(state) {
      state.objects = [];
    },
    // Вместо setCurrentObject -> setCurrentObjectId
    setCurrentObjectId(state, action: PayloadAction<string | null>) {
      state.currentObjectId = action.payload;
    },
    clearCurrentObject(state) {
      state.currentObjectId = null;
    },
    addLocalObject(state, action: PayloadAction<GameObject>) {
      state.objects.push(action.payload);
    },
    updateLocalObject(state, action: PayloadAction<GameObject>) {
      const index = state.objects.findIndex(obj => obj.id === action.payload.id);
      if (index !== -1) {
        state.objects[index] = action.payload;
      }
    },
    removeLocalObject(state, action: PayloadAction<string>) {
      state.objects = state.objects.filter(obj => obj.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSceneObjects.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(loadSceneObjects.fulfilled, (state, action: PayloadAction<GameObject[]>) => {
        state.loading = false;
        state.objects = action.payload;
      })
      .addCase(loadSceneObjects.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to load scene objects';
      })
      .addCase(addSceneObject.fulfilled, (state, action: PayloadAction<GameObject>) => {
        state.objects.push(action.payload);
      })
      .addCase(updateSceneObject.fulfilled, (state, action: PayloadAction<GameObject>) => {
        const index = state.objects.findIndex(obj => obj.id === action.payload.id);
        if (index !== -1) {
          state.objects[index] = action.payload;
        }
      })
      .addCase(removeSceneObject.fulfilled, (state, action: PayloadAction<string>) => {
        state.objects = state.objects.filter(obj => obj.id !== action.payload);
      });
  },
});

export const {
  clearObjects,
  setCurrentObjectId,     // экшен для выбора объекта
  clearCurrentObject,
  addLocalObject,
  updateLocalObject,
  removeLocalObject,
} = sceneObjectsSlice.actions;

export default sceneObjectsSlice.reducer;
