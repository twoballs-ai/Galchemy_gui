import React, { useEffect, useMemo, useRef } from 'react';

type KeyAction = 'w' | 'a' | 's' | 'd' | ' ';

interface TouchControlsOverlayProps {
  enabled: boolean;
}

const TouchControlsOverlay: React.FC<TouchControlsOverlayProps> = ({ enabled }) => {
  const pressedKeysRef = useRef<Set<KeyAction>>(new Set());

  const emitKey = useMemo(
    () => (key: KeyAction, type: 'keydown' | 'keyup') => {
      window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
    },
    []
  );

  const press = (key: KeyAction) => {
    if (pressedKeysRef.current.has(key)) return;
    pressedKeysRef.current.add(key);
    emitKey(key, 'keydown');
  };

  const release = (key: KeyAction) => {
    if (!pressedKeysRef.current.has(key)) return;
    pressedKeysRef.current.delete(key);
    emitKey(key, 'keyup');
  };

  useEffect(() => {
    if (enabled) return;
    pressedKeysRef.current.forEach((key) => emitKey(key, 'keyup'));
    pressedKeysRef.current.clear();
  }, [enabled, emitKey]);

  useEffect(() => {
    const pressed = pressedKeysRef.current;
    return () => {
      pressed.forEach((key) => emitKey(key, 'keyup'));
      pressed.clear();
    };
  }, [emitKey]);

  if (!enabled) return null;

  const bindTouch = (key: KeyAction) => ({
    onTouchStart: (event: React.TouchEvent<HTMLButtonElement>) => {
      event.preventDefault();
      press(key);
    },
    onTouchEnd: (event: React.TouchEvent<HTMLButtonElement>) => {
      event.preventDefault();
      release(key);
    },
    onTouchCancel: (event: React.TouchEvent<HTMLButtonElement>) => {
      event.preventDefault();
      release(key);
    },
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      press(key);
    },
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      release(key);
    },
    onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => {
      if ((event.buttons ?? 0) > 0) release(key);
    },
  });

  return (
    <div className="touch-controls" aria-label="touch controls">
      <div className="touch-controls__dpad">
        <button {...bindTouch('w')}>↑</button>
        <div className="touch-controls__row">
          <button {...bindTouch('a')}>←</button>
          <button {...bindTouch('s')}>↓</button>
          <button {...bindTouch('d')}>→</button>
        </div>
      </div>

      <button className="touch-controls__action" {...bindTouch(' ')}>
        Jump
      </button>
    </div>
  );
};

export default TouchControlsOverlay;
