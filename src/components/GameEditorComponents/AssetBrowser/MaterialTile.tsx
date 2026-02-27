import React from "react";
import { FileOutlined } from "@ant-design/icons";
import { AssetItem } from "../../../types/assetTypes";

interface Props {
  asset: AssetItem;
}

const MaterialTile: React.FC<Props> = ({ asset }) => {
  const previewUrl = asset.preview || (asset.meta?.colorMap as string | undefined);

  return (
    <div className="asset material">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={asset.name}
          style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }}
        />
      ) : (
        <FileOutlined style={{ fontSize: 32 }} />
      )}
      <span style={{ marginLeft: 8, fontWeight: 600 }}>{asset.name}</span>
    </div>
  );
};

export default MaterialTile;
