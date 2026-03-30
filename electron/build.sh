#!/bin/bash
set -e

echo -e "\033[32mBuilding Disk Space Analyzer...\033[0m"

# Build frontend
echo -e "\033[36mBuilding frontend...\033[0m"
cd ../frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "\033[31mFrontend build failed!\033[0m"
    exit 1
fi
cd ../electron

# Copy frontend build
echo -e "\033[36mCopying frontend build...\033[0m"
FRONTEND_BUILD_SOURCE="../frontend/build"
FRONTEND_BUILD_DEST="./frontend/build"
if [ -d "$FRONTEND_BUILD_SOURCE" ]; then
    if [ -d "$FRONTEND_BUILD_DEST" ]; then
        rm -rf "$FRONTEND_BUILD_DEST"
    fi
    cp -r "$FRONTEND_BUILD_SOURCE" "$FRONTEND_BUILD_DEST"
    echo -e "\033[32mFrontend build copied successfully\033[0m"
else
    echo -e "\033[31mError: Frontend build not found at $FRONTEND_BUILD_SOURCE\033[0m"
    exit 1
fi

# Copy backend
echo -e "\033[36mCopying backend...\033[0m"
BACKEND_SOURCE="../backend"
BACKEND_DEST="./backend"
if [ -d "$BACKEND_SOURCE" ]; then
    if [ -d "$BACKEND_DEST" ]; then
        rm -rf "$BACKEND_DEST"
    fi
    cp -r "$BACKEND_SOURCE" "$BACKEND_DEST"
    echo -e "\033[32mBackend copied successfully\033[0m"
else
    echo -e "\033[33mWarning: Backend directory not found at $BACKEND_SOURCE\033[0m"
fi

# Build unpacked electron app
echo -e "\033[36mPackaging Electron app...\033[0m"
./node_modules/.bin/electron-builder --dir

if [ $? -ne 0 ]; then
    echo -e "\033[31mBuild failed!\033[0m"
    exit 1
fi

echo -e "\033[32mBuild complete!\033[0m"
APP_LOCATION=$(find dist -type d -name "*-unpacked" | head -1)
echo -e "\033[32mApp location: $APP_LOCATION\033[0m"
