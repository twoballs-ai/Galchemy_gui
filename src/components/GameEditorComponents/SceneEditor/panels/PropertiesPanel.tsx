import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/store";
import { updateSceneObject } from "../../../../store/slices/sceneObjectsSlice";
import "./PropertiesPanel.scss";

// Конфигурация свойств (не меняется)
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

  // Вместо selectedObject, теперь:
  // 1) Получаем currentObjectId
  const currentObjectId = useSelector(
    (state: RootState) => state.sceneObjects.currentObjectId
  );
  // 2) Ищем объект в массиве objects, если есть id
  const objects = useSelector((state: RootState) => state.sceneObjects.objects);
  const selectedObject = currentObjectId
    ? objects.find((obj) => obj.id === currentObjectId)
    : null;

  const activeScene = useSelector((state: RootState) => state.project.activeScene);

  // Локальное состояние для редактирования
  const [properties, setProperties] = useState<any>({});

  useEffect(() => {
    if (selectedObject) {
      setProperties({ ...selectedObject });
    } else {
      setProperties({});
    }
  }, [selectedObject]);

  // Обработчик изменений
  const handleChange = (key: string, value: any) => {
    if (!selectedObject) return;

    // Обновляем локальный стейт
    const updatedProperties = { ...properties, [key]: value };
    setProperties(updatedProperties);

    // Отправляем обновления в Redux и БД
    if (activeScene) {
      dispatch(
        updateSceneObject({
          activeScene,
          object: updatedProperties,
        })
      );
    }
  };

  // Определяем, какие поля отобразить, исходя из типа объекта
  const propertiesConfig = selectedObject
    ? objectPropertiesConfig[selectedObject.type]
    : null;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>
          Свойства {selectedObject ? `- ${selectedObject.name || ""}` : ""}
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
                        handleChange(prop.key, parseFloat(e.target.value) || 0)
                      }
                    />
                  );
                  break;

                case "checkbox":
                  inputElement = (
                    <input
                      type="checkbox"
                      checked={properties[prop.key] || false}
                      onChange={(e) => handleChange(prop.key, e.target.checked)}
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
                  // По умолчанию, text
                  inputElement = (
                    <input
                      type="text"
                      value={properties[prop.key] || ""}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
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
