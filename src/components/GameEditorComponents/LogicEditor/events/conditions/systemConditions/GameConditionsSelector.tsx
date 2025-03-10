import React from 'react';
import { ObjectItem } from './ObjectsSelector';

interface GameConditionsSelectorProps {
  conditions: ObjectItem[];
  selectedId: string | null;
  onSelect: (cond: ObjectItem) => void;
}

const GameConditionsSelector: React.FC<GameConditionsSelectorProps> = ({
  conditions,
  selectedId,
  onSelect,
}) => {
  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
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
  );
};

export default GameConditionsSelector;
