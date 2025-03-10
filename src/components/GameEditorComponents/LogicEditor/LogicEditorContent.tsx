import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store/store';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import SortableEvent from './events/SortableEvent';
import './LogicEditor.scss';
import { loadSceneObjects } from '../../../store/slices/sceneObjectsSlice'; // Импорт thunk для загрузки объектов

interface LogicEditorProps {
  activeScene: string;
}

// Типы данных
export interface LogicCondition {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface LogicAction {
  id: string;
  type: string;
  params: Record<string, any>;
}

export interface LogicEvent {
  id: string;
  conditions: LogicCondition[];
  actions: LogicAction[];
  // Свойство position оставляем для обратной совместимости, но в новом подходе оно не используется для отображения
  position: { x: number; y: number };
}

export interface SceneLogicData {
  logicEvents: LogicEvent[];
}

// Функции для работы с localStorage
const getLogicStorageKey = (projectId: string, sceneId: string) => {
  return `LogicData:${projectId}:${sceneId}`;
};

const saveSceneLogic = (
  projectId: string,
  sceneId: string,
  logicData: SceneLogicData
) => {
  try {
    const key = getLogicStorageKey(projectId, sceneId);
    localStorage.setItem(key, JSON.stringify(logicData));
  } catch (error) {
    console.error(
      `Ошибка при сохранении логики сцены ${sceneId} в проекте ${projectId}:`,
      error
    );
  }
};

const loadSceneLogic = (projectId: string, sceneId: string): SceneLogicData => {
  try {
    const key = getLogicStorageKey(projectId, sceneId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { logicEvents: [] };
  } catch (error) {
    console.error(
      `Ошибка при загрузке логики сцены ${sceneId} в проекте ${projectId}:`,
      error
    );
    return { logicEvents: [] };
  }
};

// Основной компонент редактора логики
const LogicEditor: React.FC<LogicEditorProps> = ({ activeScene }) => {
  const dispatch = useDispatch<AppDispatch>();
  const projectId = useSelector(
    (state: RootState) => state.project.currentProjectId
  );
  // Используем переданный пропс activeScene в качестве sceneId
  const sceneId = activeScene;

  const [logicData, setLogicData] = useState<SceneLogicData>({ logicEvents: [] });

  // Загружаем объекты сцены (если они нужны для логики)
  useEffect(() => {
    if (sceneId) {
      dispatch(loadSceneObjects(sceneId));
    }
  }, [sceneId, dispatch]);

  // Загружаем сохранённую логику сцены из localStorage
  useEffect(() => {
    if (projectId && sceneId) {
      const loadedLogic = loadSceneLogic(projectId, sceneId);
      setLogicData(loadedLogic);
    }
  }, [projectId, sceneId]);

  const updateLogic = (updatedLogic: SceneLogicData) => {
    setLogicData(updatedLogic);
    if (projectId && sceneId) {
      saveSceneLogic(projectId, sceneId, updatedLogic);
    }
  };

  // Добавление нового события
  const handleAddEvent = () => {
    const newEvent: LogicEvent = {
      id: uuidv4(),
      conditions: [],
      actions: [],
      position: { x: 0, y: 0 },
    };
    updateLogic({ logicEvents: [...logicData.logicEvents, newEvent] });
  };

  // Удаление события
  const handleRemoveEvent = (eventId: string) => {
    updateLogic({
      logicEvents: logicData.logicEvents.filter((ev) => ev.id !== eventId),
    });
  };

  // Добавление условия в событие
  const handleAddCondition = (eventId: string) => {
    const updatedEvents = logicData.logicEvents.map((ev) => {
      if (ev.id === eventId) {
        const newCondition: LogicCondition = {
          id: uuidv4(),
          type: 'onKeyDown',
          params: { key: 'Space' },
        };
        return { ...ev, conditions: [...ev.conditions, newCondition] };
      }
      return ev;
    });
    updateLogic({ logicEvents: updatedEvents });
  };

  // Удаление условия из события
  const handleRemoveCondition = (eventId: string, conditionId: string) => {
    const updatedEvents = logicData.logicEvents.map((ev) => {
      if (ev.id === eventId) {
        return {
          ...ev,
          conditions: ev.conditions.filter((c) => c.id !== conditionId),
        };
      }
      return ev;
    });
    updateLogic({ logicEvents: updatedEvents });
  };

  // Добавление действия в событие
  const handleAddAction = (eventId: string) => {
    const updatedEvents = logicData.logicEvents.map((ev) => {
      if (ev.id === eventId) {
        const newAction: LogicAction = {
          id: uuidv4(),
          type: 'moveObject',
          params: { objectId: 'player', dx: 5, dy: 0 },
        };
        return { ...ev, actions: [...ev.actions, newAction] };
      }
      return ev;
    });
    updateLogic({ logicEvents: updatedEvents });
  };

  // Удаление действия из события
  const handleRemoveAction = (eventId: string, actionId: string) => {
    const updatedEvents = logicData.logicEvents.map((ev) => {
      if (ev.id === eventId) {
        return {
          ...ev,
          actions: ev.actions.filter((a) => a.id !== actionId),
        };
      }
      return ev;
    });
    updateLogic({ logicEvents: updatedEvents });
  };

  // Обработка завершения перетаскивания — для событий и миниблоков условий/действий
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Если это перетаскивание события (не миниблок условий/действий)
    if (!activeId.startsWith('condition-') && !activeId.startsWith('action-')) {
      if (activeId !== overId) {
        const oldIndex = logicData.logicEvents.findIndex(ev => ev.id === activeId);
        const newIndex = logicData.logicEvents.findIndex(ev => ev.id === overId);
        const newEvents = arrayMove(logicData.logicEvents, oldIndex, newIndex);
        updateLogic({ logicEvents: newEvents });
      }
      return;
    }

    // Обработка миниблоков (условий или действий)
    // Ожидаемый формат activeId: "condition-{condId}-{sourceEventId}" или "action-{actionId}-{sourceEventId}"
    const parts = activeId.split('-');
    if (parts.length < 3) return;
    const itemType = parts[0]; // "condition" или "action"
    const sourceEventId = parts.slice(2).join('-'); // на случай, если eventId содержит дефис

    // Формируем id контейнера для источника: "conditions-{sourceEventId}" или "actions-{sourceEventId}"
    const sourceContainerId =
      itemType === 'condition'
        ? `conditions-${sourceEventId}`
        : `actions-${sourceEventId}`;

    // Получаем destination container из over.data.current.sortable.containerId
    const destinationContainerId = over.data.current?.sortable?.containerId;
    if (!destinationContainerId) return;

    if (sourceContainerId === destinationContainerId) {
      // Перестановка внутри одного контейнера
      const eventId = sourceEventId;
      const eventIndex = logicData.logicEvents.findIndex(ev => ev.id === eventId);
      if (eventIndex === -1) return;
      const currentEvent = logicData.logicEvents[eventIndex];
      if (itemType === 'condition') {
        const oldIndex = currentEvent.conditions.findIndex(
          cond => `condition-${cond.id}-${eventId}` === activeId
        );
        const newIndex = currentEvent.conditions.findIndex(
          cond => `condition-${cond.id}-${eventId}` === overId
        );
        if (oldIndex === -1 || newIndex === -1) return;
        const newConditions = arrayMove(currentEvent.conditions, oldIndex, newIndex);
        const updatedEvent = { ...currentEvent, conditions: newConditions };
        const newEvents = [...logicData.logicEvents];
        newEvents[eventIndex] = updatedEvent;
        updateLogic({ logicEvents: newEvents });
      } else if (itemType === 'action') {
        const oldIndex = currentEvent.actions.findIndex(
          act => `action-${act.id}-${eventId}` === activeId
        );
        const newIndex = currentEvent.actions.findIndex(
          act => `action-${act.id}-${eventId}` === overId
        );
        if (oldIndex === -1 || newIndex === -1) return;
        const newActions = arrayMove(currentEvent.actions, oldIndex, newIndex);
        const updatedEvent = { ...currentEvent, actions: newActions };
        const newEvents = [...logicData.logicEvents];
        newEvents[eventIndex] = updatedEvent;
        updateLogic({ logicEvents: newEvents });
      }
    } else {
      // Перемещение между разными контейнерами
      // destinationContainerId имеет формат "conditions-{destEventId}" или "actions-{destEventId}"
      const destParts = destinationContainerId.split('-');
      if (destParts.length < 2) return;
      const destType = destParts[0] === 'conditions' ? 'condition' : 'action';
      const destEventId = destParts.slice(1).join('-');
      if (itemType !== destType) return;
      const sourceEventIndex = logicData.logicEvents.findIndex(ev => ev.id === sourceEventId);
      const destEventIndex = logicData.logicEvents.findIndex(ev => ev.id === destEventId);
      if (sourceEventIndex === -1 || destEventIndex === -1) return;
      const sourceEvent = logicData.logicEvents[sourceEventIndex];
      const destEvent = logicData.logicEvents[destEventIndex];
      if (itemType === 'condition') {
        const condIndex = sourceEvent.conditions.findIndex(
          cond => `condition-${cond.id}-${sourceEventId}` === activeId
        );
        if (condIndex === -1) return;
        const movedCond = sourceEvent.conditions[condIndex];
        const newSourceConditions = [...sourceEvent.conditions];
        newSourceConditions.splice(condIndex, 1);
        const newDestConditions = [...destEvent.conditions];
        const destIndex = newDestConditions.findIndex(
          cond => `condition-${cond.id}-${destEventId}` === overId
        );
        if (destIndex === -1) {
          newDestConditions.push(movedCond);
        } else {
          newDestConditions.splice(destIndex, 0, movedCond);
        }
        const updatedSourceEvent = { ...sourceEvent, conditions: newSourceConditions };
        const updatedDestEvent = { ...destEvent, conditions: newDestConditions };
        const newEvents = [...logicData.logicEvents];
        newEvents[sourceEventIndex] = updatedSourceEvent;
        newEvents[destEventIndex] = updatedDestEvent;
        updateLogic({ logicEvents: newEvents });
      } else if (itemType === 'action') {
        const actIndex = sourceEvent.actions.findIndex(
          act => `action-${act.id}-${sourceEventId}` === activeId
        );
        if (actIndex === -1) return;
        const movedAct = sourceEvent.actions[actIndex];
        const newSourceActions = [...sourceEvent.actions];
        newSourceActions.splice(actIndex, 1);
        const newDestActions = [...destEvent.actions];
        const destIndex = newDestActions.findIndex(
          act => `action-${act.id}-${destEventId}` === overId
        );
        if (destIndex === -1) {
          newDestActions.push(movedAct);
        } else {
          newDestActions.splice(destIndex, 0, movedAct);
        }
        const updatedSourceEvent = { ...sourceEvent, actions: newSourceActions };
        const updatedDestEvent = { ...destEvent, actions: newDestActions };
        const newEvents = [...logicData.logicEvents];
        newEvents[sourceEventIndex] = updatedSourceEvent;
        newEvents[destEventIndex] = updatedDestEvent;
        updateLogic({ logicEvents: newEvents });
      }
    }
  };

  if (!projectId || !sceneId) {
    return (
      <div style={{ color: 'white' }}>
        Нет активного проекта или сцены
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext
        items={logicData.logicEvents.map(ev => ev.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="logic-editor-container">
          <button onClick={handleAddEvent}>Добавить событие</button>
          {logicData.logicEvents.map(ev => (
            <SortableEvent
              key={ev.id}
              event={ev}
              onRemove={handleRemoveEvent}
              onAddCondition={handleAddCondition}
              onRemoveCondition={handleRemoveCondition}
              onAddAction={handleAddAction}
              onRemoveAction={handleRemoveAction}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default LogicEditor;
