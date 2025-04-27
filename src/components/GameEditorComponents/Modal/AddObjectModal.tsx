// src/components/AddObjectModal.tsx
"use client";

import React from "react";
import { v4 as uuidv4 } from "uuid";
import CustomModal from "./CustomModal";

import SphereIcon    from "../../../icons/circle.png";
import CubeIcon      from "../../../icons/circle.png";
import CylinderIcon  from "../../../icons/circle.png";

import "./AddObjectModal.scss";

interface AddObjectModalProps {
  open: boolean;
  onAdd: (payload: { id: string; type: PrimitiveType }) => void;
  onClose: () => void;
}

type PrimitiveType = "sphere" | "cube" | "cylinder";

const primitives: Array<{ title: string; type: PrimitiveType; icon: string }> =
[
  { title: "Сфера",     type: "sphere",    icon: SphereIcon    },
  { title: "Куб",       type: "cube",      icon: CubeIcon      },
  { title: "Цилиндр",   type: "cylinder",  icon: CylinderIcon  }
];

const AddObjectModal: React.FC<AddObjectModalProps> = ({ open, onAdd, onClose }) => {
  const handleSelect = (type: PrimitiveType) => {
    onAdd({ id: uuidv4(), type });
    onClose();
  };

  return (
    <CustomModal open={open} onClose={onClose} title="Добавить примитив">
      <div className="add-object-modal">
        {primitives.map((p) => (
          <div key={p.type} className="primitive-card" onClick={() => handleSelect(p.type)}>
            <img className="primitive-icon" src={p.icon} alt={p.title} />
            <span>{p.title}</span>
          </div>
        ))}
      </div>
    </CustomModal>
  );
};

export default AddObjectModal;
