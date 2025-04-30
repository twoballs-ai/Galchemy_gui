// TransformToolbar.tsx
import React from 'react';
import {
  Move as MoveIcon,
  Hand as HandIcon,
  RotateCcw as RotateIcon,
  Expand as ScaleIcon,
} from 'lucide-react';

import './TransformToolbar.scss';

type Tool = 'hand' | 'translate' | 'rotate' | 'scale';

interface TransformToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const TransformToolbar: React.FC<TransformToolbarProps> = ({ activeTool, onToolChange }) => {
  return (
    <div className="transform-toolbar">
      <button
        className={activeTool === 'hand' ? 'active' : ''}
        onClick={() => onToolChange('hand')}
        title="Свободное перемещение (Q)"
      >
        <HandIcon size={18} />
      </button>

      <button
        className={activeTool === 'translate' ? 'active' : ''}
        onClick={() => onToolChange('translate')}
        title="Перемещение (W)"
      >
        <MoveIcon size={18} />
      </button>

      <button
        className={activeTool === 'rotate' ? 'active' : ''}
        onClick={() => onToolChange('rotate')}
        title="Вращение (E)"
      >
        <RotateIcon size={18} />
      </button>

      <button
        className={activeTool === 'scale' ? 'active' : ''}
        onClick={() => onToolChange('scale')}
        title="Масштаб (R)"
      >
        <ScaleIcon size={18} />
      </button>
    </div>
  );
};

export default TransformToolbar;
