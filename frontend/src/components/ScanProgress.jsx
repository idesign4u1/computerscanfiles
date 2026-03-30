import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiFileText } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';

const ScanProgress = ({ isScanning, onScanComplete }) => {
  const [progress, setProgress] = useState({
    current_file: null,
    files_scanned: 0,
    total_size: 0,
    is_scanning: false,
  });

  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(async () => {
      try {
        const response = await diskApi.getProgress();
        setProgress(response.data || response);
      } catch (err) {
        console.error('Failed to get progress:', err);
      }
    }, 500); // Update every 500ms

    return () => clearInterval(interval);
  }, [isScanning]);

  useEffect(() => {
    if (!isScanning && progress.files_scanned > 0) {
      onScanComplete?.();
    }
  }, [isScanning, progress.files_scanned, onScanComplete]);

  if (!isScanning) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md z-40"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-blue-500"
        >
          <FiRefreshCw className="w-5 h-5" />
        </motion.div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Scanning...</h3>
      </div>

      {/* Current File */}
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <FiFileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current File
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {progress.current_file || 'Initializing...'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">Files Scanned</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {progress.files_scanned.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Size</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatBytes(progress.total_size)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          animate={{
            width: ['0%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
        />
      </div>

      {/* Cancel Button */}
      <button
        className="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
      >
        Hide
      </button>
    </motion.div>
  );
};

export default ScanProgress;
