import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiCheckCircle, FiAlertCircle, FiPlay, FiToggle2 } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';

const ScheduledScans = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    path: '/',
    frequency: 'daily',
    time: '02:00',
    enabled: true,
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await diskApi.getScheduledScans();
      setSchedules(response.data.scans || []);
    } catch (err) {
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.path.trim()) {
      setError('Please enter a schedule name and path');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await diskApi.createScheduledScan(
        formData.name,
        formData.path,
        formData.frequency,
        formData.time
      );
      setSuccess('Scan schedule created successfully');
      setFormData({ name: '', path: '/', frequency: 'daily', time: '02:00', enabled: true });
      setShowForm(false);
      loadSchedules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      setError(null);
      await diskApi.deleteScheduledScan(scheduleId);
      setSuccess('Schedule deleted successfully');
      loadSchedules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete schedule');
    }
  };

  const handleToggleEnabled = async (schedule) => {
    try {
      await diskApi.updateScheduledScan(schedule.id, { enabled: !schedule.enabled });
      loadSchedules();
    } catch (err) {
      setError('Failed to update schedule');
    }
  };

  const handleRunNow = async (scheduleId) => {
    try {
      setError(null);
      await diskApi.runScheduledScan(scheduleId);
      setSuccess('Scan triggered successfully');
      loadSchedules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to run scan');
    }
  };

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
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

      {/* Add Schedule Button */}
      {!showForm && (
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors duration-200"
        >
          <FiPlus className="w-5 h-5" />
          Add Scheduled Scan
        </motion.button>
      )}

      {/* Add Schedule Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3"
          >
            <form onSubmit={handleAddSchedule} className="space-y-3">
              <input
                type="text"
                placeholder="Schedule name (e.g., Weekly scan)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />

              <input
                type="text"
                placeholder="Path (e.g., /home/user or C:\Users)"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>

                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Create Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedules List */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-3 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full mx-auto"
          />
        </motion.div>
      ) : schedules.length === 0 ? (
        <p className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          No scheduled scans. Create one to get started!
        </p>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {schedules.map((schedule) => (
            <motion.div
              key={schedule.id}
              variants={itemVariants}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {schedule.name}
                    </h4>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {schedule.frequency}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Path: <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded">{schedule.path}</code>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Time: <span className="font-medium">{schedule.time}</span>
                  </p>
                  {schedule.next_run && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Next run: {new Date(schedule.next_run).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRunNow(schedule.id)}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
                    title="Run now"
                  >
                    <FiPlay className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleEnabled(schedule)}
                    className={`p-2 rounded transition-colors ${
                      schedule.enabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                    title={schedule.enabled ? 'Disable' : 'Enable'}
                  >
                    <FiToggle2 className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                    title="Delete"
                  >
                    <FiX className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Info Alert */}
      <motion.div
        variants={itemVariants}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300"
      >
        <strong>Note:</strong> Scheduled scans are stored locally. The application should be running for scans to execute at their scheduled times.
      </motion.div>
    </motion.div>
  );
};

export default ScheduledScans;
