import React from 'react';

interface SceneSettingsEditorProps {
  sceneSettings: any;
  onSettingsChange: (newSettings: any) => void;
}

const SceneSettingsEditor: React.FC<SceneSettingsEditorProps> = ({ sceneSettings, onSettingsChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onSettingsChange({ ...sceneSettings, [name]: value });
  };

  return (
    <div className="scene-settings-editor">
      <h3>Scene Settings</h3>
      <label>
        Background Color:
        <input type="color" name="backgroundColor" value={sceneSettings.backgroundColor} onChange={handleChange} />
      </label>
      <label>
        Ambient Light:
        <input type="range" name="ambientLight" min="0" max="1" step="0.01" value={sceneSettings.ambientLight} onChange={handleChange} />
      </label>
      {/* Добавьте другие настройки по необходимости */}
    </div>
  );
};

export default SceneSettingsEditor;
