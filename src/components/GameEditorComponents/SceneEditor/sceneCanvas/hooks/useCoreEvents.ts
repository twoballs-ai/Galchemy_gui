// useCoreEvents.ts
import { useEffect } from 'react';
import { Core } from 'tette-core';

interface CoreEventHandlers {
  onObjectSelected?: (data: { object: any }) => void;
  onModeChanged?: (data: { mode: string }) => void;
}

export function useCoreEvents(core: Core | null, handlers: CoreEventHandlers) {
  useEffect(() => {
    if (!core) return;

    handlers.onObjectSelected && core.emitter.on('objectSelected', handlers.onObjectSelected);
    handlers.onModeChanged && core.emitter.on('modeChanged', handlers.onModeChanged);

    return () => {
      handlers.onObjectSelected && core.emitter.off('objectSelected', handlers.onObjectSelected);
      handlers.onModeChanged && core.emitter.off('modeChanged', handlers.onModeChanged);
    };
  }, [core, handlers]);
}
