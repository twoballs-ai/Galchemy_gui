// utils/initScene.ts  (или где у вас лежит helper)
import { createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { addSceneObject } from '../store/slices/sceneObjectsSlice';

/** Создаём «стартовые» объекты на новой сцене */
export const initializeDefaultSceneObjects = createAsyncThunk(
  'sceneObjects/initDefault',
  async (sceneId: string, { dispatch }) => {
    const character = {
      id: uuidv4(),
      sceneId,
      type: 'character',
      name: 'Player',
      title: 'Персонаж',
      x: 0, y: 0, z: 0,
    };

    const light = {
      id: uuidv4(),
      sceneId,
      type: 'light',
      subtype: 'directional',
      name: 'Directional Light',
      title: 'Свет',
      x: 0, y: 10, z: 0,
    };

    // записываем оба объекта в IndexedDB + Redux-стор
    await dispatch(addSceneObject({ activeScene: sceneId, object: character }));
    await dispatch(addSceneObject({ activeScene: sceneId, object: light }));
  }
);
