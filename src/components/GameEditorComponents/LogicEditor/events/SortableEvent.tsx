import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ConditionItem from './conditions/ConditionItem';
import ActionItem from './actions/ActionItem';
import { LogicEvent } from './LogicEditor';

interface SortableEventProps {
  event: LogicEvent;
  onRemove: (eventId: string) => void;
  onAddCondition: (eventId: string) => void;
  onRemoveCondition: (eventId: string, conditionId: string) => void;
  onAddAction: (eventId: string) => void;
  onRemoveAction: (eventId: string, actionId: string) => void;
}

const SortableEvent: React.FC<SortableEventProps> = ({
  event,
  onRemove,
  onAddCondition,
  onRemoveCondition,
  onAddAction,
  onRemoveAction,
}) => {
  return (
    <div className="draggable-event">
      <div className="drag-handle">
        <span>::</span>
      </div>
      <div className="event-content">
        <div className="columns">
          <div className="column conditions">
            <h4>Условия</h4>
            <SortableContext
              items={event.conditions.map(cond => `condition-${cond.id}-${event.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {event.conditions.map(cond => (
                <ConditionItem
                  key={`condition-${cond.id}-${event.id}`}
                  id={`condition-${cond.id}-${event.id}`}
                  condition={cond}
                  eventId={event.id}
                  onRemove={() => onRemoveCondition(event.id, cond.id)}
                />
              ))}
            </SortableContext>
            <button onClick={() => onAddCondition(event.id)}>
              + Добавить условие
            </button>
          </div>
          <div className="column actions">
            <h4>Действия</h4>
            <SortableContext
              items={event.actions.map(act => `action-${act.id}-${event.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {event.actions.map(act => (
                <ActionItem
                  key={`action-${act.id}-${event.id}`}
                  id={`action-${act.id}-${event.id}`}
                  action={act}
                  eventId={event.id}
                  onRemove={() => onRemoveAction(event.id, act.id)}
                />
              ))}
            </SortableContext>
            <button onClick={() => onAddAction(event.id)}>
              + Добавить действие
            </button>
          </div>
        </div>
        <button onClick={() => onRemove(event.id)}>Удалить событие</button>
      </div>
    </div>
  );
};

export default SortableEvent;
