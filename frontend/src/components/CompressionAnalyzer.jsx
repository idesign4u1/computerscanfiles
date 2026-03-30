import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiFileText, FiChevronDown } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';

const CompressionAnalyzer = ({ scanPath }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedPriority, setExpandedPriority] = useState(null);

  useEffect(() => {
    if (scanPath) {
      fetchCompressionAnalysis();
    }
  }, [scanPath]);

  const fetchCompressionAnalysis = async () => {
    try {
      setLoading(true);
      const response = await diskApi.analyzeCompressionPotential(scanPath);
      setAnalysis(response.data);
    } catch (err) {
      console.error('Failed to analyze compression potential:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis || !scanPath) return null;

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

  const priorityConfig = {
    high: {
      label: 'High Priority',
      description: 'Text and database files with excellent compression',
      color: 'red',
      bgColor: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-300',
      icon: '🔴',
    },
    medium: {
      label: 'Medium Priority',
      description: 'Office documents and other files with good compression',
      color: 'amber',
      bgColor: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-900 dark:text-amber-300',
      icon: '🟠',
    },
    low: {
      label: 'Low Priority',
      description: 'Already compressed files - limited compression benefits',
      color: 'gray',
      bgColor: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      textColor: 'text-gray-900 dark:text-gray-300',
      icon: '⚪',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <FiFileText className="w-5 h-5" />
          Compression Analyzer
        </h3>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchCompressionAnalysis}
          disabled={loading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Summary Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <motion.div
          variants={itemVariants}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
        >
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Compressible</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {formatBytes(analysis.total_compressible_size)}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
        >
          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Potential Savings</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">
            {formatBytes(analysis.potential_savings)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            {analysis.savings_percentage.toFixed(1)}% reduction
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800"
        >
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Recommendations</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
            {analysis.candidates.high.length + analysis.candidates.medium.length}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            compression candidates
          </p>
        </motion.div>
      </motion.div>

      {/* By Category Breakdown */}
      {analysis.by_category && analysis.by_category.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <h4 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">
            Savings by Category
          </h4>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
          >
            {analysis.by_category.map((category) => (
              <motion.div
                key={category.name}
                variants={itemVariants}
                className="text-xs"
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatBytes(category.potential_savings)}
                  </span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    style={{
                      width: `${
                        analysis.potential_savings > 0
                          ? (category.potential_savings / analysis.potential_savings) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Priority Groups */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {Object.entries(analysis.candidates).map(([priority, files]) => {
          const config = priorityConfig[priority];
          const totalSavings = files.reduce((sum, f) => sum + f.savings, 0);

          return (
            <motion.div
              key={priority}
              variants={itemVariants}
              className={`bg-gradient-to-br ${config.bgColor} rounded-lg border ${config.borderColor} overflow-hidden`}
            >
              <motion.button
                onClick={() =>
                  setExpandedPriority(expandedPriority === priority ? null : priority)
                }
                className="w-full p-4 text-left flex items-center justify-between hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <h4 className={`font-semibold ${config.textColor}`}>
                      {config.label}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {files.length} files • {formatBytes(totalSavings)} possible
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedPriority === priority ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className={`w-5 h-5 ${config.textColor}`} />
                </motion.div>
              </motion.button>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedPriority === priority && files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`border-t ${config.borderColor} p-4 bg-white/50 dark:bg-gray-800/50`}
                  >
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2 max-h-64 overflow-y-auto"
                    >
                      {files.map((file, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="flex items-start gap-3 p-2 bg-white dark:bg-gray-800 rounded text-xs border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {file.filename}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 truncate">
                              {file.category}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              {formatBytes(file.savings)}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {formatBytes(file.size)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Info Alert */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300"
      >
        <strong>Compression Benefits:</strong> Compressing high-priority files can save significant disk space with minimal performance impact. Medium-priority files offer good compression ratios. Low-priority files are already optimized.
      </motion.div>
    </motion.div>
  );
};

export default CompressionAnalyzer;
