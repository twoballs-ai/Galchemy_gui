import React from 'react';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';
import './CustomModal.scss'; // Подключение стилей

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({ open, onClose, title, children, footer }) => {
  return (
    <Modal open={open} onClose={onClose} center>
      <div className="custom-modal-container">
        {title && <h2 className="custom-modal-title">{title}</h2>}
        <div className="custom-modal-content">{children}</div>
        {footer && <div className="custom-modal-footer">{footer}</div>}
      </div>
    </Modal>
  );
};

export default CustomModal;
