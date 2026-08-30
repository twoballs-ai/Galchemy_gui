// src/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import projectReducer from './slices/projectSlice';
import sceneReducer from './slices/sceneObjectsSlice';
import bootReducer         from "./slices/bootSlice";
// import chaptersReducer from './slices/chaptersSlice';
// import modulesReducer from './slices/modulesSlice';
const rootReducer = combineReducers({
    project: projectReducer,
    sceneObjects: sceneReducer,
    boot:         bootReducer, 
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
