import React from 'react';
import { ObjectItem } from './ObjectsSelector';

interface GameConditionsSelectorProps {
  selectedId: string | null;
  onSelect: (cond: ObjectItem) => void;
}

const GameConditionsSelector: React.FC<GameConditionsSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  // Группируем системные условия по категориям
  const conditionsGrouped: Record<string, ObjectItem[]> = {
    'Нажатия клавиатуры': [
      { id: 'onKeyDown', name: 'Нажатие клавиши' },
      { id: 'onKeyUp', name: 'Отпускание клавиши' },
    ],
    'Нажатия мыши': [
      { id: 'onMouseClick', name: 'Клик мышью' },
    ],
    'Нажатия на экран': [
      { id: 'onTouch', name: 'Сенсорное касание' },
    ],
  };

  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {Object.entries(conditionsGrouped).map(([groupName, conditions]) => (
        <div key={groupName} style={{ marginBottom: '16px' }}>
          <h5>{groupName}</h5>
          {conditions.map((cond) => (
            <div
              key={cond.id}
              onClick={() => onSelect(cond)}
              style={{
                padding: '4px 8px',
                background: selectedId === cond.id ? '#0053a0' : 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '4px',
              }}
            >
              {cond.name}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameConditionsSelector;
