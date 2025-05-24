import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/store";
import { updateSceneObject } from "../../../../store/slices/sceneObjectsSlice";
import { GameAlchemy } from "game-alchemy-core";
import "./PropertiesPanel.scss";
const baseProps = [
  { key: "name",      label: "Имя",            type: "text"   },
  { key: "x",         label: "X",              type: "number" },
  { key: "y",         label: "Y",              type: "number" },
  { key: "z",         label: "Z",              type: "number" },
];

const materialProps = [
  { key: "color",     label: "Цвет",           type: "color"  },
  { key: "roughness", label: "Шероховатость",  type: "number", min: 0, max: 1, step: 0.01 },
  { key: "metalness", label: "Металличность",  type: "number", min: 0, max: 1, step: 0.01 },
];
/* ---------- конфиг отображаемых свойств ---------- */
const objectPropertiesConfig: Record<string, any[]> = {
  sphere: [
    ...baseProps,
    { key: "radius",    label: "Радиус",   type: "number" },
    { key: "segments",  label: "Сегменты", type: "number", min: 3, max: 64 },
    ...materialProps,
  ],
  cube: [
    ...baseProps,
    { key: "width",  label: "Ширина",  type: "number" },
    { key: "height", label: "Высота",  type: "number" },
    { key: "depth",  label: "Глубина", type: "number" },
    ...materialProps,
  ],
  cylinder: [
    ...baseProps,
    { key: "radius", label: "Радиус", type: "number" },
    { key: "height", label: "Высота", type: "number" },
    ...materialProps,
  ],
  camera: [
    ...baseProps,
    { key: "fov", label: "FOV", type: "number" },
  ],
  light: [
    ...baseProps,
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
    ...baseProps,
    { key: "width",  label: "Ширина", type: "number", min: 1 },
    { key: "depth",  label: "Длина",  type: "number", min: 1 },
    ...materialProps,
  ],
  character: [
    ...baseProps,
    { key: "color",      label: "Цвет",           type: "color" },
    { key: "textureSrc", label: "Текстура (URL)", type: "text"  },
  ],
};

/* ---------- util: нужно ли пересчитывать геометрию ---------- */
const geometryKeys: Record<string, Set<string>> = {
  sphere:   new Set(["radius", "segments"]),
  cube:     new Set(["width", "height", "depth"]),
  cylinder: new Set(["radius", "height"]),
  terrain:  new Set(["width", "depth"]),
};

const needsGeometry = (type: string, key: string) =>
  geometryKeys[type]?.has(key) ?? false;

/* ---------- компонент ---------- */
const PropertiesPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch();
  const currentObjectId = useSelector((s: RootState) => s.sceneObjects.currentObjectId);
  const objects = useSelector((s: RootState) => s.sceneObjects.objects);
  const selectedObject = currentObjectId ? objects.find(o => o.id === currentObjectId) : null;
  const activeScene = useSelector((s: RootState) => s.project.activeScene);

  const [propsLocal, setPropsLocal] = useState<Record<string, any>>({});

  useEffect(() => {
    setPropsLocal(selectedObject ? { ...selectedObject } : {});
  }, [selectedObject]);

  const handleChange = (key: string, value: any) => {
    if (!selectedObject || !activeScene) return;

    const updated = { ...propsLocal, [key]: value };
    setPropsLocal(updated);
    dispatch(updateSceneObject({ activeScene, object: updated }));

    const { type, id } = selectedObject;
    const delta = { [key]: value };

    if (needsGeometry(type, key) && GameAlchemy.updateObject) {
      GameAlchemy.updateObject(id, type, delta);
    } else if (GameAlchemy.patchObject) {
      GameAlchemy.patchObject(id, delta);
    }
  };

  const config = selectedObject ? objectPropertiesConfig[selectedObject.type] : null;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>
          Свойства {selectedObject ? `- ${selectedObject.name || selectedObject.type}` : ""}
        </h3>
        <button onClick={onClose}>Закрыть</button>
      </div>

      <div className="panel-body">
  {selectedObject && config ? (
    config.map((prop, idx) => {
      if (prop.key === "y" || prop.key === "z") return null; // исключаем y, z — они идут с x в одной строке

      if (prop.key === "x") {
        return (
<label key="position" className="position-label">
  Позиция
  <div className="position-row">
    {["x", "y", "z"].map(axis => (
      <div key={axis} className="position-input">
        <span className="axis-label">{axis.toUpperCase()}</span>
        <input
          type="number"
          value={propsLocal[axis] ?? 0}
          onChange={e =>
            handleChange(axis, parseFloat(e.target.value) || 0)
          }
        />
      </div>
    ))}
  </div>
</label>
        );
      }
      if ((prop.key === "height" || prop.key === "depth") && selectedObject.type === "cube") return null;


      if (prop.key === "width" && selectedObject.type === "cube") {
        return (
          <label key="dimensions" className="position-label">
            Размеры (Ш×В×Г)
            <div className="position-row">
              {["width", "height", "depth"].map(dim => (
                <input
                  key={dim}
                  type="number"
                  value={propsLocal[dim] ?? 1}
                  onChange={e =>
                    handleChange(dim, parseFloat(e.target.value) || 0)
                  }
                />
              ))}
            </div>
          </label>
        );
      }
      const value = propsLocal[prop.key] ?? "";
      let inputEl: JSX.Element;

      switch (prop.type) {
        case "number":
          inputEl = (
            <input
              type="number"
              value={value}
              min={prop.min}
              max={prop.max}
              step={prop.step || 1}
              onChange={e => {
                let num = parseFloat(e.target.value) || 0;
                if (typeof prop.min === "number") num = Math.max(prop.min, num);
                if (typeof prop.max === "number") num = Math.min(prop.max, num);
                handleChange(prop.key, num);
              }}
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
