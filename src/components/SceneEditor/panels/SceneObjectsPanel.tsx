import React from 'react';

interface Props {
  onClose: () => void;
}

const SceneObjectsPanel: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="panel-content">
      <div className="panel-header">
        <span>Scene Objects</span>
        <button onClick={onClose}>X</button>
      </div>
      <div className="panel-body">
        {/* List of scene objects */}
        <p>Object 1</p>
        <p>Object 2</p>
        <p>Object 3</p>
      </div>
    </div>
  );
};

export default SceneObjectsPanel;
