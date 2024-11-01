import React from 'react';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css'; // Подключаем стили для модального окна

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({ open, onClose, title, children }) => {
  return (
    <Modal open={open} onClose={onClose} center>
      <div style={modalContainerStyle}>
        {title && <h2 style={titleStyle}>{title}</h2>}
        <div style={contentStyle}>
          {children}
        </div>
        <button style={closeButtonStyle} onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
};

// Стили для компонента
const modalContainerStyle: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
  margin: 'auto',
};

const titleStyle: React.CSSProperties = {
  marginBottom: '15px',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center',
};

const contentStyle: React.CSSProperties = {
  marginBottom: '20px',
  fontSize: '16px',
  textAlign: 'left',
};

const closeButtonStyle: React.CSSProperties = {
  padding: '10px 15px',
  backgroundColor: '#f44336',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  display: 'block',
  margin: '10px auto 0',
};

export default CustomModal;
