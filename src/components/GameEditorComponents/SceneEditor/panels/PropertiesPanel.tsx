import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/store";
import { updateSceneObject } from "../../../../store/slices/sceneObjectsSlice";
import { GameAlchemy } from "game-alchemy-core";
import AssetPickerModal from "../../AssetBrowser/AssetPickerModal";
import "./PropertiesPanel.scss";

/* ───────────────────────────────
 * 1. БАЗОВЫЕ НАБОРЫ ПРОПСОВ
 * ─────────────────────────────── */
const positionProps = [
  { key: "x", label: "X", type: "number" },
  { key: "y", label: "Y", type: "number" },
  { key: "z", label: "Z", type: "number" },
];

const rotationProps = [
  { key: "rotX", label: "Rot X (°)", type: "number", step: 1 },
  { key: "rotY", label: "Rot Y (°)", type: "number", step: 1 },
  { key: "rotZ", label: "Rot Z (°)", type: "number", step: 1 },
];

const scaleProps = [
  { key: "scaleX", label: "Scale X", type: "number", step: 0.01, min: 0.001 },
  { key: "scaleY", label: "Scale Y", type: "number", step: 0.01, min: 0.001 },
  { key: "scaleZ", label: "Scale Z", type: "number", step: 0.01, min: 0.001 },
];

const materialProps = [
  { key: "color", label: "Цвет", type: "color" },
  { key: "roughness", label: "Шероховатость", type: "number", min: 0, max: 1, step: 0.01 },
  { key: "metalness", label: "Металличность", type: "number", min: 0, max: 1, step: 0.01 },
];

/* ───────────────────────────────
 * 2. КОНФИГ СВОЙСТВ ДЛЯ ОБЪЕКТОВ
 * ─────────────────────────────── */
