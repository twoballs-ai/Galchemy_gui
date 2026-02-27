import React, { useEffect, useState } from "react";
import { getAssets, addAsset, removeAsset } from "../../../utils/assetStorage";
import { AssetItem } from "../../../types/assetTypes";
import { Button, Upload } from "antd";
import { UploadOutlined, DeleteOutlined, FolderOutlined, FileOutlined } from "@ant-design/icons";
import "./AssetBrowser.scss";
import { buildFolderTree, getFolderContent, getBreadcrumbs } from "./assetTree";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import MaterialTile from "./MaterialTile";
import ScriptEditorModal from "../Modal/ScriptEditorModal";

const ROOT_ID: string | undefined = undefined;
const ROOT_NODE_ID = "__root__";
const SCRIPTS_FOLDER_NAME = "scripts";

const AssetBrowser: React.FC = () => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(ROOT_ID);
  const [scriptAssets, setScriptAssets] = useState<AssetItem[]>([]);
  const [openedScript, setOpenedScript] = useState<{ id: string; name: string; content: string } | null>(null);

  useEffect(() => {
    getAssets().then(setAssets);
  }, []);

  useEffect(() => {
    const loadScripts = async () => {
      const assetsList = await getAssets();
      const scriptsFolder = assetsList.find((a) => a.name === SCRIPTS_FOLDER_NAME && !a.parentId);
      if (!scriptsFolder) return;

      const scripts = Object.entries(localStorage)
        .filter(([key]) => key.startsWith("ProjectScript:") || key.startsWith("SceneScript:"))
        .map(([key, value]) => {
          const script = JSON.parse(value);
          return {
            id: key,
            name: script.name,
            type: "script",
            parentId: scriptsFolder.id,
            fileData: script.content,
          };
        });

      setScriptAssets(scripts as AssetItem[]);
    };

    loadScripts();
  }, [assets]);

  useEffect(() => {
    const createScriptsFolder = async () => {
      const assetsList = await getAssets();
      const scriptsFolder = assetsList.find((a) => a.name === SCRIPTS_FOLDER_NAME && !a.parentId);
      if (!scriptsFolder) {
        const folder: AssetItem = {
          id: crypto.randomUUID(),
          name: SCRIPTS_FOLDER_NAME,
          type: "folder",
        };
        await addAsset(folder);
        setAssets(await getAssets());
      }
    };
    createScriptsFolder();
  }, []);

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
        url: type === "image" ? URL.createObjectURL(file) : undefined,
        fileData: reader.result ?? undefined,
      };
      await addAsset(asset);
      setAssets(await getAssets());
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleDelete = async (id: string) => {
    await removeAsset(id);
    setAssets(await getAssets());
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
    setAssets(await getAssets());
  };

  const allAssets = [...assets, ...scriptAssets];
  const folderTree = withRoot(buildFolderTree(allAssets, ROOT_ID));
  const content = getFolderContent(allAssets, currentFolderId);
  const breadcrumbs = getBreadcrumbs(allAssets, currentFolderId);

  const openScriptEditor = (asset: AssetItem) => {
    setOpenedScript({
      id: asset.id,
      name: asset.name,
      content: String(asset.fileData ?? ""),
    });
  };

  const saveScript = (content: string) => {
    if (!openedScript) return;

    const raw = localStorage.getItem(openedScript.id);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    localStorage.setItem(openedScript.id, JSON.stringify({ ...parsed, content }));

    setScriptAssets((prev) =>
      prev.map((item) => (item.id === openedScript.id ? { ...item, fileData: content } : item))
    );
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
              <div
                className="asset"
                key={asset.id}
                onDoubleClick={() => asset.type === "script" && openScriptEditor(asset)}
              >
                {asset.type === "image" ? (
                  <img
                    src={asset.url}
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
                    onClick={() => handleDelete(asset.id)}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </div>
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
