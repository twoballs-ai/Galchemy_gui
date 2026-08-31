import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAssets, addAsset, removeAsset, getOrCreateScriptsFolder } from "../../../utils/assetStorage";
import { AssetItem } from "../../../types/assetTypes";
import { Button, Upload } from "antd";
import { UploadOutlined, DeleteOutlined, FolderOutlined, FileOutlined } from "@ant-design/icons";
import "./AssetBrowser.scss";
import { buildFolderTree, getFolderContent, getBreadcrumbs } from "./assetTree";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import MaterialTile from "./MaterialTile";
import ScriptEditorModal from "../Modal/ScriptEditorModal";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";

const ROOT_ID: string | undefined = undefined;
const ROOT_NODE_ID = "__root__";

/**
 * Хук для создания blob URL из fileData (ArrayBuffer).
 * URL автоматически освобождается при unmount компонента или смене fileData.
 */
function useBlobUrl(fileData: unknown, mimeType = "application/octet-stream"): string | undefined {
  return useMemo(() => {
    if (!fileData) return undefined;
    try {
      // fileData может быть ArrayBuffer (из FileReader.readAsArrayBuffer)
      // или уже Uint8Array / Blob
      let data: ArrayBuffer | Uint8Array | Blob;
      if (fileData instanceof ArrayBuffer) {
        data = fileData;
      } else if (fileData instanceof Uint8Array) {
        data = fileData;
      } else if (fileData instanceof Blob) {
        return URL.createObjectURL(fileData);
      } else {
        return undefined;
      }
      const blob = new Blob([data], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch {
      return undefined;
    }
  }, [fileData, mimeType]);
}

const AssetBrowser: React.FC = () => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(ROOT_ID);
  const [openedScript, setOpenedScript] = useState<{ id: string; name: string; content: string } | null>(null);
  const currentProjectId = useSelector((state: RootState) => state.project.currentProjectId);

  const loadAssets = useCallback(async () => {
    const allAssets = await getAssets();
    setAssets(allAssets.filter((asset) => !asset.projectId || asset.projectId === currentProjectId));
  }, [currentProjectId]);

  useEffect(() => {
    loadAssets();
  }, [currentProjectId, loadAssets]);

  useEffect(() => {
    const createScriptsFolder = async () => {
      if (!currentProjectId) return;
      await getOrCreateScriptsFolder(currentProjectId);
      await loadAssets();
    };
    createScriptsFolder();
  }, [currentProjectId, loadAssets]);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let type: AssetItem["type"] = "file";
      if (["png", "jpg", "jpeg", "bmp", "gif"].includes(ext!)) type = "image";
      else if (["mp3", "ogg", "wav"].includes(ext!)) type = "audio";
      else if (["glb", "gltf"].includes(ext!)) type = "modelAsset";
      else if (["txt", "md"].includes(ext!)) type = "text";

      const asset: AssetItem = {
        id: crypto.randomUUID(),
        name: file.name,
        type,
        parentId: currentFolderId,
        // ─── ИСПРАВЛЕНО: НЕ сохраняем blob URL в БД ───
        // url: type === "image" ? URL.createObjectURL(file) : undefined,  ← УДАЛЕНО
        url: undefined,
        fileData: reader.result ?? undefined,
      };
      await addAsset(asset);
      await loadAssets();
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleDelete = async (id: string) => {
    await removeAsset(id);
    await loadAssets();
  };

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
    await loadAssets();
  };

  const folderTree = withRoot(buildFolderTree(assets, ROOT_ID));
  const content = getFolderContent(assets, currentFolderId);
  const breadcrumbs = getBreadcrumbs(assets, currentFolderId);

  const openScriptEditor = (asset: AssetItem) => {
    setOpenedScript({
      id: asset.id,
      name: asset.name,
      content: String(asset.fileData ?? ""),
    });
  };

  const saveScript = (content: string) => {
    if (!openedScript) return;

    const sourceAsset = assets.find((asset) => asset.id === openedScript.id);
    if (!sourceAsset) return;

    void addAsset({ ...sourceAsset, fileData: content });
    setAssets((prev) => prev.map((item) => (item.id === openedScript.id ? { ...item, fileData: content } : item)));
    setOpenedScript((prev) => (prev ? { ...prev, content } : prev));
  };

  function withRoot(folders: AssetItem[]): (AssetItem & { children?: AssetItem[] })[] {
    return [
      {
        id: ROOT_NODE_ID,
        name: "assets",
        type: "folder",
        parentId: undefined,
        children: folders,
      } as AssetItem & { children?: AssetItem[] },
    ];
  }

  return (
    <div className="asset-browser-flexrow">
      <div className="asset-browser-left">
        <FolderTree folders={folderTree} currentFolderId={currentFolderId} onSelect={setCurrentFolderId} />
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
          {breadcrumbs.map((bc) => (
            <span key={bc.id} className="breadcrumb-link" onClick={() => setCurrentFolderId(bc.id)}>
              / {bc.name}
            </span>
          ))}
        </div>

        <div className="folder-content">
          {content
            .filter((i) => i.type === "folder")
            .map((folder) => (
              <div className="folder" key={folder.id} onDoubleClick={() => setCurrentFolderId(folder.id)}>
                <FolderOutlined /> {folder.name}
              </div>
            ))}

          {content
            .filter((i) => i.type === "material")
            .map((asset) => (
              <MaterialTile asset={asset} key={asset.id} />
            ))}

          {content
            .filter((i) => i.type !== "folder" && i.type !== "material")
            .map((asset) => (
              <AssetTile
                key={asset.id}
                asset={asset}
                onDoubleClick={() => asset.type === "script" && openScriptEditor(asset)}
                onDelete={() => handleDelete(asset.id)}
              />
            ))}
        </div>
      </div>

      <ScriptEditorModal
        visible={!!openedScript}
        title={openedScript?.name}
        script={{ content: openedScript?.content ?? "" }}
        onChange={saveScript}
        onClose={() => setOpenedScript(null)}
      />
    </div>
  );
};

