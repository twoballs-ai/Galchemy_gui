import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/store";
import { updateSceneObject } from "../../../../store/slices/sceneObjectsSlice";
import { GameAlchemy } from "game-alchemy-core";          // ← добавили
import "./PropertiesPanel.scss";

/* ---------- конфиг отображаемых свойств ---------- */
const objectPropertiesConfig: Record<string, any[]> = {
  sphere: [
    { key: "name",    label: "Имя",     type: "text"   },
    { key: "x",       label: "X",       type: "number" },
    { key: "y",       label: "Y",       type: "number" },
    { key: "z",       label: "Z",       type: "number" },
    { key: "radius",  label: "Радиус",  type: "number" },   // ← влияет на геометрию
    { key: "color",   label: "Цвет",    type: "color"  },
  ],
  cube: [
    { key: "name",  label: "Имя",   type: "text"   },
    { key: "x",     label: "X",     type: "number" },
    { key: "y",     label: "Y",     type: "number" },
    { key: "z",     label: "Z",     type: "number" },
    { key: "size",  label: "Размер", type: "number" },     // ← влияет на геометрию
    { key: "color", label: "Цвет",  type: "color"  },
  ],
  cylinder: [
    { key: "name",   label: "Имя",     type: "text"   },
    { key: "x",      label: "X",       type: "number" },
    { key: "y",      label: "Y",       type: "number" },
    { key: "z",      label: "Z",       type: "number" },
    { key: "radius", label: "Радиус",  type: "number" },   // ← геометрия
    { key: "height", label: "Высота",  type: "number" },   // ← геометрия
    { key: "color",  label: "Цвет",    type: "color"  },
  ],
  camera: [
    { key: "name", label: "Имя", type: "text"   },
    { key: "x",    label: "X",   type: "number" },
    { key: "y",    label: "Y",   type: "number" },
    { key: "z",    label: "Z",   type: "number" },
    { key: "fov",  label: "FOV", type: "number" },
  ],
  light: [
    { key: "name",      label: "Имя",          type: "text"   },
    { key: "x",         label: "X",            type: "number" },
    { key: "y",         label: "Y",            type: "number" },
    { key: "z",         label: "Z",            type: "number" },
    { key: "intensity", label: "Интенсивность", type: "number" },
    { key: "color",     label: "Цвет",          type: "color"  },
    {
      key: "subtype",
      label: "Тип света",
      type: "select",
      options: [
        { value: "point",       label: "Точечный"     },
        { value: "directional", label: "Направленный" },
        { value: "ambient",     label: "Рассеянный"   },
      ],
    },
  ],
  terrain: [
    { key: "name",   label: "Имя",    type: "text"   },
    { key: "x",      label: "X",      type: "number" },
    { key: "y",      label: "Y",      type: "number" },
    { key: "z",      label: "Z",      type: "number" },
    { key: "width",  label: "Ширина", type: "number" },
    { key: "height", label: "Высота", type: "number" },
  ],
};

/* ---------- util: нужно ли пересчитывать геометрию ---------- */
const geometryKeys: Record<string, Set<string>> = {
  sphere:   new Set(["radius"]),
  cube:     new Set(["size"]),
  cylinder: new Set(["radius", "height"]),
};

const needsGeometry = (type: string, key: string) =>
  geometryKeys[type]?.has(key) ?? false;

/* ---------- компонент ---------- */
const PropertiesPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch();

  const currentObjectId = useSelector(
    (s: RootState) => s.sceneObjects.currentObjectId
  );
  const objects = useSelector((s: RootState) => s.sceneObjects.objects);
  const selectedObject = currentObjectId
    ? objects.find(o => o.id === currentObjectId)
    : null;

  const activeScene = useSelector((s: RootState) => s.project.activeScene);
  const [propsLocal, setPropsLocal] = useState<Record<string, any>>({});

  useEffect(() => {
    setPropsLocal(selectedObject ? { ...selectedObject } : {});
  }, [selectedObject]);

  /* ---------- главный onChange ---------- */
  const handleChange = (key: string, value: any) => {
    if (!selectedObject || !activeScene) return;

    const updated = { ...propsLocal, [key]: value };
    setPropsLocal(updated);

    /* 1) Redux + IndexedDB */
    dispatch(updateSceneObject({ activeScene, object: updated }));

    /* 2) Синхронизируем live‑объект */
    const { type, id } = selectedObject;
    const delta = { [key]: value };

    if (needsGeometry(type, key) && GameAlchemy.updateObject) {
      // изменили размер → обновляем VBO/IBO через лёгкую геометрию
      GameAlchemy.updateObject(id, type, delta);
    } else if (GameAlchemy.patchObject) {
      // позиция, цвет и т.п. → просто патч
      GameAlchemy.patchObject(id, delta);
    }
  };

  const config = selectedObject
    ? objectPropertiesConfig[selectedObject.type]
    : null;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>
          Свойства{" "}
          {selectedObject ? `- ${selectedObject.name || selectedObject.type}` : ""}
        </h3>
        <button onClick={onClose}>Закрыть</button>
      </div>

      <div className="panel-body">
        {selectedObject && config ? (
          config.map(prop => {
            const value = propsLocal[prop.key] ?? "";
            let inputEl: JSX.Element;

            switch (prop.type) {
              case "number":
                inputEl = (
                  <input
                    type="number"
                    value={value}
                    onChange={e =>
                      handleChange(prop.key, parseFloat(e.target.value) || 0)
                    }
                  />
                );
                break;
              case "color":
                inputEl = (
                  <input
                    type="color"
                    value={value}
                    onChange={e => handleChange(prop.key, e.target.value)}
                  />
                );
                break;
              case "checkbox":
                inputEl = (
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={e => handleChange(prop.key, e.target.checked)}
                  />
                );
                break;
              case "select":
                inputEl = (
                  <select
                    value={value}
                    onChange={e => handleChange(prop.key, e.target.value)}
                  >
                    {prop.options.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                );
                break;
              default:
                inputEl = (
                  <input
                    type="text"
                    value={value}
                    onChange={e => handleChange(prop.key, e.target.value)}
                  />
                );
            }

            return (
              <label key={prop.key}>
                {prop.label}
                {inputEl}
              </label>
            );
          })
        ) : (
          <p>Выберите объект</p>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
