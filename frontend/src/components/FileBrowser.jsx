import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { diskApi } from '../hooks/useApi';
import { formatBytes, formatDate, getFileIcon } from '../utils/formatters';
import DeleteModal from './DeleteModal';

const FileBrowser = () => {
  const [currentPath, setCurrentPath] = useState(null);
  const [contents, setContents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);

  useEffect(() => {
    const initialPath = navigator.platform.includes('Win') ? 'C:\\' : process.env.HOME || '/';
    setCurrentPath(initialPath);
    loadFolder(initialPath);
  }, []);

  const loadFolder = async (path) => {
    try {
      setLoading(true);
      setError(null);
      const response = await diskApi.getFolderContents(path);
      setContents(response.data);
      setCurrentPath(path);
      updateBreadcrumb(path);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load folder');
    } finally {
      setLoading(false);
    }
  };

  const updateBreadcrumb = (path) => {
    const parts = path.split(/[\\\/]/);
    const breadcrumbs = [];
    let current = '';

    parts.forEach((part, index) => {
      if (part) {
        if (index === 0 && (part === 'C:' || part === '/')) {
          current = navigator.platform.includes('Win') ? 'C:\\' : '/';
        } else {
          current += (current.endsWith('/') || current.endsWith('\\') ? '' : '/') + part;
        }
        breadcrumbs.push({ name: part || 'Root', path: current });
      }
    });

    setBreadcrumb(breadcrumbs);
  };

  const handleFolderClick = (folderPath) => {
    loadFolder(folderPath);
  };

  const handleDeleteClick = (file) => {
    setSelectedFile(file);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFile) return;

    try {
      await diskApi.deleteFile(selectedFile.path);
      setShowDeleteModal(false);
      setSelectedFile(null);
      loadFolder(currentPath);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete file');
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
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex items-start gap-4"
      >
        <FiAlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadFolder(currentPath)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  if (loading) {
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
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading folder...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap">
        {breadcrumb.map((crumb, index) => (
          <React.Fragment key={index}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFolderClick(crumb.path)}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
            >
              {crumb.name}
            </motion.button>
            {index < breadcrumb.length - 1 && (
              <FiChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </motion.div>

      {/* File Table */}
      {contents && (
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Size</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Modified</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contents.items.map((item, index) => (
                  <motion.tr
                    key={index}
                    variants={itemVariants}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 text-2xl">{item.is_dir ? '📁' : getFileIcon(item.name)}</td>
                    <td className="px-6 py-4">
                      {item.is_dir ? (
                        <button
                          onClick={() => handleFolderClick(item.path)}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <span className="text-gray-900 dark:text-gray-100">{item.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                      {formatBytes(item.size)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {formatDate(item.modified_time)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteClick(item)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Folder Stats */}
          <motion.div
            variants={itemVariants}
            className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm"
          >
            <div className="text-gray-700 dark:text-gray-300">
              Total Size: <span className="font-semibold">{formatBytes(contents.total_size)}</span>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              Items: <span className="font-semibold">{contents.items.length}</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showDeleteModal && (
        <DeleteModal
          file={selectedFile}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedFile(null);
          }}
        />
      )}
    </motion.div>
  );
};

export default FileBrowser;