export default AssetBrowser;

/**
 * Компонент для рендеринга одного ассета.
 * Использует useBlobUrl для динамического создания blob URL из fileData.
 */
const AssetTile: React.FC<{
  asset: AssetItem;
  onDoubleClick: () => void;
  onDelete: () => void;
}> = ({ asset, onDoubleClick, onDelete }) => {
  // Создаём blob URL динамически из fileData.
  // URL пересоздаётся только при смене fileData.
  // Освобождается автоматически при unmount компонента.
  const dynamicUrl = useBlobUrl(
    asset.fileData,
    asset.type === "image" ? "image/png" : "application/octet-stream"
  );

  // Освобождаем blob URL при unmount
  useEffect(() => {
    return () => {
      if (dynamicUrl) URL.revokeObjectURL(dynamicUrl);
    };
  }, [dynamicUrl]);

  // Используем dynamicUrl если есть fileData, иначе asset.url (для обратной совместимости)
  const imgSrc = dynamicUrl || asset.url;

  return (
    <div className="asset" onDoubleClick={onDoubleClick}>
      {asset.type === "image" && imgSrc ? (
        <img
          src={imgSrc}
          alt={asset.displayName || asset.name}
          style={{ width: 32, height: 32 }}
        />
      ) : (
        <FileOutlined style={{ fontSize: 32 }} />
      )}
      <span style={{ marginLeft: 8 }}>{asset.displayName || asset.name}</span>
      {asset.type === "script" && <span style={{ marginLeft: 8, opacity: 0.7 }}>(dblclick)</span>}
      {!asset.system && !asset.protected && (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={onDelete}
          style={{ marginLeft: 8 }}
        />
      )}
    </div>
  );
};

const FolderTree: React.FC<{
  folders: AssetItem[];
  currentFolderId?: string;
  onSelect: (id?: string) => void;
}> = ({ folders, currentFolderId, onSelect }) => (
  <div className="folder-tree">
    {folders.map((folder) => (
      <FolderTreeNode key={folder.id} node={folder} currentFolderId={currentFolderId} onSelect={onSelect} />
    ))}
  </div>
);

const FolderTreeNode: React.FC<{
  node: AssetItem & { children?: AssetItem[] };
  currentFolderId?: string;
  onSelect: (id?: string) => void;
}> = ({ node, currentFolderId, onSelect }) => {
  const [expanded, setExpanded] = useState(node.id === ROOT_NODE_ID);

  return (
    <div className="folder-tree-node">
      <div
        className={"folder-tree-label" + (node.id === currentFolderId ? " selected" : "")}
        onClick={() => onSelect(node.id === ROOT_NODE_ID ? undefined : node.id)}
      >
        {node.children && node.children.length > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            style={{ marginRight: 4 }}
          >
            {expanded ? <DownOutlined /> : <RightOutlined />}
          </span>
        )}
        <FolderOutlined style={{ marginRight: 4 }} />
        {node.name}
      </div>
      {expanded && node.children && (
        <div className="folder-tree-children">
          {node.children.map((child) => (
            <FolderTreeNode key={child.id} node={child} currentFolderId={currentFolderId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};