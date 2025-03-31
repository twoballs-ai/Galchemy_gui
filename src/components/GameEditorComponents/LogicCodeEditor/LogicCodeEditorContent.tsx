import React, { useState, useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { Button, Space } from "antd";

interface CodeEditorContentProps {
  activeScene: string;
}

const getCodeStorageKey = (projectId: string, sceneId: string) =>
  `CodeLogic:${projectId}:${sceneId}`;

const loadSceneCode = (projectId: string, sceneId: string): string => {
  const key = getCodeStorageKey(projectId, sceneId);
  return (
    localStorage.getItem(key) ||
    `// Редактор кода для сцены ${sceneId}\n\nfunction runLogic(api) {\n  console.log("Hello, World!");\n}\n`
  );
};

const saveSceneCode = (projectId: string, sceneId: string, code: string) => {
  localStorage.setItem(getCodeStorageKey(projectId, sceneId), code);
};

const LogicCodeEditorContent: React.FC<CodeEditorContentProps> = ({ activeScene }) => {
  const editorRef = useRef<any>(null);
  const [code, setCode] = useState<string>("");
  const [hasEdited, setHasEdited] = useState(false); // ⬅️ следим, редактировал ли пользователь
  const projectId = useSelector((state: RootState) => state.project.currentProjectId) || "";

  // Загрузка кода только если пользователь не редактировал
  useEffect(() => {
    if (projectId && activeScene && !hasEdited) {
      const loadedCode = loadSceneCode(projectId, activeScene);
      setCode(loadedCode);
    }
  }, [activeScene, projectId, hasEdited]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);
    setHasEdited(true);
  };

  const handleSave = () => {
    if (projectId && activeScene && editorRef.current) {
      const currentCode = editorRef.current.getValue(); // ⬅️ берём актуальный текст
      saveSceneCode(projectId, activeScene, currentCode);
      setCode(currentCode);
      setHasEdited(false);
      console.log("Сценарий сохранён.");
    }
  };

  const handleUndo = () => {
    editorRef.current?.trigger("keyboard", "undo", null);
  };

  const handleRedo = () => {
    editorRef.current?.trigger("keyboard", "redo", null);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Подключаем Ctrl+S / Cmd+S
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  return (
    <div style={{ height: "90vh", width: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px", background: "#1e1e1e", display: "flex", gap: "8px" }}>
        <Space>
          <Button size="small" onClick={handleSave}>💾 Сохранить</Button>
          <Button size="small" onClick={handleUndo}>↶ Undo</Button>
          <Button size="small" onClick={handleRedo}>↷ Redo</Button>
        </Space>
      </div>
      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
        />
      </div>
    </div>
  );
};

export default LogicCodeEditorContent;
