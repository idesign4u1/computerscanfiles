import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiAlertCircle, FiTrash2, FiClock, FiFile, FiFolder } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';

const CleanupRecommendations = ({ scanPath }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    if (scanPath) {
      fetchRecommendations();
    }
  }, [scanPath]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await diskApi.getCleanupRecommendations(scanPath);
      setRecommendations(response.data);
    } catch (err) {
      console.error('Failed to get cleanup recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!recommendations || !scanPath) return null;

  const categories = [
    {
      id: 'old_files',
      label: 'Old Files',
      description: 'Files not modified in over 1 year',
      icon: FiClock,
      color: 'orange',
      items: recommendations.recommendations.old_files,
    },
    {
      id: 'temp_files',
      label: 'Temporary Files',
      description: 'System temporary files and cache',
      icon: FiTrash2,
      color: 'red',
      items: recommendations.recommendations.temp_files,
    },
    {
      id: 'duplicate_candidates',
      label: 'Duplicate Files',
      description: 'Files with same name and size',
      icon: FiFile,
      color: 'purple',
      items: recommendations.recommendations.duplicate_candidates,
    },
    {
      id: 'large_unused',
      label: 'Large Unused Files',
      description: 'Files larger than 100MB not used recently',
      icon: FiFolder,
      color: 'blue',
      items: recommendations.recommendations.large_unused,
    },
  ];

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

  const colorMap = {
    orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800',
    red: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800',
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800',
  };

  const textColorMap = {
    orange: 'text-orange-900 dark:text-orange-300',
    red: 'text-red-900 dark:text-red-300',
    purple: 'text-purple-900 dark:text-purple-300',
    blue: 'text-blue-900 dark:text-blue-300',
  };

  const badgeColorMap = {
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary Card */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-300 mb-2">
              Cleanup Recommendations
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-4">
              Potential space savings: <span className="font-bold text-lg">{formatBytes(recommendations.recommendations.total_savings_possible)}</span>
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-500">
              {recommendations.file_count} files analyzed
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchRecommendations}
            disabled={loading}
            className="p-2 hover:bg-indigo-200 dark:hover:bg-indigo-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-5 h-5 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Category Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const itemCount = category.items.length;
          const totalSize = category.items.reduce((sum, item) => sum + item.size, 0);

          return (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className={`bg-gradient-to-br ${colorMap[category.color]} rounded-lg p-5 border transition-all duration-200 hover:shadow-lg dark:hover:shadow-lg/20 cursor-pointer`}
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )
              }
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${badgeColorMap[category.color]}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${textColorMap[category.color]}`}>
                      {category.label}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatBytes(totalSize)} to free
                  </p>
                </div>
                <motion.div
                  animate={{
                    rotate: expandedCategory === category.id ? 180 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </motion.div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedCategory === category.id && itemCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600"
                  >
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2 max-h-64 overflow-y-auto"
                    >
                      {category.items.map((item, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="flex items-start gap-3 p-2 bg-white dark:bg-gray-800/50 rounded text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.name}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 truncate text-xs">
                              {item.path}
                            </p>
                            {item.age_days && (
                              <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                                Last modified {item.age_days} days ago
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatBytes(item.size)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {itemCount === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600"
                >
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center py-2">
                    ✓ No items found in this category
                  </p>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Info Alert */}
      <motion.div
        variants={itemVariants}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3"
      >
        <FiAlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> Always verify files before deletion. Some files may be important to your system or applications.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default CleanupRecommendations;
