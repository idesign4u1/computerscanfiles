import React, { useState } from 'react';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';
import './DuplicatesList.css';

const DuplicatesList = () => {
  const [searchPath, setSearchPath] = useState(null);
  const [duplicates, setDuplicates] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSet, setExpandedSet] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchPath) {
      setError('Please enter a folder path');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [dupResponse, summaryResponse] = await Promise.all([
        diskApi.findDuplicates(searchPath),
        diskApi.getDuplicatesSummary(searchPath),
      ]);

      setDuplicates(dupResponse.data);
      setSummary(summaryResponse.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to find duplicates');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandSet = (index) => {
    setExpandedSet(expandedSet === index ? null : index);
  };

  return (
    <div className="duplicates-list">
      <div className="component-card">
        <h2>🔍 Find Duplicate Files</h2>

        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label htmlFor="search-path">Folder Path:</label>
            <input
              id="search-path"
              type="text"
              value={searchPath || ''}
              onChange={(e) => setSearchPath(e.target.value)}
              placeholder="Enter folder path to search..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : '🔍 Find Duplicates'}
          </button>
        </form>

        {error && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing files...</p>
          </div>
        )}

        {summary && !loading && (
          <div className="summary-box">
            <div className="summary-stat">
              <h3>{summary.duplicate_sets}</h3>
              <p>Duplicate Sets</p>
            </div>
            <div className="summary-stat">
              <h3>{summary.total_duplicate_files}</h3>
              <p>Duplicate Files</p>
            </div>
            <div className="summary-stat">
              <h3>{formatBytes(summary.potential_space_savings)}</h3>
              <p>Space Savings</p>
            </div>
          </div>
        )}
      </div>

      {duplicates && duplicates.length > 0 && (
        <div className="duplicates-container">
          {duplicates.map((dupSet, index) => (
            <div key={index} className="component-card duplicate-set">
              <div
                className="set-header"
                onClick={() => toggleExpandSet(index)}
                style={{ cursor: 'pointer' }}
              >
                <span className="set-toggle">
                  {expandedSet === index ? '▼' : '▶'}
                </span>
                <h3>
                  {dupSet.count} copies - {formatBytes(dupSet.file_size)} each
                </h3>
                <span className="set-info">
                  Total: {formatBytes(dupSet.file_size * dupSet.count)}
                </span>
              </div>

              {expandedSet === index && (
                <div className="set-content">
                  <p className="hash-label">Hash: {dupSet.file_hash.substring(0, 16)}...</p>
                  <div className="file-list">
                    {dupSet.paths.map((path, idx) => (
                      <div key={idx} className="duplicate-item">
                        <span className="file-path">{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {duplicates && duplicates.length === 0 && !loading && (
        <div className="component-card">
          <p className="empty-message">No duplicate files found in this folder.</p>
        </div>
      )}
    </div>
  );
};

export default DuplicatesList;
