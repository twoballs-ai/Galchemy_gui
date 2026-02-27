import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../../store/store';
import {
  addSceneObject,
  loadSceneObjects,
  removeSceneObject,
  setCurrentObjectId
} from '../../../../store/slices/sceneObjectsSlice';
import AddObjectModal from '../../Modal/AddObjectModal';
import './SceneObjectsPanel.scss';
import { GameAlchemy } from "../../../../utils/gameAlchemy";

const SceneObjectsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const objects = useSelector((state: RootState) => state.sceneObjects.objects);
  const activeScene = useSelector((state: RootState) => state.project.activeScene);
  const currentObjectId = useSelector((state: RootState) => state.sceneObjects.currentObjectId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (activeScene) {
      dispatch(loadSceneObjects(activeScene)); // Загружаем объекты при смене сцены
    }
  }, [activeScene, dispatch]);


  const handleSelectObject = (object: any) => {
    // Обновляем текущий выбранный объект в Redux
    dispatch(setCurrentObjectId(object.id));

    // Уведомляем рендерер об изменении выбранного объекта
    GameAlchemy.core?.scene.setSelectedById(object.id);  // Это теперь корректно обновит selectedObject в core
  };
  const handleRemoveObject = (objectId: string) => {
    if (!activeScene) return;
    dispatch(removeSceneObject({ activeScene, objectId }));
  };

  const handleAddObject = (newObject: any) => {
    if (!activeScene) return;
    const preparedObject = {
      ...newObject,
      sceneId: activeScene,
      title: newObject.title || newObject.name || newObject.type,
      name: newObject.name || newObject.title || newObject.type,
      x: newObject.x ?? 0,
      y: newObject.y ?? 0,
      z: newObject.z ?? 0,
      position: [newObject.x ?? 0, newObject.y ?? 0, newObject.z ?? 0],
      rotX: newObject.rotX ?? 0,
      rotY: newObject.rotY ?? 0,
      rotZ: newObject.rotZ ?? 0,
      rotation: newObject.rotation ?? [0, 0, 0],
      scaleX: newObject.scaleX ?? 1,
      scaleY: newObject.scaleY ?? 1,
      scaleZ: newObject.scaleZ ?? 1,
      scale: newObject.scale ?? [1, 1, 1],
    };
    dispatch(addSceneObject({ activeScene, object: preparedObject }));
  };

  return (
    <div className="scene-objects-panel">
      <div className="panel-header">
        <h3>Объекты на сцене</h3>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}>
          ✕
        </button>
      </div>
      <div className="panel-content">
        <ul>
          {objects.map((object) => (
            <li
              key={object.id}
              className={currentObjectId === object.id ? 'selected' : ''} // Выделяем объект, если его ID совпадает с currentObjectId
              onClick={() => handleSelectObject(object)}
            >
              {object.name || 'Без имени'}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveObject(object.id);
                }}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
        <button className="add-object" onClick={() => setIsModalOpen(true)}>
          Добавить объект
        </button>
      </div>

      <AddObjectModal
        open={isModalOpen}
        onAdd={handleAddObject}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default SceneObjectsPanel;
