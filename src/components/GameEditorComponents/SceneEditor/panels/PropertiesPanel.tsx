import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/store";
import { updateSceneObject } from "../../../../store/slices/sceneObjectsSlice";
import { GameAlchemy } from "game-alchemy-core";
import "./PropertiesPanel.scss";
import AssetPickerModal from "../../AssetBrowser/AssetPickerModal";
const baseProps = [
  { key: "name", label: "Имя", type: "text" },
  { key: "x", label: "X", type: "number" },
  { key: "y", label: "Y", type: "number" },
  { key: "z", label: "Z", type: "number" },
];

const materialProps = [
  { key: "color", label: "Цвет", type: "color" },
  {
    key: "roughness",
    label: "Шероховатость",
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "metalness",
    label: "Металличность",
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
  },
];
/* ---------- конфиг отображаемых свойств ---------- */
const objectPropertiesConfig: Record<string, any[]> = {
  sphere: [
    ...baseProps,
    { key: "radius", label: "Радиус", type: "number" },
    { key: "segments", label: "Сегменты", type: "number", min: 3, max: 64 },
    ...materialProps,
  ],
  cube: [
    ...baseProps,
    { key: "width", label: "Ширина", type: "number" },
    { key: "height", label: "Высота", type: "number" },
    { key: "depth", label: "Глубина", type: "number" },
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
    { key: "fov", label: "FOV", type: "number", min: 10, max: 179 },
    { key: "near", label: "Near", type: "number", min: 0.01, step: 0.01 },
    { key: "far", label: "Far", type: "number", min: 1 },
    { key: "isOrthographic", label: "Ортографическая", type: "checkbox" },
    { key: "orthoSize", label: "Ortho Size", type: "number", min: 1 },
    { key: "lookAtX", label: "Смотреть на X", type: "number" },
    { key: "lookAtY", label: "Смотреть на Y", type: "number" },
    { key: "lookAtZ", label: "Смотреть на Z", type: "number" },
  ],
  light: [
    ...baseProps,
    { key: "intensity", label: "Интенсивность", type: "number" },
    { key: "color", label: "Цвет", type: "color" },
    {
      key: "subtype",
      label: "Тип света",
      type: "select",
      options: [
        { value: "point", label: "Точечный" },
        { value: "directional", label: "Направленный" },
        { value: "ambient", label: "Рассеянный" },
      ],
    },
  ],
  terrain: [
    ...baseProps,
    { key: "width", label: "Ширина", type: "number", min: 1 },
    { key: "depth", label: "Длина", type: "number", min: 1 },
    ...materialProps,
  ],
  character: [
    ...baseProps,
    { key: "color", label: "Цвет", type: "color" },
    { key: "textureSrc", label: "Текстура (URL)", type: "text" },
  ],
  model: [
    { key: "name", label: "Имя", type: "text" },
    { key: "x", label: "X", type: "number" },
    { key: "y", label: "Y", type: "number" },
    { key: "z", label: "Z", type: "number" },
    { key: "modelAssetId", label: "Модель", type: "modelPicker" }, // ← новый тип
  ],
};

/* ---------- util: нужно ли пересчитывать геометрию ---------- */
const geometryKeys: Record<string, Set<string>> = {
  sphere: new Set(["radius", "segments"]),
  cube: new Set(["width", "height", "depth"]),
  cylinder: new Set(["radius", "height"]),
  terrain: new Set(["width", "depth"]),
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
    ? objects.find((o) => o.id === currentObjectId)
    : null;
  const activeScene = useSelector((s: RootState) => s.project.activeScene);

  const [propsLocal, setPropsLocal] = useState<Record<string, any>>({});

  useEffect(() => {
    setPropsLocal(selectedObject ? { ...selectedObject } : {});
  }, [selectedObject]);
  const openModelPicker = () => {
    // Простой пример:
    alert("Тут откроем Asset Browser или загрузчик модели");

    // В реальном проекте:
    // Откроем модалку Asset Browser для выбора ассета типа model (.glb, .gltf)
    // Или вызовешь AssetBrowserPanel с onSelect
  };
  const handleModelSelected = (assetId: string) => {
    handleChange("modelAssetId", assetId);
  };
  const [showModelPicker, setShowModelPicker] = useState(false);
  const handleChange = (key: string, value: any) => {
    if (!selectedObject || !activeScene) return;

    const updated = { ...propsLocal };

    if (key.startsWith("lookAt")) {
      // Для камеры lookAtX/Y/Z => массив [x, y, z]
      const idx = { lookAtX: 0, lookAtY: 1, lookAtZ: 2 }[key];
      updated.lookAt = Array.isArray(updated.lookAt)
        ? [...updated.lookAt]
        : [0, 0, 0];
      updated.lookAt[idx] = Number(value);
    } else if (key === "isOrthographic") {
      updated.isOrthographic = Boolean(value);
    } else {
      updated[key] = value;
    }

    setPropsLocal(updated);
    dispatch(updateSceneObject({ activeScene, object: updated }));

    const { type, id } = selectedObject;
    let delta;
    if (key.startsWith("lookAt")) {
      delta = { lookAt: updated.lookAt };
    } else {
      delta = { [key]: value };
    }

    if (GameAlchemy.patchObject) {
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
          {selectedObject
            ? `- ${selectedObject.name || selectedObject.type}`
            : ""}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          ✕
        </button>
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
                    {["x", "y", "z"].map((axis) => (
                      <div key={axis} className="position-input">
                        <span className="axis-label">{axis.toUpperCase()}</span>
                        <input
                          type="number"
                          value={propsLocal[axis] ?? 0}
                          onChange={(e) =>
                            handleChange(axis, parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </label>
              );
            }
            if (
              (prop.key === "height" || prop.key === "depth") &&
              selectedObject.type === "cube"
            )
              return null;

            if (prop.key === "width" && selectedObject.type === "cube") {
              return (
                <label key="dimensions" className="position-label">
                  Размеры (Ш×В×Г)
                  <div className="position-row">
                    {["width", "height", "depth"].map((dim) => (
                      <input
                        key={dim}
                        type="number"
                        value={propsLocal[dim] ?? 1}
                        onChange={(e) =>
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
                    onChange={(e) => {
                      let num = parseFloat(e.target.value) || 0;
                      if (typeof prop.min === "number")
                        num = Math.max(prop.min, num);
                      if (typeof prop.max === "number")
                        num = Math.min(prop.max, num);
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
                    onChange={(e) => handleChange(prop.key, e.target.value)}
                  />
                );
                break;
              case "checkbox":
                inputEl = (
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleChange(prop.key, e.target.checked)}
                  />
                );
                break;
              case "modelPicker":
                inputEl = (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowModelPicker(true)}
                      style={{
                        padding: "8px 12px",
                        background: "#eee",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {propsLocal.modelAssetId
                        ? "Выбрать другую модель"
                        : "Выбрать модель"}
                    </button>
                    {propsLocal.modelAssetId && (
                      <span style={{ marginLeft: 8, color: "#84c0ff" }}>
                        ID: {propsLocal.modelAssetId}
                      </span>
                    )}
                    {/* Модалка выбора модели */}
                    <AssetPickerModal
                      open={showModelPicker}
                      acceptTypes={["modelAsset"]}
                      onSelect={(assetId) => {
                        handleChange("modelAssetId", assetId);
                      }}
                      onClose={() => setShowModelPicker(false)}
                    />
                  </>
                );
                break;
              case "select":
                inputEl = (
                  <select
                    value={value}
                    onChange={(e) => handleChange(prop.key, e.target.value)}
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
                    onChange={(e) => handleChange(prop.key, e.target.value)}
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
