import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiCalendar } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';

const FileAgeTracker = ({ scanPath }) => {
  const [ageStats, setAgeStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scanPath) {
      fetchFileAgeStats();
    }
  }, [scanPath]);

  const fetchFileAgeStats = async () => {
    try {
      setLoading(true);
      const response = await diskApi.getFileAgeStats(scanPath);
      setAgeStats(response.data);
    } catch (err) {
      console.error('Failed to get file age stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!ageStats || !scanPath) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Age categories with colors
  const ageCategories = [
    {
      label: 'Last 30 Days',
      days: 30,
      color: 'green',
      bgColor: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-900 dark:text-green-300',
      value: ageStats.age_groups?.last_30_days || { count: 0, size: 0 },
    },
    {
      label: '30-90 Days',
      days: 90,
      color: 'blue',
      bgColor: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-300',
      value: ageStats.age_groups?.last_90_days || { count: 0, size: 0 },
    },
    {
      label: '90 Days - 1 Year',
      days: 365,
      color: 'amber',
      bgColor: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-900 dark:text-amber-300',
      value: ageStats.age_groups?.last_year || { count: 0, size: 0 },
    },
    {
      label: 'Older than 1 Year',
      days: 999999,
      color: 'red',
      bgColor: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-300',
      value: ageStats.age_groups?.older_than_year || { count: 0, size: 0 },
    },
  ];

  // Calculate total
  const totalSize = ageCategories.reduce((sum, cat) => sum + (cat.value.size || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <FiCalendar className="w-5 h-5" />
          File Age Distribution
        </h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchFileAgeStats}
          disabled={loading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Age Categories Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        {ageCategories.map((category) => {
          const percentage = totalSize > 0 ? (category.value.size / totalSize) * 100 : 0;

          return (
            <motion.div
              key={category.label}
              variants={itemVariants}
              className={`bg-gradient-to-br ${category.bgColor} rounded-lg p-4 border ${category.borderColor}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className={`font-semibold ${category.textColor}`}>{category.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {category.value.count} {category.value.count === 1 ? 'file' : 'files'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatBytes(category.value.size)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`h-full bg-gradient-to-r ${
                    category.color === 'green'
                      ? 'from-green-400 to-green-600'
                      : category.color === 'blue'
                      ? 'from-blue-400 to-blue-600'
                      : category.color === 'amber'
                      ? 'from-amber-400 to-amber-600'
                      : 'from-red-400 to-red-600'
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {ageStats.total_files}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Files</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatBytes(ageStats.total_size)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Size</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {ageStats.average_age_days ? Math.round(ageStats.average_age_days) : '0'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Age (days)</p>
          </div>
        </div>
      </motion.div>

      {/* Info Alert */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300"
      >
        <strong>Tip:</strong> Files older than 1 year are good candidates for archival or deletion if they're no longer needed.
      </motion.div>
    </motion.div>
  );
};

export default FileAgeTracker;
