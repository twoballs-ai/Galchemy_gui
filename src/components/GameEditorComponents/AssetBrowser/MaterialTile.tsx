// MaterialTile.tsx
import React from "react";
import { FileOutlined } from "@ant-design/icons";
import { AssetItem } from "../../../types/assetTypes";

interface Props {
  asset: AssetItem;
}

const MaterialTile: React.FC<Props> = ({ asset }) => {
  // preview url для материала, собираем путь на основе asset.url
  let previewUrl = asset.preview;
  if (!previewUrl && asset.meta?.colorMap) {
    // если нет поля preview, fallback на colorMap (пример для systemAssets)
    // path: /node_modules/game-alchemy-core/src/assets/materials/Metal052C_1K-JPG/Metal052C_1K-JPG_Color.jpg
    const folderPath = asset.url.replace(/\/material\.json$/, "");
    previewUrl = folderPath + "/" + asset.meta.colorMap;
  }

  return (
    <div className="asset material">
      {previewUrl
        ? <img src={previewUrl} alt={asset.name}
              style={{
                width: 48, height: 48,
                borderRadius: "50%",
                background: "#232323", boxShadow: "0 0 8px #0006"
              }} />
        : <FileOutlined style={{ fontSize: 40 }} />}
      <span style={{ marginLeft: 8, fontWeight: 600 }}>{asset.name}</span>
    </div>
  );
};

export default MaterialTile;
