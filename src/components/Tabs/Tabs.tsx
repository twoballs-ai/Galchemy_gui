import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './Tabs.scss';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabClick: (tab: string) => void;
  onRemoveTab: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick, onRemoveTab }) => {
  const maxTabWidth = 150;
  const minTabWidth = 90;
  const containerWidth = 1000;
  const tabWidth = Math.max(minTabWidth, Math.min(maxTabWidth, containerWidth / tabs.length));

  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <div
          key={tab}
          className={`tab ${activeTab === tab ? 'tab--active' : ''}`}
          onClick={() => onTabClick(tab)}
          style={{ width: `${tabWidth}px` }}
        >
          {tab}
          <CloseOutlined
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTab(tab);
            }}
            className="close-icon"
          />
        </div>
      ))}
    </div>
  );
};

export default Tabs;
