import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import CustomModal from '../../../Modal/CustomModal';
import { RootState } from '../../../../../store/store';
import ObjectsSelector, { ObjectItem } from './objects/ObjectsSelector';
import GameConditionsSelector from './systemConditions/GameConditionsSelector';
import ConditionSettingsPanel, { AvailableCondition, TargetItem } from './conditionSettings/ConditionSettingsPanel';

export interface LogicCondition {
  id: string;
  type: string;
  params: Record<string, any>;
}

interface AddConditionModalProps {
  open: boolean;
  onClose: () => void;
  onAddCondition: (newCondition: LogicCondition) => void;
  gameConditions: ObjectItem[];
}

// Локально выбранная цель с указанием типа
type ExtendedTargetItem = ObjectItem & { targetType: 'object' | 'gameCondition' };

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

  const [activeTab, setActiveTab] = useState<'objects' | 'gameConditions'>('objects');
  const [selectedTarget, setSelectedTarget] = useState<ExtendedTargetItem | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<AvailableCondition | null>(null);
  const [paramValue, setParamValue] = useState<string>('');

  const handleAdd = () => {
    if (selectedTarget && selectedCondition) {
      // Для условия onKeyDown оставляем параметр как строку (например, 'W'),
      // а для остальных преобразуем в число
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
  };
console.log(selectedTarget)
  return (
    <CustomModal open={open} onClose={onClose} title="Добавить условие">
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
        <div
          style={{
            flex: 0.5,
            borderRight: '3px solid #0053a0',
            paddingRight: '8px',
          }}
        >
          {activeTab === 'objects' ? (
            <>
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
