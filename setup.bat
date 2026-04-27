@echo off
echo ================================
echo  Swift Response - Setup Script
echo ================================
echo.

:: Step 1 - Check for Node.js
echo [1/3] Checking for Node.js...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed.
    echo Please download and install the LTS version from https://nodejs.org
    echo Once installed, run this script again.
    echo.
    pause
    exit
) ELSE (
    echo Node.js found.
)
echo.

:: Step 2 - Install dependencies
echo [2/3] Installing Expo CLI...
npm install -g expo-cli
echo.
echo Installing project dependencies...
npm install
echo.

:: Step 3 - Check for firebaseConfig.js
echo [3/3] Checking for Firebase configuration...
IF NOT EXIST "firebaseConfig.js" (
    echo.
    echo WARNING: firebaseConfig.js was not found in this folder.
    echo The app will not connect to Firebase without it.
    echo.
    echo To fix this:
    echo   1. Copy firebaseConfig.example.js from this folder
    echo   2. Rename the copy to firebaseConfig.js
    echo   3. Fill in your Firebase project credentials
    echo   4. Run this script again OR manually run: npx expo start
    echo.
    pause
    exit
) ELSE (
    echo firebaseConfig.js found.
)
echo.

:: Setup complete
echo ================================
echo  Setup Complete.
echo ================================
echo.
echo Your phone and this computer must be on the SAME WiFi network.
echo.
echo How would you like to start the app?
echo.
echo   [1] Normal mode   (use if phone and laptop are on same WiFi)
echo   [2] Tunnel mode   (use if QR code does not work in normal mode)
echo.
set /p choice="Enter 1 or 2: "

IF "%choice%"=="1" (
    echo.
    echo Starting in normal mode...
    echo Scan the QR code with the Expo Go app on your phone.
    echo.
    npx expo start
) ELSE IF "%choice%"=="2" (
    echo.
    echo Starting in tunnel mode...
    echo Scan the QR code with the Expo Go app on your phone.
    echo.
    npx expo start --tunnel
) ELSE (
    echo.
    echo Invalid choice. Starting in normal mode by default...
    echo.
    npx expo start
)

pause
