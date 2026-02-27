import React, { useEffect, useRef, useState } from "react";
import { FileOutlined } from "@ant-design/icons";
import { AssetItem } from "../../../types/assetTypes";
import { GameAlchemy } from "../../../utils/gameAlchemy";

interface Props {
  asset: AssetItem;
}

const MaterialTile: React.FC<Props> = ({ asset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = asset.preview || (asset.meta?.colorMap as string | undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !GameAlchemy.createMaterialPreview) return;

    let handle: { stop?: () => void } | null = null;
    try {
      handle = GameAlchemy.createMaterialPreview(canvas, {
        assetId: asset.id,
        preview: previewUrl,
        maps: asset.meta,
      });
      setPreviewFailed(false);
    } catch {
      setPreviewFailed(true);
    }

    return () => {
      handle?.stop?.();
    };
  }, [asset.id, asset.meta, previewUrl]);

  return (
    <div className="asset material">
      {!previewFailed ? (
        <canvas
          ref={canvasRef}
          width={64}
          height={64}
          style={{ width: 64, height: 64, borderRadius: 8, background: "#111" }}
        />
      ) : previewUrl ? (
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
