import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';
import './Dashboard.css';

const Dashboard = ({ setScanData, loading, setLoading }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await diskApi.getStats();
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const startScan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await diskApi.startScan();
      setScanData(response.data);
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="component-card error">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchStats}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <div className="component-card">
          <h2>Disk Space Overview</h2>
          <p>Click below to load disk statistics</p>
          <button className="btn btn-primary" onClick={fetchStats}>
            Load Stats
          </button>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Used', value: stats.used_size, color: '#3b82f6' },
    { name: 'Free', value: stats.free_size, color: '#10b981' },
  ];

  const COLORS = ['#3b82f6', '#10b981'];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>💾 Disk Space Overview</h2>
        <button className="btn btn-primary" onClick={startScan} disabled={loading}>
          {loading ? 'Scanning...' : '🔄 Scan Disk'}
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="component-card stat-card">
            <h3>Total Space</h3>
            <p className="stat-value">{formatBytes(stats.total_size)}</p>
          </div>

          <div className="component-card stat-card">
            <h3>Used Space</h3>
            <p className="stat-value">{formatBytes(stats.used_size)}</p>
            <p className="stat-percentage">{stats.percent_used}%</p>
          </div>

          <div className="component-card stat-card">
            <h3>Free Space</h3>
            <p className="stat-value">{formatBytes(stats.free_size)}</p>
            <p className="stat-percentage">{(100 - stats.percent_used).toFixed(2)}%</p>
          </div>
        </div>
      )}

      <div className="charts-container">
        <div className="component-card chart-card">
          <h3>Disk Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatBytes(value)}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatBytes(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="component-card chart-card">
          <h3>Space Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: 'Storage',
                  Used: stats.used_size,
                  Free: stats.free_size,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatBytes(value)} />
              <Legend />
              <Bar dataKey="Used" fill="#3b82f6" />
              <Bar dataKey="Free" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
