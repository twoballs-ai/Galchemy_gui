import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import CustomModal from '../../../Modal/CustomModal';
import { RootState } from '../../../../../store/store';
import ObjectsSelector, { ObjectItem } from './objects/ObjectsSelector';
import GameConditionsSelector from './systemConditions/GameConditionsSelector';

export interface LogicCondition {
  id: string;
  type: string;
  params: Record<string, any>;
}

// Пропсы: список игровых условий передаётся через пропсы
interface AddConditionModalProps {
  open: boolean;
  onClose: () => void;
  onAddCondition: (newCondition: LogicCondition) => void;
  gameConditions: ObjectItem[];
}

// Тип выбранной цели с указанием её типа
type TargetItem = ObjectItem & { targetType: 'object' | 'gameCondition' };

// Тип доступного условия для выбранной цели
type AvailableCondition = {
  id: string;
  name: string;
  defaultParams: Record<string, any>;
};

// Доступные условия для объектов
const availableObjectConditions: AvailableCondition[] = [
  { id: 'moveLeft', name: 'Движение влево', defaultParams: { speed: 5 } },
  { id: 'moveRight', name: 'Движение вправо', defaultParams: { speed: 5 } },
];

// Доступные условия для игровых условий
const availableGameConditions: AvailableCondition[] = [
  { id: 'keyPressW', name: 'Нажатие W', defaultParams: { delay: 0 } },
  { id: 'keyPressS', name: 'Нажатие S', defaultParams: { delay: 0 } },
];

const AddConditionModal: React.FC<AddConditionModalProps> = ({
  open,
  onClose,
  onAddCondition,
}) => {
  // Получаем список игровых объектов из Redux (предполагается, что они хранятся в state.sceneObjects.objects)
  const objects = useSelector((state: RootState) => state.sceneObjects.objects);
  const gameObjects: ObjectItem[] = React.useMemo(
    () => objects.map(obj => ({ id: obj.id, name: obj.name })),
    [objects]
  );
  // Локальное состояние для переключения между вкладками: 'objects' или 'gameConditions'
  const [activeTab, setActiveTab] = useState<'objects' | 'gameConditions'>('objects');

  // Состояние выбранной цели (из левой части)
  const [selectedTarget, setSelectedTarget] = useState<TargetItem | null>(null);
  // Состояние выбранного конкретного условия для цели (в правой части)
  const [selectedCondition, setSelectedCondition] = useState<AvailableCondition | null>(null);
  // Значение параметра, введённое пользователем (например, скорость или задержка)
  const [paramValue, setParamValue] = useState<string>('');

  const handleAdd = () => {
    if (selectedTarget && selectedCondition) {
      const newCondition: LogicCondition = {
        id: uuidv4(),
        type: selectedCondition.name,
        params: {
          targetId: selectedTarget.id,
          value:
            paramValue !== ''
              ? parseFloat(paramValue)
              : selectedTarget.targetType === 'object'
              ? availableObjectConditions.find(c => c.id === selectedCondition.id)?.defaultParams.speed
              : availableGameConditions.find(c => c.id === selectedCondition.id)?.defaultParams.delay,
        },
      };
      onAddCondition(newCondition);
      setSelectedTarget(null);
      setSelectedCondition(null);
      setParamValue('');
      onClose();
    }
  };

  return (
    <CustomModal open={open} onClose={onClose} title="Добавить условие">
      {/* Переключатель вкладок для левой части */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <button
          onClick={() => {
            setActiveTab('objects');
            setSelectedTarget(null);
          }}
          style={{
            padding: '8px',
            borderBottom: activeTab === 'objects' ? '2px solid #0053a0' : 'none',
          }}
        >
          Объекты
        </button>
        <button
          onClick={() => {
            setActiveTab('gameConditions');
            setSelectedTarget(null);
          }}
          style={{
            padding: '8px',
            borderBottom: activeTab === 'gameConditions' ? '2px solid #0053a0' : 'none',
          }}
        >
          Игровые условия
        </button>
      </div>
      <div
        className="add-condition-modal"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          minWidth: '600px',
          minHeight: '300px',
        }}
      >
        {/* Левая часть: отображение соответствующего селектора */}
        <div
          style={{
            flex: 1,
            borderRight: '1px solid #ccc',
            paddingRight: '8px',
          }}
        >
          {activeTab === 'objects' ? (
            <>
              <h4>Объекты</h4>
              <ObjectsSelector
                objects={gameObjects}
                selectedId={selectedTarget?.targetType === 'object' ? selectedTarget.id : null}
                onSelect={(obj) => setSelectedTarget({ ...obj, targetType: 'object' })}
              />
            </>
          ) : (
            <>
              <h4>Игровые условия</h4>
              <GameConditionsSelector
                selectedId={selectedTarget?.targetType === 'gameCondition' ? selectedTarget.id : null}
                onSelect={(cond) => setSelectedTarget({ ...cond, targetType: 'gameCondition' })}
              />
            </>
          )}
        </div>
        {/* Правая часть: настройки условия */}
        <div style={{ flex: 1, paddingLeft: '8px' }}>
          <h4>Настройки условия</h4>
          {selectedTarget ? (
            <div>
              <div style={{ marginBottom: '8px' }}>
                Выбрана цель: <strong>{selectedTarget.name}</strong> ({selectedTarget.targetType === 'object' ? 'Объект' : 'Игровое условие'})
              </div>
              <div style={{ marginBottom: '8px' }}>
                <h5>Выберите условие:</h5>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {selectedTarget.targetType === 'object'
                    ? availableObjectConditions.map((cond) => (
                        <div
                          key={cond.id}
                          onClick={() => setSelectedCondition(cond)}
                          style={{
                            padding: '4px 8px',
                            background: selectedCondition?.id === cond.id ? '#ddd' : 'transparent',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '4px',
                          }}
                        >
                          {cond.name}
                        </div>
                      ))
                    : availableGameConditions.map((cond) => (
                        <div
                          key={cond.id}
                          onClick={() => setSelectedCondition(cond)}
                          style={{
                            padding: '4px 8px',
                            background: selectedCondition?.id === cond.id ? '#ddd' : 'transparent',
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
              {selectedCondition && (
                <div style={{ marginBottom: '8px' }}>
                  <label>
                    Значение параметра:
                    <input
                      type="number"
                      value={paramValue}
                      onChange={(e) => setParamValue(e.target.value)}
                      style={{ marginLeft: '8px', padding: '4px', width: '80px' }}
                      placeholder={
                        selectedTarget.targetType === 'object'
                          ? availableObjectConditions.find(c => c.id === selectedCondition.id)?.defaultParams.speed.toString()
                          : availableGameConditions.find(c => c.id === selectedCondition.id)?.defaultParams.delay.toString()
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#888' }}>Сначала выберите цель в левой части</div>
          )}
        </div>
      </div>
      <div style={{ marginTop: '16px', textAlign: 'right' }}>
        <button onClick={handleAdd} disabled={!selectedTarget || !selectedCondition || paramValue === ''}>
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
