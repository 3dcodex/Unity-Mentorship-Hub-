@echo off
echo ========================================
echo Unity Mentorship Hub - Deployment Script
echo ========================================
echo.

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/5] Deploying Firestore rules...
call firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo WARNING: Firestore rules deployment failed
)

echo.
echo [4/5] Deploying Storage rules...
call firebase deploy --only storage
if %errorlevel% neq 0 (
    echo WARNING: Storage rules deployment failed
)

echo.
echo [5/5] Deploying to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ERROR: Hosting deployment failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Your app is now live at:
echo https://your-project-id.web.app
echo.
pause
