// components/panels/AddObjectModal.tsx

import React, { useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { v4 as uuidv4 } from 'uuid';
import 'react-responsive-modal/styles.css';
interface AddObjectModalProps {
  open: boolean;
  onAdd: (object: any) => void;
  onClose: () => void;
}

const availableObjects = [
  { name: 'Куб', type: 'cube' },
  { name: 'Сфера', type: 'sphere' },
  { name: 'Путь', type: 'path' },
  // Добавьте другие доступные объекты
];

const AddObjectModal: React.FC<AddObjectModalProps> = ({ open, onAdd, onClose }) => {
  const [selectedObjectType, setSelectedObjectType] = useState(availableObjects[0].type);

  const handleAdd = () => {
    const selectedObject = availableObjects.find((obj) => obj.type === selectedObjectType);
    if (selectedObject) {
      const newObject = {
        id: uuidv4(),
        ...selectedObject,
        // Дополнительные свойства объекта
      };
      onAdd(newObject);
    }
  };

  return (
    <Modal open={open} onClose={onClose} center>
      <h3>Добавить новый объект</h3>
      <select value={selectedObjectType} onChange={(e) => setSelectedObjectType(e.target.value)}>
        {availableObjects.map((obj) => (
          <option key={obj.type} value={obj.type}>
            {obj.name}
          </option>
        ))}
      </select>
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleAdd}>Добавить</button>
        <button onClick={onClose} style={{ marginLeft: '10px' }}>
          Отмена
        </button>
      </div>
    </Modal>
  );
};

export default AddObjectModal;
