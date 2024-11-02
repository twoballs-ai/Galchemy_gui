interface PropertiesPanelProps {
  object: any;
  onUpdate: (updatedObject: any) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ object, onUpdate, onClose }) => {
  const [properties, setProperties] = useState({ ...object });

  const handleChange = (key: string, value: any) => {
    const updatedProperties = { ...properties, [key]: value };
    setProperties(updatedProperties);
    onUpdate(updatedProperties);
  };

  return (
    <div className="panel-content">
      <div className="panel-header">
        <span>Свойства - {object.name}</span>
        <button onClick={onClose}>X</button>
      </div>
      <div className="panel-body">
        <label>
          X:
          <input
            type="number"
            value={properties.x}
            onChange={(e) => handleChange('x', parseFloat(e.target.value))}
          />
        </label>
        <label>
          Y:
          <input
            type="number"
            value={properties.y}
            onChange={(e) => handleChange('y', parseFloat(e.target.value))}
          />
        </label>
        <label>
          Ширина:
          <input
            type="number"
            value={properties.width}
            onChange={(e) => handleChange('width', parseFloat(e.target.value))}
          />
        </label>
        <label>
          Высота:
          <input
            type="number"
            value={properties.height}
            onChange={(e) => handleChange('height', parseFloat(e.target.value))}
          />
        </label>
        <label>
          Цвет:
          <input
            type="text"
            value={properties.color}
            onChange={(e) => handleChange('color', e.target.value)}
          />
        </label>
      </div>
    </div>
  );
};

export default PropertiesPanel;
