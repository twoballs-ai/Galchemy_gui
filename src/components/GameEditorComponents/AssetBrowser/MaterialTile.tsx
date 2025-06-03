// src/components/GameEditorComponents/AssetBrowser/MaterialTile.tsx
import React, { useEffect, useRef } from "react";
import { FileOutlined } from "@ant-design/icons";
import { AssetItem } from "../../../types/assetTypes";
// Импорт фасада ядра — чтобы вызвать GameAlchemy.createMaterialPreview
import { GameAlchemy } from "game-alchemy-core";

interface Props {
  asset: AssetItem;
}

const MaterialTile: React.FC<Props> = ({ asset }) => {
  // Попробуем получить previewUrl (fallback)
  let previewUrl = asset.preview;
  if (!previewUrl && asset.meta?.colorMap) {
    const folderPath = asset.url.replace(/\/material\.json$/, "");
    previewUrl = folderPath + "/" + asset.meta.colorMap;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<any>(null);

  useEffect(() => {
    // Запускаем PBR-превью только если есть meta.colorMap
    if (
      asset.type === "material" &&
      asset.meta &&
      asset.meta.colorMap &&
      canvasRef.current
    ) {
      // Строим абсолютные URL всех карт
      const base = asset.url.replace(/\/material\.json$/, "");
      const meta: typeof asset.meta = { ...asset.meta };
      if (meta.colorMap)     meta.colorMap     = base + "/" + meta.colorMap;
      if (meta.normalMap)    meta.normalMap    = base + "/" + meta.normalMap;
      if (meta.roughnessMap) meta.roughnessMap = base + "/" + meta.roughnessMap;
      if (meta.metalnessMap) meta.metalnessMap = base + "/" + meta.metalnessMap;

      previewRef.current = GameAlchemy.createMaterialPreview(
        canvasRef.current,
        meta
      );
    }

    return () => {
      previewRef.current?.stop?.();
    };
  }, [asset]);

  return (
    <div className="asset material">
      {asset.type === "material" && asset.meta?.colorMap ? (
        // Живой PBR-preview: WebGL-канвас
        <canvas
          ref={canvasRef}
          width={128}
          height={128}
          style={{
            width: 128,
            height: 128,
            background: "#232323",
            boxShadow: "0 0 8px #0006",
            display: "block",
            margin: "0 auto",
          }}
        />
      ) : previewUrl ? (
        // Обычное превью-изображение
        <img
          src={previewUrl}
          alt={asset.name}
          style={{
            width: 128,
            height: 128,
            borderRadius: "50%",
            background: "#232323",
            boxShadow: "0 0 8px #0006",
            display: "block",
            margin: "0 auto",
          }}
        />
      ) : (
        // Ни то, ни другое — иконка-фолбэк
        <FileOutlined style={{ fontSize: 40, margin: "0 auto", display: "block" }} />
      )}
      <span style={{ marginLeft: 8, fontWeight: 600 }}>{asset.name}</span>
    </div>
  );
};

export default MaterialTile;