const objectPropertiesConfig: Record<string, any[]> = {
  sphere: [
    { key: "name", label: "Имя", type: "text" },
    ...positionProps,
    ...rotationProps,
    ...scaleProps,
    { key: "radius", label: "Радиус", type: "number" },
    { key: "segments", label: "Сегменты", type: "number", min: 3, max: 64 },
    ...materialProps,
  ],
  cube: [
    { key: "name", label: "Имя", type: "text" },
    ...positionProps,
    ...rotationProps,
    ...scaleProps,
    { key: "width", label: "Ширина", type: "number" },
    { key: "height", label: "Высота", type: "number" },
    { key: "depth", label: "Глубина", type: "number" },
    ...materialProps,
  ],
  cylinder: [
    { key: "name", label: "Имя", type: "text" },
    ...positionProps,
    ...rotationProps,
    ...scaleProps,
    { key: "radius", label: "Радиус", type: "number" },
    { key: "height", label: "Высота", type: "number" },
    ...materialProps,
  ],
  character: [
    { key: "name", label: "Имя", type: "text" },
    ...positionProps,
    ...rotationProps,
    ...scaleProps,
    { key: "color", label: "Цвет", type: "color" },
    { key: "textureSrc", label: "Текстура (URL)", type: "text" },
  ],
  terrain: [
    { key: "name", label: "Имя", type: "text" },
    ...positionProps,
    ...rotationProps,
    ...scaleProps,
    { key: "width", label: "Ширина", type: "number", min: 1 },
    { key: "depth", label: "Длина", type: "number", min: 1 },
    ...materialProps,
  ],
  light: [
    { key: "name", label: "Имя", type: "text" },
    ...positionProps,
    ...rotationProps,
    ...scaleProps,
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
  camera: [
    { key: "name", label: "Имя", type: "text" },
    ...positionProps,
    ...rotationProps,
    ...scaleProps,
    { key: "fov", label: "FOV", type: "number", min: 10, max: 179 },
    { key: "near", label: "Near", type: "number", min: 0.01, step: 0.01 },
    { key: "far", label: "Far", type: "number", min: 1 },
    { key: "isOrthographic", label: "Ортографическая", type: "checkbox" },
    { key: "orthoSize", label: "Ortho Size", type: "number", min: 1 },
    { key: "lookAtX", label: "Смотреть на X", type: "number" },
    { key: "lookAtY", label: "Смотреть на Y", type: "number" },
    { key: "lookAtZ", label: "Смотреть на Z", type: "number" },
  ],
  model: [
    { key: "name", label: "Имя", type: "text" },
    ...positionProps,
    ...rotationProps,
    ...scaleProps,
    { key: "modelAssetId", label: "Модель", type: "modelPicker" },
  ],
};

/* набор ключей, при изменении которых надо пересобрать геометрию */
const geometryKeys: Record<string, Set<string>> = {
  sphere: new Set(["radius", "segments"]),
  cube: new Set(["width", "height", "depth"]),
  cylinder: new Set(["radius", "height"]),
  terrain: new Set(["width", "depth"]),
};
const needsGeometry = (type: string, key: string) =>
  geometryKeys[type]?.has(key) ?? false;

/* ───────────────────────────────
 * 3. КОМПОНЕНТ
 * ─────────────────────────────── */
const PropertiesPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch    = useDispatch();
  const activeScene = useSelector((s: RootState) => s.project.activeScene);

  const currentId   = useSelector((s: RootState) => s.sceneObjects.currentObjectId);
  const objects     = useSelector((s: RootState) => s.sceneObjects.objects);
  const selected    = currentId ? objects.find(o => o.id === currentId) : null;

  const [local, setLocal] = useState<Record<string, any>>({});
  const [showPicker, setShowPicker] = useState(false);

  /* sync local-state */
  useEffect(() => setLocal(selected ? { ...selected } : {}), [selected]);

  /* ---------------- handleChange ---------------- */
  const handleChange = (key: string, value: any) => {
    if (!selected || !activeScene) return;

    const next = { ...local };

    /* --- позиция --- */
    if (["x", "y", "z"].includes(key)) {
      next[key] = value;
      next.position = [next.x ?? 0, next.y ?? 0, next.z ?? 0];
    }

    /* --- вращение (градусы → радианы) --- */
    if (["rotX", "rotY", "rotZ"].includes(key)) {
      next[key] = value;
      const rx = (next.rotX ?? 0) * Math.PI / 180;
      const ry = (next.rotY ?? 0) * Math.PI / 180;
      const rz = (next.rotZ ?? 0) * Math.PI / 180;
      next.rotation = [rx, ry, rz];
    }

    /* --- масштаб --- */
    if (["scaleX", "scaleY", "scaleZ"].includes(key)) {
      next[key] = value;
      next.scale = [
        next.scaleX ?? 1,
        next.scaleY ?? 1,
        next.scaleZ ?? 1,
      ];
    }

    /* --- lookAt для камеры --- */
    if (key.startsWith("lookAt")) {
      const idx = { lookAtX: 0, lookAtY: 1, lookAtZ: 2 }[key];
      next.lookAt = Array.isArray(next.lookAt) ? [...next.lookAt] : [0, 0, 0];
      next.lookAt[idx] = Number(value);
    }

    /* остальные поля */
    if (
      ![
        "x","y","z",
        "rotX","rotY","rotZ",
        "scaleX","scaleY","scaleZ"
      ].includes(key) && !key.startsWith("lookAt")
    ) {
      next[key] = value;
    }

    setLocal(next);
    dispatch(updateSceneObject({ activeScene, object: next }));

    /* готовим дельту для движка */
    const delta: any = {};
    if (next.position) delta.position = next.position;
    if (next.rotation) delta.rotation = next.rotation;
    if (next.scale)    delta.scale    = next.scale;
    if (key.startsWith("lookAt"))     delta.lookAt = next.lookAt;
    if (!Object.keys(delta).length)   delta[key]   = value;

    /* geometry rebuild или обычный patch */
    if (needsGeometry(selected.type, key)) {
      GameAlchemy.updateObject(selected.id, selected.type, delta);
    } else {
      GameAlchemy.patchObject(selected.id, delta);
    }
  };

  const cfg = selected ? objectPropertiesConfig[selected.type] : null;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>
          Свойства {selected ? `– ${selected.name || selected.type}` : ""}
        </h3>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
      </div>

      <div className="panel-body">
        {!selected || !cfg ? (
          <p>Выберите объект</p>
        ) : (
          cfg.map(prop => {
            /* групповые блоки */
            if (prop.key === "x") {
              return (
                <label key="position" className="triple">
                  Позиция
                  <div className="triple-row">
                    {["x","y","z"].map(axis => (
                      <input key={axis}
                        type="number"
                        value={local[axis] ?? 0}
                        onChange={e => handleChange(axis, parseFloat(e.target.value) || 0)}
                      />
                    ))}
                  </div>
                </label>
              );
            }
            if (prop.key === "rotX") {
              return (
                <label key="rotation" className="triple">
                  Вращение (°)
                  <div className="triple-row">
                    {["rotX","rotY","rotZ"].map(axis => (
                      <input key={axis}
                        type="number"
                        value={local[axis] ?? 0}
                        step={1}
                        onChange={e => handleChange(axis, parseFloat(e.target.value) || 0)}
                      />
                    ))}
                  </div>
                </label>
              );
            }
            if (prop.key === "scaleX") {
              return (
                <label key="scale" className="triple">
                  Масштаб
                  <div className="triple-row">
                    {["scaleX","scaleY","scaleZ"].map(axis => (
                      <input key={axis}
                        type="number"
                        min={0.001} step={0.01}
                        value={local[axis] ?? 1}
                        onChange={e => handleChange(axis, parseFloat(e.target.value) || 1)}
                      />
                    ))}
                  </div>
                </label>
              );
            }

            /* скрываем пропы, попавшие в группы */
            if (
              [...positionProps.map(p=>p.key).slice(1),
               ...rotationProps.map(p=>p.key).slice(1),
               ...scaleProps.map(p=>p.key).slice(1)
              ].includes(prop.key)
            ) return null;

            /* отдельные поля */
            const value = local[prop.key] ?? "";
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
                    onChange={e => handleChange(prop.key, parseFloat(e.target.value) || 0)}
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
                    checked={!!value}
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
                    {prop.options.map((opt:any) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                );
                break;
              case "modelPicker":
                inputEl = (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowPicker(true)}
                    >
                      {local.modelAssetId ? "Выбрать другую модель" : "Выбрать модель"}
                    </button>
                    {local.modelAssetId && (
                      <span className="asset-id">ID: {local.modelAssetId}</span>
                    )}
                    <AssetPickerModal
                      open={showPicker}
                      acceptTypes={["modelAsset"]}
                      onSelect={assetId => handleChange("modelAssetId", assetId)}
                      onClose={() => setShowPicker(false)}
                    />
                  </>
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
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
