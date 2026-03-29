import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import FileBrowser from './components/FileBrowser';
import DuplicatesList from './components/DuplicatesList';
import Settings from './components/Settings';
import './styles/App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <div className="header-content">
          <h1>💾 Disk Space Analyzer</h1>
          <button className="dark-mode-toggle" onClick={toggleDarkMode}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${currentTab === 'browser' ? 'active' : ''}`}
          onClick={() => setCurrentTab('browser')}
        >
          📁 File Browser
        </button>
        <button
          className={`nav-btn ${currentTab === 'duplicates' ? 'active' : ''}`}
          onClick={() => setCurrentTab('duplicates')}
        >
          🔍 Duplicates
        </button>
        <button
          className={`nav-btn ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      <main className="app-main">
        {currentTab === 'dashboard' && (
          <Dashboard setScanData={setScanData} loading={loading} setLoading={setLoading} />
        )}
        {currentTab === 'browser' && <FileBrowser />}
        {currentTab === 'duplicates' && <DuplicatesList />}
        {currentTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;
