import React, { useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { v4 as uuidv4 } from 'uuid';
import 'react-responsive-modal/styles.css';
import './AddObjectModal.scss'; // Подключите стили

interface AddObjectModalProps {
  open: boolean;
  onAdd: (object: any) => void;
  onClose: () => void;
}

// Определение встроенных SVG-компонентов
const SquareIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#000" />
  </svg>
);

const CircleIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#000" />
  </svg>
);

const TriangleIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64">
    <polygon points="32,0 64,64 0,64" fill="#000" />
  </svg>
);

const availableObjects = [
  {
    category: 'Примитивы',
    objects: [
      { name: 'Квадрат', type: 'rectangle', icon: SquareIcon },
      { name: 'Круг', type: 'circle', icon: CircleIcon },
      { name: 'Треугольник', type: 'triangle', icon: TriangleIcon },
    ],
  },
  {
    category: 'Спрайты',
    objects: [
      // Определите объекты спрайтов с иконками
    ],
  },
];

const AddObjectModal: React.FC<AddObjectModalProps> = ({ open, onAdd, onClose }) => {
  const [selectedObjectType, setSelectedObjectType] = useState<string | null>(null);

  const handleAdd = () => {
    const selectedObject = availableObjects
      .flatMap((category) => category.objects)
      .find((obj) => obj.type === selectedObjectType);
    if (selectedObject) {
      const newObject = {
        id: uuidv4(),
        type: selectedObject.type,
        name: selectedObject.name,
        x: 50,
        y: 50,
        width: 100,
        height: 50,
        color: 'blue',
      };
      onAdd(newObject);
      setSelectedObjectType(null);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} center>
      <h3>Добавить новый объект</h3>
      <div className="add-object-modal">
        {availableObjects.map((category) => (
          <div key={category.category} className="category">
            <h4>{category.category}</h4>
            <div className="object-list">
              {category.objects.map((obj) => (
                <div
                  key={obj.type}
                  className={`object-item ${selectedObjectType === obj.type ? 'selected' : ''}`}
                  onClick={() => setSelectedObjectType(obj.type)}
                >
                  <obj.icon className="object-icon" />
                  <span className="object-name">{obj.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleAdd} disabled={!selectedObjectType}>
          Добавить
        </button>
        <button onClick={onClose} style={{ marginLeft: '10px' }}>
          Отмена
        </button>
      </div>
    </Modal>
  );
};

export default AddObjectModal;
