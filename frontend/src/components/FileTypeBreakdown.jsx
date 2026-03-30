import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FiRefreshCw } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';

const FileTypeBreakdown = ({ scanPath }) => {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);

  const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  useEffect(() => {
    if (scanPath) {
      fetchFileTypeBreakdown();
    }
  }, [scanPath]);

  const fetchFileTypeBreakdown = async () => {
    try {
      setLoading(true);
      const response = await diskApi.getFileTypes(scanPath);
      setBreakdown(response.data);
    } catch (err) {
      console.error('Failed to get file type breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!breakdown || !scanPath) return null;

  const pieData = breakdown.file_types.map(item => ({
    name: item.name,
    value: item.size,
    count: item.count
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">File Type Breakdown</h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchFileTypeBreakdown}
          disabled={loading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {COLORS.map((color, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatBytes(value)}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* File Type Details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {breakdown.file_types.map((fileType, index) => (
          <motion.div
            key={fileType.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
          >
            <div
              className="w-3 h-3 rounded-full mb-2"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {fileType.name}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {fileType.count}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {formatBytes(fileType.size)}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default FileTypeBreakdown;
