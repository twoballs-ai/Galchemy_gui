import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import CustomModal from '../../../../Modal/CustomModal';
import { RootState } from '../../../../../../store/store';
import ObjectsSelector, { ObjectItem } from './objects/ObjectsSelector';
import ConditionSettingsPanel, { AvailableCondition, TargetItem } from './conditionSettings/ConditionSettingsPanel';
import ConditionSettingsPanelSystem from './conditionSettings/ConditionSettingsPanelSystem';
import GameConditionsSelector from './systemConditions/GameConditionsSelector';

export interface LogicCondition {
  id: string;
  type: string;
  params: Record<string, any>;
}

// Локально выбранная цель с указанием типа
type ExtendedTargetItem = ObjectItem & { targetType: 'object' | 'gameCondition' };

interface AddConditionModalProps {
  open: boolean;
  onClose: () => void;
  onAddCondition: (newCondition: LogicCondition) => void;
  // Для объектов используем данные из стора, для игровых условий группировка происходит внутри GameConditionsSelector
  gameConditions: ObjectItem[]; // Можно удалить, если не используется
}

const AddConditionModal: React.FC<AddConditionModalProps> = ({
  open,
  onClose,
  onAddCondition,
}) => {
  const objects = useSelector((state: RootState) => state.sceneObjects.objects);
  const gameObjects: ObjectItem[] = React.useMemo(
    () =>
      objects.map(obj => ({
        id: obj.id,
        name: obj.name,
        image: obj.image,
        type: obj.type,
      })),
    [objects]
  );

  // Режимы: "objects" – выбор объекта, затем условие, затем параметр;
  // "gameConditions" – сразу выбор системного условия и параметра
  const [activeTab, setActiveTab] = useState<'objects' | 'gameConditions'>('objects');
  const [selectedTarget, setSelectedTarget] = useState<ExtendedTargetItem | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<AvailableCondition | null>(null);
  const [paramValue, setParamValue] = useState<string>('');

  // Функция для преобразования выбранного условия из GameConditionsSelector в AvailableCondition
  const mapToAvailableCondition = (cond: ObjectItem): AvailableCondition => {
    switch (cond.id) {
      case 'onKeyDown':
        return { id: 'onKeyDown', name: 'Нажатие клавиши', defaultParams: { key: 'Space', delay: 0 } };
      case 'onKeyUp':
        return { id: 'onKeyUp', name: 'Отпускание клавиши', defaultParams: { key: 'Space', delay: 0 } };
      case 'onMouseClick':
        return { id: 'onMouseClick', name: 'Клик мышью', defaultParams: {} };
      case 'onTouch':
        return { id: 'onTouch', name: 'Сенсорное касание', defaultParams: {} };
      default:
        return { id: cond.id, name: cond.name, defaultParams: {} };
    }
  };

  const handleAdd = () => {
    if (activeTab === 'objects') {
      if (selectedTarget && selectedCondition) {
        const value =
          selectedCondition.id === 'onKeyDown'
            ? paramValue !== '' ? paramValue : selectedCondition.defaultParams.key
            : paramValue !== ''
            ? parseFloat(paramValue)
            : selectedCondition.defaultParams.speed ||
              selectedCondition.defaultParams.delay ||
              null;

        const newCondition: LogicCondition = {
          id: uuidv4(),
          type: selectedCondition.name,
          params: {
            targetId: selectedTarget.id,
            value,
          },
        };
        onAddCondition(newCondition);
        setSelectedTarget(null);
        setSelectedCondition(null);
        setParamValue('');
        onClose();
      }
    } else {
      // В режиме игровых условий цель не выбирается вручную.
      if (selectedCondition) {
        const value =
          selectedCondition.id === 'onKeyDown'
            ? paramValue !== '' ? paramValue : selectedCondition.defaultParams.key
            : paramValue !== ''
            ? parseFloat(paramValue)
            : selectedCondition.defaultParams.speed ||
              selectedCondition.defaultParams.delay ||
              null;
        // Формируем target из выбранного системного условия
        const target: TargetItem = {
          id: selectedCondition.id,
          name: selectedCondition.name,
          type: 'system',
          targetType: 'gameCondition',
        };
        const newCondition: LogicCondition = {
          id: uuidv4(),
          type: selectedCondition.name,
          params: {
            targetId: target.id,
            value,
          },
        };
        onAddCondition(newCondition);
        setSelectedTarget(null);
        setSelectedCondition(null);
        setParamValue('');
        onClose();
      }
    }
  };

  return (
    <CustomModal open={open} onClose={onClose} title="Добавить условие">
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <button
          onClick={() => {
            setActiveTab('objects');
            setSelectedTarget(null);
            setSelectedCondition(null);
            setParamValue('');
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
            setSelectedCondition(null);
            setParamValue('');
          }}
          style={{
            padding: '8px',
            borderBottom: activeTab === 'gameConditions' ? '2px solid #0053a0' : 'none',
          }}
        >
          Игровые условия
        </button>
      </div>
      {activeTab === 'objects' ? (
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
          {/* Левая колонка: выбор объекта */}
          <div
            style={{
              flex: 0.5,
              borderRight: '3px solid #0053a0',
              paddingRight: '8px',
            }}
          >
            <h4>Объекты</h4>
            <ObjectsSelector
              objects={gameObjects}
              selectedId={selectedTarget?.targetType === 'object' ? selectedTarget.id : null}
              onSelect={(obj) => {
                setSelectedTarget({ ...obj, targetType: 'object' });
                setSelectedCondition(null);
                setParamValue('');
              }}
            />
          </div>
          {/* Правая колонка: выбор условия и параметра для объекта */}
          {selectedTarget ? (
            <ConditionSettingsPanel
              target={selectedTarget}
              selectedCondition={selectedCondition}
              onSelectCondition={setSelectedCondition}
              paramValue={paramValue}
              onParamValueChange={setParamValue}
            />
          ) : (
            <div style={{ flex: 1, paddingLeft: '8px', color: '#888' }}>
              Сначала выберите цель в левой части
            </div>
          )}
        </div>
      ) : (
        // Режим "Игровые условия": двухколоночная схема
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
          {/* Левая колонка: вывод групп системных условий */}
          <div
            style={{
              flex: 0.5,
              borderRight: '3px solid #0053a0',
              paddingRight: '8px',
            }}
          >
            <h4>Игровые условия</h4>
            <GameConditionsSelector
              selectedId={selectedCondition ? selectedCondition.id : null}
              onSelect={(cond) => {
                // Преобразуем выбранное условие в AvailableCondition с дефолтными параметрами
                const availableCondition = mapToAvailableCondition(cond);
                setSelectedCondition(availableCondition);
                setParamValue('');
              }}
            />
          </div>
          {/* Правая колонка: только панель ввода параметров */}
          <ConditionSettingsPanelSystem
            target={{ id: '', name: '', type: 'system', targetType: 'gameCondition' }}
            selectedCondition={selectedCondition}
            paramValue={paramValue}
            onParamValueChange={setParamValue}
          />
        </div>
      )}
      <div style={{ marginTop: '16px', textAlign: 'right' }}>
        <button
          onClick={handleAdd}
          disabled={
            activeTab === 'objects'
              ? !selectedTarget || !selectedCondition || paramValue === ''
              : !selectedCondition || paramValue === ''
          }
        >
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
