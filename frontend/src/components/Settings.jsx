import React, { useState, useEffect } from 'react';
import { diskApi } from '../hooks/useApi';
import './Settings.css';

const Settings = () => {
  const [exclusions, setExclusions] = useState([]);
  const [newExclusion, setNewExclusion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadExclusions();
  }, []);

  const loadExclusions = async () => {
    try {
      setLoading(true);
      const response = await diskApi.getExclusions();
      setExclusions(response.data.excluded_folders);
    } catch (err) {
      setError('Failed to load exclusions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExclusion = async (e) => {
    e.preventDefault();

    if (!newExclusion.trim()) {
      setError('Please enter a folder path');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await diskApi.addExclusion(newExclusion);
      setExclusions([...exclusions, newExclusion]);
      setNewExclusion('');
      setSuccess('Folder added to exclusions');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add exclusion');
    }
  };

  const handleRemoveExclusion = async (folder) => {
    try {
      setError(null);
      setSuccess(null);
      await diskApi.removeExclusion(folder);
      setExclusions(exclusions.filter(e => e !== folder));
      setSuccess('Folder removed from exclusions');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove exclusion');
    }
  };

  return (
    <div className="settings">
      <div className="component-card">
        <h2>⚙️ Settings</h2>

        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <p>{success}</p>
          </div>
        )}

        <div className="settings-section">
          <h3>🚫 Exclude Folders from Scanning</h3>
          <p className="section-description">
            Folders in this list will be skipped during disk scans. This is useful for system folders or large temporary directories.
          </p>

          <form onSubmit={handleAddExclusion} className="exclusion-form">
            <div className="form-group">
              <label htmlFor="new-exclusion">Folder Path:</label>
              <input
                id="new-exclusion"
                type="text"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                placeholder="Enter folder path to exclude..."
              />
            </div>
            <button type="submit" className="btn btn-primary">
              ➕ Add to Exclusions
            </button>
          </form>

          <div className="exclusions-list">
            <h4>Current Exclusions ({exclusions.length})</h4>
            {loading && <p className="loading-text">Loading...</p>}

            {exclusions.length === 0 && !loading && (
              <p className="empty-text">No folders excluded yet.</p>
            )}

            {exclusions.length > 0 && (
              <div className="exclusion-items">
                {exclusions.map((folder, index) => (
                  <div key={index} className="exclusion-item">
                    <span className="exclusion-path">{folder}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemoveExclusion(folder)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h3>ℹ️ About</h3>
          <p>
            <strong>Disk Space Analyzer</strong> v1.0.0
          </p>
          <p>
            A local disk space analysis tool for visualizing and managing disk usage.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
