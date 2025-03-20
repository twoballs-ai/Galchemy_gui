// CodeEditorContent.tsx
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorContentProps {
  activeScene: string;
}

const getCodeStorageKey = (sceneId: string) => `CodeLogic:${sceneId}`;

const loadSceneCode = (sceneId: string): string => {
  const key = getCodeStorageKey(sceneId);
  return (
    localStorage.getItem(key) ||
    `// Редактор кода для сцены ${sceneId}\n\nfunction runLogic() {\n  console.log("Hello, World!");\n}\n`
  );
};

const saveSceneCode = (sceneId: string, code: string) => {
  localStorage.setItem(getCodeStorageKey(sceneId), code);
};

const LogicCodeEditorContent: React.FC<CodeEditorContentProps> = ({ activeScene }) => {
  const [code, setCode] = useState<string>("");

  // При смене activeScene загружаем код для данной сцены
  useEffect(() => {
    const loadedCode = loadSceneCode(activeScene);
    setCode(loadedCode);
  }, [activeScene]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);
    saveSceneCode(activeScene, newCode);
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
