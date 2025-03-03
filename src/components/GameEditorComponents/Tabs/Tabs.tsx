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

  // Вставляем проектную логику (projectLogic) в самое начало, если её ещё нет
  const allTabs: Tab[] = [
    { key: 'projectLogic', sceneName: 'Проектная логика' },
    ...tabs.filter(tab => tab.key !== 'projectLogic'),
  ];

  const tabWidth = Math.max(
    minTabWidth,
    Math.min(maxTabWidth, containerWidth / allTabs.length)
  );

  return (
    <div className="tabs-container">
      {allTabs.map((tab) => (
        <div
          key={tab.key}
          className={`tab ${activeTab === tab.key ? 'tab--active' : ''}`}
          onClick={() => onTabClick(tab.key)}
          style={{ width: `${tabWidth}px` }}
        >
          {tab.sceneName}
          {tab.key !== 'projectLogic' && (
            <CloseOutlined
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTab(tab.key);
              }}
              className="close-icon"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Tabs;
