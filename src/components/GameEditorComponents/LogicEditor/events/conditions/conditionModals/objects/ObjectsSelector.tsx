import React from 'react';

export interface ObjectItem {
  id: string;
  name: string;
  image?: string; // Используем поле image вместо icon
}

interface ObjectsSelectorProps {
  objects: ObjectItem[];
  selectedId: string | null;
  onSelect: (obj: ObjectItem) => void;
}

const ObjectsSelector: React.FC<ObjectsSelectorProps> = ({ objects, selectedId, onSelect }) => {
  console.log(objects)
  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {objects.map((obj) => (
        <div
          key={obj.id}
          onClick={() => onSelect(obj)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            background: selectedId === obj.id ? '#0053a0' : 'transparent',
            cursor: 'pointer',
            borderRadius: '4px',
            marginBottom: '4px',
          }}
        >
          {obj.image && (
            <img
              src={obj.image}
              alt={obj.name}
              style={{
                width: '30px',
                height: '30px',
                objectFit: 'cover',
                borderRadius: '4px',
              }}
            />
          )}
          <span style={{ color: selectedId === obj.id ? '#fff' : '#000' }}>{obj.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ObjectsSelector;
