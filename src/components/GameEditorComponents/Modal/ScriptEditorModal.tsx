import React from 'react';
import { Modal } from 'antd';
import MonacoEditor from '@monaco-editor/react';

interface ScriptEditorModalProps {
  visible: boolean;
  title?: string;
  script: { content: string };
  onChange?: (content: string) => void;
  onClose: () => void;
}

const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({
  visible,
  title,
  script,
  onChange,
  onClose,
}) => (
  <Modal open={visible} title={title || 'Script editor'} onCancel={onClose} footer={null} width={900}>
    <MonacoEditor
      height="600px"
      language="javascript"
      value={script?.content ?? ''}
      onChange={(value) => onChange?.(value ?? '')}
      options={{ automaticLayout: true }}
    />
  </Modal>
);

export default ScriptEditorModal;
