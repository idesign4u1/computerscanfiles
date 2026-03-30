import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, method = 'GET', data = null) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        method,
        url,
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apiCall, loading, error };
};

// Specific API functions
export const diskApi = {
  startScan: (path = null) => {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    return axios.get(`${API_BASE_URL}/scan/start?${params}`);
  },

  getStats: (path = null) => {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    return axios.get(`${API_BASE_URL}/scan/stats?${params}`);
  },

  getFolderContents: (folderPath) => {
    return axios.get(`${API_BASE_URL}/files/folder?path=${encodeURIComponent(folderPath)}`);
  },

  deleteFile: (filePath) => {
    return axios.delete(`${API_BASE_URL}/files/delete?path=${encodeURIComponent(filePath)}`);
  },

  getFileSize: (filePath) => {
    return axios.get(`${API_BASE_URL}/files/size?path=${encodeURIComponent(filePath)}`);
  },

  findDuplicates: (folderPath) => {
    return axios.get(`${API_BASE_URL}/duplicates/find?folder_path=${encodeURIComponent(folderPath)}`);
  },

  getDuplicatesSummary: (folderPath) => {
    return axios.get(`${API_BASE_URL}/duplicates/summary?folder_path=${encodeURIComponent(folderPath)}`);
  },

  getExclusions: () => {
    return axios.get(`${API_BASE_URL}/files/exclusions`);
  },

  addExclusion: (folderPath) => {
    return axios.post(`${API_BASE_URL}/files/exclusions/add?folder_path=${encodeURIComponent(folderPath)}`);
  },

  removeExclusion: (folderPath) => {
    return axios.post(`${API_BASE_URL}/files/exclusions/remove?folder_path=${encodeURIComponent(folderPath)}`);
  },

  getProgress: () => {
    return axios.get(`${API_BASE_URL}/scan/progress`);
  },

  getFileTypes: (path = null) => {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    return axios.get(`${API_BASE_URL}/analytics/file-types?${params}`);
  },

  getLargeFiles: (path = null, limit = 20) => {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    params.append('limit', limit);
    return axios.get(`${API_BASE_URL}/analytics/large-files?${params}`);
  },

  getCleanupRecommendations: (path = null) => {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    return axios.get(`${API_BASE_URL}/analytics/cleanup-recommendations?${params}`);
  },

  generatePdfReport: (path = null, reportType = 'full') => {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    params.append('report_type', reportType);
    return axios.get(`${API_BASE_URL}/reports/generate-pdf?${params}`, {
      responseType: 'blob'
    });
  },

  generateCsvReport: (path = null, reportType = 'full') => {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    params.append('report_type', reportType);
    return axios.get(`${API_BASE_URL}/reports/generate-csv?${params}`, {
      responseType: 'blob'
    });
  },

  getScheduledScans: () => {
    return axios.get(`${API_BASE_URL}/scheduling/scheduled-scans`);
  },

  createScheduledScan: (name, path, frequency, time) => {
    const params = new URLSearchParams();
    params.append('name', name);
    params.append('path', path);
    params.append('frequency', frequency);
    params.append('time', time);
    return axios.post(`${API_BASE_URL}/scheduling/scheduled-scans?${params}`);
  },

  updateScheduledScan: (scheduleId, updates) => {
    const params = new URLSearchParams();
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    return axios.put(`${API_BASE_URL}/scheduling/scheduled-scans/${scheduleId}?${params}`);
  },

  deleteScheduledScan: (scheduleId) => {
    return axios.delete(`${API_BASE_URL}/scheduling/scheduled-scans/${scheduleId}`);
  },

  runScheduledScan: (scheduleId) => {
    return axios.post(`${API_BASE_URL}/scheduling/scheduled-scans/${scheduleId}/run`);
  },
};
