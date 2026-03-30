import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';

const ExportReports = ({ scanPath }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleExport = async (format) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      let response;
      if (format === 'pdf') {
        response = await diskApi.generatePdfReport(scanPath);
      } else {
        response = await diskApi.generateCsvReport(scanPath);
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `disk_report_${timestamp}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`${format.toUpperCase()} report downloaded successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to generate ${format.toUpperCase()} report`);
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
      className="space-y-4"
    >
      {/* Alerts */}
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

      {/* Export Options Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* PDF Export */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-6 border border-red-200 dark:border-red-800 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                PDF Report
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                Professional formatted report with charts and tables
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExport('pdf')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="w-4 h-4" />
                {loading ? 'Generating...' : 'Export as PDF'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* CSV Export */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800 hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                CSV Report
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                Spreadsheet format for detailed analysis and sorting
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExport('csv')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="w-4 h-4" />
                {loading ? 'Generating...' : 'Export as CSV'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Info Section */}
      <motion.div
        variants={itemVariants}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Report Contents:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>✓ Summary statistics (total files, disk usage, scan date)</li>
          <li>✓ File type breakdown by count and size</li>
          <li>✓ Detailed file listing with paths and modification dates</li>
          <li>✓ Professional formatting (PDF) or spreadsheet format (CSV)</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default ExportReports;
