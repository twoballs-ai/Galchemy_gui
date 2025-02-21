// LogicEditorContent.tsx
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadSceneData, saveSceneData } from '../../../utils/storageUtils';
import { Button, Card, Space } from 'antd';

interface Condition {
  id: string;
  type: string;
  params: any;
}

interface Action {
  id: string;
  type: string;
  params: any;
}

interface LogicEvent {
  id: string;
  conditions: Condition[];
  actions: Action[];
}

interface SceneData {
  sceneName: string;
  objects: any[];
  settings: any;
  logicEvents?: LogicEvent[];
}

interface LogicEditorContentProps {
  projectName: string;
  sceneName: string;
}

const LogicEditorContent: React.FC<LogicEditorContentProps> = ({
  projectName,
  sceneName,
}) => {
  const [sceneData, setSceneData] = useState<SceneData | null>(null);

  useEffect(() => {
    const loadedSceneData = loadSceneData(projectName, sceneName);
    if (loadedSceneData) {
      setSceneData(loadedSceneData);
    }
  }, [projectName, sceneName]);

  const handleSave = () => {
    if (sceneData) {
      // Сохраняем sceneData с обновлёнными logicEvents
      saveSceneData(projectName, sceneData);
    }
  };

  const handleAddEvent = () => {
    if (!sceneData) return;
    const newEvent: LogicEvent = {
      id: uuidv4(),
      conditions: [],
      actions: [],
    };
    const updatedData = {
      ...sceneData,
      logicEvents: [...(sceneData.logicEvents || []), newEvent],
    };
    setSceneData(updatedData);
  };

  const handleRemoveEvent = (eventId: string) => {
    if (!sceneData) return;
    const updatedEvents = (sceneData.logicEvents || []).filter((ev) => ev.id !== eventId);
    const updatedData = { ...sceneData, logicEvents: updatedEvents };
    setSceneData(updatedData);
  };

  const handleAddCondition = (eventId: string) => {
    if (!sceneData) return;
    const updatedEvents = (sceneData.logicEvents || []).map((ev) => {
      if (ev.id === eventId) {
        const newCondition: Condition = {
          id: uuidv4(),
          type: 'onKeyDown', // пример значения по умолчанию
          params: { key: 'Space' }, // пример
        };
        return { ...ev, conditions: [...ev.conditions, newCondition] };
      }
      return ev;
    });
    setSceneData({ ...sceneData, logicEvents: updatedEvents });
  };

  const handleRemoveCondition = (eventId: string, conditionId: string) => {
    if (!sceneData) return;
    const updatedEvents = (sceneData.logicEvents || []).map((ev) => {
      if (ev.id === eventId) {
        const filteredConds = ev.conditions.filter((c) => c.id !== conditionId);
        return { ...ev, conditions: filteredConds };
      }
      return ev;
    });
    setSceneData({ ...sceneData, logicEvents: updatedEvents });
  };

  const handleAddAction = (eventId: string) => {
    if (!sceneData) return;
    const updatedEvents = (sceneData.logicEvents || []).map((ev) => {
      if (ev.id === eventId) {
        const newAction: Action = {
          id: uuidv4(),
          type: 'moveObject', // пример
          params: { objectId: 'player', dx: 5, dy: 0 },
        };
        return { ...ev, actions: [...ev.actions, newAction] };
      }
      return ev;
    });
    setSceneData({ ...sceneData, logicEvents: updatedEvents });
  };

  const handleRemoveAction = (eventId: string, actionId: string) => {
    if (!sceneData) return;
    const updatedEvents = (sceneData.logicEvents || []).map((ev) => {
      if (ev.id === eventId) {
        const filteredActs = ev.actions.filter((a) => a.id !== actionId);
        return { ...ev, actions: filteredActs };
      }
      return ev;
    });
    setSceneData({ ...sceneData, logicEvents: updatedEvents });
  };

  const logicEvents = sceneData?.logicEvents || [];

  return (
    <div style={{ padding: '16px', color: 'white' }}>
      <h2>Редактор логики событий</h2>
      <Button type="primary" onClick={handleAddEvent} style={{ marginBottom: '16px' }}>
        Добавить событие
      </Button>

      {logicEvents.map((ev) => (
        <Card
          key={ev.id}
          title={`Событие ${ev.id}`}
          style={{ marginBottom: '16px', backgroundColor: '#333' }}
          extra={
            <Button danger onClick={() => handleRemoveEvent(ev.id)}>
              Удалить
            </Button>
          }
        >
          <div style={{ marginBottom: '8px' }}>
            <strong>Условия:</strong>
            <Button type="link" onClick={() => handleAddCondition(ev.id)}>
              + добавить условие
            </Button>
            <ul>
              {ev.conditions.map((cond) => (
                <li key={cond.id}>
                  <span style={{ color: '#0f0' }}>
                    {cond.type} (params: {JSON.stringify(cond.params)})
                  </span>
                  <Button
                    danger
                    size="small"
                    onClick={() => handleRemoveCondition(ev.id, cond.id)}
                    style={{ marginLeft: '8px' }}
                  >
                    x
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Действия:</strong>
            <Button type="link" onClick={() => handleAddAction(ev.id)}>
              + добавить действие
            </Button>
            <ul>
              {ev.actions.map((act) => (
                <li key={act.id}>
                  <span style={{ color: '#ff0' }}>
                    {act.type} (params: {JSON.stringify(act.params)})
                  </span>
                  <Button
                    danger
                    size="small"
                    onClick={() => handleRemoveAction(ev.id, act.id)}
                    style={{ marginLeft: '8px' }}
                  >
                    x
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ))}
      <Space>
        <Button type="primary" onClick={handleSave}>
          Сохранить
        </Button>
      </Space>
    </div>
  );
};

export default LogicEditorContent;
