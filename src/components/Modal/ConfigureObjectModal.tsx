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
        <TabPane tab="Переменные" key="2">
          <h3>Управление переменными</h3>
          {/* Логика добавления переменных */}
        </TabPane>
        <TabPane tab="Логика" key="3">
          <h3>Добавить логику</h3>
          {/* Логика добавления логики */}
        </TabPane>
        <TabPane tab="Модификаторы" key="4">
          <h3>Модификаторы</h3>
          {/* Логика добавления модификаторов */}
        </TabPane>
      </Tabs>
    </CustomModal>
  );
};

export default ConfigureObjectModal;
