import React from 'react';
import { SceneSettings, defaultSceneSettings } from '../../../../store/slices/projectSlice';

interface SceneSettingsEditorProps {
  sceneSettings?: Record<string, unknown>;
  onSettingsChange: (newSettings: SceneSettings) => void;
}

const SceneSettingsEditor: React.FC<SceneSettingsEditorProps> = ({ sceneSettings, onSettingsChange }) => {
  const settings: SceneSettings = {
    ...defaultSceneSettings,
    ...(sceneSettings as SceneSettings | undefined),
  };

  const update = <K extends keyof SceneSettings>(key: K, value: SceneSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="scene-settings-editor">
      <h3>Настройки сцены</h3>
      <label>
        Фон
        <input
          type="color"
          value={settings.backgroundColor || '#1e293b'}
          onChange={(e) => update('backgroundColor', e.target.value)}
        />
      </label>

      <label>
        Качество графики
        <select
          value={settings.graphicsPreset || 'high'}
          onChange={(e) => update('graphicsPreset', e.target.value as SceneSettings['graphicsPreset'])}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="ultra">Ultra</option>
        </select>
      </label>

      <label>
        Профиль устройства
        <select
          value={settings.devicePreset || 'desktop'}
          onChange={(e) => update('devicePreset', e.target.value as SceneSettings['devicePreset'])}
        >
          <option value="desktop">Desktop</option>
          <option value="tablet">Tablet</option>
          <option value="phone">Phone</option>
        </select>
      </label>

      <label>
        Ориентация
        <select
          value={settings.orientation || 'landscape'}
          onChange={(e) => update('orientation', e.target.value as SceneSettings['orientation'])}
        >
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
        </select>
      </label>

      <label>
        Рендерер
        <select
          value={settings.rendererType || 'webgl'}
          onChange={(e) => update('rendererType', e.target.value as SceneSettings['rendererType'])}
        >
          <option value="webgl">WebGL</option>
          <option value="webgpu">WebGPU</option>
        </select>
      </label>
    </div>
  );
};

export default SceneSettingsEditor;
