import React, { useEffect, useState } from "react";
import { getAssets, addAsset, removeAsset } from "../../../utils/assetStorage";
import { AssetItem } from "../../../types/assetTypes";
import { Button, Upload, List } from "antd";
import { UploadOutlined, DeleteOutlined, FileImageOutlined, FileOutlined } from "@ant-design/icons";
import "./AssetBrowser.scss";

const AssetBrowser: React.FC = () => {
  const [assets, setAssets] = useState<AssetItem[]>([]);

  useEffect(() => {
    getAssets().then(setAssets);
  }, []);

  // Drag & Drop загрузка ассета
  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const type = file.type.startsWith("image")
        ? "image"
        : file.type === "model/gltf-binary"
        ? "model"
        : "file";
      const asset: AssetItem = {
        id: crypto.randomUUID(),
        name: file.name,
        type,
        url: type === "image" ? URL.createObjectURL(file) : undefined,
        fileData: reader.result,
      };
      await addAsset(asset);
      setAssets(await getAssets());
    };
    reader.readAsArrayBuffer(file); // для картинок можно readAsDataURL
    return false;
  };

  const handleDelete = async (id: string) => {
    await removeAsset(id);
    setAssets(await getAssets());
  };

  return (
    <div className="asset-browser">
      <Upload
        beforeUpload={handleUpload}
        showUploadList={false}
        accept=".glb,.gltf,.png,.jpg,.jpeg,.wav,.mp3,.ogg"
      >
        <Button icon={<UploadOutlined />}>Добавить ассет</Button>
      </Upload>
      <List
        itemLayout="horizontal"
        dataSource={assets}
        renderItem={asset => (
          <List.Item
            actions={[
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(asset.id)} />,
            ]}
          >
            <List.Item.Meta
              avatar={
                asset.type === "image"
                  ? <img src={asset.url} alt={asset.name} style={{ width: 32, height: 32 }} />
                  : <FileImageOutlined style={{ fontSize: 32 }} />
              }
              title={asset.name}
              description={asset.type}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default AssetBrowser;
