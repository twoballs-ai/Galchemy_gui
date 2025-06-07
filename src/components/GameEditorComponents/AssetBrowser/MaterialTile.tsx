// src/components/GameEditorComponents/AssetBrowser/MaterialTile.tsx
import React, { useEffect, useRef } from "react";
import { FileOutlined } from "@ant-design/icons";
import { AssetItem } from "../../../types/assetTypes";
import { GameAlchemy } from "game-alchemy-core";

interface Props { asset: AssetItem; }

const MaterialTile: React.FC<Props> = ({ asset }) => {
  let previewUrl = asset.preview;
  if (!previewUrl && asset.meta?.colorMap) {
    const folderPath = asset.url.replace(/\/material\.json$/, "");
    previewUrl = folderPath + "/" + asset.meta.colorMap;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<any>(null);

  useEffect(() => {
    if (asset.type === "material" && asset.meta?.colorMap && canvasRef.current) {
      const base = asset.url.replace(/\/material\.json$/, "");
      const meta: typeof asset.meta = { ...asset.meta };
      if (meta.colorMap     && !meta.colorMap.startsWith("/"))     meta.colorMap     = base + "/" + meta.colorMap;
      if (meta.normalMap    && !meta.normalMap.startsWith("/"))    meta.normalMap    = base + "/" + meta.normalMap;
      if (meta.roughnessMap && !meta.roughnessMap.startsWith("/")) meta.roughnessMap = base + "/" + meta.roughnessMap;
      if (meta.metalnessMap && !meta.metalnessMap.startsWith("/")) meta.metalnessMap = base + "/" + meta.metalnessMap;
      if (meta.displacementMap && !meta.displacementMap.startsWith("/")) meta.displacementMap = base + "/" + meta.displacementMap;
      previewRef.current = GameAlchemy.createMaterialPreview(canvasRef.current, meta);
    }
    return () => { previewRef.current?.stop?.(); };
  }, [asset]);

  return (
    <div className="asset material">
      {asset.type === "material" && asset.meta?.colorMap ? (
        <canvas ref={canvasRef} width={128} height={128}
          style={{
            width: 128, height: 128,
            background: "#232323",
            boxShadow: "0 0 8px #0006",
            display: "block",
            margin: "0 auto",
          }}
        />
      ) : previewUrl ? (
        <img
          src={previewUrl}
          alt={asset.name}
          style={{
            width: 128, height: 128,
            borderRadius: "50%",
            background: "#232323",
            boxShadow: "0 0 8px #0006",
            display: "block",
            margin: "0 auto",
          }}
        />
      ) : (
        <FileOutlined style={{ fontSize: 40, margin: "0 auto", display: "block" }} />
      )}
      <span style={{ marginLeft: 8, fontWeight: 600 }}>{asset.name}</span>
    </div>
  );
};
export default MaterialTile;
