import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiFile } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';

const LargeFiles = ({ scanPath }) => {
  const [largeFiles, setLargeFiles] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scanPath) {
      fetchLargeFiles();
    }
  }, [scanPath]);

  const fetchLargeFiles = async () => {
    try {
      setLoading(true);
      const response = await diskApi.getLargeFiles(scanPath, 10);
      setLargeFiles(response.data);
    } catch (err) {
      console.error('Failed to get large files:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!largeFiles || !scanPath) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  const maxSize = largeFiles.large_files[0]?.size || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Largest Files</h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchLargeFiles}
          disabled={loading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {largeFiles.large_files.map((file, index) => {
          const percentage = (file.size / maxSize) * 100;
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className="space-y-2"
            >
              <div className="flex items-start gap-3">
                <FiFile className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {file.path}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total files analyzed: <span className="font-semibold">{largeFiles.total_files_found}</span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default LargeFiles;
