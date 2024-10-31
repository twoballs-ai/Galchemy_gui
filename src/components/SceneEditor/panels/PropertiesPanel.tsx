import React from 'react';

interface Props {
  onClose: () => void;
}

const PropertiesPanel: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="panel-content">
      <div className="panel-header">
        <span>Properties</span>
        <button onClick={onClose}>X</button>
      </div>
      <div className="panel-body">
        {/* Properties of the selected object */}
        <p>Property 1</p>
        <p>Property 2</p>
        <p>Property 3</p>
      </div>
    </div>
  );
};

export default PropertiesPanel;
