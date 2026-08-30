import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './Tabs.scss';

interface Tab {
  key: string;
  sceneName: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabClick: (tabKey: string) => void;
  onRemoveTab: (tabKey: string) => void;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabClick,
  onRemoveTab,
}) => {
  const maxTabWidth = 150;
  const minTabWidth = 90;
  const containerWidth = 1000;

  const tabWidth = Math.max(
    minTabWidth,
    Math.min(maxTabWidth, containerWidth / tabs.length)
  );

  const handleRemoveTab = (tabKey: string) => {
    // Если это последняя вкладка, не даём её закрыть
    if (tabs.length === 1) {
      return; // Не выполняем удаление
    }
    onRemoveTab(tabKey); // Удаляем вкладку, если она не последняя
  };

  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={`tab ${activeTab === tab.key ? 'tab--active' : ''}`}
          onClick={() => onTabClick(tab.key)}
          style={{ width: `${tabWidth}px` }}
        >
          {tab.sceneName}
          <CloseOutlined
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTab(tab.key); // Используем новую функцию для удаления вкладки
            }}
            className="close-icon"
          />
        </div>
      ))}
    </div>
  );
};

export default Tabs;
