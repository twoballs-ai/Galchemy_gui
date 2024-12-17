import React, { useState, useEffect } from "react";
import "./PropertiesPanel.scss";

interface PropertiesPanelProps {
  object: any;
  onUpdate: (updatedObject: any) => void;
}

const objectPropertiesConfig = {
  
  sprite: [
    { key: "x", label: "X", type: "number" },
    { key: "y", label: "Y", type: "number" },
    { key: "width", label: "Width", type: "number" },
    { key: "height", label: "Height", type: "number" },
    { key: "image", label: "Image", type: "file" },
    {
      key: "preserveAspectRatio",
      label: "Preserve Aspect Ratio",
      type: "checkbox",
    },
    { key: "enablePhysics", label: "Enable Physics", type: "checkbox" },
    { key: "isStatic", label: "Is Static", type: "checkbox" },
    { key: "layer", label: "Layer", type: "number" },
  ],
  spriteGrid: [
    { key: "x", label: "X", type: "number" },
    { key: "y", label: "Y", type: "number" },
    { key: "width", label: "Width", type: "number" },
    { key: "height", label: "Height", type: "number" },
    { key: "image", label: "Image", type: "file" },
    { key: "repeatX", label: "Repeat X", type: "number" },
    { key: "spacingX", label: "Spacing X", type: "number" },
    { key: "enablePhysics", label: "Enable Physics", type: "checkbox" },
    { key: "isStatic", label: "Is Static", type: "checkbox" },
    { key: "layer", label: "Layer", type: "number" },
  ],
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  object,
  onUpdate,
}) => {
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
        <span>Свойства {object ? `- ${object.name}` : ""}</span>
      </div>
      <div className="panel-body">
        {object ? (
          propertiesConfig ? (
            propertiesConfig.map((prop) => {
              let inputElement = null;
              switch (prop.type) {
                case "number":
                  inputElement = (
                    <input
                      type="number"
                      value={properties[prop.key]}
                      onChange={(e) =>
                        handleChange(prop.key, parseFloat(e.target.value))
                      }
                    />
                  );
                  break;
                case "color":
                  inputElement = (
                    <input
                      type="color"
                      value={properties[prop.key]}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                    />
                  );
                  break;
                case "text":
                  inputElement = (
                    <input
                      type="text"
                      value={properties[prop.key]}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                    />
                  );
                  break;
                case "checkbox":
                  inputElement = (
                    <input
                      type="checkbox"
                      checked={properties[prop.key]}
                      onChange={(e) => handleChange(prop.key, e.target.checked)}
                    />
                  );
                  break;
                case "select":
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
                case "textarea":
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
                  case "file":
                    inputElement = (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const imageUrl = reader.result as string;
                              handleChange(prop.key, imageUrl);
                            };
                            reader.readAsDataURL(file);
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
                  {prop.label}:{inputElement}
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
