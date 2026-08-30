import React from 'react';
import { PlayCircle, Square, Hand, Move3D, Rotate3D, Scaling, Plus, Lock, Unlock, RefreshCw } from "lucide-react";
import './EditorToolbar.scss';

type Tool = 'hand' | 'translate' | 'rotate' | 'scale';
type GraphicsPreset = 'low' | 'medium' | 'high' | 'ultra';
type DevicePreset = 'desktop' | 'tablet' | 'phone';

interface EditorToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  isPreviewing: boolean;
  onTogglePreview: () => void;
  graphicsPreset: GraphicsPreset;
  onGraphicsPresetChange: (preset: GraphicsPreset) => void;
  devicePreset: DevicePreset;
  onDevicePresetChange: (preset: DevicePreset) => void;
  onOpenAddObjectModal: () => void;
  isLayoutLocked: boolean;
  onToggleLayoutLock: () => void;
  onResetLayout: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTool,
  onToolChange,
  isPreviewing,
  onTogglePreview,
  graphicsPreset,
  onGraphicsPresetChange,
  devicePreset,
  onDevicePresetChange,
  onOpenAddObjectModal,
  isLayoutLocked,
  onToggleLayoutLock,
  onResetLayout,
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

      <label className="toolbar-select">
        Графика
        <select
          value={graphicsPreset}
          onChange={(e) => onGraphicsPresetChange(e.target.value as GraphicsPreset)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="ultra">Ultra</option>
        </select>
      </label>

      <label className="toolbar-select">
        Устройство
        <select
          value={devicePreset}
          onChange={(e) => onDevicePresetChange(e.target.value as DevicePreset)}
        >
          <option value="desktop">Desktop</option>
          <option value="tablet">Tablet</option>
          <option value="phone">Phone</option>
        </select>
      </label>

      <button
        className="add-object"
        onClick={onOpenAddObjectModal}
        title="Добавить объект"
      >
        <Plus size={18} />
      </button>

      <button
        className="add-object"
        onClick={onToggleLayoutLock}
        title={isLayoutLocked ? 'Разблокировать окна' : 'Заблокировать окна'}
      >
        {isLayoutLocked ? <Lock size={18} /> : <Unlock size={18} />}
      </button>

      <button
        className="add-object"
        onClick={onResetLayout}
        title="Сбросить раскладку окон"
      >
        <RefreshCw size={18} />
      </button>

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
