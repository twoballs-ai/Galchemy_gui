import { configureStore } from '@reduxjs/toolkit';
import projectReducer from './editorSlice';

export const store = configureStore({
  reducer: {
    editor: projectReducer,
    // Добавляйте сюда другие редюсеры по мере необходимости
  },
});

// Типы для использования в приложении
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
