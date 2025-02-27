import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/store";
import { updateSceneObject } from "../../../../store/slices/sceneObjectsSlice";
import "./PropertiesPanel.scss";

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
  character: [
    { key: "x", label: "X", type: "number" },
    { key: "y", label: "Y", type: "number" },
    { key: "width", label: "Width", type: "number" },
    { key: "height", label: "Height", type: "number" },
    { key: "sprite", label: "Sprite", type: "file" },
    { key: "health", label: "Health", type: "number" },
    { key: "speed", label: "Speed", type: "number" },
    { key: "enablePhysics", label: "Enable Physics", type: "checkbox" },
    { key: "layer", label: "Layer", type: "number" },
  ],
  enemy: [
    { key: "x", label: "X", type: "number" },
    { key: "y", label: "Y", type: "number" },
    { key: "width", label: "Width", type: "number" },
    { key: "height", label: "Height", type: "number" },
    { key: "sprite", label: "Sprite", type: "file" },
    { key: "health", label: "Health", type: "number" },
    { key: "speed", label: "Speed", type: "number" },
    { key: "enablePhysics", label: "Enable Physics", type: "checkbox" },
    { key: "layer", label: "Layer", type: "number" },
    { key: "leftBoundary", label: "Left Boundary", type: "number" },
    { key: "rightBoundary", label: "Right Boundary", type: "number" },
  ],
};

const PropertiesPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch();
  const selectedObject = useSelector(
    (state: RootState) => state.sceneObjects.currentObject
  );
  const activeScene = useSelector(
    (state: RootState) => state.project.activeScene
  );

  // Локальное состояние для редактирования параметров объекта
  const [properties, setProperties] = useState<any>({});

  useEffect(() => {
    if (selectedObject) {
      setProperties({ ...selectedObject });
    } else {
      setProperties({});
    }
  }, [selectedObject]);

  const handleChange = (key: string, value: any) => {
    if (!selectedObject) return;
    const updatedProperties = { ...properties, [key]: value };
    setProperties(updatedProperties);
    // Обновляем объект в базе и Redux через thunk
    if (activeScene && selectedObject) {
      dispatch(updateSceneObject({ activeScene, object: updatedProperties }));
    }
  };

  const propertiesConfig = selectedObject
    ? objectPropertiesConfig[selectedObject.type]
    : null;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>
          Свойства {selectedObject ? `- ${selectedObject.name}` : ""}
        </h3>
        <button onClick={onClose}>Закрыть</button>
      </div>
      <div className="panel-body">
        {selectedObject ? (
          propertiesConfig ? (
            propertiesConfig.map((prop) => {
              let inputElement = null;
              switch (prop.type) {
                case "number":
                  inputElement = (
                    <input
                      type="number"
                      value={properties[prop.key] || 0}
                      onChange={(e) =>
                        handleChange(prop.key, parseFloat(e.target.value))
                      }
                    />
                  );
                  break;
                case "checkbox":
                  inputElement = (
                    <input
                      type="checkbox"
                      checked={properties[prop.key] || false}
                      onChange={(e) =>
                        handleChange(prop.key, e.target.checked)
                      }
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
                            handleChange(prop.key, reader.result as string);
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
                      value={properties[prop.key] || ""}
                      onChange={(e) =>
                        handleChange(prop.key, e.target.value)
                      }
                    />
                  );
              }
              return (
                <label key={prop.key}>
                  {prop.label}: {inputElement}
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
