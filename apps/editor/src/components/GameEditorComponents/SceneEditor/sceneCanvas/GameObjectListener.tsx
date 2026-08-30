import React, { useEffect, useRef } from 'react';

type ListenerPayload = { object?: { id: string }; objectId?: string };

interface EmitterLike {
  on: (event: string, listener: (payload: ListenerPayload) => void) => void;
  off: (event: string, listener: (payload: ListenerPayload) => void) => void;
}

interface CoreLike {
  emitter: EmitterLike;
}

interface GameObjectListenerProps {
  coreInstance: CoreLike | null;
  onGameObjectsMapUpdate: (map: Map<string, unknown>) => void;
}

const GameObjectListener: React.FC<GameObjectListenerProps> = ({
  coreInstance,
  onGameObjectsMapUpdate,
}) => {
  const liveMap = useRef(new Map<string, unknown>()).current;

  useEffect(() => {
    if (!coreInstance) return;

    const handleAdd = ({ object }: ListenerPayload) => {
      if (!object?.id) return;
      liveMap.set(object.id, object);
      onGameObjectsMapUpdate(new Map(liveMap));
    };

    const handleRemove = ({ objectId }: ListenerPayload) => {
      if (!objectId) return;
      liveMap.delete(objectId);
      onGameObjectsMapUpdate(new Map(liveMap));
    };

    const handleClear = () => {
      liveMap.clear();
      onGameObjectsMapUpdate(new Map(liveMap));
    };

    coreInstance.emitter.on('objectAdded', handleAdd);
    coreInstance.emitter.on('objectRemoved', handleRemove);
    coreInstance.emitter.on('sceneCleared', handleClear as (payload: ListenerPayload) => void);

    return () => {
      coreInstance.emitter.off('objectAdded', handleAdd);
      coreInstance.emitter.off('objectRemoved', handleRemove);
      coreInstance.emitter.off('sceneCleared', handleClear as (payload: ListenerPayload) => void);
    };
  }, [coreInstance, onGameObjectsMapUpdate, liveMap]);

  return null;
};

export default GameObjectListener;
