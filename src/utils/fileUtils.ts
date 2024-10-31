// // utils/fileUtils.ts

// // Инициализация данных проекта в Local Storage, если их еще нет
// export const initializeProjectData = () => {
//     if (!localStorage.getItem('projectData')) {
//       const initialProjectData = {
//         projectName: 'My Project',
//         version: '1.0',
//         scenes: [],
//       };
//       localStorage.setItem('projectData', JSON.stringify(initialProjectData));
//     }
//   };
  
//   // Сохранение данных сцены в Local Storage
//   export const saveSceneToLocalStorage = (sceneName: string, data: object) => {
//     localStorage.setItem(`${sceneName}.json`, JSON.stringify(data));
//   };
  
//   // Загрузка данных проекта из Local Storage
//   export const loadProjectData = () => {
//     const data = localStorage.getItem('projectData');
//     return data ? JSON.parse(data) : null;
//   };
  
//   // Сохранение данных проекта в Local Storage
//   export const saveProjectData = (data: object) => {
//     localStorage.setItem('projectData', JSON.stringify(data));
//   };
  
//   // Удаление данных сцены из Local Storage
//   export const deleteSceneFromLocalStorage = (sceneName: string) => {
//     localStorage.removeItem(`${sceneName}.json`);
//   };
  
//   // Загрузка данных сцены из Local Storage
//   export const loadSceneData = (sceneName: string) => {
//     const data = localStorage.getItem(`${sceneName}.json`);
//     return data ? JSON.parse(data) : null;
//   };
  