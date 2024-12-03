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
    category: 'Примитивы',
    objects: [
      {
        name: 'Квадрат',
        type: 'square',
        icon: SquareIcon,
        params: {
          id: uuidv4(),
          x: 50,
          y: 50,
          size: 100,
          color: 'blue',
          borderColor: 'black',
          borderWidth: 1,
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
      {
        name: 'Прямоугольник',
        type: 'rectangle',
        icon: RectangleIcon,
        params: {
          id: uuidv4(),
          x: 50,
          y: 50,
          width: 120,
          height: 50,
          color: 'green',
          borderColor: 'black',
          borderWidth: 1,
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
      {
        name: 'Круг',
        type: 'circle',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          x: 50,
          y: 50,
          radius: 50,
          color: 'red',            // Цвет заливки
          borderColor: 'black',    // Цвет границы
          borderWidth: 1,          // Ширина границы
          enablePhysics: false,    // Поддержка физики (по умолчанию false)
          isStatic: false,         // Статичность объекта
          layer: 0,                // Слой
        },
      },
      {
        name: 'Дуга',
        type: 'arc',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          x: 50,
          y: 50,
          radius: 50,
          startAngle: 0,
          endAngle: Math.PI / 2,
          color: 'purple',
          borderColor: 'black',
          borderWidth: 1,
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
      {
        name: 'Эллипс',
        type: 'ellipse',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          x: 50,
          y: 50,
          rX: 60,
          rY: 40,
          rotation: 0,
          startAngle: 0,
          endAngle: 2 * Math.PI,
          color: 'orange',
          borderColor: 'black',
          borderWidth: 1,
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
      {
        name: 'Текст',
        type: 'text',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          x: 50,
          y: 50,
          text: 'Hello World',
          fontsize: 26,
          fontFamily: 'Arial',
          color: 'black',
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
      {
        name: 'Линия',
        type: 'line',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          x1: 10,
          y1: 10,
          x2: 100,
          y2: 100,
          color: 'black',
          widthline: 2,
          lineRounded: 'butt',
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
      {
        name: 'Многоугольник',
        type: 'polygon',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          vertices: [
            { x: 10, y: 20 },
            { x: 100, y: 50 },
            { x: 80, y: 150 },
            { x: 30, y: 120 },
          ],
          color: 'yellow',
          borderColor: 'black',
          borderWidth: 1,
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
      {
        name: 'Кривая Безье',
        type: 'bezierCurve',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          startX: 10,
          startY: 10,
          controlX1: 30,
          controlY1: 100,
          controlX2: 60,
          controlY2: 100,
          endX: 100,
          endY: 10,
          color: 'cyan',
          widthline: 2,
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
      {
        name: 'Звезда',
        type: 'star',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          x: 50,
          y: 50,
          radius: 50,
          points: 5,
          color: 'pink',
          borderColor: 'black',
          borderWidth: 1,
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
      {
        name: 'Точка',
        type: 'point',
        icon: CircleIcon,
        params: {
          id: uuidv4(),
          x: 50,
          y: 50,
          size: 5,
          color: 'black',
          enablePhysics: false,
          isStatic: false,
          layer: 0,
        },
      },
    ],
  },
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
        name: selectedObject.name,
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
      handleAddObject(type);
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
