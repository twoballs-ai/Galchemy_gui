import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { addSceneObject, loadSceneObjects, removeSceneObject, setCurrentObject } from '../../../../store/slices/sceneObjectsSlice';
import AddObjectModal from '../../Modal/AddObjectModal';
import './SceneObjectsPanel.scss';

const SceneObjectsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch();

  const objects = useSelector((state: RootState) => state.sceneObjects.objects);
  const activeScene = useSelector((state: RootState) => state.project.activeScene);
  const selectedObject = useSelector((state: RootState) => state.sceneObjects.currentObject);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // При изменении activeScene (например, при входе в проект) подгружаем объекты из базы
  useEffect(() => {
    if (activeScene) {
      dispatch(loadSceneObjects(activeScene));
    }
  }, [activeScene, dispatch]);

  const handleSelectObject = (object: any) => {
    dispatch(setCurrentObject(object));
  };

  const handleRemoveObject = (objectId: string) => {
    if (!activeScene) return;
    dispatch(removeSceneObject({ activeScene, objectId }));
  };

  // Добавление нового объекта в сцену
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
              className={selectedObject?.id === object.id ? 'selected' : ''}
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

      {/* Модальное окно добавления объекта */}
      <AddObjectModal open={isModalOpen} onAdd={handleAddObject} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default SceneObjectsPanel;
