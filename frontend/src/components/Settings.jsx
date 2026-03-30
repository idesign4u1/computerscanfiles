import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheckCircle, FiAlertCircle, FiFolder } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import ExportReports from './ExportReports';
import ScheduledScans from './ScheduledScans';

const Settings = () => {
  const [exclusions, setExclusions] = useState([]);
  const [newExclusion, setNewExclusion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadExclusions();
  }, []);

  const loadExclusions = async () => {
    try {
      setLoading(true);
      const response = await diskApi.getExclusions();
      setExclusions(response.data.excluded_folders || []);
    } catch (err) {
      setError('Failed to load exclusions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExclusion = async (e) => {
    e.preventDefault();

    if (!newExclusion.trim()) {
      setError('Please enter a folder path');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await diskApi.addExclusion(newExclusion);
      setExclusions([...exclusions, newExclusion]);
      setNewExclusion('');
      setSuccess('Folder added to exclusions');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add exclusion');
    }
  };

  const handleRemoveExclusion = async (folder) => {
    try {
      setError(null);
      setSuccess(null);
      await diskApi.removeExclusion(folder);
      setExclusions(exclusions.filter(e => e !== folder));
      setSuccess('Folder removed from exclusions');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove exclusion');
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
      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3"
          >
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3"
          >
            <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exclusions Section */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your scanner preferences</p>

        <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2">Exclude Folders from Scanning</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Folders in this list will be skipped during disk scans. This is useful for system folders or large temporary directories.
          </p>

          <form onSubmit={handleAddExclusion} className="space-y-3">
            <input
              id="new-exclusion"
              type="text"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              placeholder="Enter folder path to exclude (e.g., /tmp, C:\Windows)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors duration-200"
            >
              ➕ Add to Exclusions
            </motion.button>
          </form>
        </div>

        {/* Exclusions List */}
        <div>
          <h4 className="font-semibold text-lg mb-3">
            Current Exclusions ({exclusions.length})
          </h4>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full mx-auto"
              />
            </motion.div>
          ) : exclusions.length === 0 ? (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400">
              No folders excluded yet. Add one to get started!
            </p>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {exclusions.map((folder, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <FiFolder className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <code className="flex-1 text-sm text-gray-900 dark:text-gray-100 break-all">
                    {folder}
                  </code>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleRemoveExclusion(folder)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                    title="Remove"
                  >
                    <FiX className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Scheduled Scans Section */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-2">Scheduled Scans</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Set up automatic disk scans at regular intervals</p>
        <ScheduledScans />
      </motion.div>

      {/* Export Reports Section */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-2">Export Reports</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Generate and download analysis reports</p>
        <ExportReports scanPath="/" />
      </motion.div>

      {/* About Section */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
      >
        <h3 className="font-semibold text-lg mb-2">About</h3>
        <p className="text-sm mb-2">
          <strong className="text-gray-900 dark:text-white">Disk Space Analyzer</strong> v1.0.0
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          A modern desktop application for visualizing and managing disk usage. Analyze your storage, find duplicate files, and get recommendations for cleanup.
        </p>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>📁 Built with React, FastAPI, and Electron</p>
          <p>💾 Local analysis - no cloud storage required</p>
          <p>🚀 Fast and lightweight desktop app</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
