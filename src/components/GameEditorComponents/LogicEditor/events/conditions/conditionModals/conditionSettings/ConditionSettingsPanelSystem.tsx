import React from 'react';
import { AvailableCondition, TargetItem } from './ConditionSettingsPanel';

interface ConditionSettingsPanelSystemProps {
  target: TargetItem;
  selectedCondition: AvailableCondition | null;
  paramValue: string;
  onParamValueChange: (value: string) => void;
}

const ConditionSettingsPanelSystem: React.FC<ConditionSettingsPanelSystemProps> = ({
  target,
  selectedCondition,
  paramValue,
  onParamValueChange,
}) => {
  if (!selectedCondition) {
    return <div style={{ color: '#888' }}>Сначала выберите условие</div>;
  }
  
  return (
    <div
      style={{
        flex: 1,
        paddingLeft: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Отображаем только панель для ввода параметров выбранного системного условия */}
      {selectedCondition.id === 'onKeyDown' ? (
        <div>
          <h5>Выберите клавишу</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { value: 'W', label: 'W' },
              { value: 'A', label: 'A' },
              { value: 'S', label: 'S' },
              { value: 'D', label: 'D' },
              { value: 'Space', label: 'Space' },
              { value: 'Enter', label: 'Enter' },
            ].map((option) => (
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
        <div style={{ marginTop: '16px' }}>
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
  );
};

export default ConditionSettingsPanelSystem;
