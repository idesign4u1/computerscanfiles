import React from 'react';
import { formatBytes } from '../utils/formatters';
import './DeleteModal.css';

const DeleteModal = ({ file, onConfirm, onCancel }) => {
  if (!file) return null;

  const fileType = file.is_dir ? 'Folder' : 'File';
  const icon = file.is_dir ? '📁' : '📄';

  return (
    <div className="modal-overlay">
      <div className="modal delete-modal">
        <h2>⚠️ Confirm Deletion</h2>

        <div className="delete-info">
          <p className="warning">
            Are you sure you want to delete this {fileType.toLowerCase()}?
          </p>

          <div className="file-details">
            <p>
              <span className="detail-icon">{icon}</span>
              <strong>Name:</strong> {file.name}
            </p>
            <p>
              <span className="detail-icon">💾</span>
              <strong>Size:</strong> {formatBytes(file.size)}
            </p>
            <p>
              <span className="detail-icon">📂</span>
              <strong>Type:</strong> {file.is_dir ? 'Folder' : file.file_type || 'File'}
            </p>
          </div>

          {file.is_dir && (
            <div className="warning-box">
              <p>⚠️ <strong>Warning:</strong> This will permanently delete the folder and all its contents!</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Delete {fileType}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
