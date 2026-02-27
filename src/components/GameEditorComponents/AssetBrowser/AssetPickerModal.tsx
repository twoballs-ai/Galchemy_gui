import React, { useEffect, useState } from "react";
import { getAssets } from "../../../utils/assetStorage";
import { AssetItem } from "../../../types/assetTypes";
import { Modal } from "antd";

interface AssetPickerModalProps {
  open: boolean;
  onSelect: (assetId: string) => void;
  onClose: () => void;
  acceptTypes?: string[]; // например ["modelAsset"]
}

const AssetPickerModal: React.FC<AssetPickerModalProps> = ({
  open,
  onSelect,
  onClose,
  acceptTypes = []
}) => {
  const [assets, setAssets] = useState<AssetItem[]>([]);

  useEffect(() => {
    if (open) {
      getAssets().then(data => {
        setAssets(
          acceptTypes.length
            ? data.filter(a => acceptTypes.includes(a.type))
            : data
        );
      });
    }
  }, [open, acceptTypes]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Выберите модель"
      footer={null}
      width={600}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {assets.map(asset => (
          <div
            key={asset.id}
            style={{
              width: 120,
              height: 110,
              border: "1px solid #333",
              borderRadius: 6,
              background: "#232b38",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginBottom: 10,
              boxShadow: "0 2px 8px #0002",
            }}
            onClick={() => {
              onSelect(asset.id);
              onClose();
            }}
          >
            <div style={{ marginBottom: 6 }}>
              {asset.type === "modelAsset" ? (
                <span role="img" aria-label="modelAsset" style={{ fontSize: 36 }}>🗿</span>
              ) : (
                <span role="img" aria-label="file" style={{ fontSize: 36 }}>📄</span>
              )}
            </div>
            <span style={{
              color: "#fff", fontSize: 13, wordBreak: "break-all", textAlign: "center"
            }}>{asset.name}</span>
          </div>
        ))}
        {!assets.length && <span style={{ color: "#888" }}>Нет ассетов моделей</span>}
      </div>
    </Modal>
  );
};

export default AssetPickerModal;
