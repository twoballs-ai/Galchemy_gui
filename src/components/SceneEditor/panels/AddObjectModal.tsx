// src/components/AddObjectModal.tsx
import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CircleIcon from '../../../icons/circle.png';
import RectangleIcon from '../../../icons/rectangle.png';
import SquareIcon from '../../../icons/square.png';
import CustomModal from '../../Modal/CustomModal';
import './AddObjectModal.scss';

interface AddObjectModalProps {
  open: boolean;
  onAdd: (object: any) => void;
  onClose: () => void;
}

// Your existing object definitions remain the same
const availableObjects = [

  {
    category: 'Спрайты',
    objects: [
      {
        name: 'Спрайт',
        type: 'sprite',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          image: '',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          preserveAspectRatio: true,
          enablePhysics: true,
          isStatic: false,
          layer: 2,
        },
      },
      {
        name: 'Sprite Grid',
        type: 'spriteGrid',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          image: '',
          x: 0,
          y: 800,
          width: 160,
          height: 150,
          repeatX: 12,
          spacingX: 0,
          enablePhysics: true,
          isStatic: true,
          layer: 1,
        },
      },
    ],
  },
];

const AddObjectModal: React.FC<AddObjectModalProps> = ({ open, onAdd, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<string | null>(null);

  // Open file dialog
  const openFileDialog = (type: string) => {
    setSelectedObjectType(type);
    fileInputRef.current?.click();
  };

  // Handle image upload
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedObjectType) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      handleAddObject(selectedObjectType, imageUrl);
    };
    reader.readAsDataURL(file);
  };

  // Add object with image
  const handleAddObject = (type: string, imageUrl: string = '') => {
    const selectedObject = availableObjects
      .flatMap((category) => category.objects)
      .find((obj) => obj.type === type);
  
    if (selectedObject) {
      const newObject = {
        ...selectedObject.params,
        id: uuidv4(), // Ensure unique ID
        type: selectedObject.type,
        name: selectedObject.name,  // Обратите внимание, что это значение установлено
        image: imageUrl,
      };
  
      onAdd(newObject);
      onClose();
    }
  };

  // Handle object selection
  const handleSelectObject = (type: string) => {
    if (type === 'sprite' || type === 'spriteGrid') {
      openFileDialog(type);
    } else {
      handleAddObject(type); // Добавление объекта с его названием
    }
  };

  return (
    <CustomModal open={open} onClose={onClose} title="Добавить новый объект">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />
      <div className="add-object-modal">
        {availableObjects.map((category) => (
          <div key={category.category} className="category">
            <h4>{category.category}</h4>
            <div className="object-list">
              {category.objects.map((obj) => (
                <div
                  key={obj.type}
                  className="object-item"
                  onClick={() => handleSelectObject(obj.type)}
                >
                  <img src={obj.icon} alt={obj.name} className="object-icon" />
                  <span className="object-name">{obj.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CustomModal>
  );
};

export default AddObjectModal;
