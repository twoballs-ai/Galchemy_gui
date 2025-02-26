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
  showGlobalLogicTab?: boolean; // Новый проп для отображения глобальной вкладки
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabClick,
  onRemoveTab,
  showGlobalLogicTab = false,
}) => {
  const maxTabWidth = 150;
  const minTabWidth = 90;
  const containerWidth = 1000;
  // Если нужно показать вкладку глобальной логики, считаем общее количество вкладок как tabs.length + 1
  const totalTabs = showGlobalLogicTab ? tabs.length + 1 : tabs.length;
  const tabWidth = Math.max(
    minTabWidth,
    Math.min(maxTabWidth, containerWidth / totalTabs)
  );

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
              onRemoveTab(tab.key);
            }}
            className="close-icon"
          />
        </div>
      ))}
      {showGlobalLogicTab && (
        <div
          key="projectLogic"
          className={`tab ${
            activeTab === 'projectLogic' ? 'tab--active' : ''
          }`}
          onClick={() => onTabClick('projectLogic')}
          style={{ width: `${tabWidth}px` }}
        >
          Global Logic
        </div>
      )}
    </div>
  );
};

export default Tabs;
