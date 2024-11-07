import React, { useState, useEffect } from 'react';
import './PropertiesPanel.scss';

interface PropertiesPanelProps {
  object: any;
  onUpdate: (updatedObject: any) => void;
}

const objectPropertiesConfig = {
  square: [
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'size', label: 'Size', type: 'number' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'borderColor', label: 'Border Color', type: 'color' },
    { key: 'borderWidth', label: 'Border Width', type: 'number' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  rectangle: [
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'width', label: 'Width', type: 'number' },
    { key: 'height', label: 'Height', type: 'number' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'borderColor', label: 'Border Color', type: 'color' },
    { key: 'borderWidth', label: 'Border Width', type: 'number' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  circle: [
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'radius', label: 'Radius', type: 'number' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'borderColor', label: 'Border Color', type: 'color' },
    { key: 'borderWidth', label: 'Border Width', type: 'number' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  arc: [
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'radius', label: 'Radius', type: 'number' },
    { key: 'startAngle', label: 'Start Angle', type: 'number' },
    { key: 'endAngle', label: 'End Angle', type: 'number' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'borderColor', label: 'Border Color', type: 'color' },
    { key: 'borderWidth', label: 'Border Width', type: 'number' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  ellipse: [
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'rX', label: 'Radius X', type: 'number' },
    { key: 'rY', label: 'Radius Y', type: 'number' },
    { key: 'rotation', label: 'Rotation', type: 'number' },
    { key: 'startAngle', label: 'Start Angle', type: 'number' },
    { key: 'endAngle', label: 'End Angle', type: 'number' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'borderColor', label: 'Border Color', type: 'color' },
    { key: 'borderWidth', label: 'Border Width', type: 'number' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  text: [
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'text', label: 'Text', type: 'text' },
    { key: 'fontsize', label: 'Font Size', type: 'number' },
    { key: 'fontFamily', label: 'Font Family', type: 'text' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  line: [
    { key: 'x1', label: 'X1', type: 'number' },
    { key: 'y1', label: 'Y1', type: 'number' },
    { key: 'x2', label: 'X2', type: 'number' },
    { key: 'y2', label: 'Y2', type: 'number' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'widthline', label: 'Line Width', type: 'number' },
    {
      key: 'lineRounded',
      label: 'Line Cap',
      type: 'select',
      options: ['butt', 'round', 'square'],
    },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  polygon: [
    {
      key: 'vertices',
      label: 'Vertices',
      type: 'textarea',
    },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'borderColor', label: 'Border Color', type: 'color' },
    { key: 'borderWidth', label: 'Border Width', type: 'number' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  bezierCurve: [
    { key: 'startX', label: 'Start X', type: 'number' },
    { key: 'startY', label: 'Start Y', type: 'number' },
    { key: 'controlX1', label: 'Control X1', type: 'number' },
    { key: 'controlY1', label: 'Control Y1', type: 'number' },
    { key: 'controlX2', label: 'Control X2', type: 'number' },
    { key: 'controlY2', label: 'Control Y2', type: 'number' },
    { key: 'endX', label: 'End X', type: 'number' },
    { key: 'endY', label: 'End Y', type: 'number' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'widthline', label: 'Line Width', type: 'number' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  star: [
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'radius', label: 'Radius', type: 'number' },
    { key: 'points', label: 'Points', type: 'number' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'borderColor', label: 'Border Color', type: 'color' },
    { key: 'borderWidth', label: 'Border Width', type: 'number' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
  point: [
    { key: 'x', label: 'X', type: 'number' },
    { key: 'y', label: 'Y', type: 'number' },
    { key: 'size', label: 'Size', type: 'number' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'enablePhysics', label: 'Enable Physics', type: 'checkbox' },
    { key: 'isStatic', label: 'Is Static', type: 'checkbox' },
    { key: 'layer', label: 'Layer', type: 'number' },
  ],
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ object, onUpdate }) => {
  const [properties, setProperties] = useState<any>({});

  useEffect(() => {
    if (object) {
      setProperties({ ...object });
    } else {
      setProperties({});
    }
  }, [object]);

  const handleChange = (key: string, value: any) => {
    if (!object) return;
    const updatedProperties = { ...properties, [key]: value };
    setProperties(updatedProperties);
    onUpdate(updatedProperties);
  };

  const propertiesConfig = object ? objectPropertiesConfig[object.type] : null;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <span>Свойства {object ? `- ${object.name}` : ''}</span>
      </div>
      <div className="panel-body">
        {object ? (
          propertiesConfig ? (
            propertiesConfig.map((prop) => {
              let inputElement = null;
              switch (prop.type) {
                case 'number':
                  inputElement = (
                    <input
                      type="number"
                      value={properties[prop.key]}
                      onChange={(e) => handleChange(prop.key, parseFloat(e.target.value))}
                    />
                  );
                  break;
                case 'color':
                  inputElement = (
                    <input
                      type="color"
                      value={properties[prop.key]}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                    />
                  );
                  break;
                case 'text':
                  inputElement = (
                    <input
                      type="text"
                      value={properties[prop.key]}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                    />
                  );
                  break;
                case 'checkbox':
                  inputElement = (
                    <input
                      type="checkbox"
                      checked={properties[prop.key]}
                      onChange={(e) => handleChange(prop.key, e.target.checked)}
                    />
                  );
                  break;
                case 'select':
                  inputElement = (
                    <select
                      value={properties[prop.key]}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                    >
                      {prop.options.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  );
                  break;
                case 'textarea':
                  inputElement = (
                    <textarea
                      value={JSON.stringify(properties[prop.key], null, 2)}
                      onChange={(e) => {
                        try {
                          const value = JSON.parse(e.target.value);
                          handleChange(prop.key, value);
                        } catch (error) {
                          // Обработка ошибки парсинга JSON
                        }
                      }}
                    />
                  );
                  break;
                default:
                  inputElement = (
                    <input
                      type="text"
                      value={properties[prop.key]}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                    />
                  );
              }
              return (
                <label key={prop.key}>
                  {prop.label}:
                  {inputElement}
                </label>
              );
            })
          ) : (
            <p>Нет доступных свойств для этого типа объекта.</p>
          )
        ) : (
          <p>Выберите объект</p>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
