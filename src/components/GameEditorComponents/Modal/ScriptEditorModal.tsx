import React from 'react';
import { Modal } from 'antd';
import MonacoEditor from '@monaco-editor/react';

const ScriptEditorModal = ({ visible, script, onClose }) => (
  <Modal visible={visible} onCancel={onClose} footer={null} width={800}>
    <MonacoEditor
      height="600px"
      language="javascript"
      value={script.content}
      options={{ automaticLayout: true }}
    />
  </Modal>
);

export default ScriptEditorModal;
