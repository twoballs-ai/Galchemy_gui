// LogicCodeEditorContent.tsx
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";

interface CodeEditorContentProps {
  activeScene: string;
}

const getCodeStorageKey = (projectId: string, sceneId: string) =>
  `CodeLogic:${projectId}:${sceneId}`;

const loadSceneCode = (projectId: string, sceneId: string): string => {
  const key = getCodeStorageKey(projectId, sceneId);
  return (
    localStorage.getItem(key) ||
    `// Редактор кода для сцены ${sceneId}\n\nfunction runLogic() {\n  console.log("Hello, World!");\n}\n`
  );
};

const saveSceneCode = (projectId: string, sceneId: string, code: string) => {
  localStorage.setItem(getCodeStorageKey(projectId, sceneId), code);
};

const LogicCodeEditorContent: React.FC<CodeEditorContentProps> = ({ activeScene }) => {
  const [code, setCode] = useState<string>("");
  const projectId = useSelector((state: RootState) => state.project.currentProjectId) || "";

  // При смене activeScene или projectId загружаем код для данной сцены
  useEffect(() => {
    if (projectId && activeScene) {
      const loadedCode = loadSceneCode(projectId, activeScene);
      setCode(loadedCode);
    }
  }, [activeScene, projectId]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);
    if (projectId && activeScene) {
      saveSceneCode(projectId, activeScene, newCode);
    }
  };

  return (
    <div style={{ height: "90vh", width: "100%" }}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
      />
    </div>
  );
};

export default LogicCodeEditorContent;
