import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CircleIcon from '../../../icons/circle.png';
import TilesMap from '../../../icons/tilesmap.png';
import CharacterIcon from '../../../icons/character.png';
import EnemyIcon from '../../../icons/enemy.png';
import CustomModal from '../../Modal/CustomModal';
import ConfigureObjectModal from '../../Modal/ConfigureObjectModal';
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
        icon: TilesMap,
        params: {
          id: uuidv4(),
          image: '',
          x: 0,
          y: 100,
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
  {
    category: 'Персонажи',
    objects: [
      {
        name: 'Персонаж',
        type: 'character',
        icon: CharacterIcon,
        params: {
          id: uuidv4(),
          x: 200,
          y: 200,
          width: 50,
          height: 100,
          color: 'blue',
          sprite: '',
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
        },
      },
      {
        name: 'Враг',
        type: 'enemy',
        icon: EnemyIcon,
        params: {
          id: uuidv4(),
          x: 300,
          y: 200,
          width: 50,
          height: 100,
          color: 'red',
          sprite: '',
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
        },
      },
    ],
  },
];

const AddObjectModal: React.FC<AddObjectModalProps> = ({ open, onAdd, onClose }) => {
  const [showSecondModal, setShowSecondModal] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);

  const handleSelectObject = (type: string) => {
    const selected = availableObjects
      .flatMap((category) => category.objects)
      .find((obj) => obj.type === type);

    if (selected) {
      const newObject = {
        ...selected.params,
        id: uuidv4(),
        type: selected.type,
        name: selected.name,
      };

      setSelectedObject(newObject);
      setShowSecondModal(true);
    }
  };

  const handleFinalizeObject = (updatedObject: any) => {
    if (updatedObject) {
      onAdd(updatedObject);
      setShowSecondModal(false);
      onClose();
    }
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
                    <img src={obj.icon} alt={obj.name} className="object-icon" />
                    <span className="object-name">{obj.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CustomModal>

      {selectedObject && (
        <ConfigureObjectModal
          open={showSecondModal}
          onClose={() => setShowSecondModal(false)}
          selectedObject={selectedObject}
          onSave={handleFinalizeObject}
        />
      )}
    </>
  );
};

export default AddObjectModal;
