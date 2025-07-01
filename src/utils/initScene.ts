import { addSceneObject } from "../store/slices/sceneObjectsSlice";

export const initializeDefaultSceneObjects = (dispatch, sceneId) => {
  // Пример: персонаж и свет
  const character = {
    id: uuidv4(),
    sceneId,
    type: "character",
    name: "Player",
    title: "Персонаж",
    x: 0, y: 0, z: 0
    // ...ещё поля по умолчанию
  };
  const light = {
    id: uuidv4(),
    sceneId,
    type: "light",
    name: "Directional Light",
    title: "Свет",
    subtype: "directional",
    x: 0, y: 10, z: 0
  };
  dispatch(addSceneObject({ activeScene: sceneId, object: character }));
  dispatch(addSceneObject({ activeScene: sceneId, object: light }));
};
