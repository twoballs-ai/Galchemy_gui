import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store'; // проверь путь под себя

// Типы данных и функции для работы с логикой
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
}

export interface SceneLogicData {
  logicEvents: LogicEvent[];
}

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
    console.error(`Ошибка при сохранении логики сцены ${sceneId} в проекте ${projectId}:`, error);
  }
};

const loadSceneLogic = (projectId: string, sceneId: string): SceneLogicData => {
  try {
    const key = getLogicStorageKey(projectId, sceneId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { logicEvents: [] };
  } catch (error) {
    console.error(`Ошибка при загрузке логики сцены ${sceneId} в проекте ${projectId}:`, error);
    return { logicEvents: [] };
  }
};

// Компонент LogicEditor, который теперь сам берёт projectId и sceneId из Redux
const LogicEditor: React.FC = () => {
  const projectId = useSelector((state: RootState) => state.project.currentProjectId);
  const sceneId = useSelector((state: RootState) => state.project.activeScene);

  const [logicData, setLogicData] = useState<SceneLogicData>({ logicEvents: [] });

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

  const handleAddEvent = () => {
    const newEvent: LogicEvent = {
      id: uuidv4(),
      conditions: [],
      actions: [],
    };
    updateLogic({ logicEvents: [...logicData.logicEvents, newEvent] });
  };

  const handleRemoveEvent = (eventId: string) => {
    updateLogic({
      logicEvents: logicData.logicEvents.filter((ev) => ev.id !== eventId),
    });
  };

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

  if (!projectId || !sceneId) {
    return (
      <div style={{ color: 'white' }}>
        Нет активного проекта или сцены
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', backgroundColor: '#222', color: '#fff' }}>
      <h2>Редактор логики событий для сцены {sceneId}</h2>
      <button onClick={handleAddEvent}>Добавить событие</button>

      {logicData.logicEvents.map((ev) => (
        <div
          key={ev.id}
          style={{ border: '1px solid #555', padding: '8px', margin: '8px 0' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Событие {ev.id}</strong>
            <button onClick={() => handleRemoveEvent(ev.id)}>Удалить событие</button>
          </div>
          <div>
            <h4>Условия</h4>
            <button onClick={() => handleAddCondition(ev.id)}>+ Добавить условие</button>
            <ul>
              {ev.conditions.map((cond) => (
                <li key={cond.id}>
                  {cond.type} (params: {JSON.stringify(cond.params)})
                  <button onClick={() => handleRemoveCondition(ev.id, cond.id)}>x</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Действия</h4>
            <button onClick={() => handleAddAction(ev.id)}>+ Добавить действие</button>
            <ul>
              {ev.actions.map((act) => (
                <li key={act.id}>
                  {act.type} (params: {JSON.stringify(act.params)})
                  <button onClick={() => handleRemoveAction(ev.id, act.id)}>x</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LogicEditor;
