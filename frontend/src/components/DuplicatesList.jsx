import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiChevronDown, FiAlertCircle, FiCopy } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';

const DuplicatesList = () => {
  const [searchPath, setSearchPath] = useState('');
  const [duplicates, setDuplicates] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSet, setExpandedSet] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchPath.trim()) {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Search Form */}
      <motion.form
        variants={itemVariants}
        onSubmit={handleSearch}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Search for Duplicates
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchPath}
            onChange={(e) => setSearchPath(e.target.value)}
            placeholder="Enter folder path to search..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSearch className="w-4 h-4" />
            {loading ? 'Searching...' : 'Find'}
          </motion.button>
        </div>
      </motion.form>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex items-start gap-4"
          >
            <FiAlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Analyzing files...</p>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      {summary && !loading && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800"
          >
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">Duplicate Sets</p>
            <p className="text-3xl font-bold text-orange-900 dark:text-orange-200">
              {summary.duplicate_sets}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-6 border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-red-700 dark:text-red-300 mb-1">Duplicate Files</p>
            <p className="text-3xl font-bold text-red-900 dark:text-red-200">
              {summary.total_duplicate_files}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800"
          >
            <p className="text-sm text-green-700 dark:text-green-300 mb-1">Potential Savings</p>
            <p className="text-3xl font-bold text-green-900 dark:text-green-200">
              {formatBytes(summary.potential_space_savings)}
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* Duplicates List */}
      {duplicates && duplicates.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {duplicates.map((dupSet, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <motion.button
                onClick={() => setExpandedSet(expandedSet === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: expandedSet === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {dupSet.count} copies of {formatBytes(dupSet.file_size)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total: {formatBytes(dupSet.file_size * dupSet.count)}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Hash: {dupSet.file_hash.substring(0, 12)}...
                </div>
              </motion.button>

              <AnimatePresence>
                {expandedSet === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30"
                  >
                    <div className="px-6 py-4 space-y-2">
                      {dupSet.paths.map((path, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <FiCopy className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
                            {path}
                          </code>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {duplicates && duplicates.length === 0 && !loading && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            No duplicate files found in this folder.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DuplicatesList;
