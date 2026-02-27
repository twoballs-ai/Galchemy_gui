import React from 'react';
import { Modal } from 'antd';
import MonacoEditor from '@monaco-editor/react';

interface ScriptEditorModalProps {
  visible: boolean;
  script: { content: string };
  onClose: () => void;
}

const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({ visible, script, onClose }) => (
  <Modal open={visible} onCancel={onClose} footer={null} width={800}>
    <MonacoEditor
      height="600px"
      language="javascript"
      value={script?.content ?? ''}
      options={{ automaticLayout: true }}
    />
  </Modal>
);

export default ScriptEditorModal;
