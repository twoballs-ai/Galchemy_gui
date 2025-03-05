import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CustomModal from '../../../Modal/CustomModal';

export interface LogicCondition {
  id: string;
  type: string;
  params: Record<string, any>;
}

interface AddConditionModalProps {
  open: boolean;
  onClose: () => void;
  onAddCondition: (newCondition: LogicCondition) => void;
  // Списки объектов и игровых условий, которые можно выбрать
  gameObjects: Array<{ id: string; name: string }>;
  gameConditions: Array<{ id: string; name: string }>;
}

const AddConditionModal: React.FC<AddConditionModalProps> = ({
  open,
  onClose,
  onAddCondition,
  gameObjects,
  gameConditions,
}) => {
  // Выбранная вкладка: 'objects' или 'conditions'
  const [activeTab, setActiveTab] = useState<'objects' | 'conditions'>('objects');
  // Выбранный элемент (объект или условие)
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);
  // Пример дополнительного параметра (например, значение ключа)
  const [param, setParam] = useState('');

  const handleAdd = () => {
    if (selectedItem) {
      const newCondition: LogicCondition = {
        id: uuidv4(),
        type: selectedItem.name,
        params: { key: param },
      };
      onAddCondition(newCondition);
      onClose();
      setSelectedItem(null);
      setParam('');
    }
  };

  return (
    <CustomModal open={open} onClose={onClose} title="Добавить условие">
      <div
        className="add-condition-modal"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          minWidth: '500px',
          minHeight: '250px',
        }}
      >
        {/* Левая часть: вкладки с выбором */}
        <div className="modal-left" style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '8px' }}>
          <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div
              className={`tab ${activeTab === 'objects' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('objects');
                setSelectedItem(null);
              }}
              style={{
                padding: '8px',
                cursor: 'pointer',
                borderBottom: activeTab === 'objects' ? '2px solid #0053a0' : 'none',
              }}
            >
              Объекты
            </div>
            <div
              className={`tab ${activeTab === 'conditions' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('conditions');
                setSelectedItem(null);
              }}
              style={{
                padding: '8px',
                cursor: 'pointer',
                borderBottom: activeTab === 'conditions' ? '2px solid #0053a0' : 'none',
              }}
            >
              Игровые условия
            </div>
          </div>
          <div
            className="tab-content"
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              marginTop: '8px',
            }}
          >
            {activeTab === 'objects' &&
              gameObjects.map(obj => (
                <div
                  key={obj.id}
                  onClick={() => setSelectedItem(obj)}
                  style={{
                    padding: '4px 8px',
                    background: selectedItem?.id === obj.id ? '#ddd' : 'transparent',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    marginBottom: '4px',
                  }}
                >
                  {obj.name}
                </div>
              ))}
            {activeTab === 'conditions' &&
              gameConditions.map(cond => (
                <div
                  key={cond.id}
                  onClick={() => setSelectedItem(cond)}
                  style={{
                    padding: '4px 8px',
                    background: selectedItem?.id === cond.id ? '#ddd' : 'transparent',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    marginBottom: '4px',
                  }}
                >
                  {cond.name}
                </div>
              ))}
          </div>
        </div>

        {/* Правая часть: детали выбранного элемента */}
        <div className="modal-right" style={{ flex: 1, paddingLeft: '8px' }}>
          <h4 style={{ marginBottom: '8px' }}>Настройки условия</h4>
          {selectedItem ? (
            <div>
              <div style={{ marginBottom: '8px' }}>Выбран: <strong>{selectedItem.name}</strong></div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Параметр:
                <input
                  type="text"
                  value={param}
                  onChange={(e) => setParam(e.target.value)}
                  style={{ marginLeft: '8px', padding: '4px' }}
                />
              </label>
            </div>
          ) : (
            <div style={{ color: '#888' }}>Сначала выберите объект или условие</div>
          )}
        </div>
      </div>
      <div
        className="custom-modal-footer"
        style={{ marginTop: '16px', textAlign: 'right' }}
      >
        <button onClick={handleAdd} disabled={!selectedItem}>
          Добавить
        </button>
        <button onClick={onClose} style={{ marginLeft: '8px' }}>
          Отмена
        </button>
      </div>
    </CustomModal>
  );
};

export default AddConditionModal;
