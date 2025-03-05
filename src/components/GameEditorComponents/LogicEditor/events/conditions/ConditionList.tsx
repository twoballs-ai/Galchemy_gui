import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CustomModal from '../../../Modal/CustomModal'; // подкорректируйте путь к модалке

export interface LogicCondition {
  id: string;
  type: string;
  params: Record<string, any>;
}

interface ConditionListProps {
  conditions: LogicCondition[];
  onAddCondition: (newCondition: LogicCondition) => void;
  onRemoveCondition: (conditionId: string) => void;
}

const ConditionList: React.FC<ConditionListProps> = ({
  conditions,
  onAddCondition,
  onRemoveCondition,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [conditionType, setConditionType] = useState('');
  const [conditionParam, setConditionParam] = useState('');

  const openModal = () => setModalOpen(true);
  const closeModal = () => {
    setModalOpen(false);
    setConditionType('');
    setConditionParam('');
  };

  const handleSubmit = () => {
    if (!conditionType.trim()) return;
    const newCondition: LogicCondition = {
      id: uuidv4(),
      type: conditionType,
      params: { key: conditionParam },
    };
    onAddCondition(newCondition);
    closeModal();
  };

  return (
    <div className="condition-list">
      <h4>Условия</h4>
      <ul>
        {conditions.map(cond => (
          <li key={cond.id}>
            {cond.type} (params: {JSON.stringify(cond.params)})
            <button onClick={() => onRemoveCondition(cond.id)}>x</button>
          </li>
        ))}
      </ul>
      <button onClick={openModal} className="add-condition-btn">
        + Добавить условие
      </button>

      <CustomModal open={modalOpen} onClose={closeModal} title="Добавить условие">
        <div className="condition-form">
          <label>
            Тип условия:
            <input
              type="text"
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value)}
            />
          </label>
          <label>
            Параметр:
            <input
              type="text"
              value={conditionParam}
              onChange={(e) => setConditionParam(e.target.value)}
            />
          </label>
        </div>
        <div className="custom-modal-footer">
          <button onClick={handleSubmit}>Добавить</button>
          <button onClick={closeModal}>Отмена</button>
        </div>
      </CustomModal>
    </div>
  );
};

export default ConditionList;
