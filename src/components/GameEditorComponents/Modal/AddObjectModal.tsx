import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CircleIcon from '../../../icons/circle.png';
import TilesMap from '../../../icons/tilesmap.png';
import CharacterIcon from '../../../icons/character.png';
import EnemyIcon from '../../../icons/enemy.png';
import CustomModal from './CustomModal';
import ConfigureObjectModal from './ConfigureObjectModal';
import './AddObjectModal.scss';

interface AddObjectModalProps {
  open: boolean;
  onAdd: (object: any) => void;
  onClose: () => void;
}

const availableObjects = [
  {
    category: 'Спрайты',
    objects: [
      {
        // Изменили: поле name переименовано в title
        title: 'Спрайт',
        type: 'sprite',
        icon: CircleIcon,
        params: {
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          image: '', // Путь к изображению
          enablePhysics: true,
          rigidBody:false,
          isStatic: false,
          layer: 2,
        },
      },
      {
        title: 'Sprite Grid',
        type: 'spriteGrid',
        icon: TilesMap,
        params: {
          x: 0,
          y: 100,
          width: 160,
          height: 150,
          image: '', // Путь к изображению
          repeatX: 12,
          spacingX: 0,
          enablePhysics: true,
          isStatic: true,
          layer: 1,
        },
      },
    ],
  },
  {
    category: 'Персонажи',
    objects: [
      {
        title: 'Персонаж',
        type: 'character',
        icon: CharacterIcon,
        params: {
          x: 200,
          y: 200,
          width: 50,
          height: 100,
          image: '', // Путь к изображению
          animations: {
            idle: [],
            run: [],
            jump: [],
            attack: [],
          },
          health: 100,
          speed: 30,
          enablePhysics: true,
          layer: 3,
          preserveAspectRatio: false,
          isAnimated: false,
        },
      },
      {
        title: 'Враг',
        type: 'enemy',
        icon: EnemyIcon,
        params: {
          x: 300,
          y: 200,
          width: 50,
          height: 100,
          image: '', // Путь к изображению
          animations: {
            idle: [],
            run: [],
            jump: [],
            attack: [],
          },
          health: 50,
          speed: 20,
          enablePhysics: true,
          layer: 3,
          leftBoundary: 100,
          rightBoundary: 500,
          isAnimated: false,
        },
      },
    ],
  },
];

const AddObjectModal: React.FC<AddObjectModalProps> = ({ open, onAdd, onClose }) => {
  const [showSecondModal, setShowSecondModal] = useState(false);
  const [selectedAddObject, setSelectedAddObject] = useState<any>(null);

  const handleSelectObject = (type: string) => {
    const selected = availableObjects
      .flatMap((category) => category.objects)
      .find((obj) => obj.type === type);

    if (selected) {
      // При выборе объекта:
      // - Поле title получает исходное значение (selected.title)
      // - Поле name устанавливается пустым, чтобы пользователь сам записал нужное название
      const newObject = {
        ...selected.params,
        id: uuidv4(),
        type: selected.type,
        title: selected.title, // исходное название сохраняется как title
        name: '',            // поле name оставляем пустым для ввода пользователем
      };

      setSelectedAddObject(newObject);
      setShowSecondModal(true);
    }
  };

  const handleFinalizeObject = (updatedObject: any) => {
    onAdd(updatedObject);
    setShowSecondModal(false);
    onClose();
  };

  return (
    <>
      <CustomModal open={open} onClose={onClose} title="Добавить новый объект">
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
                    <img src={obj.icon} alt={obj.title} className="object-icon" />
                    <span className="object-name">{obj.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CustomModal>

      {selectedAddObject && (
        <ConfigureObjectModal
          open={showSecondModal}
          onClose={() => setShowSecondModal(false)}
          selectedAddObject={selectedAddObject}
          onSave={handleFinalizeObject}
        />
      )}
    </>
  );
};

export default AddObjectModal;
