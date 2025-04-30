import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { 
  addSceneObject, 
  loadSceneObjects, 
  removeSceneObject, 
  setCurrentObjectId  
} from '../../../../store/slices/sceneObjectsSlice';
import AddObjectModal from '../../Modal/AddObjectModal';
import './SceneObjectsPanel.scss';
import { GameAlchemy } from 'game-alchemy-core';    

const SceneObjectsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch();
  const objects = useSelector((state: RootState) => state.sceneObjects.objects);
  const activeScene = useSelector((state: RootState) => state.project.activeScene);
  const currentObjectId = useSelector((state: RootState) => state.sceneObjects.currentObjectId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (activeScene) {
      dispatch(loadSceneObjects(activeScene)); // Загружаем объекты при смене сцены
    }
  }, [activeScene, dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (GameAlchemy.core?.emitter) {
        const onObjectSelected = (payload: { id: string } | null) => {
          if (payload?.id) {
            dispatch(setCurrentObjectId(payload.id));
          } else {
            dispatch(setCurrentObjectId(null));
          }
        };
  
        GameAlchemy.core.emitter.on("objectSelected", onObjectSelected);
  
        clearInterval(interval); // всё ок — очистить интервал
        return () => {
          GameAlchemy.core?.emitter?.off("objectSelected", onObjectSelected);
        };
      }
    }, 100); // проверяем каждые 100 мс
  
    return () => clearInterval(interval);
  }, [dispatch]);

const handleSelectObject = (object: any) => {
  GameAlchemy.core.scene.setSelectedById(object.id); // Только через ядро
};
  const handleRemoveObject = (objectId: string) => {
    if (!activeScene) return;
    dispatch(removeSceneObject({ activeScene, objectId }));
  };

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
