// components/panels/SceneObjectsPanel.tsx

import React, { useState } from 'react';
import AddObjectModal from './AddObjectModal';
import './SceneObjectsPanel.scss'; // Импортируем SCSS

interface SceneObjectsPanelProps {
  objects: any[];
  onAddObject: (object: any) => void;
  onRemoveObject: (objectId: string) => void;
  onSelectObject: (object: any) => void; // Добавлено
  onClose: () => void;
}

const SceneObjectsPanel: React.FC<SceneObjectsPanelProps> = ({
  objects,
  onAddObject,
  onRemoveObject,
  onSelectObject,
  onClose,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddObject = (newObject: any) => {
    onAddObject(newObject);
    setIsModalOpen(false);
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
            <li key={object.id} onClick={() => onSelectObject(object)}>
              {object.name}
              <button onClick={() => onRemoveObject(object.id)}>Удалить</button>
            </li>
          ))}
        </ul>
        {/* Кнопка "Добавить объект" перемещена вниз */}
        <button className="add-object" onClick={() => setIsModalOpen(true)}>Добавить объект</button>
      </div>
      <AddObjectModal open={isModalOpen} onAdd={handleAddObject} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default SceneObjectsPanel;
