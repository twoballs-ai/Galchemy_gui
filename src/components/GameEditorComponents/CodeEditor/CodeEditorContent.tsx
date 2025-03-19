// CodeEditorContent.tsx
import React from "react";

interface CodeEditorContentProps {
  activeScene: string;
}

const CodeEditorContent: React.FC<CodeEditorContentProps> = ({ activeScene }) => {
  return (
    <div style={{ color: "white" }}>
      <h2>Code Editor для {activeScene}</h2>
      {/* Здесь можно интегрировать ваш кодовый редактор, например, Ace Editor или Monaco */}
    </div>
  );
};

export default CodeEditorContent;
