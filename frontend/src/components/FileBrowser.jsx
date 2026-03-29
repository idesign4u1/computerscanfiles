import React, { useState, useEffect } from 'react';
import { diskApi } from '../hooks/useApi';
import { formatBytes, formatDate, getFileIcon } from '../utils/formatters';
import DeleteModal from './DeleteModal';
import './FileBrowser.css';

const FileBrowser = () => {
  const [currentPath, setCurrentPath] = useState(null);
  const [contents, setContents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);

  useEffect(() => {
    // Set initial path based on OS
    const initialPath = navigator.platform.includes('Win') ? 'C:\\' : process.env.HOME || '/';
    setCurrentPath(initialPath);
    loadFolder(initialPath);
  }, []);

  const loadFolder = async (path) => {
    try {
      setLoading(true);
      setError(null);
      const response = await diskApi.getFolderContents(path);
      setContents(response.data);
      setCurrentPath(path);
      updateBreadcrumb(path);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load folder');
    } finally {
      setLoading(false);
    }
  };

  const updateBreadcrumb = (path) => {
    const parts = path.split(/[\\\/]/);
    const breadcrumbs = [];
    let current = '';

    parts.forEach((part, index) => {
      if (part) {
        if (index === 0 && (part === 'C:' || part === '/')) {
          current = navigator.platform.includes('Win') ? 'C:\\' : '/';
        } else {
          current += (current.endsWith('/') || current.endsWith('\\') ? '' : '/') + part;
        }
        breadcrumbs.push({ name: part || 'Root', path: current });
      }
    });

    setBreadcrumb(breadcrumbs);
  };

  const handleFolderClick = (folderPath) => {
    loadFolder(folderPath);
  };

  const handleDeleteClick = (file) => {
    setSelectedFile(file);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFile) return;

    try {
      await diskApi.deleteFile(selectedFile.path);
      setShowDeleteModal(false);
      setSelectedFile(null);
      // Reload current folder
      loadFolder(currentPath);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete file');
    }
  };

  return (
    <div className="file-browser">
      <div className="browser-header">
        <h2>📁 File Browser</h2>
        <div className="breadcrumb">
          {breadcrumb.map((crumb, index) => (
            <React.Fragment key={index}>
              <button
                className="breadcrumb-btn"
                onClick={() => handleFolderClick(crumb.path)}
              >
                {crumb.name}
              </button>
              {index < breadcrumb.length - 1 && <span className="breadcrumb-sep">/</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="component-card error">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => loadFolder(currentPath)}>
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="component-card">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      )}

      {contents && !loading && (
        <div className="component-card">
          <div className="file-table-container">
            <table className="file-table">
              <thead>
                <tr>
                  <th className="col-icon"></th>
                  <th className="col-name">Name</th>
                  <th className="col-size">Size</th>
                  <th className="col-modified">Modified</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contents.items.map((item, index) => (
                  <tr key={index} className={item.is_dir ? 'dir-row' : 'file-row'}>
                    <td className="col-icon">
                      {item.is_dir ? '📁' : getFileIcon(item.name)}
                    </td>
                    <td className="col-name">
                      {item.is_dir ? (
                        <button
                          className="file-link"
                          onClick={() => handleFolderClick(item.path)}
                        >
                          {item.name}
                        </button>
                      ) : (
                        <span>{item.name}</span>
                      )}
                    </td>
                    <td className="col-size">{formatBytes(item.size)}</td>
                    <td className="col-modified">{formatDate(item.modified_time)}</td>
                    <td className="col-actions">
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteClick(item)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="folder-stats">
            <p>Total Size: <strong>{formatBytes(contents.total_size)}</strong></p>
            <p>Items: <strong>{contents.items.length}</strong></p>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <DeleteModal
          file={selectedFile}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
};

export default FileBrowser;
