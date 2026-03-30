const { spawn, execFile } = require('child_process');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');

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
    // In packaged apps, backend is extracted outside app.asar
    // __dirname points to app.asar, so we need ../backend
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                          (process.defaultApp === true) ||
                          /[\\/]electron[\\/]dist[\\/]/.test(process.execPath) === false;

    const backendPath = isDevelopment
      ? './backend'
      : '../backend';

    const pythonScript = path.join(__dirname, backendPath, 'main.py');
    const backendDir = path.join(__dirname, backendPath);

    // Verify files exist before spawning
    console.log(`[Server] Checking backend directory: ${backendDir}`);
    if (!fs.existsSync(backendDir)) {
      reject(new Error(`Backend directory not found: ${backendDir}`));
      return;
    }

    console.log(`[Server] Checking Python script: ${pythonScript}`);
    if (!fs.existsSync(pythonScript)) {
      reject(new Error(`Python script not found: ${pythonScript}`));
      return;
    }

    // Try both 'python' and 'py' on Windows
    let pythonExecutable = null;
    const pythonCandidates = process.platform === 'win32'
      ? ['python', 'py', 'python3']
      : ['python3', 'python'];

    for (const candidate of pythonCandidates) {
      try {
        console.log(`[Server] Trying Python: ${candidate}`);
        execSync(`${candidate} --version`, { stdio: 'pipe', encoding: 'utf8' });
        pythonExecutable = candidate;
        console.log(`[Server] Found Python: ${candidate}`);
        break;
      } catch (e) {
        console.log(`[Server] ${candidate} not found`);
      }
    }

    if (!pythonExecutable) {
      reject(new Error('Python not found in PATH'));
      return;
    }

    console.log(`[Server] Starting Python server...`);
    console.log(`[Server] Python: ${pythonExecutable}`);
    console.log(`[Server] Script: ${pythonScript}`);
    console.log(`[Server] Working Dir: ${backendDir}`);

    pythonProcess = spawn(pythonExecutable, [pythonScript], {
      cwd: backendDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: process.env,
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
