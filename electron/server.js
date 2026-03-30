const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

const API_URL = 'http://127.0.0.1:8000';
const HEALTH_CHECK_URL = `${API_URL}/health`;
const HEALTH_CHECK_INTERVAL = 1000; // 1 second
const HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds

let pythonProcess = null;

/**
 * Start Python FastAPI server
 * @returns {Promise<void>}
 */
async function startServer() {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, './backend/main.py');
    const backendDir = path.join(__dirname, './backend');

    // Determine Python executable
    // Use 'py' (Windows Python launcher) on Windows for better compatibility
    const pythonExecutable = process.platform === 'win32' ? 'py' : 'python3';

    console.log(`[Server] Starting Python server...`);
    console.log(`[Server] Python: ${pythonExecutable}`);
    console.log(`[Server] Script: ${pythonScript}`);
    console.log(`[Server] Working Dir: ${backendDir}`);

    pythonProcess = spawn(pythonExecutable, [pythonScript], {
      cwd: backendDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: process.env,  // Inherit parent process environment (includes PATH)
    });

    console.log(`[Server] Process spawned with PID: ${pythonProcess.pid}`);

    let isResolved = false;

    // Handle stdout
    pythonProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      console.log(`[Server stdout] ${msg}`);
    });

    // Handle stderr
    pythonProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      console.log(`[Server stderr] ${msg}`);
    });

    // Handle errors
    pythonProcess.on('error', (err) => {
      console.error(`[Server] Failed to start: ${err.message}`);
      if (!isResolved) {
        isResolved = true;
        reject(new Error(`Failed to start server: ${err.message}`));
      }
    });

    // Handle exit
    pythonProcess.on('exit', (code, signal) => {
      console.log(`[Server] Process exited with code ${code}, signal ${signal}`);
      pythonProcess = null;
    });

    console.log(`[Server] Waiting for server to be ready...`);

    // Wait for server to be healthy
    waitForServer()
      .then(() => {
        if (!isResolved) {
          isResolved = true;
          console.log('[Server] Server is ready!');
          resolve();
        }
      })
      .catch((err) => {
        if (!isResolved) {
          isResolved = true;
          console.error(`[Server] Error: ${err.message}`);
          reject(err);
        }
      });
  });
}

/**
 * Wait for server to be ready
 * @returns {Promise<void>}
 */
async function waitForServer() {
  const startTime = Date.now();

  while (Date.now() - startTime < HEALTH_CHECK_TIMEOUT) {
    try {
      console.log(`[Health Check] Attempting to connect to ${HEALTH_CHECK_URL}...`);
      const response = await axios.get(HEALTH_CHECK_URL, { timeout: 2000 });
      console.log('[Health Check] Response:', response.data);
      if (response.data && response.data.status === 'ok') {
        console.log('[Health Check] Server is healthy!');
        return;
      }
    } catch (err) {
      // Server not ready yet, wait and retry
      const elapsed = Date.now() - startTime;
      console.log(`[Health Check] Failed (${elapsed}ms): ${err.message}`);
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
  }

  throw new Error('Server failed to start within timeout');
}

/**
 * Kill Python server
 * @returns {Promise<void>}
 */
function stopServer() {
  return new Promise((resolve, reject) => {
    if (!pythonProcess) {
      resolve();
      return;
    }

    console.log('Stopping Python server...');

    try {
      if (process.platform === 'win32') {
        // Windows: use taskkill
        spawn('taskkill', ['/pid', pythonProcess.pid, '/f']);
      } else {
        // Unix: use kill
        pythonProcess.kill('SIGTERM');
      }

      // Give it time to terminate
      setTimeout(() => {
        if (pythonProcess) {
          console.log('Force killing Python process');
          pythonProcess.kill('SIGKILL');
        }
        resolve();
      }, 3000);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Check if server is running
 * @returns {boolean}
 */
function isServerRunning() {
  return pythonProcess !== null && !pythonProcess.killed;
}

module.exports = {
  startServer,
  stopServer,
  isServerRunning,
  API_URL,
};
