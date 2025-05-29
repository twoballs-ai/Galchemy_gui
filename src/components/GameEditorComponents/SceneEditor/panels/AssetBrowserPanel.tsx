import React from "react";
import AssetBrowser from "../../AssetBrowser/AssetBrowser";
import "./AssetBrowserPanel.scss";

const AssetBrowserPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="asset-browser-panel">
      <div className="panel-header">
        <span>Assets</span>
        <button onClick={e => { e.stopPropagation(); onClose(); }}>
          ✕
        </button>
      </div>
      <div className="panel-body">
        <AssetBrowser />
      </div>
    </div>
  );
};

export default AssetBrowserPanel;
