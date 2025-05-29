import React, { useEffect, useState } from "react";
import { getAssets, addAsset, removeAsset } from "../../../utils/assetStorage";
import { AssetItem } from "../../../types/assetTypes";
import { Button, Upload } from "antd";
import { UploadOutlined, DeleteOutlined, FolderOutlined, FileOutlined } from "@ant-design/icons";
import "./AssetBrowser.scss";
import {
  buildFolderTree,
  getFolderContent,
  getBreadcrumbs
} from "./assetTree"; // свой путь

const ROOT_ID = undefined;

const AssetBrowser: React.FC = () => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(ROOT_ID);

  useEffect(() => {
    getAssets().then(setAssets);
  }, []);


  // -------- Загрузка ассета
  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      // simple ext->type detect
      const ext = file.name.split('.').pop()?.toLowerCase();
      let type: AssetItem["type"] = "file";
      if (["png", "jpg", "jpeg", "bmp", "gif"].includes(ext!)) type = "image";
      else if (["mp3", "ogg", "wav"].includes(ext!)) type = "audio";
      else if (["glb", "gltf"].includes(ext!)) type = "model";
      else if (["txt", "md"].includes(ext!)) type = "text";

      const asset: AssetItem = {
        id: crypto.randomUUID(),
        name: file.name,
        type,
        parentId: currentFolderId,
        url: type === "image" ? URL.createObjectURL(file) : undefined,
        fileData: reader.result,
      };
      await addAsset(asset);
      setAssets(await getAssets());
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  // -------- Удаление ассета
  const handleDelete = async (id: string) => {
    await removeAsset(id);
    setAssets(await getAssets());
  };

  // --------- Добавить папку
  const handleCreateFolder = async () => {
    const folderName = prompt("Имя папки?");
    if (!folderName) return;
    const newFolder: AssetItem = {
      id: crypto.randomUUID(),
      name: folderName,
      type: "folder",
      parentId: currentFolderId,
    };
    await addAsset(newFolder);
    setAssets(await getAssets());
  };

   const folderTree = buildFolderTree(assets, ROOT_ID);
  const content = getFolderContent(assets, currentFolderId);
  const breadcrumbs = getBreadcrumbs(assets, currentFolderId);

  return (
    <div className="asset-browser-flexrow">
      <div className="asset-browser-left">
        <FolderTree
          folders={folderTree}
          currentFolderId={currentFolderId}
          onSelect={setCurrentFolderId}
        />
      </div>
      <div className="asset-browser-right">
        <div className="asset-browser-toolbar">
          <Upload beforeUpload={handleUpload} showUploadList={false}>
            <Button icon={<UploadOutlined />}>Загрузить ассет</Button>
          </Upload>
          <Button icon={<FolderOutlined />} onClick={handleCreateFolder}>
            Новая папка
          </Button>
        </div>
        <div className="breadcrumbs">
          <span className="breadcrumb-link" onClick={() => setCurrentFolderId(ROOT_ID)}>
            assets
          </span>
          {breadcrumbs.map(bc => (
            <span key={bc.id} className="breadcrumb-link" onClick={() => setCurrentFolderId(bc.id)}>
              / {bc.name}
            </span>
          ))}
        </div>
        <div className="folder-content">
          {/* Папки */}
          {content.filter(i => i.type === "folder").map(folder => (
            <div
              className="folder"
              key={folder.id}
              onDoubleClick={() => setCurrentFolderId(folder.id)}
            >
              <FolderOutlined /> {folder.name}
            </div>
          ))}
          {/* Файлы */}
          {content.filter(i => i.type !== "folder").map(asset => (
            <div className="asset" key={asset.id}>
              {asset.type === "image"
                ? <img src={asset.url} alt={asset.name} style={{ width: 32, height: 32 }} />
                : <FileOutlined style={{ fontSize: 32 }} />}
              <span style={{ marginLeft: 8 }}>{asset.name}</span>
              <Button
                danger size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(asset.id)}
                style={{ marginLeft: 8 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetBrowser;


// ------------------ FolderTree Component ---------------------
const FolderTree: React.FC<{
  folders: AssetItem[];
  currentFolderId?: string;
  onSelect: (id?: string) => void;
}> = ({ folders, currentFolderId, onSelect }) => (
  <div className="folder-tree">
    {folders.map(folder => (
      <FolderTreeNode
        key={folder.id}
        node={folder}
        currentFolderId={currentFolderId}
        onSelect={onSelect}
      />
    ))}
  </div>
);

const FolderTreeNode: React.FC<{
  node: AssetItem & { children?: AssetItem[] };
  currentFolderId?: string;
  onSelect: (id?: string) => void;
}> = ({ node, currentFolderId, onSelect }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="folder-tree-node">
      <div
        className={"folder-tree-label" + (node.id === currentFolderId ? " selected" : "")}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => setExpanded(e => !e)}
      >
        <FolderOutlined style={{ marginRight: 4 }} />
        {node.name}
      </div>
      {expanded && node.children && (
        <div className="folder-tree-children">
          {node.children.map(child =>
            <FolderTreeNode key={child.id} node={child} currentFolderId={currentFolderId} onSelect={onSelect} />
          )}
        </div>
      )}
    </div>
  );
};
