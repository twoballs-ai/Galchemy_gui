import React, { useEffect, useRef } from 'react';

interface GameObjectListenerProps {
  coreInstance: any;
  onGameObjectsMapUpdate: (map: Map<string, any>) => void;
}

const GameObjectListener: React.FC<GameObjectListenerProps> = ({
  coreInstance,
  onGameObjectsMapUpdate,
}) => {
  const liveMap = useRef(new Map<string, any>()).current;

  useEffect(() => {
    if (!coreInstance) return;

    const handleAdd = ({ object }) => {
      liveMap.set(object.id, object);
      onGameObjectsMapUpdate(new Map(liveMap));
    };

    const handleRemove = ({ objectId }) => {
      liveMap.delete(objectId);
      onGameObjectsMapUpdate(new Map(liveMap));
    };

    const handleClear = () => {
      liveMap.clear();
      onGameObjectsMapUpdate(new Map(liveMap));
    };

    coreInstance.emitter.on('objectAdded', handleAdd);
    coreInstance.emitter.on('objectRemoved', handleRemove);
    coreInstance.emitter.on('sceneCleared', handleClear);

    return () => {
      coreInstance.emitter.off('objectAdded', handleAdd);
      coreInstance.emitter.off('objectRemoved', handleRemove);
      coreInstance.emitter.off('sceneCleared', handleClear);
    };
  }, [coreInstance, onGameObjectsMapUpdate, liveMap]);

  return null; // чистый слушатель, ничего не рисует
};

export default GameObjectListener;
