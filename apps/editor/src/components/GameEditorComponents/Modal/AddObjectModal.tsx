"use client";

import React from "react";
import { v4 as uuidv4 } from "uuid";
import CustomModal from "./CustomModal";

import SphereIcon from "../../../icons/circle.png";
import CubeIcon from "../../../icons/square.png";
import CylinderIcon from "../../../icons/rectangle.png";
import CameraIcon from "../../../icons/enemy.png";
import LightIcon from "../../../icons/tilesmap.png";
import TerrainIcon from "../../../icons/rectangle.png";
import CharacterIcon from "../../../icons/character.png";
import "./AddObjectModal.scss";

export interface AddObjectPayload {
  id: string;
  type: ObjectType;
  name: string;
  x: number;
  y: number;
  z: number;
  radius?: number;
  segments?: number;
  width?: number;
  height?: number;
  depth?: number;
  subtype?: LightSubtype | CameraSubtype;
  title?: string;
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  rotation?: [number, number, number];
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  scale?: [number, number, number];
    // Новые поля для спрайта
  plane?: 'xy' | 'xz' | 'yz';  // плоскость ориентации
  imageSrc?: string;            // путь к текстуре
}

interface AddObjectModalProps {
  open: boolean;
  onAdd: (payload: AddObjectPayload) => void;
  onClose: () => void;
}

export type ObjectType =
  | "sphere"
  | "cube"
  | "cylinder"
  | "capsule"
  | "cone"
  | "torus"
  | "icosahedron"
  | "pyramid"
  | "prism"
  | "camera"
  | "light"
  | "terrain"
  | "plane"
  | "water"
  | "sprite"
  | "character"
  | "spawnPoint"
  | "model";

export type LightSubtype = "point" | "directional" | "ambient";
export type CameraSubtype = "game" | "first" | "third" | "topdown";

interface GroupedItem {
  title: string;
  type: ObjectType;
  icon: string;
  subtype?: LightSubtype | CameraSubtype;
}

const groupedObjects: { group: string; items: GroupedItem[] }[] = [
  {
    group: "Gameplay",
    items: [
      { title: "Точка спавна", type: "spawnPoint", icon: CharacterIcon },
      { title: "Персонаж", type: "character", icon: CharacterIcon },
      { title: "Спрайт", type: "sprite", icon: CharacterIcon },
    ],
  },
  {
    group: "Модели / Объекты сцены",
    items: [{ title: "3D Модель", type: "model", icon: CharacterIcon }],
  },
  {
    group: "Камеры",
    items: [
      { title: "Игровая камера", type: "camera", icon: CameraIcon, subtype: "game" },
      { title: "От первого лица", type: "camera", icon: CameraIcon, subtype: "first" },
      { title: "От третьего лица", type: "camera", icon: CameraIcon, subtype: "third" },
      { title: "Top-Down", type: "camera", icon: CameraIcon, subtype: "topdown" },
    ],
  },
  {
    group: "Освещение",
    items: [
      { title: "Точечный свет", type: "light", subtype: "point", icon: LightIcon },
      { title: "Направленный свет", type: "light", subtype: "directional", icon: LightIcon },
      { title: "Рассеянный свет", type: "light", subtype: "ambient", icon: LightIcon },
    ],
  },
  {
    group: "Окружение",
    items: [
      { title: "Поверхность", type: "plane", icon: TerrainIcon },
      { title: "Вода", type: "water", icon: TerrainIcon },
      { title: "Террейн", type: "terrain", icon: TerrainIcon },
    ],
  },
  {
    group: "3D Примитивы",
    items: [
      { title: "Сфера", type: "sphere", icon: SphereIcon },
      { title: "Куб", type: "cube", icon: CubeIcon },
      { title: "Цилиндр", type: "cylinder", icon: CylinderIcon },
      { title: "Капсула", type: "capsule", icon: CylinderIcon },
      { title: "Конус", type: "cone", icon: CylinderIcon },
      { title: "Тор (Бублик)", type: "torus", icon: CylinderIcon },
      { title: "Икосаэдр", type: "icosahedron", icon: SphereIcon },
      { title: "Пирамида", type: "pyramid", icon: CubeIcon },
      { title: "Призма", type: "prism", icon: CubeIcon },
    ],
  },
];

const AddObjectModal: React.FC<AddObjectModalProps> = ({ open, onAdd, onClose }) => {
  const handleSelect = (item: GroupedItem) => {
    const base = {
      id: uuidv4(),
      type: item.type,
      name: item.title,
      x: 0,
      y: 0,
      z: 0,
      ...(item.subtype ? { subtype: item.subtype } : {}),
    };

    if (item.type === "sphere") onAdd({ ...base, radius: 1, segments: 24 });
    else if (item.type === "cube") onAdd({ ...base, width: 1, height: 1, depth: 1 });
    else if (item.type === "cylinder") onAdd({ ...base, radius: 1, height: 2 });
    else if (item.type === "capsule") onAdd({ ...base, radius: 0.5, height: 2, segments: 16 });
    else if (item.type === "cone") onAdd({ ...base, radius: 1, height: 2, segments: 32 });
    else if (item.type === "torus") onAdd({ ...base, outerRadius: 1, innerRadius: 0.3, segmentsOuter: 32, segmentsInner: 16 });
    else if (item.type === "icosahedron") onAdd({ ...base, radius: 1 });
    else if (item.type === "pyramid") onAdd({ ...base, baseSize: 1, height: 1 });
    else if (item.type === "prism") onAdd({ ...base, width: 1, height: 1, depth: 1 });
    else if (item.type === "terrain") onAdd({ ...base, width: 12, depth: 12 });
    else if (item.type === "plane") onAdd({ ...base, width: 10, depth: 10 });
    else if (item.type === "water") onAdd({ ...base, width: 16, depth: 16 });
    else if (item.type === "sprite") onAdd({ 
  ...base, 
  width: 1,           // ширина в мировых единицах (не пиксели!)
  height: 1,          // высота в мировых единицах
  plane: 'xy',        // плоскость по умолчанию
  imageSrc: '/textures/default_sprite.png' // картинка-заглушка
});
    else onAdd(base);

    onClose();
  };

  return (
    <CustomModal open={open} onClose={onClose} title="Добавить объект">
      <div className="add-object-modal">
        {groupedObjects.map(({ group, items }) => (
          <div key={group} className="object-group">
            <h3 className="group-title">{group}</h3>
            <div className="group-items">
              {items.map((item) => (
                <div key={item.title} className="primitive-card" onClick={() => handleSelect(item)}>
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
