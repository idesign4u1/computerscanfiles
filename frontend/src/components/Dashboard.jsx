import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import { formatBytes } from '../utils/formatters';

const Dashboard = ({ loading, setLoading }) => {
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
      await diskApi.startScan();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Scan failed');
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

  if (error) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div
          variants={itemVariants}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex items-start gap-4"
        >
          <FiAlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-200">Error</h3>
            <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Retry
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (loading && !stats) {
    return (
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
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
        </div>
      </motion.div>
    );
  }

  if (!stats) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold mb-2">Disk Space Overview</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Click below to load disk statistics</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchStats}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors duration-200"
          >
            Load Stats
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const pieData = [
    { name: 'Used', value: stats.used_size },
    { name: 'Free', value: stats.free_size },
  ];

  const COLORS = ['#3b82f6', '#10b981'];
  const usagePercent = Math.round((stats.used_size / stats.total_size) * 100);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Scan Button */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold">Disk Space Overview</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={startScan}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : 'Scan Disk'}
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Total Space Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Total Space</h3>
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatBytes(stats.total_size)}
          </p>
        </motion.div>

        {/* Used Space Card */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">Used Space</h3>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">
            {formatBytes(stats.used_size)}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            {usagePercent}% of total
          </p>
        </motion.div>

        {/* Free Space Card */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-green-900 dark:text-green-300">Free Space</h3>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <p className="text-3xl font-bold text-green-900 dark:text-green-200">
            {formatBytes(stats.free_size)}
          </p>
          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
            {100 - usagePercent}% available
          </p>
        </motion.div>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Pie Chart */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
        >
          <h3 className="font-semibold text-lg mb-4">Disk Usage</h3>
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
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
        >
          <h3 className="font-semibold text-lg mb-4">Space Breakdown</h3>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => formatBytes(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="Used" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Free" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
