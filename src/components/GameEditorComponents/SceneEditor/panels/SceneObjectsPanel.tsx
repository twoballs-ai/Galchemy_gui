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


  const handleSelectObject = (object) => {
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
