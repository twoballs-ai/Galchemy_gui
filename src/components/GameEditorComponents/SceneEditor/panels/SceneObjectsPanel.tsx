import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { 
  addSceneObject, 
  loadSceneObjects, 
  removeSceneObject, 
  setCurrentObjectId  // <-- меняем импорт
} from '../../../../store/slices/sceneObjectsSlice';
import AddObjectModal from '../../Modal/AddObjectModal';
import './SceneObjectsPanel.scss';
import { GameAlchemy } from 'game-alchemy-core';
const SceneObjectsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch();

  const objects = useSelector((state: RootState) => state.sceneObjects.objects);
  const activeScene = useSelector((state: RootState) => state.project.activeScene);
  
  // У нас теперь currentObjectId вместо currentObject
  const currentObjectId = useSelector((state: RootState) => state.sceneObjects.currentObjectId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // При изменении activeScene подгружаем объекты
  useEffect(() => {
    if (activeScene) {
      dispatch(loadSceneObjects(activeScene));
    }
  }, [activeScene, dispatch]);
  useEffect(() => {
    const onObjectSelected = (payload: { id: string } | null) => {
      if (payload?.id) {
        dispatch(setCurrentObjectId(payload.id));
      } else {
        dispatch(setCurrentObjectId(null));
      }
    };
  
    GameAlchemy.core.emitter.on("objectSelected", onObjectSelected);
    return () => {
      GameAlchemy.core.emitter.off("objectSelected", onObjectSelected);
    };
  }, [dispatch]);
  // Выбор объекта: диспатчим только его id
  const handleSelectObject = (object: any) => {
    dispatch(setCurrentObjectId(object.id));
  };

  const handleRemoveObject = (objectId: string) => {
    if (!activeScene) return;
    dispatch(removeSceneObject({ activeScene, objectId }));
  };

  // Добавление нового объекта
  const handleAddObject = (newObject: any) => {
    if (!activeScene) return;
    dispatch(addSceneObject({ activeScene, object: newObject }));
  };

  return (
    <div className="scene-objects-panel">
      <div className="panel-header">
        <h3>Объекты на сцене</h3>
        <button onClick={onClose}>Закрыть</button>
      </div>
      <div className="panel-content">
  {currentObjectId && (
    <div className="current-selection">
      <strong>Выбран объект:</strong>{" "}
      {objects.find(o => o.id === currentObjectId)?.name || "Без имени"}
    </div>
  )}
  <ul>
    {objects.map((object) => (
      <li
        key={object.id}
        className={currentObjectId === object.id ? 'selected' : ''}
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
