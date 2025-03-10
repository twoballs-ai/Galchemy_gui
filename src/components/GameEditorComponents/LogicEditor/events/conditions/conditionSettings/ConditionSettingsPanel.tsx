import React from 'react';

export interface AvailableCondition {
  id: string;
  name: string;
  defaultParams: Record<string, any>;
}

export interface TargetItem {
  id: string;
  name: string;
  image?: string;
  type: string;
  targetType: 'object' | 'gameCondition';
}

interface ConditionSettingsPanelProps {
  target: TargetItem;
  selectedCondition: AvailableCondition | null;
  onSelectCondition: (condition: AvailableCondition) => void;
  paramValue: string;
  onParamValueChange: (value: string) => void;
}

// Опции клавиш для условия "Нажатие клавиши"
const keyOptions = [
  { value: 'W', label: 'W' },
  { value: 'A', label: 'A' },
  { value: 'S', label: 'S' },
  { value: 'D', label: 'D' },
  { value: 'Space', label: 'Space' },
  { value: 'Enter', label: 'Enter' },
];

const ConditionSettingsPanel: React.FC<ConditionSettingsPanelProps> = ({
  target,
  selectedCondition,
  onSelectCondition,
  paramValue,
  onParamValueChange,
}) => {
  // Определяем группы условий в зависимости от типа объекта
  const conditionGroupsByType: Record<string, Record<string, AvailableCondition[]>> = {
    character: {
      'Нажатия клавиатуры': [
        { id: 'onKeyDown', name: 'Нажатие клавиши', defaultParams: { key: 'Space', delay: 0 } },
        { id: 'onKeyUp', name: 'Отпускание клавиши', defaultParams: { key: 'Space', delay: 0 } },
      ],
      'Нажатия мыши': [
        { id: 'onMouseClick', name: 'Клик мышью', defaultParams: {} },
      ],
      'Нажатия на экран': [
        { id: 'onTouch', name: 'Сенсорное касание', defaultParams: {} },
      ],
    },
    sprite: {
      'Movement': [
        { id: 'moveLeft', name: 'Движение влево', defaultParams: { speed: 5 } },
        { id: 'moveRight', name: 'Движение вправо', defaultParams: { speed: 5 } },
      ],
    },
    default: {
      'Default Conditions': [
        { id: 'defaultCondition', name: 'Условие по умолчанию', defaultParams: {} },
      ],
    },
  };

  const groups = conditionGroupsByType[target.type] || conditionGroupsByType.default;

  return (
    <div style={{ flex: 1, paddingLeft: '8px', display: 'flex', flexDirection: 'row', gap: '16px' }}>
      {/* Левая колонка: список групп условий */}
      <div style={{ flex: 1,          borderRight: '3px solid #0053a0',
            paddingRight: '8px', }}>
        {Object.entries(groups).map(([groupName, conditions]) => (
          <div key={groupName} style={{ marginBottom: '16px' }}>
            <h5>{groupName}</h5>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {conditions.map((cond) => (
                <div
                  key={cond.id}
                  onClick={() => onSelectCondition(cond)}
                  style={{
                    
                    padding: '4px 8px',
                    background: selectedCondition?.id === cond.id ? '#0053a0' : 'transparent',
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
        ))}
      </div>
      {/* Правая колонка: выбор конкретного параметра */}
      {selectedCondition && selectedCondition.id === 'onKeyDown' ? (
        <div style={{ flex: 1 }}>
          <h5>Выберите клавишу</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {keyOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => onParamValueChange(option.value)}
                style={{
                  padding: '4px 8px',
                  background: paramValue === option.value ? '#0053a0' : 'transparent',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Если условие не требует выбора из списка, показываем числовой ввод (если требуется)
        <div style={{ flex: 1 }}>
          {selectedCondition && (
            <div style={{ marginBottom: '8px' }}>
              <label>
                Значение параметра:
                <input
                  type="number"
                  value={paramValue}
                  onChange={(e) => onParamValueChange(e.target.value)}
                  style={{ marginLeft: '8px', padding: '4px', width: '80px' }}
                  placeholder={
                    selectedCondition.defaultParams.speed?.toString() ||
                    selectedCondition.defaultParams.delay?.toString() ||
                    ''
                  }
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConditionSettingsPanel;
