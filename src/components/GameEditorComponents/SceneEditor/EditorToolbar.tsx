import React from 'react';
import { PlayCircle, Square, Hand, Move3D, Rotate3D, Scaling } from "lucide-react";
import './EditorToolbar.scss';

type Tool = 'hand' | 'translate' | 'rotate' | 'scale';

interface EditorToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  isPreviewing: boolean;
  onTogglePreview: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTool,
  onToolChange,
  isPreviewing,
  onTogglePreview
}) => {
  return (
    <div className="editor-toolbar">
      <button
        className={activeTool === 'hand' ? 'active' : ''}
        onClick={() => onToolChange('hand')}
        title="Рука (Q)"
      >
        <Hand size={18} />
      </button>
      <button
        className={activeTool === 'translate' ? 'active' : ''}
        onClick={() => onToolChange('translate')}
        title="Перемещение (W)"
      >
        <Move3D size={18} />
      </button>
      <button
        className={activeTool === 'rotate' ? 'active' : ''}
        onClick={() => onToolChange('rotate')}
        title="Вращение (E)"
      >
        <Rotate3D size={18} />
      </button>
      <button
        className={activeTool === 'scale' ? 'active' : ''}
        onClick={() => onToolChange('scale')}
        title="Масштабирование (R)"
      >
        <Scaling size={18} />
      </button>

      <div className="separator" />

      <button
        className="preview"
        onClick={onTogglePreview}
        title={isPreviewing ? 'Остановить предпросмотр' : 'Запустить сцену'}
      >
        {isPreviewing ? <Square size={18} /> : <PlayCircle size={18} />}
      </button>
    </div>
  );
};

export default EditorToolbar;
