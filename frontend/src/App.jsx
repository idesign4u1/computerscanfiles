import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiFolder, FiCopy, FiSettings, FiSun, FiMoon } from 'react-icons/fi';
import Dashboard from './components/Dashboard';
import FileBrowser from './components/FileBrowser';
import DuplicatesList from './components/DuplicatesList';
import Settings from './components/Settings';
import './styles/App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
    { id: 'browser', label: 'File Browser', icon: FiFolder },
    { id: 'duplicates', label: 'Duplicates', icon: FiCopy },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

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
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-40 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Disk Space Analyzer
              </h1>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <FiSun className="w-5 h-5" />
              ) : (
                <FiMoon className="w-5 h-5" />
              )}
            </button>
          </div>
        </motion.header>

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-16 z-30"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    whileHover={{ backgroundColor: isActive ? undefined : 'rgba(0,0,0,0.05)' }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.nav>

        {/* Main Content */}
        <main className="flex-1">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto px-6 py-8"
          >
            <motion.div variants={itemVariants}>
              {currentTab === 'dashboard' && (
                <Dashboard loading={loading} setLoading={setLoading} />
              )}
              {currentTab === 'browser' && <FileBrowser />}
              {currentTab === 'duplicates' && <DuplicatesList />}
              {currentTab === 'settings' && <Settings />}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default App;
