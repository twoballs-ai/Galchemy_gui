// AddObjectModal.tsx
"use client";

import React from "react";
import { v4 as uuidv4 } from "uuid";
import CustomModal from "./CustomModal";

import SphereIcon    from "../../../icons/circle.png";
import CubeIcon      from "../../../icons/circle.png";
import CylinderIcon  from "../../../icons/circle.png";
import CameraIcon    from "../../../icons/circle.png";
import LightIcon     from "../../../icons/circle.png";
import TerrainIcon   from "../../../icons/circle.png";

import "./AddObjectModal.scss";

interface AddObjectModalProps {
  open: boolean;
  // Добавлено поле name
  onAdd: (payload: { id: string; type: ObjectType; name: string; subtype?: LightSubtype }) => void;
  onClose: () => void;
}

// Объекты — как раньше, плюс общий "light"
export type ObjectType =
  | "sphere"
  | "cube"
  | "cylinder"
  | "camera"
  | "light"
  | "terrain"
  | "sprite";

// Подтип для освещений
export type LightSubtype = "point" | "directional" | "ambient";

interface GroupedItem {
  title: string;
  type: ObjectType;
  icon: string;
  // subtype указываем только для type === "light"
  subtype?: LightSubtype;
}

const groupedObjects: { group: string; items: GroupedItem[] }[] = [
  {
    group: "Камеры",
    items: [
      { title: "Камера", type: "camera", icon: CameraIcon },
    ],
  },
  {
    group: "Освещение",
    items: [
      { title: "Точечный свет",       type: "light", subtype: "point",       icon: LightIcon },
      { title: "Направленный свет",   type: "light", subtype: "directional", icon: LightIcon },
      { title: "Рассеянный свет",     type: "light", subtype: "ambient",     icon: LightIcon },
    ],
  },
  {
    group: "3D Примитивы",
    items: [
      { title: "Сфера",    type: "sphere",   icon: SphereIcon },
      { title: "Куб",      type: "cube",     icon: CubeIcon },
      { title: "Цилиндр",  type: "cylinder", icon: CylinderIcon },
    ],
  },
  {
    group: "Террэйн",
    items: [
      { title: "Террэйн", type: "terrain", icon: TerrainIcon },
    ],
  },
];

const AddObjectModal: React.FC<AddObjectModalProps> = ({ open, onAdd, onClose }) => {
  const handleSelect = (item: GroupedItem) => {
    onAdd({ 
      id: uuidv4(), 
      type: item.type,
      name: item.title, // <--- добавлено имя
      ...(item.subtype ? { subtype: item.subtype } : {}) 
    });
    onClose();
  };

  return (
    <CustomModal open={open} onClose={onClose} title="Добавить объект">
      <div className="add-object-modal">
        {groupedObjects.map(({ group, items }) => (
          <div key={group} className="object-group">
            <h3 className="group-title">{group}</h3>
            <div className="group-items">
              {items.map(item => (
                <div
                  key={item.title}
                  className="primitive-card"
                  onClick={() => handleSelect(item)}
                >
                  <img className="primitive-icon" src={item.icon} alt={item.title} />
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CustomModal>
  );
};

export default AddObjectModal;
