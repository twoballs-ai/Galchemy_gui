import React, { useState } from 'react';
import { Tabs } from 'antd';
import CustomModal from './CustomModal';

const { TabPane } = Tabs;

interface ConfigureObjectModalProps {
  open: boolean;
  onClose: () => void;
  selectedObject: any;
  onSave: (updatedObject: any) => void;
}

const ConfigureObjectModal: React.FC<ConfigureObjectModalProps> = ({
  open,
  onClose,
  selectedObject,
  onSave,
}) => {
  const [image, setImage] = useState<string | null>(selectedObject?.image || null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updatedObject = { ...selectedObject, image };
    onSave(updatedObject);
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={`Настройка объекта: ${selectedObject?.name || ''}`}
      footer={
        <button onClick={handleSave} style={{ marginTop: '10px' }}>
          Сохранить объект
        </button>
      }
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="Изображение" key="1">
          <h3>Добавить изображение</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
          {image && (
            <div style={{ marginTop: '10px' }}>
              <img
                src={image}
                alt="Uploaded"
                style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }}
              />
            </div>
          )}
        </TabPane>
        {selectedObject?.type === 'spriteGrid' && (
          <TabPane tab="Параметры Grid" key="2">
            <h3>Настройки Grid</h3>
            <label>
              Повторения по X:
              <input
                type="number"
                defaultValue={selectedObject?.repeatX || 1}
                onChange={(e) =>
                  (selectedObject.repeatX = parseInt(e.target.value, 10))
                }
              />
            </label>
            <label>
              Отступ по X:
              <input
                type="number"
                defaultValue={selectedObject?.spacingX || 0}
                onChange={(e) =>
                  (selectedObject.spacingX = parseInt(e.target.value, 10))
                }
              />
            </label>
          </TabPane>
        )}
        <TabPane tab="Переменные" key="3">
          <h3>Управление переменными</h3>
        </TabPane>
        <TabPane tab="Логика" key="4">
          <h3>Добавить логику</h3>
        </TabPane>
      </Tabs>
    </CustomModal>
  );
};

export default ConfigureObjectModal;
