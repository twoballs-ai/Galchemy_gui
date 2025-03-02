"use client";

import React, { useState, useEffect } from "react";
import { Tabs } from "antd";
import CustomModal from "./CustomModal";

const { TabPane } = Tabs;

interface ConfigureObjectModalProps {
  open: boolean;
  onClose: () => void;
  selectedAddObject: any;
  onSave: (updatedObject: any) => void;
}

const ConfigureObjectModal: React.FC<ConfigureObjectModalProps> = ({
  open,
  onClose,
  selectedAddObject,
  onSave,
}) => {
  // Определяем, является ли объект анимированным (enemy или character)
  const isAnimatedObject =
    selectedAddObject?.type === "enemy" || selectedAddObject?.type === "character";

  // Состояние для переключения режима в одной вкладке: "image" или "animations"
  const [activeMediaTab, setActiveMediaTab] = useState("image");
  const [useAnimations, setUseAnimations] = useState(selectedAddObject?.isAnimated || false);

  // Состояние для обычного изображения (sprite)
  const [image, setImage] = useState<string | null>(
    selectedAddObject?.image || null
  );

  // Состояние для анимаций: для каждого типа анимации свой массив кадров
  const [animationFrames, setAnimationFrames] = useState<{
    idle: string[];
    run: string[];
    jump: string[];
    attack: string[];
  }>({
    idle: selectedAddObject?.animations?.idle || [],
    run: selectedAddObject?.animations?.run || [],
    jump: selectedAddObject?.animations?.jump || [],
    attack: selectedAddObject?.animations?.attack || [],
  });

  // Обработчик загрузки изображения для режима "image"
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Обработчик загрузки кадров для конкретного типа анимации
  const handleAnimationUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    animType: "idle" | "run" | "jump" | "attack"
  ) => {
    const files = event.target.files;
    if (!files) return;
    const frames: string[] = [];
    let loaded = 0;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        frames.push(reader.result as string);
        loaded++;
        if (loaded === files.length) {
          setAnimationFrames((prev) => ({
            ...prev,
            [animType]: frames,
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    const updatedObject = { ...selectedAddObject, isAnimated: useAnimations };
    if (useAnimations) {
      updatedObject.image = image;
      updatedObject.animations = {
        idle: animationFrames.idle,
        run: animationFrames.run,
        jump: animationFrames.jump,
        attack: animationFrames.attack,
      };
    } else {
      updatedObject.image = image;
    }
    onSave(updatedObject);
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={`Настройка объекта: ${selectedAddObject?.name || ""}`}
      footer={
        <button onClick={handleSave} style={{ marginTop: "10px" }}>
          Сохранить объект
        </button>
      }
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="Изображение" key="1">
          {isAnimatedObject && (
            <div className="mb-4 flex gap-4">
              <button
                className={`${
                  activeMediaTab === "image"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                } px-3 py-1 rounded`}
                onClick={() => setActiveMediaTab("image")}
              >
                Изображение
              </button>
              <button
                className={`${
                  activeMediaTab === "animations"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                } px-3 py-1 rounded`}
                onClick={() => setActiveMediaTab("animations")}
              >
                Анимации
              </button>
            </div>
          )}
          {activeMediaTab === "image" ? (
            <>
              <h3>Добавить изображение</h3>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {image && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={image}
                    alt="Uploaded"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <h3>Загрузите кадры анимаций</h3>
              {(["idle", "run", "jump", "attack"] as const).map((animType) => (
                <div key={animType} className="mb-4">
                  <label className="block font-semibold capitalize">
                    {animType}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleAnimationUpload(e, animType)}
                  />
                  {animationFrames[animType].length > 0 && (
                    <div
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {animationFrames[animType].map((frame, idx) => (
                        <img
                          key={idx}
                          src={frame}
                          alt={`${animType} frame ${idx}`}
                          style={{
                            maxWidth: "100px",
                            maxHeight: "100px",
                            border: "1px solid #ccc",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </TabPane>
  
        {/* Если объект типа spriteGrid, добавляем отдельную вкладку для параметров Grid */}
        {selectedAddObject?.type === "spriteGrid" && (
          <TabPane tab="Параметры Grid" key="2">
            <h3>Настройки Grid</h3>
            <label>
              Повторения по X:
              <input
                type="number"
                defaultValue={selectedAddObject?.repeatX || 1}
                onChange={(e) =>
                  (selectedAddObject.repeatX = parseInt(e.target.value, 10))
                }
              />
            </label>
            <label>
              Отступ по X:
              <input
                type="number"
                defaultValue={selectedAddObject?.spacingX || 0}
                onChange={(e) =>
                  (selectedAddObject.spacingX = parseInt(e.target.value, 10))
                }
              />
            </label>
          </TabPane>
        )}
  
        <TabPane tab="Переменные" key={isAnimatedObject ? "3" : "2"}>
          <h3>Управление переменными</h3>
          {/* Дополнительная логика для переменных */}
        </TabPane>
  
        <TabPane tab="Логика" key={isAnimatedObject ? "4" : "3"}>
          <h3>Добавить логику</h3>
          {/* Дополнительная логика для обработки */}
        </TabPane>
      </Tabs>
    </CustomModal>
  );
};

export default ConfigureObjectModal;
