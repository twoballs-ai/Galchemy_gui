"use client";

import React from "react";
import { v4 as uuidv4 } from "uuid";
import CustomModal from "./CustomModal";

import SphereIcon    from "../../../icons/circle.png";
import CubeIcon      from "../../../icons/circle.png";
import CylinderIcon  from "../../../icons/circle.png";
import CameraIcon    from "../../../icons/circle.png";
import LightIcon     from "../../../icons/circle.png";
import TerrainIcon   from "../../../icons/circle.png";   // подготовь иконку террэйна

import "./AddObjectModal.scss";

interface AddObjectModalProps {
  open: boolean;
  onAdd: (payload: { id: string; type: ObjectType }) => void;
  onClose: () => void;
}

// ✨ Расширяем типы
type ObjectType =
  | "sphere" | "cube" | "cylinder"         // 3D
  | "camera" | "light"                     // сцена
  | "terrain"                              // террэйны
  | "sprite";                              // 2D примитивы (если добавим)

const groupedObjects = [
  {
    group: "Камеры",
    items: [
      { title: "Камера", type: "camera", icon: CameraIcon },
    ],
  },
  {
    group: "Освещение",
    items: [
      { title: "Свет", type: "light", icon: LightIcon },
    ],
  },
  {
    group: "3D Примитивы",
    items: [
      { title: "Сфера", type: "sphere", icon: SphereIcon },
      { title: "Куб", type: "cube", icon: CubeIcon },
      { title: "Цилиндр", type: "cylinder", icon: CylinderIcon },
    ],
  },
  {
    group: "Террэйны",
    items: [
      { title: "Террэйн", type: "terrain", icon: TerrainIcon },
    ],
  },
  // Можно добавить 2D-примитивы потом
];

const AddObjectModal: React.FC<AddObjectModalProps> = ({ open, onAdd, onClose }) => {
  const handleSelect = (type: ObjectType) => {
    onAdd({ id: uuidv4(), type });
    onClose();
  };

  return (
    <CustomModal open={open} onClose={onClose} title="Добавить объект">
<div className="add-object-modal">
  {groupedObjects.map((group) => (
    <div key={group.group} className="object-group">
      <h3 className="group-title">{group.group}</h3>
      <div className="group-items">
        {group.items.map((item) => (
          <div
            key={item.type}
            className="primitive-card"
            onClick={() => handleSelect(item.type)}
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
