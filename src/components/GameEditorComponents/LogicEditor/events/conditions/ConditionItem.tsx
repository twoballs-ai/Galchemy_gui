import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ConditionItemProps {
  id: string;
  condition: { id: string; type: string; params: Record<string, any> };
  eventId: string;
  onRemove: () => void;
}

const ConditionItem: React.FC<ConditionItemProps> = ({ id, condition, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #777',
    padding: '4px',
    marginBottom: '4px',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="drag-handle-mini" {...listeners}></div>
      <div className="condition-content">
        {condition.type} (params: {JSON.stringify(condition.params)})
      </div>
      <button onClick={onRemove}>x</button>
    </div>
  );
};

export default ConditionItem;
